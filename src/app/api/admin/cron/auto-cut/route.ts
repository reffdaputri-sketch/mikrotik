import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendWhatsApp } from '@/lib/whatsapp'

// API ini bisa dipanggil pakai Cron Job (misal tiap jam atau tiap hari jam 00:01)
export async function GET(request: Request) {
  try {
    // Keamanan sederhana: Pakai secret key dari env biar nggak sembarang orang bisa nembak API ini
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')
    if (key !== process.env.LOCAL_AGENT_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createAdminClient()
    const now = new Date().toISOString()

    console.log('🚀 RUNNING AUTO-CUT CRON JOB...')

    // 1. Cari pelanggan PPPoE yang Active, Auto-Cut nyala, dan Expired sudah lewat
    const { data: expiredCustomers, error } = await supabase
      .from('customers')
      .select('*, plans(*)')
      .ilike('service_type', 'pppoe')
      .eq('auto_cut', true)
      .eq('status', 'Active')
      .lt('expired_at', now)

    if (error) throw error

    if (!expiredCustomers || expiredCustomers.length === 0) {
      return NextResponse.json({ message: 'No expired customers found' })
    }

    console.log(`📡 Found ${expiredCustomers.length} expired customers. Processing...`)

    const results = []

    for (const customer of expiredCustomers) {
      // a. Update status pelanggan di database jadi 'Disabled'
      await supabase
        .from('customers')
        .update({ status: 'Disabled' })
        .eq('id', customer.id)

      // b. Kirim perintah ke MikroTik Agent buat Disable PPPoE
      if (customer.router_id) {
        await supabase.from('mikrotik_command_queue').insert({
          router_id: customer.router_id,
          command: 'disable_pppoe_secret',
          payload: {
            username: customer.username,
            comment: `AUTO-CUT: Expired at ${customer.expired_at}`,
          },
          status: 'pending',
        })
      }

      // c. Cetak Invois Tagihan otomatis jika belum ada yang PENDING
      const { data: pending } = await supabase
        .from('payment_orders')
        .select('id')
        .eq('customer_id', customer.id)
        .eq('status', 'pending')

      if (!pending || pending.length === 0) {
        const orderId = `BILL-${Math.random().toString(36).slice(2, 9).toUpperCase()}`
        await supabase.from('payment_orders').insert({
          order_id: orderId,
          customer_id: customer.id,
          customer_name: customer.fullname,
          plan_id: customer.plan_id,
          plan_name: customer.plans?.name_plan || 'Pakej Internet',
          price: customer.plans?.price || 0,
          status: 'pending',
          created_at: new Date().toISOString(),
          description: `RENEWAL_PPPOE:${customer.id}`
        })
      }

      // d. Hantar Notifikasi WhatsApp automatik jika nombor WA wujud
      let waStatus = 'No Phone'
      if (customer.phonenumber) {
        const expiryDate = customer.expired_at 
          ? new Date(customer.expired_at).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' }) 
          : 'Tarikh Luput'
        const planName = customer.plans?.name_plan || 'Pakej Internet'
        const price = customer.plans?.price || 0

        const message = 
          `⚠️ *NOTIFIKASI TAMAT TEMPOH (PURNAMA WIFI)* ⚠️\n\n` +
          `Salam sejahtera *${customer.fullname}*,\n\n` +
          `Akaun internet PPPoE anda (*${customer.username}*) telah *TAMAT TEMPOH* pada *${expiryDate}*.\n\n` +
          `Pakej: *${planName}*\n` +
          `Jumlah Bayaran: *RM ${price}*\n\n` +
          `━━━━━━━━━━━━━━━\n` +
          `📲 *BUAT BAYARAN SEKARANG:*\n\n` +
          `Sila buka aplikasi Purnama WiFi anda untuk membuat semakan dan pembayaran.\n\n` +
          `━━━━━━━━━━━━━━━\n` +
          `Terima kasih kerana memilih Purnama WiFi! 🙏`

        const sent = await sendWhatsApp(customer.phonenumber, message)
        waStatus = sent ? 'WA Notified' : 'WA Failed'
      }


      results.push({ id: customer.id, username: customer.username, status: 'Cut-off & Invoice Generated', wa: waStatus })
    }

    return NextResponse.json({ 
      success: true, 
      processed_count: expiredCustomers.length,
      details: results
    })

  } catch (err) {
    console.error('❌ Auto-Cut Cron Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
