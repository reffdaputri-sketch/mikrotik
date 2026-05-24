'use client'

import { useState, useEffect } from 'react'
import { User, Clock, CreditCard, Activity, ArrowRight, ShieldCheck, Wifi, Tag, LogOut, ChevronRight, Zap, Plus, Receipt, Home, Wallet, History } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function PelangganDashboard() {
  const [loading, setLoading] = useState(true)
  const [customer, setCustomer] = useState<any>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [topupTab, setTopupTab] = useState<'otomatis' | 'manual'>('otomatis')
  const [error, setError] = useState('')
  const [paying, setPaying] = useState(false)
  const [topupLoading, setTopupLoading] = useState(false)
  const [showTopupModal, setShowTopupModal] = useState(false)
  const [topupAmount, setTopupAmount] = useState('10')
  const [manualOrderId, setManualOrderId] = useState('')
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [uploadingProof, setUploadingProof] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'wallet' | 'history'>('overview')
  const [balanceLogs, setBalanceLogs] = useState<any[]>([])
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  // OTP Login states
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginOtp, setLoginOtp] = useState('')
  const [loginShowPass, setLoginShowPass] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [loginInfo, setLoginInfo] = useState('')
  const [maskedPhone, setMaskedPhone] = useState('')

  // Cek session dan fetch data terbaru
  useEffect(() => {
    setHasMounted(true)
    async function syncData() {
      const saved = localStorage.getItem('nuxbill_customer')
      if (saved) {
        const localData = JSON.parse(saved)
        try {
          const res = await fetch(`/api/pelanggan/me?id=${localData.id}`)
          if (res.ok) {
            const freshData = await res.json()
            setCustomer(freshData.customer)
            localStorage.setItem('nuxbill_customer', JSON.stringify(freshData.customer))
            setIsLoggedIn(true)
          } else {
            handleLogout()
          }
        } catch (e) {
          console.error("Sync failed", e)
        }
      }
      setLoading(false)
    }
    syncData()
    fetchHistory()
  }, [])

  async function fetchHistory() {
    const saved = localStorage.getItem('nuxbill_customer')
    if (!saved) return
    const localData = JSON.parse(saved)

    try {
      // Fetch balance logs
      const resLogs = await fetch(`/api/pelanggan/balance-logs?id=${localData.id}`)
      if (resLogs.ok) {
        const data = await resLogs.json()
        setBalanceLogs(data.logs || [])
      }
    } catch (e) {
      console.error("Fetch history failed", e)
    }
  }

  // ─── OTP Login Step 1: Verify username+password → Hantar OTP ────
  async function handleSendLoginOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setLoginInfo('')
    try {
      const res = await fetch('/api/pelanggan/login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal menghantar OTP')
      setOtpSent(true)
      setMaskedPhone(data.masked_phone || '')
      setLoginInfo(data.message || 'Kod OTP telah dihantar ke WhatsApp anda')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ─── OTP Login Step 2: Verify OTP & Masuk ────────────────────────
  async function handleVerifyLoginOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/pelanggan/login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword, otp_code: loginOtp })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'OTP tidak sah')
      if (!data.customer) throw new Error('Data akaun tidak dijumpai. Sila cuba lagi.')
      localStorage.setItem('nuxbill_customer', JSON.stringify(data.customer))
      setCustomer(data.customer)
      setIsLoggedIn(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handlePay() {
    setPaying(true)
    const res = await fetch('/api/pelanggan/renew', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id: customer.id })
    })

    const data = await res.json()
    if (data.redirect_url) {
      window.location.href = data.redirect_url
    } else {
      alert('Gagal membuat pembayaran. Sila cuba sebentar lagi.')
      setPaying(false)
    }
  }

  async function handlePayWithWallet() {
    if (!confirm(`Tolak wallet ${formatCurrency(customer.plans?.price)} untuk perbaharui pakej?`)) return

    setPaying(true)
    const res = await fetch('/api/pelanggan/pay-with-wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id: customer.id })
    })

    const data = await res.json()
    if (res.ok) {
      alert('Pembayaran berjaya! Internet anda telah diaktifkan.')
      window.location.reload()
    } else {
      alert(data.error || 'Baki tidak mencukupi.')
      setPaying(false)
    }
  }

  async function handleTopup(e: React.FormEvent) {
    e.preventDefault()
    setTopupLoading(true)

    const res = await fetch('/api/pelanggan/topup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_id: customer.id,
        amount: parseFloat(topupAmount),
        method: topupTab
      })
    })

    const data = await res.json()
    if (data.redirect_url) {
      window.location.href = data.redirect_url
    } else if (data.success) {
      setManualOrderId(data.order_id)
      alert('Permintaan Top Up dicatat! Silakan lakukan transfer.')
    } else {
      alert(data.error || 'Gagal menjana permintaan Top Up.')
    }
    setTopupLoading(false)
  }

  async function handleUploadProof() {
    if (!proofFile || !manualOrderId) return
    setUploadingProof(true)

    const formData = new FormData()
    formData.append('file', proofFile)
    formData.append('order_id', manualOrderId)

    const res = await fetch('/api/pelanggan/upload-proof', {
      method: 'POST',
      body: formData
    })

    const data = await res.json()
    if (res.ok) {
      alert('Bukti transfer berhasil diunggah! Admin akan segera memverifikasi.')
      setShowTopupModal(false)
      setManualOrderId('')
      setProofFile(null)
    } else {
      alert(data.error || 'Gagal mengunggah bukti.')
    }
    setUploadingProof(false)
  }

  function handleLogout() {
    localStorage.removeItem('nuxbill_customer')
    setIsLoggedIn(false)
    setCustomer(null)
  }

  if (!hasMounted || loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f0fdf4' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <div className="spinner"></div>
        <p style={{ color: '#15803d', fontWeight: 600 }}>Memuatkan data anda...</p>
      </div>
    </div>
  )

  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at top right, #f0fdf4, #dcfce7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{
          maxWidth: '420px', width: '100%', padding: '40px',
          background: 'white', borderRadius: '24px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
          border: '1px solid rgba(22, 163, 74, 0.1)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              width: '72px', height: '72px',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', boxShadow: '0 10px 15px -3px rgba(34, 197, 94, 0.3)'
            }}>
              <Wifi color="white" size={36} />
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#166534', letterSpacing: '-0.5px' }}>
              Login Pelanggan
            </h1>
            <p style={{ color: '#4b5563', fontSize: '15px', marginTop: '4px' }}>
              {otpSent ? 'Masukkan kod OTP dari WhatsApp anda' : 'Log masuk menggunakan nombor WhatsApp anda'}
            </p>
          </div>

          {/* INFO ALERT */}
          {loginInfo && !error && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '12px', marginBottom: '16px', color: '#166534', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={16} style={{ flexShrink: 0 }} /> {loginInfo}
            </div>
          )}
          {error && (
            <div style={{ color: '#b91c1c', background: '#fef2f2', padding: '12px', borderRadius: '12px', fontSize: '14px', textAlign: 'center', border: '1px solid #fee2e2', marginBottom: '16px' }}>{error}</div>
          )}

          {!otpSent ? (
            // ── STEP 1: Username + Password ──
            <form onSubmit={handleSendLoginOtp} style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label className="form-label" style={{ color: '#374151', fontWeight: 600, marginBottom: '8px' }}>👤 Username</label>
                <input
                  id="login-username"
                  className="form-input"
                  style={{ background: '#f9fafb', borderColor: '#e5e7eb', color: '#111827', height: '50px' }}
                  placeholder="Masukkan username anda"
                  value={loginUsername}
                  onChange={e => setLoginUsername(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="form-label" style={{ color: '#374151', fontWeight: 600, marginBottom: '8px' }}>🔒 Kata Laluan</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="login-password"
                    className="form-input"
                    style={{ background: '#f9fafb', borderColor: '#e5e7eb', color: '#111827', height: '50px', paddingRight: '44px' }}
                    placeholder="Masukkan kata laluan"
                    type={loginShowPass ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    required
                  />
                  <button type="button" onClick={() => setLoginShowPass(!loginShowPass)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '18px' }}>
                    {loginShowPass ? '🙈' : '👁️'}
                  </button>
                </div>
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>OTP akan dihantar ke WhatsApp yang berdaftar</p>
              </div>
              <button
                type="submit"
                id="login-send-otp"
                className="btn btn-primary"
                style={{ width: '100%', padding: '16px', fontSize: '16px', fontWeight: 700, borderRadius: '14px', background: '#16a34a' }}
                disabled={loading}
              >
                {loading ? 'Menyemak...' : '📲 Hantar Kod OTP ke WhatsApp'}
              </button>
              <a href="/daftar" style={{ textAlign: 'center', display: 'block', color: '#16a34a', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>
                Belum ada akaun? Daftar di sini →
              </a>
            </form>
          ) : (
            // ── STEP 2: Masukkan OTP ──
            <form onSubmit={handleVerifyLoginOtp} style={{ display: 'grid', gap: '20px' }}>
              <div>
                <p style={{ fontSize: '14px', color: '#4b5563', textAlign: 'center', marginBottom: '8px' }}>
                  OTP dihantar ke <strong style={{ color: '#166534' }}>{maskedPhone}</strong>
                </p>
                <label className="form-label" style={{ color: '#374151', fontWeight: 600, marginBottom: '8px' }}>🔑 Kod OTP (6 Digit)</label>
                <input
                  id="login-otp"
                  className="form-input"
                  style={{ background: '#f9fafb', borderColor: '#e5e7eb', color: '#111827', height: '50px', letterSpacing: '0.3em', textAlign: 'center', fontSize: '1.2rem' }}
                  placeholder="123456"
                  type="number"
                  maxLength={6}
                  value={loginOtp}
                  onChange={e => setLoginOtp(e.target.value.slice(0, 6))}
                  required
                  autoFocus
                />
              </div>
              <button
                type="submit"
                id="login-verify-otp"
                className="btn btn-primary"
                style={{ width: '100%', padding: '16px', fontSize: '16px', fontWeight: 700, borderRadius: '14px', background: '#16a34a' }}
                disabled={loading}
              >
                {loading ? 'Mengesahkan...' : '✅ Masuk ke Dashboard'}
              </button>
              <button
                type="button"
                onClick={() => { setOtpSent(false); setLoginOtp(''); setError(''); setLoginInfo(''); setMaskedPhone('') }}
                style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '14px', cursor: 'pointer' }}
              >
                ← Kembali
              </button>
            </form>
          )}

          <div style={{ textAlign: 'center', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #f3f4f6' }}>
            <a href="/beli" style={{ color: '#16a34a', fontSize: '14px', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              Bukan pelanggan PPPoE? Beli Baucar <ChevronRight size={16} />
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Safety guard: jika isLoggedIn tapi customer null, reset ke login
  if (isLoggedIn && !customer) {
    handleLogout()
    return null
  }

  const isExpired = customer?.expired_at ? new Date(customer.expired_at) < new Date() : true
  const isInactive = customer?.status !== 'Active'
  const needsRenewal = isExpired || isInactive
  const hasPlan = !!customer?.plans

  return (
    <div style={{ minHeight: '100vh', background: '#f0fdf4', color: '#111827', paddingBottom: '80px' }}>
      <style>{`
        @media (max-width: 640px) {
          .desktop-tabs { display: none !important; }
          .bottom-nav { display: flex !important; }
        }
        @media (min-width: 641px) {
          .bottom-nav { display: none !important; }
        }
        /* Profile card responsive */
        .profile-name { font-size: clamp(15px, 4vw, 20px) !important; }
        .profile-meta { font-size: clamp(11px, 3vw, 14px) !important; }
        .profile-badge { font-size: clamp(10px, 2.5vw, 12px) !important; padding: clamp(4px,1vw,6px) clamp(8px,2vw,12px) !important; }
        .info-label { font-size: clamp(10px, 2.5vw, 12px) !important; }
        .info-value { font-size: clamp(13px, 3.5vw, 17px) !important; }
        .info-card { padding: clamp(12px, 3vw, 16px) !important; }
        @media (max-width: 380px) {
          .profile-card-inner { gap: 10px !important; }
          .profile-avatar { width: 44px !important; height: 44px !important; }
        }
      `}</style>
      {/* Navbar */}
      <nav style={{
        padding: '16px 24px', background: 'white', borderBottom: '1px solid #dcfce7',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px',
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Wifi color="white" size={20} />
          </div>
          <span style={{ fontWeight: 900, fontSize: '20px', color: '#166534', letterSpacing: '-0.5px' }}>
            Purnama WiFi <span style={{ color: '#ea580c' }}>User</span>
          </span>
        </div>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: '#fef2f2', border: '1px solid #fee2e2', color: '#991b1b',
            padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer'
          }}
        >
          <LogOut size={14} /> Log Keluar
        </button>
      </nav>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '24px' }}>
        {/* Tab Navigation (Desktop Only) */}
        <div className="desktop-tabs" style={{ display: 'flex', background: 'white', padding: '6px', borderRadius: '16px', marginBottom: '24px', border: '1px solid #dcfce7' }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: activeTab === 'overview' ? '#16a34a' : 'transparent', color: activeTab === 'overview' ? 'white' : '#64748b', fontWeight: 800, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            DASHBOARD
          </button>
          <button
            onClick={() => setActiveTab('wallet')}
            style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: activeTab === 'wallet' ? '#16a34a' : 'transparent', color: activeTab === 'wallet' ? 'white' : '#64748b', fontWeight: 800, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            SALDO
          </button>
          <button
            onClick={() => setActiveTab('history')}
            style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: activeTab === 'history' ? '#16a34a' : 'transparent', color: activeTab === 'history' ? 'white' : '#64748b', fontWeight: 800, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            BELIAN
          </button>
        </div>

        {activeTab === 'overview' && (
          <>
            {/* Wallet Card */}
            <div style={{
              background: 'linear-gradient(135deg, #16a34a, #15803d)',
              padding: '24px', borderRadius: '24px', marginBottom: '24px',
              boxShadow: '0 10px 15px -3px rgba(22, 163, 74, 0.2)',
              color: 'white', position: 'relative', overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.1 }}>
                <CreditCard size={120} />
              </div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, opacity: 0.9 }}>Baki Wallet</span>
                  <div style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>PREMIUM</div>
                </div>
                <div style={{ fontSize: '32px', fontWeight: 900, marginBottom: '20px' }}>{formatCurrency(customer.balance || 0)}</div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => setShowTopupModal(true)}
                    style={{
                      flex: 1, padding: '12px', background: 'white', color: '#16a34a',
                      border: 'none', borderRadius: '14px', fontWeight: 800, fontSize: '14px',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}
                  >
                    <Plus size={16} /> Tambah Nilai Wallet
                  </button>
                  <button style={{
                    padding: '12px', background: 'rgba(255,255,255,0.2)', color: 'white',
                    border: 'none', borderRadius: '14px', cursor: 'pointer'
                  }}>
                    <Activity size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Profile Card */}
            <div style={{
              background: 'white', padding: '28px', borderRadius: '24px', marginBottom: '24px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
              border: '1px solid #dcfce7'
            }}>
              <div className="profile-card-inner" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div className="profile-avatar" style={{
                  width: '50px', height: '50px', borderRadius: '16px', flexShrink: 0,
                  background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid #dcfce7'
                }}>
                  <User color="#16a34a" size={24} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 className="profile-name" style={{ fontSize: '18px', fontWeight: 800, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{customer.fullname}</h2>
                  <div className="profile-meta" style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>@{customer.username}</span>
                    <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#d1d5db', flexShrink: 0 }}></span>
                    <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: 600 }}>{customer.service_type === 'PPPoE' ? 'Pelanggan PPPoE' : 'Pelanggan Hotspot'}</span>
                  </div>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <span className="profile-badge" style={{
                    padding: '5px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                    background: needsRenewal ? '#fef2f2' : '#f0fdf4',
                    color: needsRenewal ? '#b91c1c' : '#166534',
                    border: `1px solid ${needsRenewal ? '#fee2e2' : '#dcfce7'}`,
                    whiteSpace: 'nowrap'
                  }}>
                    {needsRenewal ? 'Terputus' : 'Aktif'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="info-card" style={{ background: '#f9fafb', padding: '14px', borderRadius: '16px', border: '1px solid #f3f4f6' }}>
                  <div className="info-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6b7280', fontSize: '11px', marginBottom: '5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    <Clock size={12} style={{ color: '#3b82f6', flexShrink: 0 }} /> Aktif Sehingga
                  </div>
                  <div className="info-value" style={{ fontWeight: 800, fontSize: '14px', color: needsRenewal ? '#b91c1c' : '#111827', lineHeight: 1.3 }}>
                    {customer.expired_at ? new Date(customer.expired_at).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Belum Aktif'}
                  </div>
                </div>
                <div className="info-card" style={{ background: '#f9fafb', padding: '14px', borderRadius: '16px', border: '1px solid #f3f4f6' }}>
                  <div className="info-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6b7280', fontSize: '11px', marginBottom: '5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    <Activity size={12} style={{ color: '#10b981', flexShrink: 0 }} /> Pakej Semasa
                  </div>
                  <div className="info-value" style={{ fontWeight: 800, fontSize: '14px', color: '#111827', lineHeight: 1.3 }}>
                    {customer?.plans?.name_plan || 'Tiada Pakej'}
                    {customer?.plans?.bandwidths && (
                      <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 700, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Zap size={9} />{customer.plans.bandwidths.rate_down}{customer.plans.bandwidths.rate_down_unit}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Banner Beli Voucher */}
            {customer?.service_type !== 'PPPoE' && (
              <div
                onClick={() => window.location.href = '/beli'}
                style={{
                  background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                  padding: '24px', borderRadius: '24px', marginBottom: '24px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  boxShadow: '0 10px 15px -3px rgba(22, 163, 74, 0.2)', cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.2)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Tag color="white" size={24} />
                  </div>
                  <div>
                    <div style={{ color: 'white', fontWeight: 800, fontSize: '18px' }}>Beli Baucar Hotspot</div>
                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>Sesuai untuk rakan atau peranti tetamu.</div>
                  </div>
                </div>
                <button style={{ background: 'white', border: 'none', padding: '10px 20px', borderRadius: '50px', color: '#16a34a', fontWeight: 800, fontSize: '12px' }}>
                  BELI &rarr;
                </button>
              </div>
            )}

            {/* Payment Alert / Action (Only for PPPoE with existing plan) */}
            {needsRenewal && hasPlan && (
              <div style={{
                padding: '32px', borderRadius: '28px', border: '1px solid #fee2e2',
                background: 'white', boxShadow: '0 15px 30px -10px rgba(185, 28, 28, 0.1)',
                marginBottom: '24px', position: 'relative', overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: '#fef2f2', borderRadius: '0 0 0 100%', zIndex: 0 }}></div>

                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                    <div style={{ padding: '12px', background: '#ef4444', borderRadius: '14px', boxShadow: '0 8px 16px -4px rgba(239, 68, 68, 0.4)' }}>
                      <Activity color="white" size={24} />
                    </div>
                    <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#991b1b', margin: 0, letterSpacing: '-0.5px' }}>Internet Terputus!</h3>
                  </div>

                  <p style={{ fontSize: '15px', color: '#4b5563', marginBottom: '24px', lineHeight: 1.6 }}>
                    Masa aktif pakej anda telah tamat. Jom perbaharui sekarang untuk sambungan <span style={{ color: '#16a34a', fontWeight: 700 }}>Aktif Automatik</span> serta-merta!
                  </p>

                  <div style={{
                    padding: '20px', background: '#f8fafc', borderRadius: '16px', marginBottom: '24px',
                    border: '1px solid #e2e8f0', display: 'grid', gap: '10px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>Pakej Pembaharuan</span>
                      <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: 700 }}>{customer?.plans?.name_plan || 'Pilih Paket Baru'}</span>
                    </div>
                    <div style={{ height: '1px', background: '#e2e8f0' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>Jumlah Bayaran</span>
                      <span style={{ fontSize: '24px', fontWeight: 950, color: '#16a34a' }}>{formatCurrency(customer?.plans?.price || 0)}</span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: '14px' }}>
                    <button
                      onClick={handlePay}
                      className="btn btn-primary"
                      style={{
                        width: '100%', padding: '18px', fontSize: '16px', fontWeight: 900, borderRadius: '16px',
                        background: '#16a34a', border: 'none', color: 'white',
                        boxShadow: '0 8px 16px -4px rgba(22, 163, 74, 0.3)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px'
                      }}
                      disabled={paying}
                    >
                      <CreditCard size={20} /> BAYAR ONLINE (AKTIF AUTOMATIK)
                    </button>

                    <button
                      onClick={handlePayWithWallet}
                      className="btn btn-secondary"
                      style={{
                        width: '100%', padding: '16px', fontSize: '15px', fontWeight: 800, borderRadius: '16px',
                        background: '#f0fdf4', border: '2px solid #16a34a', color: '#16a34a',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px'
                      }}
                      disabled={paying || !hasPlan || (customer.balance < (customer?.plans?.price || 0))}
                    >
                      <Zap size={18} /> {hasPlan ? 'BAYAR GUNA WALLET' : 'SILA BELI PAKEJ DULU'}
                    </button>

                    <div style={{ height: '1px', background: '#f3f4f6', margin: '10px 0' }}></div>

                    <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '18px', border: '1px solid #e2e8f0' }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 800, color: '#1e293b' }}>PINDAHAN MANUAL (CASH/ATM)</h4>
                      <div style={{ fontSize: '13px', color: '#475569', marginBottom: '16px', lineHeight: 1.6 }}>
                        Sila buat pindahan ke akaun di bawah dan hantar bukti pembayaran kepada Admin.
                      </div>

                      <div style={{ display: 'grid', gap: '10px', marginBottom: '20px' }}>
                        <div style={{ background: 'white', padding: '12px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>BANK ISLAM</div>
                          <div style={{ fontSize: '16px', fontWeight: 900, color: '#16a34a' }}>02075025251187</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>ADY BIN SAHABUDDIN</div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          const msg = `Halo Admin, saya telah buat bayaran manual.\n\n*Butiran Pembayaran:*\nNama: ${customer.fullname}\nUsername: ${customer.username}\nPakej: ${customer.plans?.name_plan}\nJumlah: ${formatCurrency(customer.plans?.price || 0)}\n\n_Mohon sahkan bayaran saya. Terma kasih._`;
                          window.open(`https://wa.me/60104005969?text=${encodeURIComponent(msg)}`, '_blank');
                        }}
                        style={{
                          width: '100%', padding: '14px', fontSize: '14px', fontWeight: 800, borderRadius: '14px',
                          background: 'white', color: '#25d366', border: '2px solid #25d366', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                        }}
                      >
                        🚀 HANTAR BUKTI (WHATSAPP)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* History Card */}
            <div style={{
              background: 'white', padding: '28px', borderRadius: '24px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#111827' }}>
                <div style={{ padding: '8px', background: '#f0fdf4', borderRadius: '8px' }}><Clock size={18} color="#16a34a" /></div>
                Sejarah Pembayaran
              </h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                {customer.payment_orders && customer.payment_orders.length > 0 ? (
                  customer.payment_orders
                    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((order: any) => (
                      <div key={order.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '16px', background: '#f9fafb', borderRadius: '16px', border: '1px solid #f3f4f6'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '40px', height: '40px', background: order.status === 'paid' ? '#f0fdf4' : '#fffbeb',
                            borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            <Receipt size={18} color={order.status === 'paid' ? '#16a34a' : '#d97706'} />
                          </div>
                          <div>
                            <div style={{ fontSize: '15px', fontWeight: 700, color: '#1f2937' }}>{order.plan_name || 'Pakej Internet'}</div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>{new Date(order.created_at).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '16px', fontWeight: 800, color: order.status === 'paid' ? '#16a34a' : '#d97706' }}>{formatCurrency(order.price)}</div>
                          <span style={{
                            fontSize: '10px', padding: '2px 8px', borderRadius: '10px',
                            background: order.status === 'paid' ? '#dcfce7' : '#fef3c7',
                            color: order.status === 'paid' ? '#166534' : '#92400e',
                            fontWeight: 800, textTransform: 'uppercase'
                          }}>
                            {order.status === 'paid' ? 'BERJAYA' : 'TERTUNDA'}
                          </span>
                        </div>
                      </div>
                    ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af', fontSize: '14px' }}>Tiada rekod pembayaran dijumpai.</div>
                )}
              </div>
            </div>

          </>
        )}

        {activeTab === 'wallet' && (
          <div style={{ background: 'white', padding: '28px', borderRadius: '24px', border: '1px solid #dcfce7', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#166534', marginBottom: '20px' }}>Sejarah Prmbelian</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              {balanceLogs.length > 0 ? balanceLogs.map((log: any) => (
                <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#f9fafb', borderRadius: '16px', border: '1px solid #f3f4f6' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', background: log.amount > 0 && log.type === 'topup' ? '#f0fdf4' : '#fff1f2', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Activity size={18} color={log.amount > 0 && log.type === 'topup' ? '#16a34a' : '#ef4444'} />
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#1f2937' }}>{log.description}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{new Date(log.created_at).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontWeight: 900, color: log.amount > 0 && log.type === 'topup' ? '#16a34a' : '#ef4444' }}>
                    {log.amount > 0 && log.type === 'topup' ? '+' : '-'}{formatCurrency(Math.abs(log.amount))}
                  </div>
                </div>
              )) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Belum ada Sejarah pembelian.</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div style={{ background: 'white', padding: '28px', borderRadius: '24px', border: '1px solid #dcfce7', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#166534', marginBottom: '20px' }}>Senarai Pembelian</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              {customer.payment_orders?.length > 0 ? customer.payment_orders.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((order: any) => (
                <div
                  key={order.id}
                  onClick={() => setSelectedInvoice(order)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#f9fafb', borderRadius: '16px', border: '1px solid #f3f4f6', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', background: order.status === 'paid' ? '#f0fdf4' : '#fffbeb', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Receipt size={18} color={order.status === 'paid' ? '#16a34a' : '#d97706'} />
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#1f2937' }}>{order.plan_name}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{new Date(order.created_at).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: order.status === 'paid' ? '#16a34a' : '#d97706' }}>{formatCurrency(order.price)}</div>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: order.status === 'paid' ? '#16a34a' : '#d97706' }}>{order.status.toUpperCase()}</div>
                  </div>
                </div>
              )) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Belum ada riwayat pembelian.</div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '40px', paddingBottom: '20px' }}>
          <p style={{ fontSize: '12px', color: '#9ca3af' }}>&copy; 2026 Purnama WiFi Malaysia. Semua Hak Terpelihara.</p>
        </div>
      </div>

      {/* Topup Modal */}
      {showTopupModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: '20px',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'white', width: '100%', maxWidth: '440px',
            borderRadius: '28px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#111827', margin: 0 }}>Isi Wallet</h3>
              <button onClick={() => setShowTopupModal(false)} style={{ background: '#f3f4f6', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontWeight: 900 }}>×</button>
            </div>

            {/* Tab Selector */}
            <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '14px', marginBottom: '24px' }}>
              <button
                onClick={() => setTopupTab('otomatis')}
                style={{
                  flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                  background: topupTab === 'otomatis' ? 'white' : 'transparent',
                  color: topupTab === 'otomatis' ? '#16a34a' : '#64748b',
                  fontWeight: 800, fontSize: '13px', cursor: 'pointer',
                  boxShadow: topupTab === 'otomatis' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                OTOMATIS
              </button>
              <button
                onClick={() => setTopupTab('manual')}
                style={{
                  flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                  background: topupTab === 'manual' ? 'white' : 'transparent',
                  color: topupTab === 'manual' ? '#16a34a' : '#64748b',
                  fontWeight: 800, fontSize: '13px', cursor: 'pointer',
                  boxShadow: topupTab === 'manual' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                MANUAL
              </button>
            </div>

            {topupTab === 'otomatis' ? (
              <>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>Wallet akan bertambah otomatis setelah pembayaran berhasil.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                  {['10', '20', '50', '100', '200', '500'].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setTopupAmount(amt)}
                      style={{
                        padding: '12px', borderRadius: '12px', border: '2px solid',
                        borderColor: topupAmount === amt ? '#16a34a' : '#f3f4f6',
                        background: topupAmount === amt ? '#f0fdf4' : 'white',
                        color: topupAmount === amt ? '#16a34a' : '#4b5563',
                        fontWeight: 800, cursor: 'pointer'
                      }}
                    >
                      RM {amt}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleTopup}>
                  <div style={{ marginBottom: '24px' }}>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '14px' }}>Jumlah Kustom (RM)</label>
                    <input
                      type="number"
                      className="form-input"
                      style={{ height: '50px', fontSize: '18px', fontWeight: 800 }}
                      value={topupAmount}
                      onChange={e => setTopupAmount(e.target.value)}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={topupLoading}
                    style={{
                      width: '100%', padding: '18px', borderRadius: '16px',
                      background: '#16a34a', color: 'white', border: 'none',
                      fontWeight: 800, cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(22, 163, 74, 0.3)'
                    }}
                  >
                    {topupLoading ? 'Memproses...' : 'BAYAR SEKARANG'}
                  </button>
                </form>
              </>
            ) : (
              <div style={{ textAlign: 'center' }}>
                {!manualOrderId ? (
                  <form onSubmit={handleTopup}>
                    <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>Masukkan jumlah Wallet yang ingin Anda isi secara manual.</p>
                    <div style={{ marginBottom: '24px' }}>
                      <label className="form-label" style={{ fontWeight: 700, fontSize: '14px' }}>Jumlah Top Up (RM)</label>
                      <input
                        type="number"
                        className="form-input"
                        style={{ height: '50px', fontSize: '18px', fontWeight: 800 }}
                        value={topupAmount}
                        onChange={e => setTopupAmount(e.target.value)}
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={topupLoading}
                      style={{
                        width: '100%', padding: '18px', borderRadius: '16px',
                        background: '#16a34a', color: 'white', border: 'none',
                        fontWeight: 800, cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(22, 163, 74, 0.3)'
                      }}
                    >
                      {topupLoading ? 'Memproses...' : 'KONFIRMASI JUMLAH'}
                    </button>
                  </form>
                ) : (
                  <>
                    <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #dcfce7' }}>
                      <div style={{ fontSize: '12px', color: '#166534', fontWeight: 700 }}>NOMOR INVOICE:</div>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: '#16a34a' }}>#{manualOrderId}</div>
                    </div>

                    <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>Silakan transfer tepat **RM {topupAmount}** ke rekening berikut:</p>

                    <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0', textAlign: 'left', marginBottom: '24px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 800 }}>BANK ISLAM</div>
                        <div style={{ fontSize: '20px', fontWeight: 900, color: '#16a34a' }}>02075025251187</div>
                        <div style={{ fontSize: '13px', color: '#1e293b', fontWeight: 600 }}>ADY BIN SAHABUDDIN</div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const msg = `Halo Admin, saya ingin Konfirmasi Top Up Manual.\n\n*Butiran:*\nNo. Invoice: #${manualOrderId}\nNama: ${customer.fullname}\nUsername: ${customer.username}\nJumlah: RM ${topupAmount}\n\n_Mohon setujui top up saya setelah cek mutasi. Terima kasih._`;
                        window.open(`https://wa.me/60104005969?text=${encodeURIComponent(msg)}`, '_blank');
                      }}
                      style={{
                        width: '100%', padding: '18px', borderRadius: '16px',
                        background: '#25d366', color: 'white', border: 'none',
                        fontWeight: 800, fontSize: '15px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                        boxShadow: '0 8px 16px -4px rgba(37, 211, 102, 0.3)',
                        marginBottom: '16px'
                      }}
                    >
                      🚀 KONFIRMASI WHATSAPP
                    </button>

                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px', marginTop: '10px' }}>
                      <p style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginBottom: '12px' }}>ATAU UPLOAD STRUK TRANSFER:</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                        style={{ marginBottom: '12px', fontSize: '13px', width: '100%' }}
                      />
                      <button
                        onClick={handleUploadProof}
                        disabled={!proofFile || uploadingProof}
                        style={{
                          width: '100%', padding: '14px', borderRadius: '14px',
                          background: proofFile ? '#1e293b' : '#f1f5f9',
                          color: proofFile ? 'white' : '#94a3b8',
                          border: 'none', fontWeight: 700, cursor: proofFile ? 'pointer' : 'default'
                        }}
                      >
                        {uploadingProof ? 'Mengunggah...' : '📤 Muat Naik Bukti Resit Transfer Anda'}
                      </button>
                    </div>

                    <button
                      onClick={() => setManualOrderId('')}
                      style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '12px', marginTop: '20px', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Ganti Jumlah Top Up
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '400px', borderRadius: '24px', padding: '30px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#111827', margin: 0 }}>Detail Transaksi</h3>
              <button onClick={() => setSelectedInvoice(null)} style={{ background: '#f3f4f6', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontWeight: 900 }}>×</button>
            </div>

            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>PESANAN</div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#16a34a', marginBottom: '16px' }}>{selectedInvoice.plan_name}</div>

              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Status:</span>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: selectedInvoice.status === 'paid' ? '#16a34a' : '#d97706' }}>{selectedInvoice.status.toUpperCase()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Tarikh:</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#1f2937' }}>{new Date(selectedInvoice.created_at).toLocaleString('ms-MY')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Metode:</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#1f2937' }}>{selectedInvoice.payment_type || 'Online Gateway'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Harga:</span>
                  <span style={{ fontSize: '16px', fontWeight: 900, color: '#16a34a' }}>{formatCurrency(selectedInvoice.price)}</span>
                </div>
              </div>
            </div>

            {selectedInvoice.voucher_code && (
              <div style={{ background: '#f0fdf4', border: '2px dashed #16a34a', padding: '20px', borderRadius: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: 900, color: '#16a34a', marginBottom: '10px' }}>KOD VOUCHER ANDA</div>
                <div style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '2px', color: '#111827' }}>{selectedInvoice.voucher_code}</div>
                {selectedInvoice.voucher_password && (
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#64748b', marginTop: '4px' }}>P: {selectedInvoice.voucher_password}</div>
                )}
                <button
                  onClick={() => {
                    const text = `Voucher: ${selectedInvoice.voucher_code}${selectedInvoice.voucher_password ? `\nPass: ${selectedInvoice.voucher_password}` : ''}`
                    navigator.clipboard.writeText(text)
                    alert('Kod disalin!')
                  }}
                  style={{ marginTop: '16px', background: 'white', border: '1px solid #16a34a', color: '#16a34a', padding: '8px 20px', borderRadius: '50px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                >
                  SALIN KOD
                </button>
              </div>
            )}

            <button onClick={() => setSelectedInvoice(null)} style={{ width: '100%', marginTop: '24px', padding: '16px', borderRadius: '16px', background: '#16a34a', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer' }}>
              TUTUP
            </button>
          </div>
        </div>
      )}
      {/* Bottom Navigation (Mobile Only) */}
      <div className="bottom-nav" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)',
        borderTop: '1px solid #dcfce7', height: '70px',
        display: 'none', justifyContent: 'space-around', alignItems: 'center',
        zIndex: 1000, boxShadow: '0 -4px 12px rgba(0,0,0,0.05)',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}>
        <button
          onClick={() => setActiveTab('overview')}
          style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: activeTab === 'overview' ? '#16a34a' : '#94a3b8', cursor: 'pointer' }}
        >
          <Home size={activeTab === 'overview' ? 24 : 22} strokeWidth={activeTab === 'overview' ? 2.5 : 2} />
          <span style={{ fontSize: '11px', fontWeight: activeTab === 'overview' ? 800 : 500 }}>Utama</span>
        </button>
        <button
          onClick={() => setActiveTab('wallet')}
          style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: activeTab === 'wallet' ? '#16a34a' : '#94a3b8', cursor: 'pointer' }}
        >
          <Wallet size={activeTab === 'wallet' ? 24 : 22} strokeWidth={activeTab === 'wallet' ? 2.5 : 2} />
          <span style={{ fontSize: '11px', fontWeight: activeTab === 'wallet' ? 800 : 500 }}>Saldo</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: activeTab === 'history' ? '#16a34a' : '#94a3b8', cursor: 'pointer' }}
        >
          <History size={activeTab === 'history' ? 24 : 22} strokeWidth={activeTab === 'history' ? 2.5 : 2} />
          <span style={{ fontSize: '11px', fontWeight: activeTab === 'history' ? 800 : 500 }}>Belian</span>
        </button>
      </div>
    </div>
  )
}
