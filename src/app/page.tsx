'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Wifi, Zap, User, CheckCircle2, Calendar, Home, Package, Ticket } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function LandingPage() {
  const router = useRouter()
  const [plans, setPlans] = useState<any[]>([])
  const [banners, setBanners] = useState<any[]>([])
  const [news, setNews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [hasMounted, setHasMounted] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [selectedNews, setSelectedNews] = useState<any | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const timestamp = new Date().getTime()

      const fetchWithTimeout = (url: string, ms = 5000) => {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), ms)
        return fetch(url, { signal: controller.signal, cache: 'no-store' })
          .then(res => { clearTimeout(timer); return res })
          .catch(err => { clearTimeout(timer); throw err })
      }

      const [plansResult, contentResult] = await Promise.allSettled([
        fetchWithTimeout(`/api/public/plans?t=${timestamp}`)
          .then(res => res.ok ? res.json() : Promise.reject(`Plans API ${res.status}`)),
        fetchWithTimeout(`/api/public/content?t=${timestamp}`)
          .then(res => res.ok ? res.json() : Promise.reject(`Content API ${res.status}`)),
      ])

      if (plansResult.status === 'fulfilled') {
        setPlans(plansResult.value.plans || [])
      } else {
        console.error('Plans gagal:', plansResult.reason)
        setErrorMsg('Gagal memuatkan senarai pakej.')
      }
      if (contentResult.status === 'fulfilled') {
        setBanners(contentResult.value.banners || [])
        setNews(contentResult.value.news || [])
      } else {
        console.warn('Content gagal (non-kritikal):', contentResult.reason)
      }
    } catch (err) {
      console.error('fetchData error:', err)
      setErrorMsg('Ralat tidak dijangka. Sila muat semula.')
    } finally {
      // ALWAYS clear loading, no matter what
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setHasMounted(true)
  }, [])

  // Fetch on mount
  useEffect(() => {
    fetchData()
  }, [])

  // Fix bfcache: when user presses Back, force a full page reload
  // This is the most reliable cross-browser solution for Next.js App Router
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        // Page restored from bfcache — force reload to re-run effects
        router.refresh()
        fetchData()
      }
    }
    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [fetchData, router])

  useEffect(() => {
    if (banners.length <= 1) return
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % banners.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [banners.length])

  // Palette
  // Green base: #f0fdf4 (bg), #16a34a (primary), #166534 (dark)
  // Orange accent: #ea580c (accent), #fed7aa (light orange)

  return (
    <div style={{ background: '#f0fdf4', color: '#14532d', fontFamily: '"Nunito", system-ui, sans-serif', minHeight: '100vh' }}>

      {/* ── FULL PAGE LOADING SCREEN ── */}
      {loading && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'linear-gradient(160deg, #14532d 0%, #15803d 50%, #4ade80 100%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: '24px'
        }}>
          <style>{`
            @keyframes spin { to { transform: rotate(360deg); } }
            @keyframes pulse-scale {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.08); }
            }
            @keyframes fade-in {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          {/* Mascot */}
          <div style={{ animation: 'pulse-scale 1.6s ease-in-out infinite' }}>
            <img src="/mascot.png" alt="Loading..." style={{ width: '160px', filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.3))' }} />
          </div>

          {/* Brand */}
          <div style={{ textAlign: 'center', animation: 'fade-in 0.5s ease' }}>
            <div style={{ fontSize: '32px', fontWeight: 900, color: 'white', letterSpacing: '-0.5px' }}>
              Purnama <span style={{ color: '#fbbf24' }}>WiFi</span>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '16px', fontWeight: 600, marginTop: '4px' }}>
              Sedang menyediakan pakej untuk anda...
            </div>
          </div>

          {/* Spinner bar */}
          <div style={{ width: '200px', height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: '40%', background: '#fbbf24',
              borderRadius: '10px', animation: 'spin 1s linear infinite',
              animationName: 'loading-bar'
            }} />
          </div>
          <style>{`
            @keyframes loading-bar {
              0%   { margin-left: -40%; }
              100% { margin-left: 100%; }
            }
            div[data-bar] { animation: loading-bar 1s ease-in-out infinite; }
          `}</style>
          <div style={{ width: '200px', height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '45%', background: '#fbbf24', borderRadius: '10px', animation: 'loading-bar 1s ease-in-out infinite' }} />
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;800;900&display=swap');
        body { margin: 0; }

        .bubbly-button {
          transition: all 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          cursor: pointer;
        }
        .bubbly-button:hover { transform: scale(1.05); }
        .bubbly-button:active { transform: scale(0.97); }

        .float-anim {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-14px); }
        }

        .plan-card {
          background: white;
          border-radius: 28px;
          border: 3px solid #bbf7d0;
          box-shadow: 0 8px 20px rgba(22,163,74,0.12);
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          overflow: hidden;
        }
        .plan-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 18px 32px rgba(22,163,74,0.2);
          border-color: #16a34a;
        }

        .news-card {
          background: white;
          border-radius: 24px;
          border: 3px solid #bbf7d0;
          box-shadow: 0 6px 16px rgba(22,163,74,0.1);
          overflow: hidden;
          transition: all 0.3s ease;
        }
        .news-card:hover {
          transform: translateY(-5px);
          border-color: #16a34a;
        }

        .cloud {
          position: absolute;
          background: white;
          border-radius: 100px;
          opacity: 0.6;
          z-index: 0;
        }

        /* ── NAVBAR DESKTOP LINKS ── */
        .nav-desktop-links {
          display: flex;
          gap: 14px;
          align-items: center;
        }
        @media (max-width: 640px) {
          .nav-desktop-links { display: none; }
          .nav-portal-btn { display: flex !important; }
        }

        /* ── BOTTOM NAV MOBILE ── */
        .bottom-nav {
          display: none;
        }
        @media (max-width: 640px) {
          .bottom-nav {
            display: flex;
          }
          /* Extra padding so content isn't hidden behind bottom nav */
          body { padding-bottom: 80px; }
        }

        .bottom-nav-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 8px 4px;
          text-decoration: none;
          color: #15803d;
          font-weight: 800;
          font-size: 10px;
          border-radius: 16px;
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
        }
        .bottom-nav-item:active { transform: scale(0.9); }
        .bottom-nav-item.active {
          color: #16a34a;
          background: #dcfce7;
        }
        .bottom-nav-item.active svg {
          filter: drop-shadow(0 2px 4px rgba(22,163,74,0.3));
        }
        .bottom-nav-item-portal {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 8px 4px;
          text-decoration: none;
          color: white;
          font-weight: 800;
          font-size: 10px;
          border-radius: 16px;
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          background: #ea580c;
          box-shadow: 0 4px 0 #c2410c;
          margin: 8px 4px;
        }
        .bottom-nav-item-portal:active { transform: scale(0.9); box-shadow: 0 2px 0 #c2410c; }

        @keyframes bottom-nav-in {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      {/* Floating clouds */}
      <div className="cloud" style={{ width: '140px', height: '45px', top: '12%', left: '4%' }} />
      <div className="cloud" style={{ width: '190px', height: '55px', top: '22%', right: '8%' }} />
      <div className="cloud" style={{ width: '110px', height: '38px', top: '6%', right: '38%' }} />

      {/* ── NAVBAR ── */}
      <nav style={{
        padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'fixed', top: 0, width: '100%', zIndex: 100,
        background: 'rgba(240,253,244,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '3px solid #bbf7d0', boxShadow: '0 2px 12px rgba(22,163,74,0.08)',
        boxSizing: 'border-box'
      }}>
        {/* Logo */}
        <span style={{ fontSize: '22px', fontWeight: 900, color: '#16a34a', letterSpacing: '-0.5px', whiteSpace: 'nowrap' }}>
          Purnama <span style={{ color: '#ea580c' }}>WiFi</span>
        </span>

        {/* Desktop Links — hidden on mobile via CSS */}
        <div className="nav-desktop-links">
          <a href="https://purnamawifi.net/purnamawifi.apk" target="_blank" rel="noopener noreferrer" className="bubbly-button" style={{ color: '#166534', fontWeight: 800, fontSize: '15px', textDecoration: 'none' }}>
            Download APK
          </a>
          <a href="#plans" className="bubbly-button" style={{ color: '#166534', fontWeight: 800, fontSize: '15px', textDecoration: 'none' }}>
            Pakej
          </a>
          <a href="/pelanggan" className="bubbly-button" style={{
            background: '#ea580c', color: 'white', padding: '10px 22px', borderRadius: '50px',
            fontSize: '14px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: '0 4px 0 #c2410c', textDecoration: 'none'
          }}>
            <User size={16} strokeWidth={3} /> Portal
          </a>
        </div>

        {/* Mobile: only show Portal button */}
        <a
          href="/pelanggan"
          className="bubbly-button nav-portal-btn"
          style={{
            display: 'none', // shown via CSS on mobile
            background: '#ea580c', color: 'white', padding: '9px 18px', borderRadius: '50px',
            fontSize: '13px', fontWeight: 800, alignItems: 'center', gap: '6px',
            boxShadow: '0 3px 0 #c2410c', textDecoration: 'none', whiteSpace: 'nowrap'
          }}
        >
          <User size={14} strokeWidth={3} /> Portal
        </a>
      </nav>

      {/* ── BOTTOM NAVIGATION (Mobile Only) ── */}
      <nav
        className="bottom-nav"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
          background: 'rgba(240,253,244,0.96)', backdropFilter: 'blur(16px)',
          borderTop: '3px solid #bbf7d0',
          boxShadow: '0 -4px 20px rgba(22,163,74,0.15)',
          padding: '4px 8px',
          paddingBottom: 'calc(4px + env(safe-area-inset-bottom))',
          animation: 'bottom-nav-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <a href="/" className="bottom-nav-item active">
          <Home size={22} strokeWidth={2.5} color="#16a34a" />
          Utama
        </a>
        <a href="#plans" className="bottom-nav-item">
          <Package size={22} strokeWidth={2.5} color="#15803d" />
          Pakej
        </a>
        <a href="/beli" className="bottom-nav-item">
          <Ticket size={22} strokeWidth={2.5} color="#15803d" />
          Baucar
        </a>
        <a href="/pelanggan" className="bottom-nav-item-portal">
          <User size={20} strokeWidth={2.5} />
          Portal
        </a>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        padding: '140px 40px 100px', position: 'relative', zIndex: 10,
        background: 'linear-gradient(160deg, #14532d 0%, #15803d 40%, #16a34a 70%, #4ade80 100%)',
        borderRadius: '0 0 60px 60px',
        boxShadow: '0 12px 40px rgba(21,128,61,0.3)',
        overflow: 'hidden'
      }}>
        {/* Subtle overlay circles */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: '0 0 60px 60px', zIndex: 0 }}>
          <div style={{ position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', top: '-150px', right: '-100px' }} />
          <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', bottom: '-80px', left: '-60px' }} />
          <div style={{ position: 'absolute', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(234,88,12,0.15)', top: '30%', left: '10%' }} />
        </div>

        <div style={{
          maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '40px', flexWrap: 'wrap'
        }}>
          {/* Left: Text */}
          <div style={{ flex: '1 1 420px', textAlign: 'left' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '8px 20px', background: 'rgba(255,255,255,0.15)', borderRadius: '50px',
              border: '2px solid rgba(255,255,255,0.3)', color: 'white', fontSize: '14px', fontWeight: 800,
              marginBottom: '28px', textTransform: 'uppercase', letterSpacing: '0.5px',
              backdropFilter: 'blur(8px)'
            }}>
              <Zap size={16} fill="white" color="white" /> Internet Pantas & Menyeronokkan 🚀
            </div>

            <h1 style={{
              fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 900, lineHeight: 1.1,
              marginBottom: '20px', color: 'white',
              textShadow: '0 2px 12px rgba(0,0,0,0.15)'
            }}>
              Sambungan Internet<br/>
              <span style={{ color: '#fbbf24' }}>Paling Hebat!</span>
            </h1>

            <p style={{ maxWidth: '480px', margin: '0 0 40px', color: 'rgba(255,255,255,0.85)', fontSize: '18px', lineHeight: 1.7, fontWeight: 600 }}>
              Streaming, gaming, belajar — semuanya lancar tanpa gangguan. Jom pilih pakej terbaik untuk anda!
            </p>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <a href="#plans" className="bubbly-button" style={{
                display: 'inline-block', background: '#ea580c', color: 'white',
                padding: '16px 40px', borderRadius: '50px', fontSize: '18px', fontWeight: 900,
                textDecoration: 'none', boxShadow: '0 6px 0 #c2410c'
              }}>
                Lihat Pakej 🎁
              </a>
              <a href="/beli" className="bubbly-button" style={{
                display: 'inline-block', background: 'rgba(255,255,255,0.2)', color: 'white',
                padding: '16px 32px', borderRadius: '50px', fontSize: '18px', fontWeight: 900,
                textDecoration: 'none', boxShadow: '0 6px 0 rgba(0,0,0,0.15)',
                border: '2px solid rgba(255,255,255,0.4)', backdropFilter: 'blur(8px)'
              }}>
                Beli Baucar 🎫
              </a>
            </div>
          </div>

          {/* Right: Mascot */}
          <div style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-end' }}>
            <div className="float-anim" style={{ position: 'relative' }}>
              {/* Glow ring behind mascot */}
              <div style={{
                position: 'absolute', bottom: '0', left: '50%', transform: 'translateX(-50%)',
                width: '260px', height: '40px', borderRadius: '50%',
                background: 'rgba(0,0,0,0.2)', filter: 'blur(16px)', zIndex: 0
              }} />
              <img
                src="/mascot.png"
                alt="Purnama WiFi Mascot"
                style={{
                  width: '340px', maxWidth: '90vw',
                  filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.4))',
                  position: 'relative', zIndex: 1
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA DOWNLOAD APP ── */}
      <section style={{ padding: '60px 20px', textAlign: 'center', position: 'relative', zIndex: 10 }}>
        <div style={{
          background: 'white', maxWidth: '900px', margin: '0 auto',
          borderRadius: '32px', padding: '40px',
          border: '4px solid #bbf7d0', boxShadow: '0 10px 30px rgba(22,163,74,0.15)'
        }}>
          <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#15803d', marginBottom: '12px' }}>
            Aplikasi Purnama WiFi Kini Tersedia! 📱
          </h2>
          <p style={{ color: '#166534', fontSize: '18px', fontWeight: 600, marginBottom: '28px', maxWidth: '600px', margin: '0 auto 28px' }}>
            Dapatkan pengalaman internet yang lebih lancar, pantau langganan anda, dan urus profil dengan mudah melalui aplikasi Android rasmi kami.
          </p>
          <a href="https://purnamawifi.net/purnamawifi.apk" target="_blank" rel="noopener noreferrer" className="bubbly-button" style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            background: '#16a34a', color: 'white', padding: '16px 36px',
            borderRadius: '50px', fontSize: '18px', fontWeight: 900,
            textDecoration: 'none', boxShadow: '0 6px 0 #15803d'
          }}>
            Download APK Sekarang 🚀
          </a>
        </div>
      </section>

      {/* ── BANNER SLIDER ── */}
      {hasMounted && banners.length > 0 && (
        <section style={{ padding: '0 20px 80px', maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
          <div style={{
            position: 'relative', borderRadius: '28px', overflow: 'hidden',
            boxShadow: '0 16px 36px rgba(0,0,0,0.1)', border: '5px solid white',
            aspectRatio: '21/9', background: '#dcfce7'
          }}>
            {banners.map((b, idx) => (
              <div key={b.id} style={{
                position: 'absolute', inset: 0,
                opacity: currentSlide === idx ? 1 : 0,
                transition: 'opacity 0.5s ease-in-out',
                zIndex: currentSlide === idx ? 1 : 0,
                cursor: b.link_url ? 'pointer' : 'default'
              }} onClick={() => b.link_url && window.open(b.link_url, '_blank')}>
                <img src={b.image_url} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'linear-gradient(to top, rgba(240,253,244,0.92) 0%, transparent 100%)',
                  padding: '28px'
                }}>
                  <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#15803d' }}>{b.title}</h3>
                </div>
              </div>
            ))}
            {banners.length > 1 && (
              <div style={{ position: 'absolute', bottom: '14px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '8px', zIndex: 10 }}>
                {banners.map((_, idx) => (
                  <button key={idx} onClick={() => setCurrentSlide(idx)} style={{
                    width: currentSlide === idx ? '28px' : '10px', height: '10px',
                    borderRadius: '10px', background: currentSlide === idx ? '#ea580c' : 'rgba(0,0,0,0.2)',
                    border: '2px solid white', cursor: 'pointer', transition: 'all 0.3s'
                  }} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── PLANS ── */}
      <section id="plans" style={{ padding: '80px 20px', background: 'white', borderTop: '4px solid #dcfce7', borderBottom: '4px solid #dcfce7' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <h2 style={{ fontSize: '38px', fontWeight: 900, color: '#15803d', marginBottom: '12px' }}>
            Pilih Pakej Anda 🎉
          </h2>
          <p style={{ color: '#166534', fontSize: '17px', fontWeight: 600 }}>Harga berpatutan, kelajuan tinggi</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '28px', maxWidth: '1100px', margin: '0 auto' }}>
          {errorMsg ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#b91c1c', background: '#fee2e2', borderRadius: '24px', border: '3px solid #fca5a5' }}>
              <h3 style={{ fontWeight: 800, fontSize: '22px' }}>Alamak, Ada Ralat! 😭</h3>
              <p style={{ fontWeight: 600 }}>{errorMsg}</p>
              <button className="bubbly-button" onClick={() => window.location.reload()} style={{ marginTop: '20px', background: '#b91c1c', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '50px', fontWeight: 800, fontSize: '15px', boxShadow: '0 4px 0 #991b1b' }}>Cuba Semula</button>
            </div>
          ) : loading ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: '#16a34a', fontSize: '22px', fontWeight: 800 }} className="float-anim">
              Sedang Memuatkan... 🌿
            </div>
          ) : (
            hasMounted && plans.filter(p => p.enabled && p.is_public).map((plan, idx) => {
              const accentList = [
                { top: '#dcfce7', topBorder: '#86efac', badge: '#16a34a', badgeShadow: '#15803d', btn: '#16a34a', btnShadow: '#15803d' },
                { top: '#fff7ed', topBorder: '#fdba74', badge: '#ea580c', badgeShadow: '#c2410c', btn: '#ea580c', btnShadow: '#c2410c' },
                { top: '#f0fdf4', topBorder: '#bbf7d0', badge: '#166534', badgeShadow: '#14532d', btn: '#166534', btnShadow: '#14532d' },
              ]
              const a = accentList[idx % accentList.length]

              return (
                <div key={plan.id} className="plan-card bubbly-button">
                  {/* Card top */}
                  <div style={{ padding: '28px', background: a.top, borderBottom: `3px dashed ${a.topBorder}` }}>
                    <div style={{
                      display: 'inline-block', background: a.badge, color: 'white',
                      padding: '6px 18px', fontSize: '13px', fontWeight: 900,
                      borderRadius: '50px', boxShadow: `0 3px 0 ${a.badgeShadow}`, marginBottom: '14px'
                    }}>
                      {plan.type === 'Hotspot' ? '🔥 BAUCAR HOTSPOT' : '📅 PAKEJ BULANAN'}
                    </div>
                    <h3 style={{ fontSize: '26px', fontWeight: 900, color: '#14532d', marginBottom: '6px' }}>{plan.name_plan}</h3>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                      <span style={{ fontSize: '32px', fontWeight: 900, color: a.badge }}>{formatCurrency(plan.price)}</span>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#166534' }}>/ {
                        plan.validity_unit === 'Months' ? `${plan.validity} Bulan` :
                        plan.validity_unit === 'Days' ? `${plan.validity} Hari` :
                        plan.validity_unit === 'Hours' ? `${plan.validity} Jam` : plan.validity_unit
                      }</span>
                    </div>
                  </div>
                  {/* Card bottom */}
                  <div style={{ padding: '28px' }}>
                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'grid', gap: '14px' }}>
                      {[
                        `Kelajuan ${plan.bandwidths?.rate_down ?? '?'}${plan.bandwidths?.rate_down_unit ?? ''}`,
                        `Kuota ${plan.typebp || 'Tanpa Had'}`,
                        'Aktif 24/7'
                      ].map(txt => (
                        <li key={txt} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', color: '#166534', fontWeight: 700 }}>
                          <div style={{ background: '#dcfce7', padding: '5px', borderRadius: '50px', flexShrink: 0 }}>
                            <CheckCircle2 size={18} color="#16a34a" strokeWidth={3} />
                          </div>
                          {txt}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => window.location.href = '/beli'}
                      className="bubbly-button"
                      style={{ width: '100%', padding: '15px', borderRadius: '50px', background: a.btn, color: 'white', fontSize: '17px', fontWeight: 900, border: 'none', boxShadow: `0 5px 0 ${a.btnShadow}` }}
                    >
                      Pilih Pakej Ini! 👆
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </section>

      {/* ── NEWS ── */}
      {hasMounted && news.length > 0 && (
        <section style={{ padding: '80px 20px', maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '52px' }}>
            <h2 style={{ fontSize: '38px', fontWeight: 900, color: '#ea580c', marginBottom: '12px' }}>Berita & Pengumuman 📣</h2>
            <p style={{ color: '#166534', fontSize: '17px', fontWeight: 600 }}>Info terkini untuk anda</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '28px' }}>
            {news.map(n => (
              <div
                key={n.id}
                className="news-card bubbly-button"
                style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
                onClick={() => setSelectedNews(n)}
              >
                {n.image_url && <div style={{ height: '190px', background: `url(${n.image_url}) center/cover`, borderBottom: '3px solid #bbf7d0' }} />}
                <div style={{ padding: '28px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: '#16a34a', fontSize: '13px', fontWeight: 800, background: '#f0fdf4', padding: '5px 12px', borderRadius: '50px', width: 'fit-content', marginBottom: '14px', border: '2px solid #bbf7d0' }}>
                    <Calendar size={14} strokeWidth={3} />
                    {new Date(n.created_at).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#14532d', marginBottom: '12px' }}>{n.title}</h3>
                  <p style={{ color: '#166534', fontSize: '15px', lineHeight: 1.65, fontWeight: 600, flex: 1 }}>
                    {n.content.length > 100 ? n.content.substring(0, 100) + '...' : n.content}
                  </p>
                  <div style={{ marginTop: '16px', color: '#ea580c', fontWeight: 900, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Baca Selengkapnya <span style={{ transition: 'transform 0.2s' }}>➔</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── FOOTER ── */}
      <footer style={{
        padding: '70px 40px 36px', marginTop: '60px',
        background: '#15803d', borderTop: '6px solid #16a34a',
        borderRadius: '40px 40px 0 0', textAlign: 'center', color: 'white'
      }}>
        <div className="float-anim" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ width: '48px', height: '48px', background: 'white', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 0 #bbf7d0' }}>
            <Wifi color="#16a34a" size={26} strokeWidth={3} />
          </div>
          <span style={{ fontSize: '26px', fontWeight: 900 }}>Purnama <span style={{ color: '#fdba74' }}>WiFi</span></span>
        </div>
        <p style={{ color: '#bbf7d0', fontSize: '15px', fontWeight: 600 }}>
          &copy; 2026 Purnama WiFi Malaysia. Jadikan Internet Lebih Menyeronokkan!
        </p>
      </footer>

      {/* ── NEWS DETAIL MODAL ── */}
      {selectedNews && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'rgba(20,83,45,0.4)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }} onClick={() => setSelectedNews(null)}>
          <div style={{
            background: 'white', borderRadius: '32px', border: '4px solid #bbf7d0',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)', width: '100%', maxWidth: '640px',
            maxHeight: '85vh', overflowY: 'auto', display: 'flex', flexDirection: 'column',
            animation: 'scale-up 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            boxSizing: 'border-box'
          }} onClick={e => e.stopPropagation()}>
            <style>{`
              @keyframes scale-up {
                from { transform: scale(0.9); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
              }
            `}</style>

            {/* Modal Header/Image */}
            {selectedNews.image_url && (
              <div style={{ height: '260px', background: `url(${selectedNews.image_url}) center/cover`, borderBottom: '4px solid #bbf7d0', position: 'relative' }}>
                <button onClick={() => setSelectedNews(null)} style={{
                  position: 'absolute', top: '16px', right: '16px',
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'white', border: '3px solid #bbf7d0', color: '#16a34a',
                  fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 3px 0 #bbf7d0'
                }}>×</button>
              </div>
            )}

            {/* Modal Body */}
            <div style={{ padding: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: '#16a34a', fontSize: '13px', fontWeight: 800, background: '#f0fdf4', padding: '5px 12px', borderRadius: '50px', border: '2px solid #bbf7d0' }}>
                  <Calendar size={14} strokeWidth={3} />
                  {new Date(selectedNews.created_at).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                {!selectedNews.image_url && (
                  <button onClick={() => setSelectedNews(null)} style={{
                    marginLeft: 'auto', width: '32px', height: '32px', borderRadius: '50%',
                    background: '#f0fdf4', border: '2px solid #bbf7d0', color: '#16a34a',
                    fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>×</button>
                )}
              </div>

              <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#14532d', marginBottom: '16px', lineHeight: 1.2 }}>{selectedNews.title}</h2>
              
              <div style={{ 
                color: '#166534', fontSize: '16px', lineHeight: 1.8, fontWeight: 600, 
                whiteSpace: 'pre-line', maxHeight: '30vh', overflowY: 'auto', paddingRight: '8px'
              }}>
                {selectedNews.content}
              </div>

              <button
                onClick={() => setSelectedNews(null)}
                className="bubbly-button"
                style={{
                  marginTop: '28px', width: '100%', padding: '14px', borderRadius: '50px',
                  background: '#16a34a', color: 'white', fontSize: '16px', fontWeight: 900,
                  border: 'none', boxShadow: '0 4px 0 #15803d'
                }}
              >
                Tutup Mesej
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
