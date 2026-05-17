import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendWhatsApp } from '@/lib/whatsapp'

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
      .maybeSingle()

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

    // 4. Hantar Butiran Log Masuk via WhatsApp secara automatik
    const welcomeMessage = 
      `🎉 *PENDAFTARAN BERJAYA (PURNAMA WIFI)* 🎉\n\n` +
      `Hai *${fullname}*,\n` +
      `Tahniah! Akaun pelanggan Purnama WiFi anda telah berjaya didaftarkan. 🎉\n\n` +
      `Berikut adalah butiran akaun anda untuk simpanan/rujukan:\n` +
      `👤 *Nama Penuh:* ${fullname}\n` +
      `📱 *No. WhatsApp:* ${phonenumber}\n` +
      `🔗 *Username:* ${username}\n` +
      `🔑 *Kata Laluan:* ${password}\n\n` +
      `Sila simpan butiran ini dengan selamat agar anda tidak lupa sekiranya akaun anda terkeluar (logout).\n\n` +
      `Portal Pelanggan:\n` +
      `🔗 https://purnamawifi.net/pelanggan\n\n` +
      `Terima kasih kerana menyertai kami! 🙏`

    const sent = await sendWhatsApp(phonenumber, welcomeMessage)
    if (!sent) {
      console.warn(`[REGISTER-WELCOME] Gagal hantar mesej selamat datang ke ${phonenumber}`)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Pendaftaran berjaya! Butiran akaun telah dihantar ke WhatsApp anda.',
      customer 
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
