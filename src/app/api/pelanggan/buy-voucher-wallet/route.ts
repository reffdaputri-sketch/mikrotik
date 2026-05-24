import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'
import { generateOrderId, generateVoucherCode } from '@/lib/utils'

export async function POST(request: Request) {
  try {
    const { plan_id, customer_id, name, phone } = await request.json()
    
    if (!customer_id) return NextResponse.json({ error: 'Sila login dahulu' }, { status: 401 })
    if (!plan_id) return NextResponse.json({ error: 'Pakej tidak sah' }, { status: 400 })

    const supabase = await createAdminClient()

    // 1. Ambil data pelanggan & baki saldo terkini
    const { data: customer, error: custErr } = await supabase
      .from('customers')
      .select('id, balance, fullname, username')
      .eq('id', customer_id)
      .single()

    if (custErr || !customer) return NextResponse.json({ error: 'Pelanggan tidak ditemukan' }, { status: 404 })

    // 2. Ambil data plan
    const { data: plan, error: planErr } = await supabase
      .from('plans')
      .select('*, bandwidths(*)')
      .eq('id', plan_id)
      .eq('enabled', true)
      .single()

    if (planErr || !plan) return NextResponse.json({ error: 'Pakej tidak ditemukan' }, { status: 404 })

    const price = Number(plan.price)
    const balance = Number(customer.balance) || 0

    // 3. Cek apakah saldo cukup
    if (balance < price) {
      return NextResponse.json({ error: `Baki tidak mencukupi. Baki anda RM ${balance.toFixed(2)}` }, { status: 400 })
    }

    // --- PROSES TRANSAKSI ---
    
    // A. Potong Saldo
    const newBalance = balance - price
    await supabase.from('customers').update({ balance: newBalance }).eq('id', customer.id)

    // B. Catat Log Saldo
    await supabase.from('balance_logs').insert({
      customer_id: customer.id,
      amount: price,
      type: 'purchase',
      description: `Beli Baucar: ${plan.name_plan}`,
      created_at: new Date().toISOString()
    })

    // C. Buat Order (Langsung PAID)
    const orderId = generateOrderId()
    const { data: order } = await supabase
      .from('payment_orders')
      .insert({
        order_id: orderId,
        customer_id: customer.id,
        customer_name: name || customer.fullname,
        customer_phone: phone,
        plan_id: plan.id,
        plan_name: plan.name_plan,
        router_id: plan.router_id || null,
        price: price,
        status: 'paid',
        paid_at: new Date().toISOString(),
        payment_type: 'Wallet'
      })
      .select()
      .single()

    // D. Alokasi Voucher
    const { data: existingVoucher } = await supabase
      .from('vouchers')
      .select('*')
      .eq('plan_id', plan.id)
      .eq('status', 'unused')
      .limit(1)
      .single()

    let vCode = '', vUser = '', vPass = ''

    if (existingVoucher) {
      vCode = existingVoucher.code
      vUser = existingVoucher.username || existingVoucher.code
      vPass = existingVoucher.password || existingVoucher.code
      await supabase.from('vouchers').update({ status: 'used', used_at: new Date().toISOString() }).eq('id', existingVoucher.id)
    } else {
      vCode = generateVoucherCode(8)
      vUser = vCode
      vPass = vCode
      await supabase.from('vouchers').insert({
        code: vCode, type: plan.type, plan_id: plan.id, router_id: plan.router_id,
        username: vUser, password: vPass, status: 'used', used_at: new Date().toISOString()
      })
    }

    // E. Mikrotik Queue
    if (plan.router_id) {
      let limitUptime = undefined
      if (plan.validity && plan.validity_unit) {
        const val = parseInt(plan.validity.toString())
        const unit = plan.validity_unit.toString().toLowerCase()
        if (val > 0) {
          if (unit.startsWith('min')) limitUptime = `${val}m`
          else if (unit.startsWith('hr') || unit.startsWith('jam')) limitUptime = `${val}h`
          else if (unit.startsWith('day') || unit.startsWith('hari')) limitUptime = `${val}d`
          else if (unit.startsWith('month') || unit.startsWith('bulan')) limitUptime = `${val * 30}d`
        }
      }

      await supabase.from('mikrotik_command_queue').insert({
        router_id: plan.router_id,
        command: plan.type === 'Hotspot' ? 'add_hotspot_user' : 'add_pppoe_secret',
        payload: {
          username: vUser,
          password: vPass,
          profile: (plan.bandwidths as any)?.name_bw || 'default',
          comment: `Purnama-Wallet-${orderId}`,
          ...(limitUptime && { limit_uptime: limitUptime })
        },
        status: 'pending',
      })
    }

    // F. Update order dengan voucher
    await supabase.from('payment_orders')
      .update({ voucher_code: vCode, voucher_username: vUser, voucher_password: vPass })
      .eq('id', order.id)

    return NextResponse.json({
      success: true,
      order_id: orderId,
      voucher_code: vCode,
      username: vUser,
      password: vPass
    })

  } catch (err: any) {
    console.error('Wallet Purchase Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
