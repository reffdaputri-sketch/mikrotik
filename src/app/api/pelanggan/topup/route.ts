import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { customer_id, amount, method } = await request.json()
    const supabase = await createAdminClient()

    // 1. Ambil data pelanggan & salah satu plan
    const { data: customer } = await supabase.from('customers').select('*').eq('id', customer_id).single()
    const { data: plans } = await supabase.from('plans').select('id').limit(1).single()

    if (!customer) return NextResponse.json({ error: 'Pelanggan tidak ditemukan' }, { status: 404 })
    
    const order_id = method === 'manual' 
      ? `TRF-${Math.random().toString(36).slice(2, 10).toUpperCase()}`
      : `TOPUP-${Math.random().toString(36).slice(2, 10).toUpperCase()}`

    // 2. Simpan ke database (Sekarang sertakan plan_name karena wajib di database Anda)
    const insertData: any = {
      order_id,
      customer_id: customer.id,
      customer_name: customer.fullname,
      plan_name: 'Top Up Wallet', // Wajib ada!
      price: parseFloat(amount),
      status: 'pending'
    }

    // Isi plan_id jika ada paket tersedia
    if (plans) insertData.plan_id = plans.id

    const { error: orderError } = await supabase.from('payment_orders').insert(insertData)

    if (orderError) {
      console.error('DATABASE ERROR:', orderError)
      return NextResponse.json({ error: `DB Error: ${orderError.message}` }, { status: 500 })
    }

    // 3. Respon sukses
    if (method === 'manual') {
      return NextResponse.json({ success: true, order_id })
    }

    // Jika online, buat transaksi ToyyibPay
    const { createToyyibpayBill } = await import('@/lib/toyyibpay')
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    const toyyibRes = await createToyyibpayBill({
      billName: 'Top Up Purnama WiFi',
      billDescription: `Top up wallet for ${customer.fullname || customer.username}`,
      billAmount: parseFloat(amount),
      billTo: customer.fullname || customer.username,
      billEmail: `${customer.username}@purnama.local`, // Fallback email
      billPhone: customer.phonenumber || '08123456789',
      externalReferenceNo: order_id,
      callbackUrl: `${appUrl}/api/webhook/toyyibpay`,
      returnUrl: `${appUrl}/payment-callback?order_id=${order_id}&status=success`
    })

    if (toyyibRes.success) {
      // Simpan URL gateway ke database
      await supabase.from('payment_orders').update({ redirect_url: toyyibRes.paymentUrl }).eq('order_id', order_id)
      return NextResponse.json({ redirect_url: toyyibRes.paymentUrl, order_id })
    } else {
      console.error('ToyyibPay Error:', toyyibRes)
      // Fallback response for error
      return NextResponse.json({ error: `Gagal sambung ke Gateway: ${toyyibRes.error}` }, { status: 400 })
    }

  } catch (e: any) {
    console.error('ROUTE ERROR:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
