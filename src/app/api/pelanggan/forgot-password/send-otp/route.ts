import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendWhatsApp } from '@/lib/whatsapp'

export async function POST(request: Request) {
  try {
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json({ error: 'Nombor telefon diperlukan' }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Semak sama ada nombor dah daftar
    const { data: customer } = await supabase
      .from('customers')
      .select('id, fullname')
      .eq('phonenumber', phone)
      .maybeSingle()

    if (!customer) {
      return NextResponse.json({ error: 'Nombor telefon ini tidak dijumpai dalam sistem kami.' }, { status: 404 })
    }

    // Jana kod OTP (6 digit)
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Masa tamat tempoh (5 minit dari sekarang)
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 5)

    // Hapus OTP lama dulu (jika ada)
    await supabase
      .from('otp_verifications')
      .delete()
      .eq('phone', phone)
      .eq('type', 'forgot_password')

    // Simpan ke database
    const { error: dbError } = await supabase
      .from('otp_verifications')
      .insert({
        phone: phone,
        code: otpCode,
        type: 'forgot_password',
        expires_at: expiresAt.toISOString()
      })

    if (dbError) {
      console.error('Ralat simpan OTP forgot password:', dbError)
      return NextResponse.json({ error: 'Ralat sistem, tidak dapat memproses OTP' }, { status: 500 })
    }

    // Hantar via WhatsApp
    const message = `*Purnama WiFi*\n\nHai ${customer.fullname},\n\nAnda memohon untuk menukar kata laluan. Kod pengesahan (OTP) anda ialah:\n\n*${otpCode}*\n\nSila masukkan kod ini di dalam aplikasi untuk menetapkan kata laluan baru. Kod ini sah selama 5 minit.\n\n⚠️ Jika anda tidak membuat permohonan ini, abaikan mesej ini.`
    const sent = await sendWhatsApp(phone, message)

    if (!sent) {
      console.warn(`[OTP-FORGOT] Gagal hantar WA ke ${phone}, tapi OTP disimpan.`)
    }

    console.log(`[OTP-FORGOT] OTP ${otpCode} dihantar ke ${phone}`)
    return NextResponse.json({ success: true, message: 'OTP untuk tukar kata laluan telah dihantar ke WhatsApp anda' })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
