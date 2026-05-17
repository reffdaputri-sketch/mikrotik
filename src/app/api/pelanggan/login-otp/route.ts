import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendWhatsApp } from '@/lib/whatsapp'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password, otp_code } = body

    if (!username || !password) {
      return NextResponse.json({ error: 'Username dan kata laluan diperlukan' }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Cari customer berdasarkan username
    const { data: customer } = await supabase
      .from('customers')
      .select('id, fullname, username, password, phonenumber, status')
      .eq('username', username)
      .maybeSingle()

    if (!customer) {
      return NextResponse.json({ error: 'Username tidak dijumpai' }, { status: 404 })
    }

    // Semak password (plain text — sesuai dengan cara simpan sedia ada)
    if (customer.password !== password) {
      return NextResponse.json({ error: 'Kata laluan tidak betul' }, { status: 401 })
    }

    if (!customer.phonenumber) {
      return NextResponse.json({ error: 'Akaun ini tidak mempunyai nombor WhatsApp. Hubungi admin.' }, { status: 400 })
    }

    // ─── STEP 1: Hantar OTP (jika tiada otp_code) ───────────────────
    if (!otp_code) {
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
      const expiresAt = new Date()
      expiresAt.setMinutes(expiresAt.getMinutes() + 5)

      // Hapus OTP lama dulu (jika ada)
      await supabase
        .from('otp_verifications')
        .delete()
        .eq('phone', customer.phonenumber)
        .eq('type', 'login')

      // Simpan OTP baru
      const { error: dbError } = await supabase
        .from('otp_verifications')
        .insert({ phone: customer.phonenumber, code: otpCode, type: 'login', expires_at: expiresAt.toISOString() })

      if (dbError) {
        console.error('Ralat simpan OTP login:', dbError)
        return NextResponse.json({ error: 'Ralat sistem' }, { status: 500 })
      }

      // Hantar WA
      const maskedPhone = customer.phonenumber.slice(0, 4) + '****' + customer.phonenumber.slice(-3)
      const message = `*Purnama WiFi*\n\nHai ${customer.fullname}!\n\nKod OTP Login anda: *${otpCode}*\n\nMasukkan kod ini untuk log masuk ke akaun anda.\nKod sah selama *5 minit*.\n\n⚠️ Jangan kongsikan kod ini kepada sesiapa.`
      
      const sent = await sendWhatsApp(customer.phonenumber, message)
      if (!sent) {
        console.warn(`[OTP-LOGIN] Gagal hantar WA ke ${customer.phonenumber}`)
      }

      console.log(`[OTP-LOGIN] OTP ${otpCode} dihantar ke ${customer.phonenumber} (user: ${username})`)
      return NextResponse.json({
        success: true,
        message: `Kod OTP telah dihantar ke WhatsApp ${maskedPhone}`,
        masked_phone: maskedPhone
      })
    }

    // ─── STEP 2: Verify OTP & Login ──────────────────────────────────
    const { data: otpRecord } = await supabase
      .from('otp_verifications')
      .select('id')
      .eq('phone', customer.phonenumber)
      .eq('code', otp_code)
      .eq('type', 'login')
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!otpRecord) {
      return NextResponse.json({ error: 'Kod OTP tidak sah atau telah tamat tempoh' }, { status: 400 })
    }

    // Buang OTP lepas guna
    await supabase.from('otp_verifications').delete().eq('id', otpRecord.id)

    // Ambil data pelanggan lengkap
    const { data: fullCustomer, error: fetchErr } = await supabase
      .from('customers')
      .select('*, plans:plan_id(id, name_plan, price, bandwidths:bandwidth_id(rate_down, rate_down_unit)), payment_orders(*)')
      .eq('id', customer.id)
      .maybeSingle()

    if (fetchErr) {
      console.warn('[OTP-LOGIN] Gagal ambil data lengkap, guna data asas:', fetchErr.message)
    }

    // Fallback ke data asas jika query penuh gagal
    const customerData = fullCustomer ?? {
      id: customer.id,
      fullname: customer.fullname,
      username: customer.username,
      phonenumber: customer.phonenumber,
      status: customer.status,
      balance: 0,
      plans: null,
      payment_orders: []
    }

    return NextResponse.json({ success: true, customer: customerData })

  } catch (err: any) {
    console.error('[OTP-LOGIN] Error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
