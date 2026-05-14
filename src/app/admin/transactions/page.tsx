'use client'

import { useState, useEffect, useCallback } from 'react'
import { Receipt, Search, RefreshCw, Filter, ExternalLink, Calendar, CreditCard, User, Tag, Clock, Printer, Download } from 'lucide-react'
import { formatCurrency, timeAgo } from '@/lib/utils'

interface Transaction {
  id: number
  order_id: string
  customer_name: string
  customer_phone: string
  plan_name: string
  price: number
  status: 'pending' | 'paid' | 'failed' | 'expired' | 'cancelled'
  payment_type?: string
  created_at: string
  paid_at?: string
  voucher_code?: string
  plans?: { name_plan: string }
  routers?: { name: string }
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateRange, setDateRange] = useState('all') // today, month, year, all

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    const url = statusFilter === 'all' ? '/api/admin/transactions' : `/api/admin/transactions?status=${statusFilter}`
    const res = await fetch(url)
    const data = await res.json()
    setTransactions(data.transactions || [])
    setLoading(false)
  }, [statusFilter])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const filtered = transactions.filter(t => {
    const matchSearch = t.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
                       t.order_id?.toLowerCase().includes(search.toLowerCase()) ||
                       t.plan_name?.toLowerCase().includes(search.toLowerCase())
    
    if (!matchSearch) return false

    const date = new Date(t.created_at)
    const now = new Date()
    
    if (dateRange === 'today') {
      return date.toDateString() === now.toDateString()
    } else if (dateRange === 'month') {
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    } else if (dateRange === 'year') {
      return date.getFullYear() === now.getFullYear()
    }
    
    return true
  })

  const totalOmset = filtered
    .filter(t => t.status === 'paid')
    .reduce((sum, t) => sum + parseFloat(String(t.price)), 0)

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="page-content">
      <style jsx global>{`
        @media print {
          .no-print, .page-header, .page-sidebar, .page-navbar, .filter-section {
            display: none !important;
          }
          .page-content {
            padding: 0 !important;
            margin: 0 !important;
            color: black !important;
            background: white !important;
          }
          .glass-card {
            background: white !important;
            border: 1px solid #ccc !important;
            box-shadow: none !important;
          }
          .data-table th, .data-table td {
            color: black !important;
            border-bottom: 1px solid #eee !important;
          }
          .omset-card {
            background: #f8f9fa !important;
            border: 1px solid #000 !important;
            color: black !important;
          }
        }
      `}</style>

      <div className="page-header no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">Riwayat & Laporan</h1>
          <p className="page-subtitle">Analisis omset dan riwayat transaksi</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handlePrint} className="btn btn-secondary btn-sm" title="Cetak Laporan">
            <Printer size={14} style={{ marginRight: '6px' }} /> Cetak Laporan
          </button>
          <button onClick={fetchTransactions} className="btn btn-secondary btn-sm"><RefreshCw size={14} /></button>
        </div>
      </div>

      <div className="no-print filter-section" style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', maxWidth: '320px', flex: 1 }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
          <input className="form-input" style={{ paddingLeft: '36px' }} placeholder="Cari..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={14} color="#64748b" />
          <select className="form-input" style={{ width: 'auto', padding: '6px 12px' }} value={dateRange} onChange={e => setDateRange(e.target.value)}>
            <option value="all">Semua Waktu</option>
            <option value="today">Hari Ini</option>
            <option value="month">Bulan Ini</option>
            <option value="year">Tahun Ini</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={14} color="#64748b" />
          <select className="form-input" style={{ width: 'auto', padding: '6px 12px' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">Semua Status</option>
            <option value="paid">Terbayar</option>
            <option value="pending">Menunggu</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-card omset-card" style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.05))', borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Omset ({dateRange.toUpperCase()})</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10b981', marginTop: '4px' }}>{formatCurrency(totalOmset)}</div>
            </div>
            <div style={{ padding: '10px', background: 'rgba(16,185,129,0.2)', borderRadius: '12px' }}>
              <CreditCard size={24} color="#10b981" />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '12px' }}>
            Dari {filtered.filter(t => t.status === 'paid').length} transaksi berhasil
          </div>
        </div>

        <div className="glass-card no-print" style={{ padding: '20px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Menunggu</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f59e0b', marginTop: '4px' }}>{filtered.filter(t => t.status === 'pending').length}</div>
            </div>
            <div style={{ padding: '10px', background: 'rgba(245,158,11,0.2)', borderRadius: '12px' }}>
              <Clock size={24} color="#f59e0b" />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '12px' }}>
            Transaksi yang belum dibayar
          </div>
        </div>
      </div>

      <div className="glass-card">
        <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Data Transaksi</h3>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Showing {filtered.length} entries</span>
        </div>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Tanggal</th>
                <th>Pelanggan</th>
                <th>Layanan</th>
                <th>Metode</th>
                <th>Total</th>
                <th className="no-print">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#475569' }}>Loading...</td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#475569' }}>Data kosong</td></tr>}
              {filtered.map(t => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.8rem', fontFamily: 'monospace' }}>#{t.order_id.slice(-8).toUpperCase()}</td>
                  <td style={{ fontSize: '0.8rem' }}>{new Date(t.created_at).toLocaleDateString('id-ID')}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600, color: '#cbd5e1', fontSize: '0.85rem' }}>{t.customer_name}</span>
                    </div>
                  </td>
                  <td><span style={{ fontSize: '0.85rem' }}>{t.plan_name}</span></td>
                  <td><span style={{ fontSize: '0.75rem', color: '#64748b' }}>{t.payment_type || 'Manual'}</span></td>
                  <td style={{ fontWeight: 800, color: t.status === 'paid' ? '#10b981' : '#f59e0b' }}>{formatCurrency(t.price)}</td>
                  <td className="no-print">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`badge ${t.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                        {t.status.toUpperCase()}
                      </span>
                      {t.status === 'pending' && (
                        <button 
                          onClick={async () => {
                            if (confirm('Konfirmasi pembayaran manual ini?')) {
                              const res = await fetch(`/api/admin/transactions/confirm/${t.id}`, { method: 'POST' });
                              if (res.ok) fetchTransactions();
                              else alert('Gagal konfirmasi');
                            }
                          }}
                          className="btn btn-secondary btn-sm" 
                          style={{ padding: '4px', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}
                          title="Konfirmasi Manual"
                        >
                          <CreditCard size={12} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
