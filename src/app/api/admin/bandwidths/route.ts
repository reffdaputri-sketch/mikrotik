import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'

export async function GET() {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = await createAdminClient()
  const { data } = await supabase.from('bandwidths').select('*').order('rate_down')
  return NextResponse.json({ bandwidths: data || [] })
}

export async function POST(request: Request) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = await createAdminClient()
  const body = await request.json()
  const { data, error } = await supabase.from('bandwidths').insert({
    name_bw: body.name_bw, rate_down: parseInt(body.rate_down),
    rate_down_unit: body.rate_down_unit || 'Mbps',
    rate_up: parseInt(body.rate_up), rate_up_unit: body.rate_up_unit || 'Mbps',
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ bandwidth: data })
}
