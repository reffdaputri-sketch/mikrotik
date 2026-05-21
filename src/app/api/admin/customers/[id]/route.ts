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

  const { data: customer, error } = await supabase
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

  // --- SINKRONISASI MIKROTIK ---
  if (body.router_id) {
    // 1. Jika status berubah
    if (body.status === 'Active') {
      await supabase.from('mikrotik_command_queue').insert({
        router_id: body.router_id,
        command: customer.service_type === 'PPPoE' ? 'enable_pppoe_secret' : 'enable_hotspot_user',
        payload: { username: body.username },
        status: 'pending',
      })
    } else if (body.status === 'Disabled' || body.status === 'Banned') {
      await supabase.from('mikrotik_command_queue').insert({
        router_id: body.router_id,
        command: customer.service_type === 'PPPoE' ? 'disable_pppoe_secret' : 'disable_hotspot_user',
        payload: { username: body.username },
        status: 'pending',
      })
    }

    // 2. Jika plan atau password berubah, update di MikroTik
    // (Kick user TIDAK dilakukan dari web — admin lakukan manual dari MikroTik jika perlu)
    if (body.plan_id || body.password) {
      const { data: plan } = await supabase.from('plans').select('name_plan').eq('id', body.plan_id).single()

      await supabase.from('mikrotik_command_queue').insert({
        router_id: body.router_id,
        command: customer.service_type === 'PPPoE' ? 'update_pppoe_secret' : 'update_hotspot_user',
        payload: {
          username: body.username,
          password: body.password || undefined,
          profile: plan?.name_plan || undefined
        },
        status: 'pending',
      })
    }
  }

  return NextResponse.json({ customer })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const { id } = await params
  const supabase = await createAdminClient()

  // 1. Ambil data pelanggan sebelum dipadam untuk tahu router_id dan username
  const { data: customer } = await supabase
    .from('customers')
    .select('username, router_id, service_type')
    .eq('id', id)
    .single()

  // 2. Jika pelanggan ada di router, hantar perintah padam ke MikroTik
  if (customer && customer.router_id) {
    await supabase.from('mikrotik_command_queue').insert({
      router_id: customer.router_id,
      command: customer.service_type === 'PPPoE' ? 'remove_pppoe_secret' : 'remove_hotspot_user',
      payload: { username: customer.username },
      status: 'pending',
    })
  }

  // 2.5 Padam rekod rujukan bagi mengelakkan ralat kekunci asing (Foreign Key Constraint)
  await supabase.from('payment_orders').delete().eq('customer_id', id)
  await supabase.from('balance_logs').delete().eq('customer_id', id)

  // 3. Padam rekod dari database
  const { error } = await supabase.from('customers').delete().eq('id', id)
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
