import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'

export async function GET() {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = await createAdminClient()
  const { data: plans } = await supabase
    .from('plans')
    .select('*, bandwidths(name_bw, rate_down, rate_down_unit, rate_up, rate_up_unit), routers(name)')
    .order('display_order').order('price')
  return NextResponse.json({ plans: plans || [] })
}

export async function POST(request: Request) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = await createAdminClient()
  const body = await request.json()
  const { data, error } = await supabase.from('plans').insert({
    name_plan: body.name_plan,
    price: parseFloat(body.price),
    price_old: parseFloat(body.price_old) || 0,
    type: body.type,
    typebp: body.typebp,
    validity: parseInt(body.validity),
    validity_unit: body.validity_unit,
    data_limit: body.data_limit ? parseInt(body.data_limit) : null,
    data_unit: body.data_unit || null,
    id_bw: body.id_bw ? parseInt(body.id_bw) : null,
    router_id: body.router_id ? parseInt(body.router_id) : null,
    description: body.description || null,
    enabled: body.enabled ?? true,
    is_public: body.is_public ?? true,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ plan: data })
}
