import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

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
      .select('*')
      .eq('service_type', 'PPPoE')
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

      results.push({ id: customer.id, username: customer.username, status: 'Cut-off Success' })
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
