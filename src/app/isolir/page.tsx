'use client'

import { Activity, CreditCard, ShieldAlert, MessageCircle, ArrowRight, RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function IsolirPage() {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) return null

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'radial-gradient(circle at top right, #fff1f2, #f0fdf4)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ 
        maxWidth: '480px', width: '100%', 
        background: 'white', borderRadius: '32px', 
        padding: '40px', textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08)',
        border: '1px solid #fee2e2'
      }}>
        {/* Animated Icon Container */}
        <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 24px' }}>
          <div style={{ 
            position: 'absolute', inset: 0, 
            background: '#ef4444', opacity: 0.1, 
            borderRadius: '30px', transform: 'rotate(15deg)',
            animation: 'pulse 2s infinite' 
          }}></div>
          <div style={{ 
            position: 'absolute', inset: 0, 
            background: '#ef4444', borderRadius: '30px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 10px 20px -5px rgba(239, 68, 68, 0.4)'
          }}>
            <ShieldAlert color="white" size={48} />
          </div>
        </div>

        <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#991b1b', marginBottom: '12px', letterSpacing: '-0.5px' }}>
          Akses Internet Terhenti
        </h1>
        <p style={{ color: '#64748b', fontSize: '16px', lineHeight: 1.6, marginBottom: '32px' }}>
          Maaf, layanan internet Anda diisolir sementara karena masa aktif telah habis. Sila lakukan pembayaran untuk menyambung semula secara otomatis.
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gap: '16px' }}>
          <button 
            onClick={() => window.location.href = '/pelanggan'}
            style={{ 
              background: '#16a34a', color: 'white', padding: '18px', 
              borderRadius: '16px', fontSize: '16px', fontWeight: 800, border: 'none',
              boxShadow: '0 10px 15px -3px rgba(22, 163, 74, 0.3)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
            }}>
            <CreditCard size={20} /> BAYAR SEKARANG <ArrowRight size={18} />
          </button>

          <button 
            onClick={() => window.location.reload()}
            style={{ 
              background: '#f8fafc', color: '#475569', padding: '16px', 
              borderRadius: '16px', fontSize: '14px', fontWeight: 700, border: '1px solid #e2e8f0',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}>
            <RefreshCw size={18} /> SAYA SUDAH BAYAR
          </button>
        </div>

        {/* Support Section */}
        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #f1f5f9' }}>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>Butuh bantuan teknis atau konfirmasi manual?</p>
          <a 
            href="https://wa.me/60123456789" 
            style={{ 
              color: '#16a34a', textDecoration: 'none', fontWeight: 700, fontSize: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}>
            <MessageCircle size={18} /> Hubungi Admin (WhatsApp)
          </a>
        </div>

        <style>{`
          @keyframes pulse {
            0% { transform: scale(1) rotate(15deg); opacity: 0.1; }
            50% { transform: scale(1.2) rotate(15deg); opacity: 0.2; }
            100% { transform: scale(1) rotate(15deg); opacity: 0.1; }
          }
        `}</style>
      </div>
    </div>
  )
}
