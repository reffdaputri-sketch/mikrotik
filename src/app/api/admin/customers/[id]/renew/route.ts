import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const { id: customerId } = await params
  const supabase = await createAdminClient()

  try {
    // 1. Ambil data pelanggan saat ini
    const { data: customer, error: fetchErr } = await supabase
      .from('customers')
      .select('*, plans(*)')
      .eq('id', customerId)
      .single()

    if (fetchErr || !customer) {
      console.error('❌ RENEW: Customer not found or error:', fetchErr)
      throw new Error('Customer not found')
    }

    console.log('🔄 RENEW: Processing customer:', customer.username)
    console.log('🔄 RENEW: Current Plan:', customer.plans?.name_plan)

    // 2. Hitung tanggal expired baru
    // Jika expired lama sudah lewat, hitung dari hari ini.
    // Jika belum lewat, tambahkan dari tanggal expired lama.
    const now = new Date()
    const currentExp = customer.expired_at ? new Date(customer.expired_at) : now
    const baseDate = currentExp > now ? currentExp : now
    
    // Default tambah 30 hari (atau sesuai durasi paket jika ada)
    const newExp = new Date(baseDate)
    const validity = customer.plans?.validity || 30
    const unit = customer.plans?.validity_unit || 'Days'

    if (unit === 'Months') newExp.setMonth(newExp.getMonth() + parseInt(validity))
    else newExp.setDate(newExp.getDate() + parseInt(validity))

    // 3. Update database: Status Active + Expired Baru
    const { error: updateErr } = await supabase
      .from('customers')
      .update({
        status: 'Active',
        expired_at: newExp.toISOString(),
      })
      .eq('id', customerId)

    if (updateErr) throw updateErr

    // 4. Rekod Sejarah Pembayaran (Buat History untuk User)
    const { generateOrderId } = await import('@/lib/utils')
    await supabase.from('payment_orders').insert({
      order_id: generateOrderId(),
      customer_id: customer.id,
      customer_name: customer.fullname,
      customer_phone: customer.phonenumber || '',
      plan_id: customer.plans?.id,
      plan_name: customer.plans?.name_plan,
      price: customer.plans?.price || 0,
      status: 'paid',
      paid_at: new Date().toISOString(),
      payment_type: 'Admin Manual',
      description: `Manual Renewal by Admin`
    })

    // 5. Kirim perintah ke MikroTik Agent buat AKTIFKAN (Enable) kembali
    if (customer.router_id) {
      await supabase.from('mikrotik_command_queue').insert({
        router_id: customer.router_id,
        command: 'enable_pppoe_secret',
        payload: {
          username: customer.username,
          comment: `RENEWED: New expiry ${newExp.toLocaleDateString()}`,
        },
        status: 'pending',
      })
    }

    return NextResponse.json({ 
      success: true, 
      new_expiry: newExp.toISOString() 
    })

  } catch (err: any) {
    console.error('❌ Renew Error:', err)
    return NextResponse.json({ error: err.message || 'Gagal memperpanjang paket' }, { status: 500 })
  }
}
