'use client'

import { useState, useEffect } from 'react'
import { Wifi, Zap, Shield, Globe, ArrowRight, User, CheckCircle2, Star, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function LandingPage() {
  const [plans, setPlans] = useState<any[]>([])
  const [banners, setBanners] = useState<any[]>([])
  const [news, setNews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [hasMounted, setHasMounted] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  
  useEffect(() => {
    setHasMounted(true)
  }, [])

  useEffect(() => {
    setLoading(true)
    const timestamp = new Date().getTime()
    
    Promise.all([
      fetch(`/api/public/plans?t=${timestamp}`).then(res => {
        if (!res.ok) throw new Error(`API Plans Error (${res.status})`)
        return res.json()
      }),
      fetch(`/api/public/content?t=${timestamp}`).then(res => {
        if (!res.ok) throw new Error(`API Content Error (${res.status})`)
        return res.json()
      })
    ])
    .then(([plansData, contentData]) => {
      setPlans(plansData.plans || [])
      setBanners(contentData.banners || [])
      setNews(contentData.news || [])
      setErrorMsg('')
    })
    .catch(err => {
      console.error("Gagal memuat data:", err)
      setErrorMsg(err.message || 'Gagal menyambung ke server.')
    })
    .finally(() => {
      setLoading(false)
    })
  }, [])

  // Auto-slide Banners
  useEffect(() => {
    if (banners.length <= 1) return
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % banners.length)
    }, 5000) // Ganti slide tiap 5 detik
    return () => clearInterval(interval)
  }, [banners.length])

  return (
    <div className="min-h-screen" style={{ background: '#020617', color: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <style>{`
        @media (min-width: 768px) {
          .portal-text::after { content: ' Pelanggan'; }
          .nav-link-mobile { font-size: 14px !important; }
          nav { padding: 20px 40px !important; }
        }
      `}</style>
      {/* Navbar */}
      <nav style={{ 
        padding: '12px 20px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        position: 'fixed', 
        top: 0, 
        width: '100%', 
        zIndex: 100, 
        backdropFilter: 'blur(15px)', 
        background: 'rgba(2, 6, 23, 0.7)',
        borderBottom: '1px solid rgba(255,255,255,0.05)' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wifi color="white" size={18} />
          </div>
          <span style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '-0.5px' }}>NuxBill <span style={{ color: '#3b82f6' }}>ISP</span></span>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <a href="#plans" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '12px', fontWeight: 600 }} className="nav-link-mobile">Paket</a>
          <a href="/pelanggan" style={{ 
            color: '#f8fafc', 
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)', 
            padding: '8px 16px', 
            borderRadius: '50px', 
            fontSize: '12px', 
            fontWeight: 700, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
            textDecoration: 'none'
          }}>
            <User size={14} /> <span className="portal-text">Portal</span>
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ padding: '180px 20px 100px', textAlign: 'center', background: 'radial-gradient(circle at 50% -20%, #1e3a8a 0%, #020617 70%)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 20px', background: 'rgba(59,130,246,0.1)', borderRadius: '50px', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa', fontSize: '12px', fontWeight: 700, marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          <Zap size={14} fill="#60a5fa" /> Internet Tercepat di Indonesia 🇮🇩
        </div>
        <h1 style={{ fontSize: 'clamp(40px, 8vw, 72px)', fontWeight: 900, lineHeight: 1.1, marginBottom: '24px', background: 'linear-gradient(to bottom, #fff 0%, #94a3b8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Koneksi Tanpa Batas <br/> Untuk Masa Depan.
        </h1>
        <p style={{ maxWidth: '600px', margin: '0 auto 40px', color: '#94a3b8', fontSize: '18px', lineHeight: 1.6 }}>
          Nikmati pengalaman internet super cepat, stabil, dan terjangkau dengan sistem pembayaran otomatis yang memudahkan urusan harian Anda.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
          <a href="#plans" style={{ background: '#3b82f6', color: 'white', padding: '16px 32px', borderRadius: '12px', fontWeight: 700, textDecoration: 'none', boxShadow: '0 20px 40px -10px rgba(59, 130, 246, 0.5)' }}>Lihat Paket Sekarang</a>
          <button style={{ background: 'transparent', color: 'white', padding: '16px 32px', borderRadius: '12px', fontWeight: 700, border: '1px solid rgba(255,255,255,0.1)' }}>Hubungi Kami</button>
        </div>
      </section>

      {/* Promo Banner Slider */}
      {hasMounted && banners.length > 0 && (
        <section id="promo" style={{ padding: '0 20px 100px', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ position: 'relative', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', border: '1px solid rgba(255,255,255,0.05)', aspectRatio: '21/9', background: '#0f172a' }}>
            {banners.map((b, idx) => (
              <div 
                key={b.id} 
                style={{ 
                  position: 'absolute', inset: 0, 
                  opacity: currentSlide === idx ? 1 : 0, 
                  transition: 'opacity 0.8s ease-in-out',
                  zIndex: currentSlide === idx ? 1 : 0,
                  cursor: b.link_url ? 'pointer' : 'default'
                }}
                onClick={() => b.link_url && window.open(b.link_url, '_blank')}
              >
                <img src={b.image_url} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {/* Gradient overlay for text readability if needed */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)', display: 'flex', alignItems: 'flex-end', padding: '40px' }}>
                  <h3 style={{ fontSize: '24px', fontWeight: 800, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{b.title}</h3>
                </div>
              </div>
            ))}
            
            {/* Dots */}
            {banners.length > 1 && (
              <div style={{ position: 'absolute', bottom: '20px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '8px', zIndex: 10 }}>
                {banners.map((_, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    style={{ 
                      width: currentSlide === idx ? '24px' : '8px', height: '8px', 
                      borderRadius: '4px', background: currentSlide === idx ? '#3b82f6' : 'rgba(255,255,255,0.5)',
                      border: 'none', cursor: 'pointer', transition: 'all 0.3s' 
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Features */}
      <section style={{ padding: '0 40px 100px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
          <div className="glass-card" style={{ padding: '40px', textAlign: 'left' }}>
            <div style={{ width: '50px', height: '50px', background: '#3b82f6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <Zap color="white" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>Kecepatan Ultra</h3>
            <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: 1.6 }}>Teknologi Fiber Optik terkini memastikan koneksi Anda selalu berada pada tahap kecepatan tertinggi tanpa gangguan.</p>
          </div>
          <div className="glass-card" style={{ padding: '40px', textAlign: 'left' }}>
            <div style={{ width: '50px', height: '50px', background: '#8b5cf6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <Shield color="white" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>Aman & Stabil</h3>
            <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: 1.6 }}>Perlindungan jaringan tingkat tinggi yang menjaga privasi data Anda tetap aman saat menjelajahi dunia maya.</p>
          </div>
          <div className="glass-card" style={{ padding: '40px', textAlign: 'left' }}>
            <div style={{ width: '50px', height: '50px', background: '#ec4899', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <Globe color="white" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>Pembayaran Otomatis</h3>
            <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: 1.6 }}>Sistem pembayaran yang terintegrasi memungkinkan pengaktifan segera tanpa perlu konfirmasi manual.</p>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section id="plans" style={{ padding: '100px 20px', background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '16px' }}>Pilih Paket Internet Anda</h2>
          <p style={{ color: '#94a3b8' }}>Harga transparan, tanpa biaya tersembunyi</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', maxWidth: '1200px', margin: '0 auto' }}>
          {errorMsg ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#ef4444', background: 'rgba(239,68,68,0.1)', borderRadius: '12px' }}>
              ⚠️ {errorMsg}
              <button onClick={() => window.location.reload()} style={{ display: 'block', margin: '16px auto', background: '#3b82f6', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '50px', cursor: 'pointer' }}>Coba Lagi</button>
            </div>
          ) : loading ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#475569' }}>Memuat paket terbaik untuk Anda...</div>
          ) : (
            hasMounted && plans.filter(p => p.enabled && p.is_public).map(plan => (
              <div key={plan.id} className="glass-card" style={{ padding: '40px', position: 'relative', overflow: 'hidden', transition: 'transform 0.3s ease', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ 
                  position: 'absolute', top: '20px', right: '-30px', 
                  background: plan.type === 'Hotspot' ? '#f59e0b' : '#3b82f6', 
                  color: plan.type === 'Hotspot' ? 'black' : 'white', 
                  padding: '4px 40px', fontSize: '10px', fontWeight: 800, transform: 'rotate(45deg)',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
                }}>
                  {plan.type === 'Hotspot' ? 'BAUCAR' : 'BULANAN'}
                </div>
                
                <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>{plan.name_plan}</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '24px' }}>
                  <span style={{ fontSize: '32px', fontWeight: 900, color: '#3b82f6' }}>{formatCurrency(plan.price)}</span>
                  <span style={{ color: '#64748b', fontSize: '14px' }}>/ {plan.validity === '1' ? '' : plan.validity} {
                    plan.validity_unit === 'Months' ? 'Bulan' : 
                    plan.validity_unit === 'Days' ? 'Hari' : 
                    plan.validity_unit === 'Hours' ? 'Jam' : plan.validity_unit
                  }</span>
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'grid', gap: '12px' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#cbd5e1' }}>
                    <CheckCircle2 size={16} color="#10b981" /> Kecepatan hingga {plan.bandwidths?.rate_down}{plan.bandwidths?.rate_down_unit}
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#cbd5e1' }}>
                    <CheckCircle2 size={16} color="#10b981" /> Kuota {plan.typebp || 'Tanpa Batas'}
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#cbd5e1' }}>
                    <CheckCircle2 size={16} color="#10b981" /> Dukungan 24/7
                  </li>
                </ul>

                <button 
                  onClick={() => window.location.href = '/beli'}
                  style={{ width: '100%', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'white', fontWeight: 700, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'all 0.3s' }}
                >
                  Pilih Paket
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* News / Info Section */}
      {hasMounted && news.length > 0 && (
        <section style={{ padding: '100px 20px', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '16px' }}>Berita & Pengumuman</h2>
            <p style={{ color: '#94a3b8' }}>Info terkini seputar layanan dan gangguan jaringan</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {news.map(n => (
              <div key={n.id} className="glass-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>
                {n.image_url && (
                  <div style={{ width: '100%', height: '200px', background: `url(${n.image_url}) center/cover` }} />
                )}
                <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '12px', marginBottom: '12px', fontWeight: 600 }}>
                    <Calendar size={14} /> {new Date(n.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px', color: '#f8fafc' }}>{n.title}</h3>
                  <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6, flex: 1 }}>
                    {n.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer style={{ padding: '80px 40px 40px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', marginBottom: '16px' }}>
            <div style={{ width: '32px', height: '32px', background: '#3b82f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wifi color="white" size={16} />
            </div>
            <span style={{ fontSize: '18px', fontWeight: 800 }}>NuxBill <span style={{ color: '#3b82f6' }}>ISP</span></span>
          </div>
          <p style={{ color: '#64748b', fontSize: '14px' }}>&copy; 2026 NuxBill Indonesia. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
