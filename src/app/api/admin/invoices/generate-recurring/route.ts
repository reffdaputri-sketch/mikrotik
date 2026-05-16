import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'

export async function POST() {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createAdminClient()

  // 1. Ambil semua pelanggan PPPoE yang punya paket aktif
  const { data: customers, error: custError } = await supabase
    .from('customers')
    .select('*, plans(*)')
    .ilike('service_type', 'pppoe')
    .not('plan_id', 'is', null)

  if (custError) return NextResponse.json({ error: custError.message }, { status: 500 })

  let generatedCount = 0
  const today = new Date()

  for (const customer of customers) {
    // 2. Cek apakah sudah ada invois pending untuk pelanggan ini?
    const { data: existingPending } = await supabase
      .from('payment_orders')
      .select('id')
      .eq('customer_id', customer.id)
      .eq('status', 'pending')

    if (existingPending && existingPending.length > 0) continue // Lewati jika sudah ada tagihan yang belum dibayar

    // 3. Logika Penagihan: Jika expired dalam 7 hari kedepan atau sudah expired
    const expiryDate = new Date(customer.expired_at)
    const diffTime = expiryDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays <= 7) {
      // 4. Buat Invois Baru (Draft)
      const orderId = `BILL-${Math.random().toString(36).slice(2, 9).toUpperCase()}`
      
      const { error: insertError } = await supabase
        .from('payment_orders')
        .insert({
          order_id: orderId,
          customer_id: customer.id,
          customer_name: customer.fullname,
          plan_id: customer.plan_id,
          plan_name: customer.plans?.name_plan || 'Pakej Internet',
          price: customer.plans?.price || 0,
          status: 'pending',
          created_at: new Date().toISOString(),
          description: `RENEWAL_PPPOE:${customer.id}`
        })

      if (!insertError) generatedCount++
    }
  }

  return NextResponse.json({ 
    success: true, 
    message: `${generatedCount} Invois baharu berjaya dijana secara automatik.` 
  })
}
