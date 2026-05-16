import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'
import { generateVoucherCode } from '@/lib/utils'

export async function GET(request: Request) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  
  const supabase = await createAdminClient()
  let query = supabase
    .from('vouchers')
    .select('*, plans(name_plan), routers(name)')
    .order('created_at', { ascending: false })
  
  if (status) {
    query = query.eq('status', status)
  }
    
  const { data: vouchers } = await query
  return NextResponse.json({ vouchers: vouchers || [] })
}

export async function POST(request: Request) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const supabase = await createAdminClient()
  const body = await request.json()
  const { plan_id, router_id, quantity, type, length, prefix } = body
  
  if (!plan_id || !quantity) {
    return NextResponse.json({ error: 'Plan and Quantity are required' }, { status: 400 })
  }

  const vouchersToInsert = []
  for (let i = 0; i < quantity; i++) {
    const code = (prefix || '') + generateVoucherCode(length || 8)
    vouchersToInsert.push({
      code,
      type: type || 'Hotspot',
      plan_id: parseInt(plan_id),
      router_id: router_id ? parseInt(router_id) : null,
      username: code,
      password: code,
      status: 'unused',
    })
  }

  const { data, error } = await supabase.from('vouchers').insert(vouchersToInsert).select()
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ vouchers: data })
}

export async function DELETE(request: Request) {
    if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    
    const supabase = await createAdminClient()
    const { error } = await supabase.from('vouchers').delete().eq('id', id)
    
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
}
