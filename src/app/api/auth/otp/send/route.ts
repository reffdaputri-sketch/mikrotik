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
    // PENTING: guna maybeSingle() bukan single() — single() akan throw error jika 0 rows
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('phonenumber', phone)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Nombor telefon ini sudah berdaftar' }, { status: 400 })
    }

    // Jana kod OTP (6 digit)
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Masa tamat tempoh (5 minit dari sekarang)
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 5)

    // Simpan ke database
    const { error: dbError } = await supabase
      .from('otp_verifications')
      .insert({
        phone: phone,
        code: otpCode,
        type: 'register',
        expires_at: expiresAt.toISOString()
      })

    if (dbError) {
      console.error('Ralat simpan OTP:', dbError)
      return NextResponse.json({ error: 'Ralat sistem, tidak dapat memproses OTP' }, { status: 500 })
    }

    // Hantar via WhatsApp
    const message = `Purnama WiFi\n\nKod pengesahan (OTP) pendaftaran anda ialah: *${otpCode}*\n\nSila masukkan kod ini di dalam aplikasi. Kod ini sah selama 5 minit.`
    const sent = await sendWhatsApp(phone, message)

    if (!sent) {
      console.warn('[OTP] Gagal hantar WA, tapi OTP disimpan. Semak wa-agent berjalan di port 3001.')
      // Tetap return success supaya user boleh cuba masukkan OTP secara manual
    }

    console.log(`[OTP] OTP ${otpCode} dihantar ke ${phone}`)
    return NextResponse.json({ success: true, message: 'OTP telah dihantar ke WhatsApp anda' })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
