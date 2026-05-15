'use client'

import { useState, useEffect } from 'react'
import { User, Clock, CreditCard, Activity, ArrowRight, ShieldCheck, Wifi, Tag, LogOut, ChevronRight, Zap } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function PelangganDashboard() {
  const [loading, setLoading] = useState(true)
  const [customer, setCustomer] = useState<any>(null)
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [error, setError] = useState('')
  const [paying, setPaying] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)

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
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    
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
      setError(data.error || 'Login gagal. Sila semak semula username & kata laluan.')
    }
    setLoading(false)
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
            <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#166534', letterSpacing: '-0.5px' }}>Login Pelanggan</h1>
            <p style={{ color: '#4b5563', fontSize: '15px', marginTop: '4px' }}>Pantau status & perbaharui internet anda</p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'grid', gap: '20px' }}>
            {error && <div style={{ color: '#b91c1c', background: '#fef2f2', padding: '12px', borderRadius: '12px', fontSize: '14px', textAlign: 'center', border: '1px solid #fee2e2' }}>{error}</div>}
            <div>
              <label className="form-label" style={{ color: '#374151', fontWeight: 600, marginBottom: '8px' }}>Username / Kod Baucar</label>
              <input 
                className="form-input" 
                style={{ background: '#f9fafb', borderColor: '#e5e7eb', color: '#111827', height: '50px' }}
                placeholder="Masukkan username atau kod anda" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} required 
              />
            </div>
            <div>
              <label className="form-label" style={{ color: '#374151', fontWeight: 600, marginBottom: '8px' }}>Kata Laluan (Pilihan)</label>
              <input 
                type="password" 
                className="form-input" 
                style={{ background: '#f9fafb', borderColor: '#e5e7eb', color: '#111827', height: '50px' }}
                placeholder="Biarkan kosong jika guna baucar" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} 
              />
              <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '6px' }}>* Pengguna baucar hanya perlu masukkan kod di kotak Username.</p>
            </div>
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '16px', fontSize: '16px', fontWeight: 700, borderRadius: '14px', background: '#16a34a', boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.2)' }} 
              disabled={loading}
            >
              {loading ? 'Sila tunggu...' : 'MASUK KE DASHBOARD'}
            </button>
          </form>
          
          <div style={{ textAlign: 'center', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #f3f4f6' }}>
            <a href="/beli" style={{ color: '#16a34a', fontSize: '14px', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              Bukan pelanggan PPPoE? Beli Baucar <ChevronRight size={16} />
            </a>
          </div>
        </div>
      </div>
    )
  }

  const isExpired = customer.expired_at ? new Date(customer.expired_at) < new Date() : true

  return (
    <div style={{ minHeight: '100vh', background: '#f0fdf4', color: '#111827' }}>
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
            NuxBill <span style={{ color: '#ea580c' }}>User</span>
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
        {/* Profile Card */}
        <div style={{ 
          background: 'white', padding: '28px', borderRadius: '24px', marginBottom: '24px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
          border: '1px solid #dcfce7'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{ 
              width: '56px', height: '56px', borderRadius: '18px', 
              background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid #dcfce7'
            }}>
              <User color="#16a34a" size={28} />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#111827', margin: 0 }}>{customer.fullname}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>@{customer.username}</span>
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#d1d5db' }}></span>
                <span style={{ fontSize: '14px', color: '#16a34a', fontWeight: 600 }}>Pelanggan PPPoE</span>
              </div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <span style={{ 
                padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                background: isExpired ? '#fef2f2' : '#f0fdf4',
                color: isExpired ? '#b91c1c' : '#166534',
                border: `1px solid ${isExpired ? '#fee2e2' : '#dcfce7'}`
              }}>
                {isExpired ? 'Layanan Terputus' : 'Layanan Aktif'}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '18px', border: '1px solid #f3f4f6' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', fontSize: '12px', marginBottom: '6px', fontWeight: 600 }}>
                <Clock size={14} style={{color: '#3b82f6'}} /> AKTIF SEHINGGA
              </div>
              <div style={{ fontWeight: 800, fontSize: '17px', color: isExpired ? '#b91c1c' : '#111827' }}>
                {customer.expired_at ? new Date(customer.expired_at).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Belum Aktif'}
              </div>
            </div>
            <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '18px', border: '1px solid #f3f4f6' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', fontSize: '12px', marginBottom: '6px', fontWeight: 600 }}>
                <Activity size={14} style={{color: '#10b981'}} /> PAKEJ SEMASA
              </div>
              <div style={{ fontWeight: 800, fontSize: '17px', color: '#111827' }}>
                {customer.plans?.name_plan || 'N/A'}
                {customer.plans?.bandwidths && (
                  <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 700, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Zap size={10} /> {customer.plans.bandwidths.rate_down}{customer.plans.bandwidths.rate_down_unit} Kelajuan
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Alert / Action */}
        {isExpired && (
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
                  <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: 700 }}>{customer.plans?.name_plan}</span>
                </div>
                <div style={{ height: '1px', background: '#e2e8f0' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>Jumlah Bayaran</span>
                  <span style={{ fontSize: '24px', fontWeight: 950, color: '#16a34a' }}>{formatCurrency(customer.plans?.price || 0)}</span>
                </div>
              </div>

              <button 
                onClick={handlePay} 
                className="btn btn-primary" 
                style={{ 
                  width: '100%', padding: '20px', fontSize: '18px', fontWeight: 900, borderRadius: '18px', 
                  background: '#16a34a', border: 'none', color: 'white',
                  boxShadow: '0 10px 20px -5px rgba(22, 163, 74, 0.4)', marginBottom: '16px',
                  cursor: 'pointer', transition: 'transform 0.2s'
                }} 
                disabled={paying}
              >
                {paying ? 'Menghubungi Gerbang Bayaran...' : <><CreditCard size={22} style={{marginRight: '12px'}} /> BAYAR SEKARANG (Online)</>}
              </button>
              
              <button 
                onClick={() => {
                  const msg = `Halo Admin, saya ingin perbaharui pakej ${customer.plans?.name_plan}. Username: ${customer.username}`;
                  window.open(`https://wa.me/60123456789?text=${encodeURIComponent(msg)}`, '_blank');
                }} 
                style={{ 
                  width: '100%', padding: '16px', fontSize: '14px', fontWeight: 700, borderRadius: '14px', 
                  background: 'white', color: '#16a34a', border: '2px solid #dcfce7', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                🏧 TRANSFER MANUAL / WHATSAPP
              </button>

              <div style={{ 
                marginTop: '24px', padding: '16px', background: '#fdfcfb', borderRadius: '14px', 
                fontSize: '13px', color: '#71717a', border: '1px dashed #e4e4e7', lineHeight: 1.5
              }}>
                <b style={{ color: '#18181b' }}>Maklumat Bank:</b><br/>
                Maybank: <span style={{ color: '#16a34a', fontWeight: 700 }}>1234567890</span><br/>
                CIMB: <span style={{ color: '#16a34a', fontWeight: 700 }}>0987654321</span><br/>
                A.n: <span style={{ color: '#18181b', fontWeight: 600 }}>NuxBill Malaysia</span>
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

        {/* Upsell / Other actions */}
        <div style={{ 
          marginTop: '24px', padding: '24px', borderRadius: '24px', 
          background: 'linear-gradient(135deg, #16a34a, #15803d)', 
          boxShadow: '0 10px 15px -3px rgba(22, 163, 74, 0.2)',
          display: 'flex', alignItems: 'center', gap: '16px'
        }}>
          <div style={{ 
            padding: '12px', background: 'rgba(255,255,255,0.2)', borderRadius: '14px', backdropFilter: 'blur(4px)'
          }}>
            <Tag color="white" size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'white', margin: 0 }}>Beli Baucar Hotspot</h3>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', margin: '4px 0 0' }}>Sesuai untuk rakan atau peranti tetamu.</p>
          </div>
          <button 
            onClick={() => window.location.href = '/beli'} 
            style={{ 
              background: 'white', border: 'none', color: '#16a34a', 
              padding: '10px 20px', borderRadius: '12px', fontWeight: 800, 
              fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' 
            }}
          >
            BELI &rarr;
          </button>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '40px', paddingBottom: '20px' }}>
          <p style={{ fontSize: '12px', color: '#9ca3af' }}>&copy; 2026 NuxBill Malaysia. Semua Hak Terpelihara.</p>
        </div>
      </div>
    </div>
  )
}

function Receipt({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z" />
      <path d="M16 8h-4" />
      <path d="M16 12h-4" />
      <path d="M8 12h.01" />
      <path d="M8 8h.01" />
    </svg>
  )
}
