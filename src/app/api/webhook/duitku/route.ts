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

    // --- LOGIK PEMBAYARAN MENGIKUT JENIS ---
    
    // 1. Jika JENIS TOP UP SALDO
    if (order.plan_name === 'Top Up Saldo Wallet') {
      const { data: customer } = await supabase.from('customers').select('id, balance').eq('username', order.username).single()
      if (customer) {
        const newBalance = Number(customer.balance) + Number(order.price)
        await supabase.from('customers').update({ balance: newBalance }).eq('id', customer.id)
        
        // Log Mutasi Saldo
        await supabase.from('balance_logs').insert({
          username: order.username,
          type: 'Top Up',
          amount: order.price,
          description: `Top Up via Payment Gateway (${params.paymentCode})`
        })
      }
    } 
    // 2. Jika PEMBAYARAN PEMBAHARUAN (Renewal)
    else if (order.username && order.plan_id) {
      const { data: customer } = await supabase.from('customers').select('*').eq('username', order.username).single()
      if (customer) {
        const plan = order.plans
        const currentExpiry = customer.expired_at ? new Date(customer.expired_at) : new Date()
        const baseDate = currentExpiry > new Date() ? currentExpiry : new Date()
        
        const newExpiry = new Date(baseDate)
        if (plan.validity_unit === 'Months') {
          newExpiry.setMonth(newExpiry.getMonth() + parseInt(plan.validity))
        } else {
          newExpiry.setDate(newExpiry.getDate() + parseInt(plan.validity))
        }

        await supabase.from('customers').update({ 
          expired_at: newExpiry.toISOString(),
          status: 'Active'
        }).eq('id', customer.id)

        // Queue MikroTik command
        if (customer.router_id) {
          await supabase.from('mikrotik_command_queue').insert({
            router_id: customer.router_id,
            command: customer.service_type === 'PPPoE' ? 'enable_pppoe_secret' : 'enable_hotspot_user',
            payload: { username: customer.username },
            status: 'pending',
          })
        }
      }
    }
    // 3. Jika PEMBELIAN VOUCHER BARU
    else {
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
            comment: `Purnama-${params.merchantOrderId}`,
          },
          status: 'pending',
        })
      }
      
      // Update order with voucher info
      await supabase.from('payment_orders').update({
        voucher_code: voucherCode,
        voucher_username: voucherUsername,
        voucher_password: voucherPassword,
      }).eq('order_id', params.merchantOrderId)
    }

    // Akhiri dengan update status order
    await supabase
      .from('payment_orders')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        payment_type: params.paymentCode
      })
      .eq('order_id', params.merchantOrderId)

    return NextResponse.json({ status: 'ok' })
  } catch (err) {
    console.error('Duitku Webhook error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
