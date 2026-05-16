import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { phone, code } = await request.json()

    if (!phone || !code) {
      return NextResponse.json({ error: 'Nombor telefon dan kod diperlukan' }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Cari OTP yang sepadan, belum expired, order by latest
    const { data: otpRecord, error } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('phone', phone)
      .eq('code', code)
      .eq('type', 'register')
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error || !otpRecord) {
      return NextResponse.json({ error: 'Kod OTP tidak sah atau telah luput' }, { status: 400 })
    }

    // Kalau berjaya, kita boleh buang record ni atau biarkan (expire sendiri).
    // Lebih baik buang supaya tak boleh guna 2 kali
    await supabase.from('otp_verifications').delete().eq('id', otpRecord.id)

    return NextResponse.json({ success: true, message: 'OTP berjaya disahkan' })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
