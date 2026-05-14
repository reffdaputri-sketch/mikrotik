import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const supabase = await createAdminClient()
  const body = await request.json()
  const { error } = await supabase.from('plans').update({
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
  }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const supabase = await createAdminClient()
  const { error } = await supabase.from('plans').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
