'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Wifi, User, Phone, Lock, MessageSquare, Eye, EyeOff, CheckCircle, AlertCircle, AtSign } from 'lucide-react'

type Step = 'form' | 'otp' | 'success'

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('form')

  const [fullname, setFullname] = useState('')
  const [username, setUsername] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [showPass, setShowPass] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  // ─── Step 1: Kirim OTP ──────────────────────────────────────────
  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setInfo('')

    if (!fullname || !username || !phone || !password) {
      setError('Sila lengkapkan semua maklumat terlebih dahulu.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Gagal menghantar OTP')

      setInfo(`OTP telah dihantar ke WhatsApp ${phone}. Sila semak mesej anda.`)
      setStep('otp')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi ralat')
    } finally {
      setLoading(false)
    }
  }

  // ─── Step 2: Verify OTP & Register ─────────────────────────────
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!otpCode || otpCode.length !== 6) {
      setError('Sila masukkan kod OTP 6 digit.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/pelanggan/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullname, username, phonenumber: phone, password, otp_code: otpCode }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Pendaftaran gagal')

      setStep('success')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi ralat')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-animated min-h-screen flex items-center justify-center p-4">
      {/* Background decoration */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.07) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)' }} />
      </div>

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, #22c55e, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: '0 0 30px rgba(34,197,94,0.3)' }}>
            <Wifi size={32} color="white" />
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            <span className="gradient-text">Purnama WiFi</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '4px' }}>Daftar Akaun Pelanggan</p>
        </div>

        {/* Progress indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
          {(['form', 'otp', 'success'] as Step[]).map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, background: step === s ? 'linear-gradient(135deg, #22c55e, #3b82f6)' : ((['form', 'otp', 'success'].indexOf(step) > i) ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.05)'), color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                {['form', 'otp', 'success'].indexOf(step) > i ? '✓' : i + 1}
              </div>
              {i < 2 && <div style={{ width: '32px', height: '1px', background: (['form', 'otp', 'success'].indexOf(step) > i) ? '#22c55e' : 'rgba(255,255,255,0.1)' }} />}
            </div>
          ))}
        </div>

        <div className="glass-card" style={{ padding: '32px' }}>

          {/* Error / Info Alert */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px', marginBottom: '20px', color: '#f87171', fontSize: '0.875rem' }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} /> {error}
            </div>
          )}
          {info && !error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '8px', padding: '12px', marginBottom: '20px', color: '#4ade80', fontSize: '0.875rem' }}>
              <CheckCircle size={16} style={{ flexShrink: 0 }} /> {info}
            </div>
          )}

          {/* ── STEP 1: Form ── */}
          {step === 'form' && (
            <form onSubmit={handleSendOTP}>
              <h2 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '20px', color: '#f1f5f9' }}>Maklumat Diri</h2>

              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Nama Penuh</label>
                <div style={{ position: 'relative' }}>
                  <User size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input id="reg-fullname" className="form-input" style={{ paddingLeft: '36px' }} placeholder="Contoh: Ahmad bin Ali" value={fullname} onChange={e => setFullname(e.target.value)} required />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Username</label>
                <div style={{ position: 'relative' }}>
                  <AtSign size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input id="reg-username" className="form-input" style={{ paddingLeft: '36px' }} placeholder="username unik" value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} required />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Nombor WhatsApp</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input id="reg-phone" className="form-input" style={{ paddingLeft: '36px' }} placeholder="08123456789 atau 628123456789" type="tel" value={phone} onChange={e => setPhone(e.target.value)} required />
                </div>
                <p style={{ fontSize: '0.7rem', color: '#475569', marginTop: '4px' }}>OTP akan dihantar ke nombor ini via WhatsApp</p>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label className="form-label">Kata Laluan</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input id="reg-password" className="form-input" style={{ paddingLeft: '36px', paddingRight: '44px' }} type={showPass ? 'text' : 'password'} placeholder="Minimum 6 karakter" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" id="reg-send-otp" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={loading}>
                {loading ? <><span className="spinner" />Menghantar OTP...</> : '📱 Hantar OTP ke WhatsApp'}
              </button>
            </form>
          )}

          {/* ── STEP 2: OTP ── */}
          {step === 'otp' && (
            <form onSubmit={handleRegister}>
              <h2 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '8px', color: '#f1f5f9' }}>Masukkan Kod OTP</h2>
              <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '24px' }}>
                Kod 6-digit telah dihantar ke WhatsApp <strong style={{ color: '#f1f5f9' }}>{phone}</strong>
              </p>

              <div style={{ marginBottom: '24px' }}>
                <label className="form-label">Kod OTP</label>
                <div style={{ position: 'relative' }}>
                  <MessageSquare size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input
                    id="reg-otp"
                    className="form-input"
                    style={{ paddingLeft: '36px', letterSpacing: '0.3em', fontSize: '1.2rem', textAlign: 'center' }}
                    placeholder="123456"
                    type="number"
                    maxLength={6}
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.slice(0, 6))}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button type="submit" id="reg-verify" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginBottom: '12px' }} disabled={loading}>
                {loading ? <><span className="spinner" />Mendaftar...</> : '✅ Sahkan & Daftar'}
              </button>

              <button type="button" onClick={() => { setStep('form'); setError(''); setInfo('') }} style={{ width: '100%', padding: '10px', background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#64748b', cursor: 'pointer', fontSize: '0.875rem' }}>
                ← Kembali & tukar nombor
              </button>
            </form>
          )}

          {/* ── STEP 3: Success ── */}
          {step === 'success' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle size={36} color="#22c55e" />
              </div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f1f5f9', marginBottom: '8px' }}>Pendaftaran Berjaya! 🎉</h2>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '28px' }}>
                Akaun anda telah dibuat. Sila login menggunakan nombor telefon dan kata laluan anda.
              </p>
              <button onClick={() => router.push('/pelanggan')} id="reg-go-login" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                Pergi ke Login →
              </button>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <a href="/pelanggan" style={{ color: '#64748b', fontSize: '0.8rem', textDecoration: 'none' }}>
            Sudah ada akaun? <span style={{ color: '#3b82f6' }}>Login di sini →</span>
          </a>
        </div>
      </div>
    </div>
  )
}
