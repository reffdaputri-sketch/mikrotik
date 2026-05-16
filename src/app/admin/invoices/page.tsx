'use client'

import { useState, useEffect, useCallback } from 'react'
import { Receipt, Search, RefreshCw, Filter, CreditCard, User, Clock, Printer, CheckCircle, AlertCircle, Wifi } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Invoice {
  id: number
  order_id: string
  username: string
  customer_name: string
  customer_phone?: string
  plan_name: string
  price: number
  status: 'pending' | 'paid' | 'failed' | 'expired' | 'cancelled'
  service_type?: 'PPPoE' | 'Hotspot' | 'Others'
  created_at: string
  paid_at?: string
  proof_img?: string
  description?: string
  payment_type?: string
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'all' | 'pending' | 'paid'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'PPPoE' | 'Hotspot'>('all')
  const [generating, setGenerating] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [config, setConfig] = useState<any>(null)

  const fetchInvoices = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/transactions') 
    const data = await res.json()
    setInvoices(data.transactions || [])
    setLoading(false)
  }, [])

  const fetchSettings = useCallback(async () => {
    const res = await fetch('/api/admin/settings')
    const data = await res.json()
    if (data.config) setConfig(data.config)
  }, [])

  useEffect(() => {
    fetchInvoices()
    fetchSettings()
  }, [fetchInvoices, fetchSettings])

  const handleGenerate = async () => {
    if (!confirm('Jana bil bulanan untuk semua pelanggan PPPoE yang hampir tamat tempoh?')) return
    setGenerating(true)
    try {
      const res = await fetch('/api/admin/invoices/generate-recurring', { method: 'POST' })
      const data = await res.json()
      alert(data.message || 'Selesai menjana bil.')
      fetchInvoices()
    } catch (e) {
      alert('Ralat menjana bil.')
    }
    setGenerating(false)
  }

  const printOfficialInvoice = (inv: Invoice) => {
    setSelectedInvoice(inv)
    setTimeout(() => {
      window.print()
      setSelectedInvoice(null)
    }, 200)
  }

  async function confirmPayment(id: number) {
    if (!confirm('Sahkan pembayaran ini secara manual?')) return
    const res = await fetch(`/api/admin/transactions/confirm/${id}`, { method: 'POST' })
    if (res.ok) fetchInvoices()
    else alert('Gagal mengesahkan pembayaran')
  }

  const filtered = invoices.filter(inv => {
    const matchSearch = inv.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
                       inv.order_id?.toLowerCase().includes(search.toLowerCase())
    
    if (!matchSearch) return false
    if (tab === 'pending') return inv.status === 'pending'
    if (tab === 'paid') return inv.status === 'paid'
    
    const matchType = typeFilter === 'all' || inv.service_type === typeFilter
    return matchType
  })

  const stats = {
    total: invoices.length,
    paid: invoices.filter(i => i.status === 'paid').length,
    pending: invoices.filter(i => i.status === 'pending').length,
    unpaidAmount: invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + Number(i.price), 0)
  }

  return (
    <div className="page-content">
      <style>{`
        @media screen {
          .printable-invoice { display: none !important; }
        }
        @media print {
          .no-print, .sidebar, .topbar, .nav-item, .page-header button, .tabs-container, .search-container, .glass-card:not(.printable-invoice) {
            display: none !important;
          }
          .printable-invoice { 
            display: block !important; 
            color: black !important;
            background: white !important;
            padding: 40px !important;
          }
          .main-content { margin: 0 !important; padding: 0 !important; }
          body { background: white !important; }
        }
      `}</style>

      {/* Reka Bentuk Invois Rasmi (Hanya muncul bila print) */}
      {selectedInvoice && (
        <div className="printable-invoice" style={{ color: 'black', background: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #333', paddingBottom: '20px', marginBottom: '30px' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 900, margin: 0 }}>{config?.company_name || 'Purnama WiFi ISP'}</h1>
              <p style={{ margin: '5px 0', fontSize: '12px', color: '#555' }}>{config?.address || 'Alamat Perniagaan Anda'}</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#555' }}>Tel: {config?.phone || '-'}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ fontSize: '32px', fontWeight: 900, color: selectedInvoice.service_type === 'Hotspot' ? '#3b82f6' : '#333', margin: 0 }}>
                {selectedInvoice.service_type === 'Hotspot' ? 'RESIT' : 'INVOIS'}
              </h2>
              <p style={{ margin: '5px 0', fontWeight: 700 }}>#{selectedInvoice.order_id.toUpperCase()}</p>
              <p style={{ margin: 0, fontSize: '12px' }}>Tarikh: {new Date(selectedInvoice.created_at).toLocaleDateString('ms-MY')}</p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
            <div>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', textTransform: 'uppercase', color: '#777' }}>Ditujukan Kepada:</h4>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '16px' }}>{selectedInvoice.customer_name}</p>
              <p style={{ margin: '4px 0', fontSize: '14px' }}>ID Pelanggan: {selectedInvoice.username}</p>
              <p style={{ margin: 0, fontSize: '14px' }}>Tel: {selectedInvoice.customer_phone || '-'}</p>
              {selectedInvoice.payment_type && (
                <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}>Sumber Dana: {selectedInvoice.payment_type}</p>
              )}
            </div>
            {selectedInvoice.status === 'paid' ? (
              <div style={{ border: '4px solid #16a34a', color: '#16a34a', padding: '10px 20px', borderRadius: '10px', transform: 'rotate(-15deg)', fontWeight: 900, fontSize: '24px' }}>
                LUNAS
              </div>
            ) : (
              <div style={{ border: '4px solid #ef4444', color: '#ef4444', padding: '10px 20px', borderRadius: '10px', transform: 'rotate(-15deg)', fontWeight: 900, fontSize: '24px' }}>
                PENDING
              </div>
            )}
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px' }}>Perincian Perkhidmatan</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px' }}>Kuantiti</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px' }}>Jumlah</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '15px 12px' }}>
                  <p style={{ margin: 0, fontWeight: 700 }}>{selectedInvoice.plan_name}</p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666' }}>
                    {selectedInvoice.service_type === 'Hotspot' ? 'Pembelian Voucher WiFi' : 'Langganan Internet Bulanan'}
                  </p>
                </td>
                <td style={{ padding: '15px 12px', textAlign: 'right' }}>1 Bulan</td>
                <td style={{ padding: '15px 12px', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(selectedInvoice.price)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} style={{ padding: '20px 12px', textAlign: 'right', fontWeight: 700, fontSize: '16px' }}>Jumlah Keseluruhan:</td>
                <td style={{ padding: '20px 12px', textAlign: 'right', fontWeight: 900, fontSize: '18px', background: '#f8f9fa' }}>{formatCurrency(selectedInvoice.price)}</td>
              </tr>
            </tfoot>
          </table>

          <div style={{ borderTop: '1px solid #eee', paddingTop: '20px', fontSize: '11px', color: '#777', lineHeight: '1.6' }}>
            <p style={{ fontWeight: 700, marginBottom: '5px' }}>Terma & Syarat:</p>
            <ul style={{ margin: 0, paddingLeft: '15px' }}>
              <li>Sila jelaskan bayaran sebelum tarikh tamat tempoh bagi mengelakkan gangguan perkhidmatan.</li>
              <li>Bayaran yang telah dibuat tidak boleh dikembalikan.</li>
              <li>Invois ini adalah cetakan komputer dan tidak memerlukan tandatangan.</li>
            </ul>
          </div>

          <div style={{ marginTop: '50px', textAlign: 'center', fontSize: '12px', color: '#999' }}>
            Terima kasih kerana melanggan perkhidmatan kami!
          </div>
        </div>
      )}

      {/* HEADER DAN KANDUNGAN ADMIN (NO-PRINT) */}
      <div className="no-print">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">Pengurusan Invois</h1>
            <p className="page-subtitle">Pantau dan urus bil pelanggan anda</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={handleGenerate} 
              className="btn btn-primary btn-sm" 
              style={{ background: '#ea580c', borderColor: '#ea580c' }}
              disabled={generating}
            >
              {generating ? <RefreshCw size={14} className="animate-spin" /> : <CreditCard size={14} />}
              <span style={{ marginLeft: '8px' }}>Jana Bil Bulanan</span>
            </button>
            <button onClick={fetchInvoices} className="btn btn-secondary btn-sm">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #16a34a' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>INVOIS LUNAS</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#16a34a', marginTop: '4px' }}>{stats.paid}</div>
          </div>
          <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #ea580c' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>MENUNGGU BAYARAN</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ea580c', marginTop: '4px' }}>{stats.pending}</div>
          </div>
          <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #ef4444' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>JUMLAH TERTUNGGAK</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ef4444', marginTop: '4px' }}>{formatCurrency(stats.unpaidAmount)}</div>
          </div>
        </div>

        {/* Tabs & Search */}
        <div className="glass-card" style={{ marginBottom: '20px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div className="tabs-container" style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '12px' }}>
              {(['all', 'pending', 'paid'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    padding: '8px 16px', borderRadius: '10px', border: 'none',
                    background: tab === t ? '#16a34a' : 'transparent',
                    color: tab === t ? 'white' : '#94a3b8',
                    fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {t === 'all' ? 'Semua' : t === 'pending' ? 'Belum Bayar' : 'Sudah Bayar'}
                </button>
              ))}
            </div>
            <div style={{ position: 'relative', width: '300px' }} className="search-container">
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input 
                className="form-input" 
                style={{ paddingLeft: '40px' }} 
                placeholder="Cari pelanggan / no invois..." 
                value={search} 
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="no-print">
              <Filter size={14} color="#64748b" />
              <select className="form-input" style={{ width: 'auto', padding: '6px 12px' }} value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)}>
                <option value="all">Semua Layanan</option>
                <option value="PPPoE">PPPoE (Bulanan)</option>
                <option value="Hotspot">Hotspot (Voucher)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="glass-card">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>No. Invois</th>
                  <th>Nama Pelanggan</th>
                  <th>Layanan</th>
                  <th>Pakej</th>
                  <th>Jumlah</th>
                  <th>Tarikh Bil</th>
                  <th>Sumber Dana</th>
                  <th>Bukti</th>
                  <th>Status</th>
                  <th>Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px' }}>Memuatkan data...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px' }}>Tiada invois dijumpai</td></tr>
                ) : filtered.map(inv => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 800, color: '#f1f5f9', fontFamily: 'monospace' }}>#{inv.order_id.slice(-8).toUpperCase()}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <User size={14} color="#64748b" />
                        </div>
                        <span style={{ fontWeight: 600 }}>{inv.customer_name}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${inv.service_type === 'Hotspot' ? 'badge-info' : 'badge-primary'}`} style={{ fontSize: '0.65rem' }}>
                        {inv.service_type || 'Unknown'}
                      </span>
                    </td>
                    <td>{inv.plan_name}</td>
                    <td style={{ fontWeight: 800, color: inv.status === 'paid' ? '#4ade80' : '#fbbf24' }}>{formatCurrency(inv.price)}</td>
                    <td>{new Date(inv.created_at).toLocaleDateString('ms-MY')}</td>
                    <td>
                      <span className="badge badge-secondary" style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {inv.payment_type || 'Manual'}
                      </span>
                    </td>
                    <td>
                      {inv.proof_img ? (
                        <a href={inv.proof_img} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: '10px', background: '#3b82f6', color: 'white', border: 'none' }}>
                          LIHAT STRUK
                        </a>
                      ) : inv.description?.includes('/uploads/proofs/') ? (
                        <a href={inv.description.split('PROOF_IMG:')[1]} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: '10px', background: '#3b82f6', color: 'white', border: 'none' }}>
                          LIHAT STRUK*
                        </a>
                      ) : inv.payment_type?.startsWith('BUKTI:') ? (
                        <a href={inv.payment_type.split('BUKTI:')[1]} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: '10px', background: '#3b82f6', color: 'white', border: 'none' }}>
                          LIHAT STRUK**
                        </a>
                      ) : (
                        <span style={{ fontSize: '10px', color: '#64748b' }}>-</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${inv.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                        {inv.status === 'paid' ? 'LUNAS' : 'PENDING'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {inv.status === 'pending' && (
                          <button 
                            onClick={() => confirmPayment(inv.id)}
                            className="btn btn-primary btn-sm" 
                            style={{ background: '#16a34a', boxShadow: 'none' }}
                            title="Sahkan Bayaran"
                          >
                            <CheckCircle size={14} />
                          </button>
                        )}
                        <button onClick={() => printOfficialInvoice(inv)} className="btn btn-secondary btn-sm" title="Cetak Invois Rasmi">
                          <Printer size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
