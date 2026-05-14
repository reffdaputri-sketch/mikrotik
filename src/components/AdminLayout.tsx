'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, Users, Package, Router, Receipt,
  Ticket, Settings, LogOut, Menu, X, Wifi,
  ChevronRight, Bell, User, Activity, MapPin
} from 'lucide-react'

const navItems = [
  { section: 'Utama' },
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { section: 'Billing' },
  { href: '/admin/customers', label: 'Pelanggan', icon: Users },
  { href: '/admin/plans', label: 'Paket Internet', icon: Package },
  { href: '/admin/transactions', label: 'Transaksi', icon: Receipt },
  { href: '/admin/vouchers', label: 'Voucher', icon: Ticket },
  { href: '/admin/maps', label: 'Geo-Maps', icon: MapPin },
  { section: 'Jaringan' },
  { href: '/admin/routers', label: 'Router MikroTik', icon: Router },
  { href: '/admin/bandwidths', label: 'Bandwidth', icon: Activity },
  { section: 'Konten' },
  { href: '/admin/banners', label: 'Banner Promo', icon: Package }, // Ganti icon kalau ada yg lebih cocok misal Image
  { href: '/admin/news', label: 'Berita & Info', icon: Bell },
  { section: 'Sistem' },
  { href: '/admin/settings', label: 'Pengaturan', icon: Settings },
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
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            zIndex: 49, display: 'none'
          }}
          className="mobile-overlay"
        />
      )}

      {/* SIDEBAR */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Wifi size={20} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em' }}>
                <span className="gradient-text">NuxBill</span>
              </div>
              <div style={{ fontSize: '0.65rem', color: '#475569' }}>Billing MikroTik</div>
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
                <Icon size={16} />
                <span>{item.label}</span>
                {isActive && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.6 }} />}
              </Link>
            )
          })}
        </nav>

        {/* User info + logout */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid #1e2d45' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 12px', borderRadius: '8px',
            background: 'rgba(255,255,255,0.03)',
            marginBottom: '4px',
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, fontSize: '0.75rem', fontWeight: 700, color: 'white',
            }}>
              {user?.fullname?.[0] || 'A'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.fullname || 'Admin'}
              </div>
              <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{user?.user_type || 'SuperAdmin'}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="nav-item"
            style={{ color: '#ef4444', width: '100%' }}
            disabled={loggingOut}
          >
            <LogOut size={16} />
            <span>{loggingOut ? 'Keluar...' : 'Logout'}</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="main-content" style={{ flex: 1 }}>
        {/* Topbar */}
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex' }}
              className="mobile-menu-btn"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div>
              <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Admin Panel</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link
              href="/beli"
              target="_blank"
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', borderRadius: '8px',
                background: 'rgba(16,185,129,0.1)', color: '#10b981',
                border: '1px solid rgba(16,185,129,0.2)',
                fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none',
              }}
            >
              <Wifi size={14} /> Lihat Storefront
            </Link>
            <button style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid #334155',
              borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#94a3b8',
              display: 'flex', alignItems: 'center',
            }}>
              <Bell size={16} />
            </button>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.8rem', fontWeight: 700, color: 'white', cursor: 'pointer',
            }}>
              <User size={14} />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main>{children}</main>
      </div>
    </div>
  )
}
