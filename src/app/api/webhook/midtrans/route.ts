import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { generateVoucherCode } from '@/lib/utils'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      order_id,
      transaction_status,
      fraud_status,
      gross_amount,
      signature_key,
      status_code,
    } = body

    // Verifikasi signature Midtrans
    const serverKey = process.env.MIDTRANS_SERVER_KEY || ''
    const expectedSig = crypto
      .createHash('sha512')
      .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
      .digest('hex')

    if (signature_key !== expectedSig) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }

    const isPaid =
      (transaction_status === 'settlement' || transaction_status === 'capture') &&
      fraud_status !== 'deny'

    if (!isPaid) {
      // Update status jika failed/expired
      if (['cancel', 'deny', 'expire'].includes(transaction_status)) {
        const supabase = await createAdminClient()
        await supabase
          .from('payment_orders')
          .update({ status: transaction_status === 'expire' ? 'expired' : 'failed' })
          .eq('order_id', order_id)
      }
      return NextResponse.json({ status: 'ignored' })
    }

    const supabase = await createAdminClient()

    // Ambil order
    const { data: order } = await supabase
      .from('payment_orders')
      .select('*, plans(*)')
      .eq('order_id', order_id)
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
    
    // Queue MikroTik command (Wajib jalan untuk voucher stok maupun baru)
    if (plan.router_id) {
      await supabase.from('mikrotik_command_queue').insert({
        router_id: plan.router_id,
        command: plan.type === 'Hotspot' ? 'add_hotspot_user' : 'add_pppoe_secret',
        payload: {
          username: voucherUsername,
          password: voucherPassword,
          profile: plan.bandwidths?.name_bw || 'default',
          comment: `NuxBill-${order_id}`,
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
      })
      .eq('order_id', order_id)

    return NextResponse.json({ status: 'ok' })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
