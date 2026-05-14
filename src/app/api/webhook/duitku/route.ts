import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { generateVoucherCode } from '@/lib/utils'
import { verifyDuitkuCallback } from '@/lib/duitku'

export async function POST(request: Request) {
  try {
    // Duitku mengirim data lewat Form Data (x-www-form-urlencoded)
    const formData = await request.formData()
    const params = {
      merchantCode: formData.get('merchantCode') as string,
      amount: formData.get('amount') as string,
      merchantOrderId: formData.get('merchantOrderId') as string,
      productDetail: formData.get('productDetail') as string,
      additionalParam: formData.get('additionalParam') as string,
      paymentCode: formData.get('paymentCode') as string,
      resultCode: formData.get('resultCode') as string,
      merchantUserId: formData.get('merchantUserId') as string,
      reference: formData.get('reference') as string,
      signature: formData.get('signature') as string,
    }

    // Verifikasi Signature (Pakai ENV sesuai permintaan user)
    const merchantCode = process.env.DUITKU_MERCHANT_CODE || ''
    const apiKey = process.env.DUITKU_API_KEY || ''
    const raw = params.merchantCode + params.amount + params.merchantOrderId + apiKey
    const expected = require('crypto').createHash('md5').update(raw).digest('hex')

    if (params.signature !== expected) {
      console.error('INVALID SIGNATURE:', { expected, received: params.signature })
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }

    // Cek jika pembayaran sukses (resultCode '00' = success)
    if (params.resultCode !== '00') {
      return NextResponse.json({ status: 'ignored' })
    }

    const supabase = await createAdminClient()

    // Ambil order
    const { data: order } = await supabase
      .from('payment_orders')
      .select('*, plans(*)')
      .eq('order_id', params.merchantOrderId)
      .single()

    if (!order || order.status === 'paid') {
      return NextResponse.json({ status: 'already_processed' })
    }

    const plan = order.plans

    // Ambil / generate voucher
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
      voucherCode = existingVoucher.code
      voucherUsername = existingVoucher.username || existingVoucher.code
      voucherPassword = existingVoucher.password || existingVoucher.code
      await supabase
        .from('vouchers')
        .update({ status: 'used', used_at: new Date().toISOString() })
        .eq('id', existingVoucher.id)
    } else {
      voucherCode = generateVoucherCode(8)
      voucherUsername = voucherCode
      voucherPassword = generateVoucherCode(6)

      await supabase.from('vouchers').insert({
        code: voucherCode,
        type: plan.type,
        plan_id: plan.id,
        router_id: plan.router_id || null,
        username: voucherUsername,
        password: voucherPassword,
        status: 'used',
        used_at: new Date().toISOString(),
      })
    }

    // Queue MikroTik command (Wajib jalan)
    if (plan.router_id) {
      await supabase.from('mikrotik_command_queue').insert({
        router_id: plan.router_id,
        command: plan.type === 'Hotspot' ? 'add_hotspot_user' : 'add_pppoe_secret',
        payload: {
          username: voucherUsername,
          password: voucherPassword,
          profile: plan.bandwidths?.name_bw || 'default',
          comment: `NuxBill-${params.merchantOrderId}`,
        },
        status: 'pending',
      })
    }

    // Update payment order
    await supabase
      .from('payment_orders')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        voucher_code: voucherCode,
        voucher_username: voucherUsername,
        voucher_password: voucherPassword,
        payment_type: params.paymentCode
      })
      .eq('order_id', params.merchantOrderId)

    return NextResponse.json({ status: 'ok' })
  } catch (err) {
    console.error('Duitku Webhook error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
