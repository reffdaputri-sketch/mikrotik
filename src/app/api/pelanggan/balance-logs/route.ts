import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'ID tidak sah' }, { status: 400 })

    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from('balance_logs')
      .select('*')
      .eq('customer_id', id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ logs: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
