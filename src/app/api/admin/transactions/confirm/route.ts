import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'

export async function POST(request: Request) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const body = await request.json()
  const { id } = body
  const supabase = await createAdminClient()

  try {
    // 1. Ambil data order
    const { data: order, error: orderErr } = await supabase
      .from('payment_orders')
      .select('*, plans(*)')
      .eq('id', id)
      .single()

    if (orderErr || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    if (order.status === 'paid') return NextResponse.json({ error: 'Order already paid' }, { status: 400 })

    // 2. Update status order jadi paid
    await supabase.from('payment_orders').update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      payment_type: 'Manual/Admin'
    }).eq('id', id)

    // 3. JIKA INI RENEWAL PPPOE, update masa aktif & nyalain internet
    if (order.description?.startsWith('RENEWAL_PPPOE:')) {
      const customerId = order.description.split(':')[1]
      
      const { data: customer } = await supabase.from('customers').select('*').eq('id', customerId).single()
      
      if (customer) {
        const now = new Date()
        const currentExp = customer.expired_at ? new Date(customer.expired_at) : now
        const baseDate = currentExp > now ? currentExp : now
        
        const newExp = new Date(baseDate)
        const validity = order.plans?.validity || 30
        const unit = order.plans?.validity_unit || 'Days'

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

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
