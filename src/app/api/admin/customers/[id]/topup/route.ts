import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const { id } = await params
  const { amount } = await request.json()

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: 'Jumlah tidak sah' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  try {
    // 1. Ambil data pelanggan saat ini
    const { data: customer, error: fetchErr } = await supabase
      .from('customers')
      .select('balance, fullname, username')
      .eq('id', id)
      .single()

    if (fetchErr || !customer) return NextResponse.json({ error: 'Pelanggan tidak ditemukan' }, { status: 404 })

    const newBalance = (Number(customer.balance) || 0) + Number(amount)

    // 2. Update saldo
    const { error: updateErr } = await supabase
      .from('customers')
      .update({ balance: newBalance })
      .eq('id', id)

    if (updateErr) throw updateErr

    // 3. Catat di balance_logs
    await supabase.from('balance_logs').insert({
      customer_id: id,
      amount: amount,
      type: 'topup',
      description: `Top Up Cash oleh Admin`,
      created_at: new Date().toISOString()
    })

    // 4. Buat record di payment_orders sebagai audit
    await supabase.from('payment_orders').insert({
      order_id: `CASH-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
      customer_id: id,
      customer_name: customer.fullname,
      plan_name: 'Top Up Cash',
      price: amount,
      status: 'paid',
      paid_at: new Date().toISOString(),
      payment_type: 'Cash'
    })

    return NextResponse.json({ success: true, new_balance: newBalance })
  } catch (err: any) {
    console.error('Cash Topup Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
