import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { customer_id } = await request.json()
    const supabase = await createAdminClient()

    // 1. Ambil data pelanggan & pakej
    const { data: customer } = await supabase
      .from('customers')
      .select('*, plans(*)')
      .eq('id', customer_id)
      .single()

    if (!customer) return NextResponse.json({ error: 'Pelanggan tidak dijumpai' }, { status: 404 })
    if (!customer.plans) return NextResponse.json({ error: 'Pakej tidak dijumpai' }, { status: 400 })

    const price = customer.plans.price

    // 2. Semak baki saldo
    if (customer.balance < price) {
      return NextResponse.json({ error: 'Baki wallet tidak mencukupi' }, { status: 400 })
    }

    // 3. Mulakan Transaksi (Update Balance & Renew Expiry)
    const newBalance = customer.balance - price
    
    // Hitung tarikh luput baharu
    const currentExpiry = customer.expired_at ? new Date(customer.expired_at) : new Date()
    const baseDate = currentExpiry > new Date() ? currentExpiry : new Date()
    
    const newExpiry = new Date(baseDate)
    if (customer.plans.validity_unit === 'Months') {
      newExpiry.setMonth(newExpiry.getMonth() + parseInt(customer.plans.validity))
    } else {
      newExpiry.setDate(newExpiry.getDate() + parseInt(customer.plans.validity))
    }

    // Update Customer
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        balance: newBalance,
        expired_at: newExpiry.toISOString(),
        status: 'Active'
      })
      .eq('id', customer_id)

    if (updateError) throw updateError

    // 4. Rekodkan transaksi ke payment_orders sebagai 'paid'
    // Cek dulu apakah ada invoice pending (misal dari cronjob auto-cut)
    const { data: pendingOrders } = await supabase
      .from('payment_orders')
      .select('id, order_id')
      .eq('customer_id', customer.id)
      .eq('status', 'pending')
      .limit(1)

    if (pendingOrders && pendingOrders.length > 0) {
      await supabase.from('payment_orders').update({
        status: 'paid',
        payment_type: 'Wallet',
        paid_at: new Date().toISOString()
      }).eq('id', pendingOrders[0].id)
    } else {
      const order_id = `WAL-${Math.random().toString(36).slice(2, 10).toUpperCase()}`
      await supabase.from('payment_orders').insert({
        order_id,
        customer_id: customer.id,
        customer_name: customer.fullname || customer.username,
        username: customer.username,
        plan_id: customer.plans.id,
        plan_name: customer.plans.name_plan,
        price: price,
        status: 'paid',
        payment_type: 'Wallet',
        created_at: new Date().toISOString(),
        paid_at: new Date().toISOString()
      })
    }

    // 5. Isyarat ke MikroTik (Enable User)
    if (customer.router_id) {
      await supabase.from('mikrotik_command_queue').insert({
        router_id: customer.router_id,
        command: customer.service_type === 'PPPoE' ? 'enable_pppoe_secret' : 'enable_hotspot_user',
        payload: { username: customer.username },
        status: 'pending',
      })
    }

    return NextResponse.json({ success: true, new_balance: newBalance })

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
