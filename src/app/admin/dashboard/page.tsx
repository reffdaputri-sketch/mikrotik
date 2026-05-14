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
    { data: pendingCommands },
  ] = await Promise.all([
    supabase.from('customers').select('*', { count: 'exact', head: true }),
    supabase.from('plans').select('*', { count: 'exact', head: true }).eq('enabled', true),
    supabase.from('vouchers').select('*', { count: 'exact', head: true }).eq('status', 'unused'),
    supabase.from('payment_orders').select('price').eq('status', 'paid').gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    supabase.from('payment_orders').select('*, plans(name_plan)').order('created_at', { ascending: false }).limit(5),
    supabase.from('mikrotik_command_queue').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  const monthlyRevenue = transactions?.reduce((sum, t) => sum + parseFloat(t.price || '0'), 0) || 0

  return { totalCustomers, totalPlans, totalVouchers, monthlyRevenue, recentOrders, pendingCommands: pendingCommands?.count || 0 }
}

export default async function DashboardPage() {
  const session = await getSession()
  const stats = await getDashboardStats()

  const statCards = [
    { label: 'Total Pelanggan', value: stats.totalCustomers?.toLocaleString() || '0', icon: Users, color: 'blue', href: '/admin/customers', change: 'Aktif bulan ini' },
    { label: 'Revenue Bulan Ini', value: formatCurrency(stats.monthlyRevenue), icon: TrendingUp, color: 'green', href: '/admin/transactions', change: 'Transaksi terbayar' },
    { label: 'Voucher Tersedia', value: stats.totalVouchers?.toLocaleString() || '0', icon: Ticket, color: 'purple', href: '/admin/vouchers', change: 'Siap digunakan' },
    { label: 'Paket Aktif', value: stats.totalPlans?.toLocaleString() || '0', icon: Package, color: 'orange', href: '/admin/plans', change: 'Tersedia di storefront' },
  ]

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 className="page-title">Selamat datang, {session?.fullname?.split(' ')[0]} 👋</h1>
            <p className="page-subtitle">Berikut ringkasan sistem billing kamu hari ini</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link href="/beli" target="_blank" className="btn btn-success btn-sm">
              <Wifi size={14} /> Lihat Storefront
            </Link>
            <Link href="/admin/vouchers/generate" className="btn btn-primary btn-sm">
              <Ticket size={14} /> Generate Voucher
            </Link>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Link key={card.label} href={card.href} style={{ textDecoration: 'none' }}>
              <div className={`stat-card ${card.color}`} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '10px',
                    background: card.color === 'blue' ? 'rgba(59,130,246,0.15)' :
                      card.color === 'green' ? 'rgba(16,185,129,0.15)' :
                      card.color === 'purple' ? 'rgba(139,92,246,0.15)' : 'rgba(245,158,11,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={20} color={
                      card.color === 'blue' ? '#3b82f6' :
                      card.color === 'green' ? '#10b981' :
                      card.color === 'purple' ? '#8b5cf6' : '#f59e0b'
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

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px' }}>

        {/* Recent Orders */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9' }}>Order Terbaru</h2>
            <Link href="/admin/transactions" style={{ fontSize: '0.78rem', color: '#3b82f6', textDecoration: 'none' }}>
              Lihat semua →
            </Link>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Pelanggan</th>
                  <th>Paket</th>
                  <th>Harga</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders?.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: '#475569', padding: '32px' }}>Belum ada order</td></tr>
                )}
                {stats.recentOrders?.map((order: Record<string, unknown>) => (
                  <tr key={order.id as number}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#94a3b8' }}>{(order.order_id as string)?.slice(-12)}</td>
                    <td style={{ fontWeight: 500 }}>{order.customer_name as string || '-'}</td>
                    <td>{(order.plans as Record<string, unknown>)?.name_plan as string || order.plan_name as string}</td>
                    <td style={{ color: '#10b981', fontWeight: 600 }}>{formatCurrency(parseFloat(order.price as string || '0'))}</td>
                    <td>
                      <span className={`badge ${
                        order.status === 'paid' ? 'badge-success' :
                        order.status === 'pending' ? 'badge-warning' :
                        order.status === 'failed' ? 'badge-danger' : 'badge-info'
                      }`}>
                        {order.status as string}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Status Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* MikroTik Agent Status */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Router size={16} style={{ color: '#3b82f6' }} /> Status Agent
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Local Agent</span>
                <span className="badge badge-warning">Belum dikonfigurasi</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Perintah Pending</span>
                <span style={{ fontWeight: 700, color: stats.pendingCommands > 0 ? '#f59e0b' : '#10b981' }}>
                  {stats.pendingCommands}
                </span>
              </div>
              <div style={{ marginTop: '4px', padding: '10px', background: 'rgba(59,130,246,0.08)', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.15)' }}>
                <p style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.6 }}>
                  Install <strong style={{ color: '#3b82f6' }}>mikrotik-agent</strong> di server lokal yang terhubung ke jaringan MikroTik
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={16} style={{ color: '#10b981' }} /> Aksi Cepat
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { href: '/admin/customers', label: '+ Tambah Pelanggan', color: '#3b82f6' },
                { href: '/admin/vouchers', label: '🎫 Generate Voucher', color: '#8b5cf6' },
                { href: '/admin/plans', label: '📦 Tambah Paket', color: '#10b981' },
                { href: '/admin/routers', label: '📡 Tambah Router', color: '#f59e0b' },
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
