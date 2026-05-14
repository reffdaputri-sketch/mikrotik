import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'

export async function GET() {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = await createAdminClient()
  const { data } = await supabase.from('app_config').select('*')
  
  // Convert array to key-value object
  const config = (data || []).reduce((acc: any, item: any) => {
    acc[item.setting] = item.value
    return acc
  }, {})
  
  return NextResponse.json({ config })
}

export async function POST(request: Request) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = await createAdminClient()
  const body = await request.json()
  
  const updates = Object.entries(body).map(([key, value]) => ({
    setting: key,
    value: String(value)
  }))

  for (const item of updates) {
    await supabase.from('app_config').upsert(item, { onConflict: 'setting' })
  }
  
  return NextResponse.json({ success: true })
}
