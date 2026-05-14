'use client'

import { useState, useEffect } from 'react'
import { Wifi, MapPin, AlertTriangle, CreditCard, Tag, CheckCircle2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function BeliVoucher() {
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const [locError, setLocError] = useState('')
  const [buyerInfo, setBuyerInfo] = useState({ name: '', phone: '' })

  // Haversine formula buat itung jarak (dalam Meter)
  function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3 // Earth radius in meters
    const φ1 = lat1 * Math.PI/180
    const φ2 = lat2 * Math.PI/180
    const Δφ = (lat2-lat1) * Math.PI/180
    const Δλ = (lon2-lon1) * Math.PI/180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c
  }

  useEffect(() => {
    // Ambil data profil kalau sudah login
    const saved = localStorage.getItem('nuxbill_customer')
    if (saved) {
      const customer = JSON.parse(saved)
      setBuyerInfo({ name: customer.fullname, phone: customer.phonenumber })
    }

    // 1. Minta lokasi user
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        },
        (err) => {
          setLocError('Gagal mendapatkan lokasi. Pastikan GPS aktif.')
          console.error(err)
        }
      )
    }

    // 2. Ambil paket hotspot
    const timestamp = new Date().getTime()
    fetch(`/api/public/plans?t=${timestamp}`)
      .then(res => res.json())
      .then(data => {
        setPlans((data.plans || []).filter((p: any) => p.type === 'Hotspot'))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const [purchasedVoucher, setPurchasedVoucher] = useState<any>(null)

  async function handleBuy(planId: number) {
    const saved = localStorage.getItem('nuxbill_customer')
    const customer = saved ? JSON.parse(saved) : null

    if (!buyerInfo.name || !buyerInfo.phone) {
      alert('Tolong isi Nama dan Nomor WA kamu dulu ya!')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          plan_id: planId,
          customer_id: customer?.id || null,
          name: buyerInfo.name,
          phone: buyerInfo.phone,
          email: ''
        })
      })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyambung ke server pembayaran')
      }

      if (data.redirect_url) {
        window.location.href = data.redirect_url
      } else {
        setPurchasedVoucher({
          username: data.voucher_code || data.username,
          password: data.password || data.voucher_code
        })
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } catch (err: any) {
      alert(`Gagal: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner"></div>
      <span style={{ marginLeft: '12px' }}>Memuat paket...</span>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f1f5f9', padding: '20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Wifi color="white" size={32} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Beli Voucher Hotspot</h1>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Pilih paket WiFi Sultan yang kamu mau</p>
        </header>

        {purchasedVoucher && (
          <div className="glass-card" style={{ padding: '30px', marginBottom: '32px', textAlign: 'center', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: 'white' }}>
            <CheckCircle2 size={48} style={{ marginBottom: '16px' }} />
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px' }}>Pembelian Berhasil!</h2>
            <p style={{ fontSize: '13px', opacity: 0.9, marginBottom: '24px' }}>Gunakan detail di bawah untuk login ke WiFi</p>
            
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.3)' }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, opacity: 0.8, textTransform: 'uppercase' }}>USERNAME</div>
                <div style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '2px', fontFamily: 'monospace' }}>{purchasedVoucher.username}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, opacity: 0.8, textTransform: 'uppercase' }}>PASSWORD</div>
                <div style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '2px', fontFamily: 'monospace' }}>{purchasedVoucher.password}</div>
              </div>
            </div>
            
            <button 
              onClick={() => setPurchasedVoucher(null)}
              style={{ marginTop: '24px', background: 'white', color: '#059669', border: 'none', padding: '12px 24px', borderRadius: '50px', fontWeight: 700, fontSize: '14px' }}
            >
              BELI LAGI
            </button>
          </div>
        )}

        {locError && (
          <div style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', padding: '12px', borderRadius: '12px', marginBottom: '20px', fontSize: '13px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <AlertTriangle size={18} /> {locError}
          </div>
        )}

        <div className="glass-card" style={{ padding: '20px', marginBottom: '24px', background: 'rgba(255,255,255,0.02)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', color: '#3b82f6' }}>Data Pembeli</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px', fontWeight: 600 }}>NAMA LENGKAP</label>
              <input 
                className="form-input" 
                placeholder="Contoh: Budi Santoso" 
                value={buyerInfo.name} 
                onChange={e => setBuyerInfo({...buyerInfo, name: e.target.value})}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px', fontWeight: 600 }}>NOMOR WHATSAPP</label>
              <input 
                className="form-input" 
                placeholder="Contoh: 60123456789" 
                value={buyerInfo.phone} 
                onChange={e => setBuyerInfo({...buyerInfo, phone: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '16px' }}>
          {plans.map(plan => {
            // Hitung jarak jika koordinat router ada
            let distance = -1
            let isOutside = false
            if (userLocation && plan.routers?.coordinates) {
              const [lat, lng] = plan.routers.coordinates.split(',').map(Number)
              if (!isNaN(lat) && !isNaN(lng)) {
                distance = getDistance(userLocation.lat, userLocation.lng, lat, lng)
                // Kita set radius default 15 meter (bisa diatur)
                if (distance > 15) isOutside = true
              }
            }

            return (
              <div key={plan.id} className="glass-card" style={{ padding: '20px', border: isOutside ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{plan.name_plan}</h3>
                    <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 600 }}>{plan.bandwidths?.name_bw}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#10b981' }}>{formatCurrency(plan.price)}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Masa aktif {plan.validity} {plan.validity_unit}</div>
                  </div>
                </div>

                {distance !== -1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', marginBottom: '16px', color: isOutside ? '#f59e0b' : '#10b981' }}>
                    <MapPin size={14} /> 
                    Jarak Anda: {distance.toFixed(1)} meter 
                    {isOutside ? ' (DI LUAR RADIUS ⚠️)' : ' (Sinyal Bagus ✅)'}
                  </div>
                )}

                {isOutside && (
                  <div style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', padding: '10px', borderRadius: '8px', fontSize: '11px', marginBottom: '16px' }}>
                    ⚠️ Anda berada di luar radius jangkauan WiFi. Pastikan Anda mendekat ke pemancar sebelum membeli agar voucher bisa digunakan.
                  </div>
                )}

                <button 
                  onClick={() => handleBuy(plan.id)}
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: '12px', borderRadius: '10px' }}
                >
                  <CreditCard size={18} style={{marginRight: '8px'}} /> BELI VOUCHER
                </button>
              </div>
            )
          })}
        </div>

        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <a href="/pelanggan" style={{ color: '#64748b', fontSize: '14px', textDecoration: 'none' }}>&larr; Kembali ke Dashboard PPPoE</a>
        </div>
      </div>
    </div>
  )
}
