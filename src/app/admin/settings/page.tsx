'use client'

import { useState, useEffect, useRef } from 'react'
import { Save, Shield, Globe, CreditCard, RefreshCw, Wifi, WifiOff, QrCode, Unlink } from 'lucide-react'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  // WA Agent states
  const [waStatus, setWaStatus] = useState<any>(null)
  const [waQR, setWaQR] = useState<string | null>(null)
  const [waLoading, setWaLoading] = useState(false)
  const pollRef = useRef<NodeJS.Timeout | null>(null)
  const [config, setConfig] = useState<any>({
    app_name: 'Purnama WiFi',
    company_name: '',
    address: '',
    phone: '',
    currency_code: 'RM',
    midtrans_client_key: '',
    midtrans_server_key: '',
    midtrans_is_production: 'false',
    duitku_merchant_code: '',
    duitku_api_key: '',
    duitku_is_production: 'false',
    local_agent_secret: '',
    whatsapp_gateway_url: '',
    whatsapp_api_key: '',
  })

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => {
        if (data.config) {
          setConfig((prev: any) => ({ ...prev, ...data.config }))
        }
        setLoading(false)
      })

    // Fetch WA status pertama kali
    fetchWaStatus()

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  async function fetchWaStatus() {
    try {
      const res = await fetch('/api/admin/whatsapp')
      if (!res.ok) throw new Error('Agent tidak berjalan')
      const data = await res.json()
      setWaStatus(data)

      if (!data.connected && data.hasQR) {
        // Ambil QR code melalui proxy
        const qrRes = await fetch('/api/admin/whatsapp?action=qr')
        if (qrRes.ok) {
          const qrData = await qrRes.json()
          if (qrData.qr) setWaQR(qrData.qr)
        }
        // Mula polling setiap 3 saat
        startPolling()
      } else if (data.connected) {
        setWaQR(null)
        stopPolling()
      }
    } catch (err) {
      setWaStatus({ connected: false, error: 'Gagal menghubungi WhatsApp Agent' })
    }
  }

  function startPolling() {
    if (pollRef.current) return // Elak double polling
    pollRef.current = setInterval(fetchWaStatus, 3000)
  }

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  async function handleWaDisconnect() {
    if (!confirm('Adakah anda pasti ingin putuskan sambungan WhatsApp? QR baru akan dijana.')) return
    setWaLoading(true)
    setWaQR(null)
    try {
      await fetch('/api/admin/whatsapp', { method: 'POST' })
      setWaStatus({ connected: false, hasQR: false, message: 'Memutuskan... QR baru akan muncul dalam beberapa saat.' })
      setTimeout(() => { fetchWaStatus(); startPolling() }, 3000)
    } catch (err) {
      alert('Gagal putuskan sambungan. Pastikan WA Agent berjalan.')
    }
    setWaLoading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    })
    if (res.ok) {
      alert('Tetapan berjaya disimpan!')
    }
    setSaving(false)
  }

  if (loading) return <div className="page-content">Memuatkan tetapan...</div>

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Tetapan Sistem</h1>
        <p className="page-subtitle">Konfigurasi aplikasi, gerbang pembayaran, dan keselamatan</p>
      </div>

      <form onSubmit={handleSave}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
          
          {/* WhatsApp Gateway Manager (Sambungan WhatsApp Agent) */}
          <div className="glass-card" style={{ padding: '24px', gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #1e293b', paddingBottom: '12px' }}>
              <QrCode size={20} color="#22c55e" />
              <h3 style={{ fontWeight: 700, color: '#f1f5f9' }}>Sambungan WhatsApp Agent</h3>
              <button
                type="button"
                onClick={fetchWaStatus}
                style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.05)', border: '1px solid #1e293b', borderRadius: '8px', padding: '6px 12px', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
              >
                <RefreshCw size={13} /> Refresh Status
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
              {/* Status Panel */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '12px', background: waStatus?.connected ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${waStatus?.connected ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, marginBottom: '16px' }}>
                  {waStatus?.connected
                    ? <Wifi size={24} color="#22c55e" />
                    : <WifiOff size={24} color="#ef4444" />
                  }
                  <div>
                    <div style={{ fontWeight: 700, color: waStatus?.connected ? '#22c55e' : '#ef4444', fontSize: '0.95rem' }}>
                      {waStatus?.connected ? '✅ Tersambung' : '❌ Tidak Tersambung'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                      {waStatus?.message || waStatus?.error || 'Semak status...'}
                    </div>
                    {waStatus?.phone && (
                      <div style={{ fontSize: '0.75rem', color: '#22c55e', marginTop: '2px' }}>📱 {waStatus.phone}</div>
                    )}
                  </div>
                </div>

                {/* Info panduan */}
                <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '10px', padding: '14px', fontSize: '0.78rem', color: '#64748b', lineHeight: 1.7 }}>
                  <strong style={{ color: '#93c5fd' }}>📋 Cara Sambung:</strong><br/>
                  1. Pastikan wa-agent berjalan di <code style={{ color: '#f1f5f9', background: 'rgba(255,255,255,0.05)', padding: '1px 4px', borderRadius: '3px' }}>{config.whatsapp_gateway_url || 'https://server.internetdesa.site'}</code><br/>
                  2. Klik <strong style={{ color: '#f1f5f9' }}>Refresh Status</strong> hingga QR muncul<br/>
                  3. Imbas QR dengan WhatsApp anda<br/>
                  4. Status akan bertukar menjadi <span style={{ color: '#22c55e' }}>Tersambung</span>
                </div>

                {waStatus?.connected && (
                  <button
                    type="button"
                    onClick={handleWaDisconnect}
                    disabled={waLoading}
                    style={{ marginTop: '16px', width: '100%', padding: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600 }}
                  >
                    <Unlink size={15} /> {waLoading ? 'Memutuskan...' : 'Putus & Jana QR Baru'}
                  </button>
                )}
              </div>

              {/* QR Code Panel */}
              <div style={{ textAlign: 'center' }}>
                {waStatus?.connected ? (
                  <div style={{ padding: '40px', background: 'rgba(34,197,94,0.05)', borderRadius: '16px', border: '1px solid rgba(34,197,94,0.2)' }}>
                    <Wifi size={48} color="#22c55e" style={{ margin: '0 auto 12px' }} />
                    <p style={{ color: '#4ade80', fontWeight: 700 }}>WhatsApp Aktif</p>
                    <p style={{ color: '#64748b', fontSize: '0.8rem' }}>OTP boleh dihantar</p>
                  </div>
                ) : waQR ? (
                  <div>
                    <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '12px' }}>Imbas dengan WhatsApp → Peranti Tertaut → Tambah Peranti</p>
                    <img
                      src={waQR}
                      alt="WhatsApp QR Code"
                      style={{ width: '220px', height: '220px', borderRadius: '12px', border: '4px solid #22c55e', display: 'block', margin: '0 auto' }}
                    />
                    <p style={{ color: '#64748b', fontSize: '0.72rem', marginTop: '10px' }}>QR tamat dalam ~60 saat. Klik Refresh jika tamat.</p>
                  </div>
                ) : (
                  <div style={{ padding: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed #1e293b' }}>
                    <QrCode size={48} color="#334155" style={{ margin: '0 auto 12px' }} />
                    <p style={{ color: '#475569', fontSize: '0.85rem' }}>
                      {waStatus?.error ? 'WA Agent tidak berjalan' : 'Klik Refresh Status untuk muat QR'}
                    </p>
                    <button
                      type="button"
                      onClick={fetchWaStatus}
                      style={{ marginTop: '12px', padding: '8px 20px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '8px', color: '#4ade80', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      Muat QR Code
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* WhatsApp Gateway Settings */}
            <div style={{ marginTop: '24px', borderTop: '1px solid #1e293b', paddingTop: '20px' }}>
              <h4 style={{ fontWeight: 600, color: '#f1f5f9', marginBottom: '12px', fontSize: '0.9rem' }}>Konfigurasi WhatsApp Gateway</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                <div>
                  <label className="form-label" style={{ color: '#94a3b8' }}>URL WhatsApp Gateway</label>
                  <input
                    className="form-input"
                    placeholder="https://server.internetdesa.site/"
                    value={config.whatsapp_gateway_url || ''}
                    onChange={e => setConfig({...config, whatsapp_gateway_url: e.target.value})}
                  />
                  <p style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '4px' }}>Contoh: https://server.internetdesa.site/ (biarkan kosong untuk menggunakan default)</p>
                </div>
                <div>
                  <label className="form-label" style={{ color: '#94a3b8' }}>WhatsApp API Key / Token</label>
                  <input
                    className="form-input"
                    type="password"
                    placeholder="purnamawifi_wa_secure_key_..."
                    value={config.whatsapp_api_key || ''}
                    onChange={e => setConfig({...config, whatsapp_api_key: e.target.value})}
                  />
                  <p style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '4px' }}>Token keamanan otentikasi dengan WhatsApp Agent.</p>
                </div>
              </div>
            </div>
          </div>

          {/* General Tetapan */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #1e293b', paddingBottom: '12px' }}>
              <Globe size={20} color="#60a5fa" />
              <h3 style={{ fontWeight: 700, color: '#f1f5f9' }}>Maklumat Umum</h3>
            </div>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label className="form-label">Nama Aplikasi</label>
                <input className="form-input" value={config.app_name} onChange={e => setConfig({...config, app_name: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Nama Syarikat / ISP</label>
                <input className="form-input" value={config.company_name} onChange={e => setConfig({...config, company_name: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Alamat</label>
                <textarea className="form-input" rows={2} value={config.address} onChange={e => setConfig({...config, address: e.target.value})} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">No. Telefon</label>
                  <input className="form-input" value={config.phone} onChange={e => setConfig({...config, phone: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Mata Wang</label>
                  <input className="form-input" value={config.currency_code} onChange={e => setConfig({...config, currency_code: e.target.value})} />
                </div>
              </div>
            </div>
          </div>

          {/* Security & Agent */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #1e293b', paddingBottom: '12px' }}>
              <Shield size={20} color="#fbbf24" />
              <h3 style={{ fontWeight: 700, color: '#f1f5f9' }}>Keselamatan & Ejen</h3>
            </div>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label className="form-label">Rahsia Ejen Tempatan (Secret)</label>
                <input className="form-input" value={config.local_agent_secret} onChange={e => setConfig({...config, local_agent_secret: e.target.value})} />
                <p style={{ fontSize: '0.65rem', color: '#475569', marginTop: '4px' }}>Kata laluan bersama antara Aplikasi Awan dan Ejen Tempatan di PC anda.</p>
              </div>
            </div>
          </div>

        </div>

        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ padding: '12px 32px' }}>
            {saving ? <><RefreshCw size={18} className="animate-spin" style={{marginRight: '8px'}}/> Menyimpan...</> : <><Save size={18} style={{marginRight: '8px'}}/> Simpan Semua Perubahan</>}
          </button>
        </div>
      </form>
    </div>
  )
}
