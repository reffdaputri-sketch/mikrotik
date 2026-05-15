import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()
    const supabase = await createAdminClient()

    // Cari pelanggan berdasarkan username
    let query = supabase
      .from('customers')
      .select('*, plans(*, bandwidths(*)), payment_orders(*)')
      .eq('username', username)

    // Jika password diberikan, pastikan ia sepadan
    if (password) {
      query = query.eq('password', password)
    }

    const { data: customer, error } = await query.single()

    if (error || !customer) {
      return NextResponse.json({ error: 'Username atau kata laluan tidak sah' }, { status: 401 })
    }

    // Jika masuk tanpa kata laluan, kita benarkan hanya jika password di DB sama dengan username (ciri khas voucher)
    // ATAU jika ia memang disetkan kosong (jarang berlaku)
    if (!password && customer.password !== username && customer.password !== '') {
       return NextResponse.json({ error: 'Sila masukkan kata laluan untuk akaun ini' }, { status: 401 })
    }

    return NextResponse.json({ customer })
  } catch (err) {
    return NextResponse.json({ error: 'Ralat sistem berlaku' }, { status: 500 })
  }
}
