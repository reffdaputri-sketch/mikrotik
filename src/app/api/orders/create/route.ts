import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { generateOrderId, generateVoucherCode } from '@/lib/utils'

export async function POST(request: Request) {
  try {
    const { plan_id, name, phone, email, customer_id } = await request.json()

    if (!plan_id || !name || !phone) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Ambil data plan
    const { data: plan, error: planErr } = await supabase
      .from('plans')
      .select('*, bandwidths(*)')
      .eq('id', plan_id)
      .eq('enabled', true)
      .single()

    if (planErr || !plan) {
      return NextResponse.json({ error: 'Paket tidak ditemukan' }, { status: 404 })
    }

    const orderId = generateOrderId()
    const expiredAt = new Date(Date.now() + 3 * 60 * 60 * 1000) // 3 jam

    // Buat payment order dulu
    const { data: order, error: orderErr } = await supabase
      .from('payment_orders')
      .insert({
        order_id: orderId,
        customer_id: customer_id || null, // Link ke akaun kalau tengah login
        customer_name: name,
        customer_email: email || null,
        customer_phone: phone,
        plan_id: plan.id,
        plan_name: plan.name_plan,
        router_id: plan.router_id || null,
        price: plan.price,
        gateway: 'toyyibPay',
        status: 'pending',
        expired_at: expiredAt.toISOString(),
      })
      .select()
      .single()

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Gagal membuat order' }, { status: 500 })
    }

    // Ambil config toyyibPay dari ENV
    const secretKey = process.env.TOYYIBPAY_USER_SECRET_KEY
    const categoryCode = process.env.TOYYIBPAY_CATEGORY_CODE
    
    console.log('DEBUG TOYYIBPAY:', { 
      hasSecret: !!secretKey && secretKey !== 'your-toyyibpay-secret-key',
      hasCategory: !!categoryCode && categoryCode !== 'your-category-code'
    })

    if (!secretKey || secretKey === 'your-toyyibpay-secret-key' || !categoryCode || categoryCode === 'your-category-code') {
      console.log('TOYYIBPAY NOT CONFIGURED, FALLBACK TO DIRECT DELIVERY')
      return await deliverVoucherDirect(supabase, order, plan)
    }

    // --- TOYYIBPAY CREATE BILL ---
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const { createToyyibpayBill } = await import('@/lib/toyyibpay')
    
    const toyyibRes = await createToyyibpayBill({
      billName: `Internet Voucher: ${plan.name_plan}`,
      billDescription: `Purchase of ${plan.name_plan} for ${name}`,
      billAmount: parseFloat(plan.price),
      billTo: name,
      billEmail: email || `${phone}@purnama.local`,
      billPhone: phone,
      externalReferenceNo: orderId,
      callbackUrl: `${appUrl}/api/webhook/toyyibpay`,
      returnUrl: `${appUrl}/beli/status?order_id=${orderId}`
    })

    if (!toyyibRes.success) {
      console.error('toyyibPay error:', toyyibRes.error)
      // Jangan fallback ke direct delivery kalau toyyibpay error beneran
      return NextResponse.json({ 
        error: `Gagal menyambung ke ToyyibPay: ${toyyibRes.error}. Sila semak API Key anda.` 
      }, { status: 400 })
    }

    // Simpan redirect url
    await supabase
      .from('payment_orders')
      .update({ redirect_url: toyyibRes.paymentUrl })
      .eq('id', order.id)

    return NextResponse.json({
      order_id: orderId,
      redirect_url: toyyibRes.paymentUrl,
    })
  } catch (err: any) {
    console.error('Order error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

// Deliver voucher langsung (tanpa payment gateway / setelah bayar)
async function deliverVoucherDirect(
  supabase: ReturnType<typeof createAdminClient> extends Promise<infer T> ? T : never,
  order: Record<string, unknown>,
  plan: Record<string, unknown>
) {
  // Cek apakah ada voucher tersedia
  const { data: existingVoucher } = await supabase
    .from('vouchers')
    .select('*')
    .eq('plan_id', plan.id)
    .eq('status', 'unused')
    .limit(1)
    .single()

  let voucherCode = ''
  let voucherUsername = ''
  let voucherPassword = ''

  if (existingVoucher) {
    // Ambil voucher dari stok
    voucherCode = existingVoucher.code
    voucherUsername = existingVoucher.username || existingVoucher.code
    voucherPassword = existingVoucher.password || existingVoucher.code

    // Tandai voucher sebagai terpakai
    await supabase
      .from('vouchers')
      .update({ status: 'used', used_at: new Date().toISOString() })
      .eq('id', existingVoucher.id)
  } else {
    // Generate voucher baru otomatis
    voucherCode = generateVoucherCode(8)
    voucherUsername = voucherCode
    voucherPassword = generateVoucherCode(6)

    await supabase.from('vouchers').insert({
      code: voucherCode,
      type: plan.type as string,
      plan_id: plan.id,
      router_id: plan.router_id || null,
      username: voucherUsername,
      password: voucherPassword,
      status: 'used',
      used_at: new Date().toISOString(),
    })

  }

  // Kirim command ke MikroTik via queue (Wajib jalan untuk voucher stok maupun baru)
  if (plan.router_id) {
    await supabase.from('mikrotik_command_queue').insert({
      router_id: plan.router_id,
      command: plan.type === 'Hotspot' ? 'add_hotspot_user' : 'add_pppoe_secret',
      payload: {
        username: voucherUsername,
        password: voucherPassword,
        profile: (plan.bandwidths as any)?.name_bw || 'default',
        comment: `Purnama-Order-${order.order_id}`,
      },
      status: 'pending',
    })
  }

  // Update order dengan info voucher
  await supabase
    .from('payment_orders')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      voucher_code: voucherCode,
      voucher_username: voucherUsername,
      voucher_password: voucherPassword,
    })
    .eq('id', order.id)

  return NextResponse.json({
    order_id: order.order_id,
    voucher_code: voucherCode,
    username: voucherUsername,
    password: voucherPassword,
  })
}
