import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'

export async function GET(request: Request) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  
  const supabase = await createAdminClient()
  
  // Ambil data dari payment_orders karena ini yang mencatat flow pembelian online
  let query = supabase
    .from('payment_orders')
    .select('*, plans(name_plan), routers(name)')
    .order('created_at', { ascending: false })
  
  if (status && status !== 'all') {
    query = query.eq('status', status)
  }
    
  const { data: orders, error } = await query
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ transactions: orders || [] })
}
