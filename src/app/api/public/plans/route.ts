import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createAdminClient()

    // Ambil paket yang aktif dan publik
    const { data, error } = await supabase
      .from('plans')
      .select('*, bandwidths(name_bw, rate_down, rate_down_unit, rate_up, rate_up_unit), routers(name)')
      .eq('enabled', true)
      .eq('is_public', true)
      .order('price', { ascending: true })

    if (error) throw error

    return NextResponse.json({ plans: data })
  } catch (error: any) {
    console.error('Public Plans API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
