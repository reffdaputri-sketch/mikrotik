import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createAdminClient()
    const { data: plans, error } = await supabase
      .from('plans')
      .select('*, bandwidths(name_bw, rate_down, rate_down_unit, rate_up, rate_up_unit)')
      .eq('enabled', true)
      .eq('is_public', true)
      .order('display_order', { ascending: true })
      .order('price', { ascending: true })

    if (error) throw error
    return NextResponse.json({ plans: plans || [] })
  } catch {
    return NextResponse.json({ plans: [] })
  }
}
