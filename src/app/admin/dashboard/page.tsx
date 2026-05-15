import { createAdminClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'
import {
  Users, Package, Receipt, Ticket, Wifi,
  TrendingUp, Activity, Router, ArrowUpRight
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

async function getDashboardStats() {
  const supabase = await createAdminClient()
  const [
    { count: totalCustomers },
    { count: totalPlans },
    { count: totalVouchers },
    { data: transactions },
    { data: recentOrders },
    { count: totalPendingCommands },
  ] = await Promise.all([
    supabase.from('customers').select('*', { count: 'exact', head: true }),
    supabase.from('plans').select('*', { count: 'exact', head: true }).eq('enabled', true),
    supabase.from('vouchers').select('*', { count: 'exact', head: true }).eq('status', 'unused'),
    supabase.from('payment_orders').select('price').eq('status', 'paid').gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    supabase.from('payment_orders').select('*, plans(name_plan)').order('created_at', { ascending: false }).limit(5),
    supabase.from('mikrotik_command_queue').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  const monthlyRevenue = transactions?.reduce((sum, t) => sum + parseFloat(t.price || '0'), 0) || 0

  return { totalCustomers, totalPlans, totalVouchers, monthlyRevenue, recentOrders, pendingCommands: totalPendingCommands || 0 }
}

export default async function DashboardPage() {
  const session = await getSession()
  const stats = await getDashboardStats()

  const statCards = [
    { label: 'Jumlah Pelanggan', value: stats.totalCustomers?.toLocaleString() || '0', icon: Users, color: 'blue', href: '/admin/customers', change: 'Aktif bulan ini' },
    { label: 'Hasil Bulan Ini', value: formatCurrency(stats.monthlyRevenue), icon: TrendingUp, color: 'green', href: '/admin/transactions', change: 'Transaksi dibayar' },
    { label: 'Baucar Tersedia', value: stats.totalVouchers?.toLocaleString() || '0', icon: Ticket, color: 'purple', href: '/admin/vouchers', change: 'Sedia digunakan' },
    { label: 'Pakej Aktif', value: stats.totalPlans?.toLocaleString() || '0', icon: Package, color: 'orange', href: '/admin/plans', change: 'Tersedia di storefront' },
  ]

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 className="page-title">Selamat Datang, {session?.fullname?.split(' ')[0]} 👋</h1>
            <p className="page-subtitle">Berikut ringkasan sistem billing anda hari ini</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link href="/beli" target="_blank" className="btn btn-success btn-sm">
              <Wifi size={14} /> Lihat Storefront
            </Link>
            <Link href="/admin/vouchers/generate" className="btn btn-primary btn-sm">
              <Ticket size={14} /> Jana Baucar
            </Link>
          </div>
        </div>
      </div>

      {/* Kad Statistik */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Link key={card.label} href={card.href} style={{ textDecoration: 'none' }}>
              <div className={`stat-card ${card.color}`} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '10px',
                    background: card.color === 'blue' ? 'rgba(96,165,250,0.15)' :
                      card.color === 'green' ? 'rgba(74,222,128,0.15)' :
                      card.color === 'purple' ? 'rgba(167,139,250,0.15)' : 'rgba(251,191,36,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={20} color={
                      card.color === 'blue' ? '#60a5fa' :
                      card.color === 'green' ? '#4ade80' :
                      card.color === 'purple' ? '#a78bfa' : '#fbbf24'
                    } />
                  </div>
                  <ArrowUpRight size={16} style={{ color: '#475569' }} />
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f1f5f9', lineHeight: 1.1, marginBottom: '4px' }}>
                  {card.value}
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>{card.label}</div>
                <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '4px' }}>{card.change}</div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Baris Bawah */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px' }}>

        {/* Order Terkini */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9' }}>Order Terkini</h2>
            <Link href="/admin/transactions" style={{ fontSize: '0.78rem', color: '#4ade80', textDecoration: 'none' }}>
              Lihat semua →
            </Link>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID Order</th>
                  <th>Pelanggan</th>
                  <th>Pakej</th>
                  <th>Harga</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders?.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: '#475569', padding: '32px' }}>Tiada order lagi</td></tr>
                )}
                {stats.recentOrders?.map((order: Record<string, unknown>) => (
                  <tr key={order.id as number}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#94a3b8' }}>{(order.order_id as string)?.slice(-12)}</td>
                    <td style={{ fontWeight: 500 }}>{order.customer_name as string || '-'}</td>
                    <td>{(order.plans as Record<string, unknown>)?.name_plan as string || order.plan_name as string}</td>
                    <td style={{ color: '#4ade80', fontWeight: 600 }}>{formatCurrency(parseFloat(order.price as string || '0'))}</td>
                    <td>
                      <span className={`badge ${
                        order.status === 'paid' ? 'badge-success' :
                        order.status === 'pending' ? 'badge-warning' :
                        order.status === 'failed' ? 'badge-danger' : 'badge-info'
                      }`}>
                        {order.status === 'paid' ? 'Dibayar' : order.status === 'pending' ? 'Menunggu' : order.status as string}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel Samping */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Status Agent MikroTik */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Router size={16} style={{ color: '#4ade80' }} /> Status Agent
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Ejen Tempatan</span>
                <span className="badge badge-warning">Belum dikonfigurasikan</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Arahan Tertunda</span>
                <span style={{ fontWeight: 700, color: stats.pendingCommands > 0 ? '#fbbf24' : '#4ade80' }}>
                  {stats.pendingCommands}
                </span>
              </div>
              <div style={{ marginTop: '4px', padding: '10px', background: 'rgba(74,222,128,0.06)', borderRadius: '8px', border: '1px solid rgba(74,222,128,0.15)' }}>
                <p style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.6 }}>
                  Pasang <strong style={{ color: '#4ade80' }}>mikrotik-agent</strong> di pelayan tempatan yang bersambung ke rangkaian MikroTik
                </p>
              </div>
            </div>
          </div>

          {/* Tindakan Pantas */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={16} style={{ color: '#4ade80' }} /> Tindakan Pantas
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { href: '/admin/customers', label: '+ Tambah Pelanggan', color: '#60a5fa' },
                { href: '/admin/vouchers', label: '🎫 Jana Baucar', color: '#a78bfa' },
                { href: '/admin/plans', label: '📦 Tambah Pakej', color: '#4ade80' },
                { href: '/admin/routers', label: '📡 Tambah Router', color: '#fbbf24' },
              ].map(a => (
                <Link
                  key={a.href}
                  href={a.href}
                  style={{
                    display: 'block', padding: '8px 12px', borderRadius: '8px',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid #1e293b',
                    textDecoration: 'none', color: a.color, fontSize: '0.82rem', fontWeight: 600,
                    transition: 'all 0.2s',
                  }}
                >
                  {a.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
