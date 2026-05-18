import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendWhatsApp } from '@/lib/whatsapp'

export async function POST(request: Request) {
  try {
    const { phone, otp_code, new_password } = await request.json()

    if (!phone || !otp_code || !new_password) {
      return NextResponse.json({ error: 'Sila lengkapkan semua maklumat' }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // 1. Sahkan OTP
    const { data: otpRecord, error: otpError } = await supabase
      .from('otp_verifications')
      .select('id')
      .eq('phone', phone)
      .eq('code', otp_code)
      .eq('type', 'forgot_password')
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (otpError || !otpRecord) {
      return NextResponse.json({ error: 'Kod OTP tidak sah atau telah luput' }, { status: 400 })
    }

    // Buang OTP selepas berjaya disahkan
    await supabase.from('otp_verifications').delete().eq('id', otpRecord.id)

    // 2. Update Kata Laluan
    const { error: updateErr } = await supabase
      .from('customers')
      .update({ password: new_password }) // Note: ideally hashed
      .eq('phonenumber', phone)

    if (updateErr) {
      console.error('Reset Password Error:', updateErr)
      return NextResponse.json({ error: 'Gagal menukar kata laluan. Sila cuba lagi.' }, { status: 500 })
    }

    // 3. Hantar Mesej Berjaya
    const successMsg = `*Purnama WiFi*\n\nKata laluan anda telah berjaya ditukar! 🎉\n\nSila gunakan kata laluan baru anda untuk log masuk ke dalam aplikasi.`
    await sendWhatsApp(phone, successMsg)

    return NextResponse.json({ 
      success: true, 
      message: 'Kata laluan berjaya ditukar!'
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
