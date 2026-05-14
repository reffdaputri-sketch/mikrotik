import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

    const supabase = await createAdminClient()

    // Ambil data terbaru lengkap dengan plan & history
    const { data: customer, error } = await supabase
      .from('customers')
      .select('*, plans(*, bandwidths(*)), payment_orders(*)')
      .eq('id', id)
      .single()

    if (error || !customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json({ customer })
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
