import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const { id: customerId } = await params
  const supabase = await createAdminClient()
  const body = await request.json()

  const { data, error } = await supabase
    .from('customers')
    .update({
      fullname: body.fullname,
      email: body.email || null,
      phonenumber: body.phonenumber || null,
      address: body.address || null,
      service_type: body.service_type,
      status: body.status,
      expired_at: body.expired_at || null,
      auto_cut: body.auto_cut,
      plan_id: body.plan_id ? parseInt(body.plan_id) : null,
      router_id: body.router_id ? parseInt(body.router_id) : null,
      coordinates: body.coordinates || null,
      // Jangan update password kalau kosong
      ...(body.password ? { password: body.password } : {})
    })
    .eq('id', customerId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Jika status berubah jadi Active, kirim perintah Enable ke MikroTik
  if (body.status === 'Active' && body.router_id) {
    await supabase.from('mikrotik_command_queue').insert({
      router_id: body.router_id,
      command: 'enable_pppoe_secret',
      payload: { username: body.username },
      status: 'pending',
    })
  }

  return NextResponse.json({ customer: data })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const { id } = await params
  const supabase = await createAdminClient()
  const { error } = await supabase.from('customers').delete().eq('id', id)
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
