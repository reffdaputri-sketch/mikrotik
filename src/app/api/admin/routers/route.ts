import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'

export async function GET() {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = await createAdminClient()
  const { data: routers } = await supabase.from('routers').select('*').order('name')
  return NextResponse.json({ routers: routers || [] })
}

export async function POST(request: Request) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = await createAdminClient()
  const body = await request.json()
  const { data, error } = await supabase.from('routers').insert({
    name: body.name,
    ip_address: body.ip_address,
    username: body.username,
    password: body.password,
    description: body.description || null,
    enabled: body.enabled ?? true,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ router: data })
}
