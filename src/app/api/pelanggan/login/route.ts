import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()
    const supabase = await createAdminClient()

    // Cari pelanggan berdasarkan username & password
    const { data: customer, error } = await supabase
      .from('customers')
      .select('*, plans(*, bandwidths(*)), payment_orders(*)')
      .eq('username', username)
      .eq('password', password)
      .single()

    if (error || !customer) {
      return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 })
    }

    return NextResponse.json({ customer })
  } catch (err) {
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 })
  }
}
