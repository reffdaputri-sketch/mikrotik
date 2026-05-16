import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'

export async function GET() {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = await createAdminClient()
  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false })
  return NextResponse.json({ customers: customers || [] })
}

export async function POST(request: Request) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = await createAdminClient()
  const body = await request.json()
  const { data, error } = await supabase.from('customers').insert({
    username: body.username,
    password: body.password,
    fullname: body.fullname,
    email: body.email || null,
    phonenumber: body.phonenumber || null,
    address: body.address || null,
    service_type: body.service_type || 'Others',
    balance: parseFloat(body.balance) || 0,
    status: body.status || 'Active',
    expired_at: body.expired_at || null,
    auto_cut: body.auto_cut !== undefined ? body.auto_cut : true,
    plan_id: body.plan_id ? parseInt(body.plan_id) : null,
    router_id: body.router_id ? parseInt(body.router_id) : null,
    coordinates: body.coordinates || null,
  }).select().single()
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Jika tipe PPPoE, kirim ke MikroTik via Agent Queue
  if (body.service_type === 'PPPoE' && body.router_id) {
    // Ambil detail bandwidth untuk profil
    const { data: plan } = await supabase
      .from('plans')
      .select('*, bandwidths(*)')
      .eq('id', body.plan_id)
      .single()

    await supabase.from('mikrotik_command_queue').insert({
      router_id: body.router_id,
      command: 'add_pppoe_secret',
      payload: {
        username: body.username,
        password: body.password,
        profile: plan?.bandwidths?.name_bw || 'default',
        comment: `Purnama-${body.fullname}`,
      },
      status: 'pending',
    })
  }

  return NextResponse.json({ customer: data })
}
