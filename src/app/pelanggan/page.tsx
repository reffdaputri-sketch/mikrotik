'use client'

import { useState, useEffect } from 'react'
import { User, Clock, CreditCard, Activity, ArrowRight, ShieldCheck, Wifi, Tag } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function PelangganDashboard() {
  const [loading, setLoading] = useState(true)
  const [customer, setCustomer] = useState<any>(null)
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [error, setError] = useState('')
  const [paying, setPaying] = useState(false)

  // Cek session dan fetch data terbaru
  useEffect(() => {
    async function syncData() {
      const saved = localStorage.getItem('nuxbill_customer')
      if (saved) {
        const localData = JSON.parse(saved)
        // Fetch data terbaru dari server
        const res = await fetch(`/api/pelanggan/me?id=${localData.id}`)
        if (res.ok) {
          const freshData = await res.json()
          setCustomer(freshData.customer)
          localStorage.setItem('nuxbill_customer', JSON.stringify(freshData.customer))
          setIsLoggedIn(true)
        } else {
          // Jika gagal fetch (misal id salah), logout saja
          handleLogout()
        }
      }
      setLoading(false)
    }
    syncData()
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    // API khusus buat pelanggan login
    const res = await fetch('/api/pelanggan/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginForm)
    })

    const data = await res.json()
    if (res.ok) {
      localStorage.setItem('nuxbill_customer', JSON.stringify(data.customer))
      setCustomer(data.customer)
      setIsLoggedIn(true)
    } else {
      setError(data.error || 'Login gagal. Cek kembali username & password.')
    }
    setLoading(false)
  }

  async function handlePay() {
    setPaying(true)
    // Panggil API buat bikin order renewal
    const res = await fetch('/api/pelanggan/renew', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id: customer.id })
    })

    const data = await res.json()
    if (data.redirect_url) {
      window.location.href = data.redirect_url
    } else {
      alert('Gagal membuat pembayaran. Coba lagi nanti.')
      setPaying(false)
    }
  }

  function handleLogout() {
    localStorage.removeItem('nuxbill_customer')
    setIsLoggedIn(false)
    setCustomer(null)
  }

  if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}><span className="spinner"></span></div>

  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div className="glass-card" style={{ maxWidth: '400px', width: '100%', padding: '32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Wifi color="white" size={32} />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#f1f5f9' }}>Login Pelanggan</h1>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Pantau status & perpanjang internet kamu</p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'grid', gap: '16px' }}>
            {error && <div style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)', padding: '10px', borderRadius: '8px', fontSize: '14px', textAlign: 'center' }}>{error}</div>}
            <div>
              <label className="form-label">Username PPPoE</label>
              <input className="form-input" placeholder="Masukkan username" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} required />
            </div>
            <div>
              <label className="form-label">Password</label>
              <input type="password" className="form-input" placeholder="Masukkan password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px' }} disabled={loading}>
              {loading ? 'Masuk...' : 'MASUK KE DASHBOARD'}
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <a href="/beli" style={{ color: '#3b82f6', fontSize: '14px', textDecoration: 'none' }}>Bukan pelanggan PPPoE? Beli Voucher Hotspot &rarr;</a>
          </div>
        </div>
      </div>
    )
  }

  const isExpired = customer.expired_at ? new Date(customer.expired_at) < new Date() : true

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f1f5f9' }}>
      <nav style={{ padding: '20px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wifi color="white" size={18} />
          </div>
          <span style={{ fontWeight: 800, fontSize: '18px' }}>NuxBill <span style={{ color: '#3b82f6' }}>User</span></span>
        </div>
        <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '14px', cursor: 'pointer' }}>Logout</button>
      </nav>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>
        <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User color="#3b82f6" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>{customer.fullname}</h2>
              <span style={{ fontSize: '14px', color: '#94a3b8' }}>@{customer.username}</span>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <span className={`badge ${isExpired ? 'badge-danger' : 'badge-success'}`}>
                {isExpired ? 'Layanan Terputus' : 'Layanan Aktif'}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>
                <Clock size={14} /> AKTIF SAMPAI
              </div>
              <div style={{ fontWeight: 700, fontSize: '16px', color: isExpired ? '#f87171' : '#f1f5f9' }}>
                {customer.expired_at ? new Date(customer.expired_at).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Belum Aktif'}
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>
                <Activity size={14} /> PAKET SAAT INI
              </div>
              <div style={{ fontWeight: 700, fontSize: '16px' }}>
                {customer.plans?.name_plan || 'N/A'}
                {customer.plans?.bandwidths && (
                  <div style={{ fontSize: '11px', color: '#60a5fa', fontWeight: 600, marginTop: '2px' }}>
                    🚀 {customer.plans.bandwidths.rate_down}{customer.plans.bandwidths.rate_down_unit} Speed
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {isExpired && (
          <div className="glass-card" style={{ padding: '24px', border: '2px solid #ef4444', background: 'rgba(239,68,68,0.05)', animation: 'pulse 2s infinite', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '10px', background: '#ef4444', borderRadius: '10px' }}>
                <Activity color="white" size={24} />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#f1f5f9', margin: 0 }}>Layanan Terputus!</h3>
            </div>
            <p style={{ fontSize: '14px', color: '#cbd5e1', marginBottom: '20px', lineHeight: 1.6 }}>
              Waduh! Sepertinya masa aktif paket internet kamu sudah habis nih. Yuk perpanjang sekarang biar bisa langsung <span style={{ color: '#10b981', fontWeight: 700 }}>Aktif Otomatis</span> lagi!
            </p>
            <div style={{ padding: '16px', background: 'rgba(15,23,42,0.5)', borderRadius: '12px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#94a3b8' }}>Paket</span>
                <span style={{ fontSize: '14px', color: '#f1f5f9', fontWeight: 600 }}>{customer.plans?.name_plan}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#94a3b8' }}>Total Bayar</span>
                <span style={{ fontSize: '22px', fontWeight: 900, color: '#10b981' }}>{formatCurrency(customer.plans?.price || 0)}</span>
              </div>
            </div>
            <button onClick={handlePay} className="btn btn-primary" style={{ width: '100%', padding: '18px', fontSize: '18px', fontWeight: 800, borderRadius: '14px', boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.5)', marginBottom: '12px' }} disabled={paying}>
              {paying ? 'Menuju Pembayaran...' : <><CreditCard size={20} style={{marginRight: '12px'}} /> BAYAR OTOMATIS (toyyibPay)</>}
            </button>
            
            <button 
              onClick={() => {
                const msg = `Halo Admin, saya ingin bayar manual untuk paket ${customer.plans?.name_plan}. Username: ${customer.username}`;
                window.open(`https://wa.me/60123456789?text=${encodeURIComponent(msg)}`, '_blank');
              }} 
              className="btn btn-secondary" 
              style={{ width: '100%', padding: '14px', fontSize: '14px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}
            >
              🏧 TRANSFER MANUAL / WHATSAPP
            </button>

            <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', fontSize: '12px', color: '#94a3b8', border: '1px dashed rgba(255,255,255,0.1)' }}>
              <b>Info Rekening:</b><br/>
              Maybank: 1234567890<br/>
              CIMB: 0987654321<br/>
              A.n: NuxBill Malaysia
            </div>
          </div>
        )}

        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowRight size={16} color="#3b82f6" /> Riwayat Pembayaran
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {customer.payment_orders && customer.payment_orders.length > 0 ? (
              customer.payment_orders
                .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((order: any) => (
                  <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600 }}>{order.plan_name || 'Pembaharuan Paket'}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{new Date(order.created_at).toLocaleDateString('ms-MY')}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#10b981' }}>{formatCurrency(order.price)}</div>
                      <span style={{ fontSize: '10px', color: order.status === 'paid' ? '#10b981' : '#f59e0b', textTransform: 'uppercase', fontWeight: 800 }}>
                        {order.status === 'paid' ? 'LUNAS' : 'PENDING'}
                      </span>
                    </div>
                  </div>
                ))
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '14px' }}>Belum ada riwayat pembayaran</div>
            )}
          </div>
        </div>
        <div className="glass-card" style={{ padding: '24px', marginTop: '24px', background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))', border: '1px solid rgba(59,130,246,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '12px', background: '#3b82f6', borderRadius: '12px' }}>
              <Tag color="white" size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Beli Voucher Hotspot</h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0' }}>Beli voucher untuk teman atau perangkat lain</p>
            </div>
            <button 
              onClick={() => window.location.href = '/beli'} 
              className="btn btn-primary btn-sm" 
              style={{ marginLeft: 'auto', padding: '10px 20px' }}
            >
              BELI &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
