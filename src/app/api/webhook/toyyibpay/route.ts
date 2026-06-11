import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { generateVoucherCode } from '@/lib/utils'
import { verifyToyyibpayTransaction } from '@/lib/toyyibpay'

export async function POST(request: Request) {
  try {
    // toyyibPay mengirim data lewat Form Data
    const formData = await request.formData()
    const params = {
      refno: formData.get('refno') as string,
      status: formData.get('status') as string,
      reason: formData.get('reason') as string,
      billcode: formData.get('billcode') as string,
      order_id: formData.get('order_id') as string, // externalReferenceNo kita
      amount: formData.get('amount') as string,
    }

    console.log('TOYYIBPAY WEBHOOK RECEIVED:', params)

    // Cek awal (hanya mengecek data yang dikirim)
    if (params.status !== '1') {
      return NextResponse.json({ status: 'ignored', reason: params.reason })
    }

    // --- VERIFIKASI GANDA (KEAMANAN TINGKAT TINGGI) ---
    // Jangan langsung percaya! Tanya ke ToyyibPay beneran lunas gak.
    const verification = await verifyToyyibpayTransaction(params.billcode, '1')
    
    if (!verification.isPaid) {
      console.error('SECURITY ALERT: Fake webhook payload detected or transaction unpaid!', params)
      return NextResponse.json({ error: 'Verification failed. This incident will be reported.' }, { status: 403 })
    }
    // --------------------------------------------------

    const supabase = await createAdminClient()

    // Ambil order berdasarkan externalReferenceNo (order_id)
    const { data: order } = await supabase
      .from('payment_orders')
      .select('*, plans(*)')
      .eq('order_id', params.order_id)
      .single()

    if (!order || order.status === 'paid') {
      return NextResponse.json({ status: 'already_processed_or_not_found' })
    }

    // --- LOGIKA TOP-UP WALLET ---
    if (order.plan_name === 'Top Up Saldo Wallet' || order.plan_name === 'Top Up Wallet' || order.order_id.startsWith('TOPUP-') || order.order_id.startsWith('TRF-')) {
      // 1. Update order status
      await supabase
        .from('payment_orders')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          payment_type: 'toyyibPay'
        })
        .eq('order_id', params.order_id)

      // 2. Tambahkan saldo pelanggan
      if (order.customer_id) {
        const { data: customer } = await supabase.from('customers').select('balance').eq('id', order.customer_id).single()
        const currentBalance = customer?.balance || 0
        const topupAmount = order.price

        await supabase.from('customers').update({
          balance: currentBalance + topupAmount
        }).eq('id', order.customer_id)

        // 3. Catat di balance_logs
        await supabase.from('balance_logs').insert({
          customer_id: order.customer_id,
          amount: topupAmount,
          type: 'topup',
          description: `Top-up via ToyyibPay (Order: ${order.order_id})`,
        })
      }

      return new Response('OK', { status: 200 })
    }
    // ----------------------------

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

    // Queue MikroTik command
    if (plan.router_id) {
      await supabase.from('mikrotik_command_queue').insert({
        router_id: plan.router_id,
        command: plan.type === 'Hotspot' ? 'add_hotspot_user' : 'add_pppoe_secret',
        payload: {
          username: voucherUsername,
          password: voucherPassword,
          profile: plan.bandwidths?.name_bw || 'default',
          comment: `toyyibPay-${params.order_id}`,
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
        voucher_code: voucherCode || null,
        voucher_username: voucherUsername || null,
        voucher_password: voucherPassword || null,
        payment_type: 'toyyibPay'
      })
      .eq('order_id', params.order_id)

    // JIKA INI ADALAH RENEWAL PPPOE (Bukan Voucher Biasa)
    if (order.description?.startsWith('RENEWAL_PPPOE:')) {
      const customerId = order.description.split(':')[1]
      
      // Ambil data pelanggan saat ini
      const { data: customer } = await supabase.from('customers').select('*').eq('id', customerId).single()
      
      if (customer) {
        const now = new Date()
        const currentExp = customer.expired_at ? new Date(customer.expired_at) : now
        const baseDate = currentExp > now ? currentExp : now
        
        const newExp = new Date(baseDate)
        const validity = plan.validity || 30
        const unit = plan.validity_unit || 'Days'

        if (unit === 'Months') newExp.setMonth(newExp.getMonth() + parseInt(validity))
        else newExp.setDate(newExp.getDate() + parseInt(validity))

        // Update database pelanggan
        await supabase.from('customers').update({
          status: 'Active',
          expired_at: newExp.toISOString()
        }).eq('id', customerId)

        // Kirim perintah ENABLE ke MikroTik
        if (customer.router_id) {
          await supabase.from('mikrotik_command_queue').insert({
            router_id: customer.router_id,
            command: 'enable_pppoe_secret',
            payload: { username: customer.username },
            status: 'pending'
          })
        }
      }
    }

    return new Response('OK', { status: 200 })
  } catch (err) {
    console.error('toyyibPay Webhook error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
