import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { generateOrderId } from '@/lib/utils'
import { createToyyibpayBill } from '@/lib/toyyibpay'

export async function POST(request: Request) {
  try {
    const { customer_id } = await request.json()
    const supabase = await createAdminClient()

    // 1. Ambil data pelanggan & paketnya
    const { data: customer, error } = await supabase
      .from('customers')
      .select('*, plans(*)')
      .eq('id', customer_id)
      .single()

    if (error || !customer) {
      return NextResponse.json({ error: 'Pelanggan tidak ditemukan' }, { status: 404 })
    }

    const plan = customer.plans
    const orderId = generateOrderId()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // 2. Buat record di payment_orders (tipe renewal)
    const { data: order, error: orderErr } = await supabase.from('payment_orders').insert({
      order_id: orderId,
      customer_name: customer.fullname,
      customer_id: customer.id,
      plan_id: plan.id,
      price: plan.price,
      status: 'pending',
      payment_type: 'toyyibPay',
      // Kita tandai ini sebagai renewal PPPoE
      description: `RENEWAL_PPPOE:${customer.id}`
    }).select().single()

    if (orderErr) throw orderErr

    // 3. Buat tagihan di toyyibPay (atau proses langsung jika belum disetup)
    const secretKey = process.env.TOYYIBPAY_USER_SECRET_KEY
    if (!secretKey || secretKey === 'your-toyyibpay-secret-key') {
      console.log('--- MODE SIMULASI AKTIF ---')
      return await processRenewalDirectly(supabase, customer, plan, order)
    }

    const toyyibRes = await createToyyibpayBill({
      billName: `Pembaharuan ${plan.name_plan}`,
      billDescription: `Pembaharuan internet untuk ${customer.username}`,
      billAmount: plan.price,
      billTo: customer.fullname,
      billEmail: customer.email || 'customer@purnama.com',
      billPhone: customer.phonenumber,
      externalReferenceNo: order.order_id,
      returnUrl: `${appUrl}/pelanggan?status=pending`,
      callbackUrl: `${appUrl}/api/webhook/toyyibpay`
    })

    if (!toyyibRes.success) {
      console.error('toyyibPay error:', toyyibRes.error)
      return await processRenewalDirectly(supabase, customer, plan, order)
    }

    // 4. Update redirect_url di database
    await supabase.from('payment_orders').update({
      redirect_url: toyyibRes.paymentUrl
    }).eq('id', order.id)

    return NextResponse.json({ redirect_url: toyyibRes.paymentUrl })

  } catch (err) {
    console.error('Renew error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function processRenewalDirectly(supabase: any, customer: any, plan: any, order: any) {
  const now = new Date()
  const currentExp = customer.expired_at ? new Date(customer.expired_at) : now
  const baseDate = currentExp > now ? currentExp : now
  
  const newExp = new Date(baseDate)
  const validity = plan.validity || 30
  const unit = plan.validity_unit || 'Days'

  if (unit === 'Months') newExp.setMonth(newExp.getMonth() + parseInt(validity))
  else newExp.setDate(newExp.getDate() + parseInt(validity))

  // 1. Update pelanggan
  await supabase.from('customers').update({
    status: 'Active',
    expired_at: newExp.toISOString()
  }).eq('id', customer.id)

  // 2. Update order
  await supabase.from('payment_orders').update({
    status: 'paid',
    paid_at: new Date().toISOString(),
    payment_type: 'Simulation'
  }).eq('id', order.id)

  // 3. Command ke MikroTik
  if (customer.router_id) {
    await supabase.from('mikrotik_command_queue').insert({
      router_id: customer.router_id,
      command: 'enable_pppoe_secret',
      payload: { username: customer.username },
      status: 'pending'
    })
  }

  return NextResponse.json({ 
    success: true, 
    message: 'Simulasi berjaya! Internet diaktifkan.',
    redirect_url: '/pelanggan?status=success'
  })
}
