import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'

export async function GET() {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = await createAdminClient()
  const { data: banners } = await supabase.from('banners').select('*').order('created_at', { ascending: false })
  return NextResponse.json({ banners: banners || [] })
}

export async function POST(request: Request) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = await createAdminClient()
  const body = await request.json()
  
  const { data, error } = await supabase.from('banners').insert({
    title: body.title,
    image_url: body.image_url,
    link_url: body.link_url || null,
    is_active: body.is_active !== undefined ? body.is_active : true,
  }).select().single()
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ banner: data })
}
