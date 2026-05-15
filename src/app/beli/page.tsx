'use client'

import { useState, useEffect } from 'react'
import { Wifi, MapPin, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function BeliVoucher() {
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const [locError, setLocError] = useState('')
  const [buyerInfo, setBuyerInfo] = useState({ name: '', phone: '' })
  const [purchasedVoucher, setPurchasedVoucher] = useState<any>(null)

  function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3
    const φ1 = lat1 * Math.PI/180
    const φ2 = lat2 * Math.PI/180
    const Δφ = (lat2-lat1) * Math.PI/180
    const Δλ = (lon2-lon1) * Math.PI/180
    const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  }

  useEffect(() => {
    const saved = localStorage.getItem('nuxbill_customer')
    if (saved) {
      const c = JSON.parse(saved)
      setBuyerInfo({ name: c.fullname, phone: c.phonenumber })
    }
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => { setLocError('Gagal mendapatkan lokasi. Pastikan GPS aktif.'); console.error(err) }
      )
    }
    fetch(`/api/public/plans?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => { setPlans((data.plans || []).filter((p: any) => p.type === 'Hotspot')); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handleBuy(planId: number) {
    const saved = localStorage.getItem('nuxbill_customer')
    const customer = saved ? JSON.parse(saved) : null
    if (!buyerInfo.name || !buyerInfo.phone) {
      alert('Tolong isi Nama dan Nombor WA anda dahulu ya!')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: planId, customer_id: customer?.id || null, name: buyerInfo.name, phone: buyerInfo.phone, email: '' })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal menyambung ke pelayan pembayaran')
      if (data.redirect_url) {
        window.location.href = data.redirect_url
      } else {
        setPurchasedVoucher({ username: data.voucher_code || data.username, password: data.password || data.voucher_code })
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } catch (err: any) {
      alert(`Gagal: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Nunito", system-ui, sans-serif' }}>
      <div style={{ color: '#16a34a', fontSize: '22px', fontWeight: 800 }}>Sedang Memuatkan... 🌿</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f0fdf4', color: '#14532d', padding: '40px 20px', fontFamily: '"Nunito", system-ui, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;800;900&display=swap');

        .kid-card {
          background: white;
          border-radius: 28px;
          box-shadow: 0 8px 20px rgba(22,163,74,0.12);
          border: 3px solid #bbf7d0;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .kid-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 14px 28px rgba(22,163,74,0.2);
          border-color: #16a34a;
        }

        .bubbly-button {
          transition: all 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          cursor: pointer;
        }
        .bubbly-button:hover { transform: scale(1.02); }
        .bubbly-button:active { transform: scale(0.96); }

        .form-input-kid {
          width: 100%;
          padding: 14px 20px;
          border-radius: 50px;
          border: 3px solid #bbf7d0;
          background: #f0fdf4;
          font-size: 15px;
          font-family: inherit;
          font-weight: 600;
          color: #14532d;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
          box-sizing: border-box;
        }
        .form-input-kid:focus {
          border-color: #16a34a;
          background: white;
        }
      `}</style>

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>

        {/* Header */}
        <header style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ width: '76px', height: '76px', background: '#16a34a', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 6px 0 #15803d' }}>
            <Wifi color="white" size={38} strokeWidth={3} />
          </div>
          <h1 style={{ fontSize: '30px', fontWeight: 900, color: '#15803d' }}>Beli Baucar Internet 🚀</h1>
          <p style={{ color: '#166534', fontSize: '16px', fontWeight: 600 }}>Pilih pakej WiFi menarik yang anda mahu!</p>
        </header>

        {/* Success Voucher */}
        {purchasedVoucher && (
          <div className="kid-card" style={{ padding: '30px', marginBottom: '32px', textAlign: 'center', background: '#f0fdf4', border: '3px solid #86efac' }}>
            <div style={{ background: '#16a34a', width: '58px', height: '58px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 4px 0 #15803d' }}>
              <CheckCircle2 color="white" size={32} strokeWidth={3} />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#166534', marginBottom: '6px' }}>Yey! Pembelian Berjaya! 🎉</h2>
            <p style={{ fontSize: '15px', color: '#166534', fontWeight: 600, marginBottom: '22px' }}>Gunakan kod di bawah ini untuk online</p>
            <div style={{ background: 'white', padding: '22px', borderRadius: '20px', border: '2px dashed #86efac', marginBottom: '20px' }}>
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 900, color: '#166534', textTransform: 'uppercase', letterSpacing: '1px' }}>Username</div>
                <div style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '2px', color: '#14532d' }}>{purchasedVoucher.username}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 900, color: '#166534', textTransform: 'uppercase', letterSpacing: '1px' }}>Password</div>
                <div style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '2px', color: '#14532d' }}>{purchasedVoucher.password}</div>
              </div>
            </div>
            <button className="bubbly-button" onClick={() => setPurchasedVoucher(null)}
              style={{ background: '#ea580c', color: 'white', border: 'none', padding: '14px 32px', borderRadius: '50px', fontWeight: 900, fontSize: '15px', boxShadow: '0 4px 0 #c2410c' }}>
              Beli Lagi! 🛒
            </button>
          </div>
        )}

        {/* Location Error */}
        {locError && (
          <div className="kid-card" style={{ background: '#fee2e2', border: '3px solid #fca5a5', padding: '14px 18px', marginBottom: '22px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ background: '#ef4444', padding: '7px', borderRadius: '50%', flexShrink: 0 }}><AlertTriangle color="white" size={18} /></div>
            <div style={{ color: '#b91c1c', fontWeight: 700, fontSize: '14px' }}>{locError}</div>
          </div>
        )}

        {/* Buyer Info */}
        <div className="kid-card" style={{ padding: '28px', marginBottom: '28px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '18px', color: '#16a34a' }}>Data Peribadi Anda 📝</h3>
          <div style={{ display: 'grid', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#166534', marginBottom: '7px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nama Penuh</label>
              <input className="form-input-kid" placeholder="Contoh: Ali bin Abu" value={buyerInfo.name} onChange={e => setBuyerInfo({...buyerInfo, name: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#166534', marginBottom: '7px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nombor WhatsApp</label>
              <input className="form-input-kid" placeholder="Contoh: 0123456789" value={buyerInfo.phone} onChange={e => setBuyerInfo({...buyerInfo, phone: e.target.value})} />
            </div>
          </div>
        </div>

        {/* Plans */}
        <div style={{ display: 'grid', gap: '18px' }}>
          {plans.map((plan, idx) => {
            let distance = -1, isOutside = false
            if (userLocation && plan.routers?.coordinates) {
              const [lat, lng] = plan.routers.coordinates.split(',').map(Number)
              if (!isNaN(lat) && !isNaN(lng)) {
                distance = getDistance(userLocation.lat, userLocation.lng, lat, lng)
                if (distance > 15) isOutside = true
              }
            }

            const accents = [
              { topBg: '#f0fdf4', topBorder: '#bbf7d0', priceColor: '#15803d', btn: '#16a34a', btnShadow: '#15803d' },
              { topBg: '#fff7ed', topBorder: '#fdba74', priceColor: '#c2410c', btn: '#ea580c', btnShadow: '#c2410c' },
              { topBg: '#dcfce7', topBorder: '#86efac', priceColor: '#166534', btn: '#15803d', btnShadow: '#14532d' },
            ]
            const ac = accents[idx % accents.length]

            return (
              <div key={plan.id} className="kid-card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '22px 24px', background: ac.topBg, borderBottom: `3px dashed ${ac.topBorder}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#14532d', marginBottom: '4px' }}>{plan.name_plan}</h3>
                      <div style={{ fontSize: '13px', color: '#166534', fontWeight: 700 }}>{plan.bandwidths?.name_bw}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '22px', fontWeight: 900, color: ac.priceColor }}>{formatCurrency(plan.price)}</div>
                      <div style={{ fontSize: '12px', color: '#166534', fontWeight: 700 }}>
                        {plan.validity} {plan.validity_unit === 'Months' ? 'Bulan' : plan.validity_unit === 'Days' ? 'Hari' : plan.validity_unit === 'Hours' ? 'Jam' : plan.validity_unit}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '20px 24px' }}>
                  {distance !== -1 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', marginBottom: '14px', fontWeight: 700, color: isOutside ? '#ef4444' : '#16a34a' }}>
                      <MapPin size={15} strokeWidth={3} />
                      Jarak Anda: {distance.toFixed(1)} meter {isOutside ? '(TERLALU JAUH ⚠️)' : '(Isyarat Kuat ✅)'}
                    </div>
                  )}
                  {isOutside && (
                    <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: '14px', fontSize: '13px', fontWeight: 600, marginBottom: '16px', border: '2px dashed #fca5a5' }}>
                      Alamak! Anda berada jauh dari WiFi. Sila dekatkan diri dahulu supaya baucar boleh digunakan! 🏃‍♂️
                    </div>
                  )}
                  <button
                    onClick={() => handleBuy(plan.id)}
                    className="bubbly-button"
                    style={{ width: '100%', padding: '14px', borderRadius: '50px', background: ac.btn, color: 'white', fontSize: '16px', fontWeight: 900, border: 'none', boxShadow: `0 5px 0 ${ac.btnShadow}` }}
                  >
                    Beli Baucar Sekarang! 💳
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Back link */}
        <div style={{ marginTop: '40px', textAlign: 'center' }}>
          <a href="/pelanggan" style={{ color: '#16a34a', fontSize: '15px', fontWeight: 800, textDecoration: 'none', background: 'white', padding: '12px 24px', borderRadius: '50px', display: 'inline-block', border: '3px solid #bbf7d0' }}>
            &larr; Kembali ke Papan Pemuka
          </a>
        </div>

      </div>
    </div>
  )
}
