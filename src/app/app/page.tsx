import React from 'react'
import Link from 'next/link'

export const metadata = {
  title: 'Muat Turun Aplikasi | Purnama WiFi',
  description: 'Buka atau muat turun aplikasi mobile resmi Purnama WiFi untuk pengalaman pengurusan WiFi dan pembelian bauchar yang lebih pantas.',
}

export default function AppPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '500px', width: '100%', backgroundColor: '#1e293b', borderRadius: '24px', padding: '40px 30px', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)', border: '1px solid #334155' }}>
        <div style={{ width: '80px', height: '80px', backgroundColor: '#16a34a', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 10px 15px -3px rgba(22, 163, 74, 0.4)' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 Z"></path>
          </svg>
        </div>

        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'white', marginBottom: '12px' }}>Purnama WiFi Mobile</h1>
        <p style={{ fontSize: '15px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '32px' }}>
          Jika aplikasi kami sudah terpasang di telefon pintar anda, halaman ini akan dibuka secara automatik di dalam aplikasi.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Tombol Intent Android */}
          <a 
            href="intent://purnamawifi.net/app#Intent;scheme=https;package=com.nuxbill.admin.nuxbill_admin_flutter;end;"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
              backgroundColor: '#16a34a', color: 'white', padding: '16px', borderRadius: '16px',
              fontWeight: 700, fontSize: '16px', textDecoration: 'none', boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.3)',
              transition: 'all 0.2s'
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
            Buka Dalam Aplikasi
          </a>

          {/* Tombol Download APK / Play Store */}
          <a 
            href="https://play.google.com/store/apps/details?id=com.nuxbill.admin.nuxbill_admin_flutter" 
            target="_blank" 
            rel="noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
              backgroundColor: '#334155', color: 'white', padding: '16px', borderRadius: '16px',
              fontWeight: 700, fontSize: '16px', textDecoration: 'none', border: '1px solid #475569',
              transition: 'all 0.2s'
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Muat Turun Aplikasi Android
          </a>

          {/* Tombol Buka Web Pelanggan */}
          <Link 
            href="/pelanggan"
            style={{
              display: 'block', color: '#38bdf8', fontSize: '15px', fontWeight: 600, textDecoration: 'none', marginTop: '12px'
            }}
          >
            Atau teruskan ke Portal Web Pelanggan →
          </Link>
        </div>
      </div>

      <div style={{ marginTop: '40px', fontSize: '13px', color: '#64748b' }}>
        © {new Date().getFullYear()} Purnama WiFi Technology. Hak Cipta Terpelihara.
      </div>
    </div>
  )
}
