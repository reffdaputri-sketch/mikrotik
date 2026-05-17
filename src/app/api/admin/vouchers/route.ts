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

export async function PUT(request: Request) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  
  if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
  
  const supabase = await createAdminClient()
  
  // 1. Ambil maklumat baucar berserta plan dan router
  const { data: voucher, error: fetchErr } = await supabase
    .from('vouchers')
    .select('*, plans(*, bandwidths(*)), routers(*)')
    .eq('id', id)
    .single()
    
  if (fetchErr || !voucher) {
    return NextResponse.json({ error: 'Baucar tidak dijumpai' }, { status: 404 })
  }
  
  if (voucher.status !== 'unused') {
    return NextResponse.json({ error: 'Baucar ini telah digunakan atau tamat tempoh' }, { status: 400 })
  }
  
  const plan = voucher.plans as any
  if (!plan) {
    return NextResponse.json({ error: 'Pakej bersekutu tidak dijumpai' }, { status: 400 })
  }
  
  // 2. Kemas kini status baucar kepada 'used'
  const { error: updateErr } = await supabase
    .from('vouchers')
    .update({ status: 'used', used_at: new Date().toISOString() })
    .eq('id', id)
    
  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }
  
  // 3. Masukkan arahan ke dalam giliran command queue MikroTik jika ada router bersekutu
  if (voucher.router_id) {
    let limitUptime = undefined
    if (plan.validity && plan.validity_unit) {
      const val = parseInt(plan.validity.toString())
      const unit = plan.validity_unit.toString().toLowerCase()
      if (val > 0) {
        if (unit.startsWith('min')) limitUptime = `${val}m`
        else if (unit.startsWith('hr') || unit.startsWith('jam')) limitUptime = `${val}h`
        else if (unit.startsWith('day') || unit.startsWith('hari')) limitUptime = `${val}d`
        else if (unit.startsWith('month') || unit.startsWith('bulan')) limitUptime = `${val * 30}d`
      }
    }

    await supabase.from('mikrotik_command_queue').insert({
      router_id: voucher.router_id,
      command: plan.type === 'Hotspot' ? 'add_hotspot_user' : 'add_pppoe_secret',
      payload: {
        username: voucher.username || voucher.code,
        password: voucher.password || voucher.code,
        profile: plan.bandwidths?.name_bw || 'default',
        comment: `Purnama-Admin-Cash-${voucher.code}`,
        ...(limitUptime && { limit_uptime: limitUptime })
      },
      status: 'pending',
    })
  }
  
  return NextResponse.json({ success: true })
}
