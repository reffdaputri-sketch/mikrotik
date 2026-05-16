import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { fullname, username, email, phonenumber, password, otp_code } = await request.json()

    if (!fullname || !username || !phonenumber || !password || !otp_code) {
      return NextResponse.json({ error: 'Sila lengkapkan semua maklumat wajib termasuk kod OTP' }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // 1. Cek apakah username atau nomor HP sudah terdaftar
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .or(`username.eq.${username},phonenumber.eq.${phonenumber}`)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Username atau Nombor telefon ini sudah pun berdaftar' }, { status: 400 })
    }

    // 2. Sahkan OTP
    const { data: otpRecord, error: otpError } = await supabase
      .from('otp_verifications')
      .select('id')
      .eq('phone', phonenumber)
      .eq('code', otp_code)
      .eq('type', 'register')
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (otpError || !otpRecord) {
      return NextResponse.json({ error: 'Kod OTP tidak sah atau telah luput' }, { status: 400 })
    }

    // Buang OTP selepas berjaya disahkan
    await supabase.from('otp_verifications').delete().eq('id', otpRecord.id)

    // 3. Simpan pelanggan baru
    const { data: customer, error: insertErr } = await supabase
      .from('customers')
      .insert({
        fullname,
        email: email || null,
        phonenumber,
        username,
        password: password, // Dalam aplikasi nyata, sebaiknya di-hash
        balance: 0,
        status: 'Active',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertErr) {
      console.error('Register Error:', insertErr)
      return NextResponse.json({ error: 'Gagal mendaftar. Sila cuba lagi.' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Pendaftaran berjaya! Sila login menggunakan nombor telefon anda.',
      customer 
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
