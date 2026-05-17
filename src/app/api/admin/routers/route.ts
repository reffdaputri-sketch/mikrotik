import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'

export async function GET() {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = await createAdminClient()
  const { data: rawRouters } = await supabase.from('routers').select('*').order('name')
  
  const routers = (rawRouters || []).map(r => {
    let status = r.status || 'Offline'
    
    // Jika last_seen melebihi 15 detik yang lalu, anggap Offline (karena agent terputus/mati)
    if (r.last_seen) {
      const lastSeenTime = new Date(r.last_seen).getTime()
      const nowTime = new Date().getTime()
      if (nowTime - lastSeenTime > 15000) {
        status = 'Offline'
      }
    } else {
      status = 'Offline'
    }
    
    return {
      ...r,
      status
    }
  })
  
  return NextResponse.json({ routers })
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
