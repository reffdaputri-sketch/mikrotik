'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, Users, Package, Router, Receipt,
  Ticket, Settings, LogOut, Menu, X, Wifi,
  ChevronRight, Bell, User, Activity, MapPin, Image, MessageSquare
} from 'lucide-react'

const navItems = [
  { section: 'Utama' },
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { section: 'Billing' },
  { href: '/admin/customers', label: 'Pelanggan', icon: Users },
  { href: '/admin/plans', label: 'Pakej Internet', icon: Package },
  { href: '/admin/invoices', label: 'Invois & Bil', icon: Receipt },
  { href: '/admin/transactions', label: 'Sejarah Transaksi', icon: Activity },
  { href: '/admin/vouchers', label: 'Voucher', icon: Ticket },
  { href: '/admin/complaints', label: 'Laporan Gangguan', icon: MessageSquare },
  { href: '/admin/maps', label: 'Geo-Maps', icon: MapPin },
  { section: 'Jaringan' },
  { href: '/admin/routers', label: 'Router MikroTik', icon: Router },
  { href: '/admin/bandwidths', label: 'Bandwidth', icon: Activity },
  { section: 'Kandungan' },
  { href: '/admin/banners', label: 'Banner Promo', icon: Image },
  { href: '/admin/news', label: 'Berita & Info', icon: Bell },
  { section: 'Sistem' },
  { href: '/admin/settings', label: 'Tetapan', icon: Settings },
]

interface AdminLayoutProps {
  children: React.ReactNode
  user?: { fullname: string; user_type: string }
}

export default function AdminLayout({ children, user }: AdminLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => { setSidebarOpen(false) }, [pathname])

  async function handleLogout() {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: '"Nunito", "Inter", system-ui, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
      `}</style>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(20,83,45,0.5)',
            zIndex: 49, backdropFilter: 'blur(2px)'
          }}
          className="mobile-overlay"
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>

        {/* Logo */}
        <div className="sidebar-logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: '#ea580c',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, boxShadow: '0 4px 0 #c2410c'
            }}>
              <Wifi size={22} color="white" strokeWidth={3} />
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: '1.1rem', color: 'white', letterSpacing: '-0.5px' }}>
                Purnama <span style={{ color: '#fbbf24' }}>WiFi</span>
              </div>
              <div style={{ fontSize: '0.65rem', color: '#4ade80', fontWeight: 700 }}>Admin Panel</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          {navItems.map((item, idx) => {
            if ('section' in item) {
              return <div key={idx} className="nav-section">{item.section}</div>
            }
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} strokeWidth={isActive ? 3 : 2} />
                <span>{item.label}</span>
                {isActive && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.8 }} />}
              </Link>
            )
          })}
        </nav>

        {/* User info + logout */}
        <div style={{ padding: '12px 8px', borderTop: '2px solid #166534' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px', borderRadius: '10px',
            background: 'rgba(255,255,255,0.08)',
            marginBottom: '6px',
          }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '50%',
              background: '#ea580c',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, fontSize: '0.85rem', fontWeight: 900, color: 'white',
              boxShadow: '0 2px 0 #c2410c'
            }}>
              {user?.fullname?.[0]?.toUpperCase() || 'A'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.fullname || 'Admin'}
              </div>
              <div style={{ fontSize: '0.65rem', color: '#4ade80', fontWeight: 700 }}>{user?.user_type || 'SuperAdmin'}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="nav-item"
            style={{ color: '#fca5a5', width: '100%' }}
            disabled={loggingOut}
          >
            <LogOut size={16} />
            <span>{loggingOut ? 'Keluar...' : 'Log Keluar'}</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="main-content" style={{ flex: 1 }}>

        {/* Topbar */}
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}
              className="mobile-menu-btn"
            >
              {sidebarOpen ? <X size={22} strokeWidth={2} /> : <Menu size={22} strokeWidth={2} />}
            </button>
            <div>
              <span style={{ fontSize: '0.875rem', color: '#94a3b8', fontWeight: 700 }}>Admin Panel</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link
              href="/"
              target="_blank"
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '7px 14px', borderRadius: '8px',
                background: 'rgba(22,163,74,0.12)', color: '#4ade80',
                border: '1px solid rgba(22,163,74,0.25)',
                fontSize: '0.78rem', fontWeight: 700, textDecoration: 'none',
                transition: 'all 0.2s'
              }}
            >
              <Wifi size={14} strokeWidth={2.5} /> Laman Web
            </Link>

            <div style={{
              width: '34px', height: '34px', borderRadius: '50%',
              background: '#16a34a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.8rem', fontWeight: 900, color: 'white', cursor: 'pointer',
              boxShadow: '0 3px 0 #15803d'
            }}>
              <User size={16} />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main>{children}</main>
      </div>
    </div>
  )
}
