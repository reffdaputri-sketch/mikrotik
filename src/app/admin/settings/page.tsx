'use client'

import { useState, useEffect } from 'react'
import { Save, Shield, Globe, CreditCard, Bell, RefreshCw } from 'lucide-react'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<any>({
    app_name: 'NuxBill',
    company_name: '',
    address: '',
    phone: '',
    currency_code: 'IDR',
    midtrans_client_key: '',
    midtrans_server_key: '',
    midtrans_is_production: 'false',
    duitku_merchant_code: '',
    duitku_api_key: '',
    duitku_is_production: 'false',
    local_agent_secret: '',
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
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    })
    if (res.ok) {
      alert('Pengaturan berhasil disimpan!')
    }
    setSaving(false)
  }

  if (loading) return <div className="page-content">Loading settings...</div>

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Pengaturan Sistem</h1>
        <p className="page-subtitle">Konfigurasi aplikasi, gateway pembayaran, dan keamanan</p>
      </div>

      <form onSubmit={handleSave}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
          
          {/* General Settings */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #1e293b', paddingBottom: '12px' }}>
              <Globe size={20} color="#3b82f6" />
              <h3 style={{ fontWeight: 700, color: '#f1f5f9' }}>Informasi Umum</h3>
            </div>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label className="form-label">Nama Aplikasi</label>
                <input className="form-input" value={config.app_name} onChange={e => setConfig({...config, app_name: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Nama Perusahaan / ISP</label>
                <input className="form-input" value={config.company_name} onChange={e => setConfig({...config, company_name: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Alamat</label>
                <textarea className="form-input" rows={2} value={config.address} onChange={e => setConfig({...config, address: e.target.value})} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Telepon</label>
                  <input className="form-input" value={config.phone} onChange={e => setConfig({...config, phone: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Mata Uang</label>
                  <input className="form-input" value={config.currency_code} onChange={e => setConfig({...config, currency_code: e.target.value})} />
                </div>
              </div>
            </div>
          </div>

          {/* Duitku Settings */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #1e293b', paddingBottom: '12px' }}>
              <CreditCard size={20} color="#10b981" />
              <h3 style={{ fontWeight: 700, color: '#f1f5f9' }}>Gateway Duitku</h3>
            </div>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label className="form-label">Duitku Merchant Code</label>
                <input className="form-input" value={config.duitku_merchant_code} onChange={e => setConfig({...config, duitku_merchant_code: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Duitku API Key</label>
                <input type="password" className="form-input" value={config.duitku_api_key} onChange={e => setConfig({...config, duitku_api_key: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Mode Produksi</label>
                <select className="form-input" value={config.duitku_is_production} onChange={e => setConfig({...config, duitku_is_production: e.target.value})}>
                  <option value="false">Sandbox (Testing)</option>
                  <option value="true">Production (Live)</option>
                </select>
              </div>
              <div style={{ background: 'rgba(16,185,129,0.05)', padding: '12px', borderRadius: '8px', fontSize: '0.75rem', color: '#64748b' }}>
                Gunakan URL callback berikut di dashboard Duitku:<br/>
                <code>{process.env.NEXT_PUBLIC_APP_URL}/api/webhook/duitku</code>
              </div>
            </div>
          </div>

          {/* Security & Agent */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #1e293b', paddingBottom: '12px' }}>
              <Shield size={20} color="#f59e0b" />
              <h3 style={{ fontWeight: 700, color: '#f1f5f9' }}>Keamanan & Agent</h3>
            </div>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label className="form-label">Local Agent Secret</label>
                <input className="form-input" value={config.local_agent_secret} onChange={e => setConfig({...config, local_agent_secret: e.target.value})} />
                <p style={{ fontSize: '0.65rem', color: '#475569', marginTop: '4px' }}>Password bersama antara Cloud App dan Local Agent di PC kamu.</p>
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
