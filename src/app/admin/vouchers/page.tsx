'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Ticket, Search, Plus, Trash2, Printer, RefreshCw, Filter, CheckCircle, Clock, XCircle, MoreVertical } from 'lucide-react'
import { formatCurrency, timeAgo } from '@/lib/utils'

interface Voucher {
  id: number
  code: string
  username: string
  password?: string
  status: 'unused' | 'used' | 'expired'
  created_at: string
  used_at?: string
  plans?: { name_plan: string }
  routers?: { name: string }
}

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('unused')
  const [showGenModal, setShowGenModal] = useState(false)
  const [generating, setGenerating] = useState(false)
  
  const [plans, setPlans] = useState<{id: number, name_plan: string}[]>([])
  const [routers, setRouters] = useState<{id: number, name: string}[]>([])

  const [genForm, setGenForm] = useState({
    plan_id: '',
    router_id: '',
    quantity: '10',
    type: 'Hotspot',
    length: '8',
    prefix: '',
  })

  const [selectedIds, setSelectedIds] = useState<number[]>([])

  const fetchVouchers = useCallback(async () => {
    setLoading(true)
    const url = statusFilter === 'all' ? '/api/admin/vouchers' : `/api/admin/vouchers?status=${statusFilter}`
    const res = await fetch(url)
    const data = await res.json()
    setVouchers(data.vouchers || [])
    setLoading(false)
    setSelectedIds([])
  }, [statusFilter])

  useEffect(() => {
    fetchVouchers()
    fetch('/api/admin/plans').then(r => r.json()).then(d => setPlans(d.plans || []))
    fetch('/api/admin/routers').then(r => r.json()).then(d => setRouters(d.routers || []))
  }, [fetchVouchers])

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    setGenerating(true)
    const res = await fetch('/api/admin/vouchers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(genForm),
    })
    if (res.ok) {
      setShowGenModal(false)
      fetchVouchers()
    }
    setGenerating(false)
  }

  async function handleDelete(id: number) {
    if (!confirm('Hapus voucher ini?')) return
    await fetch(`/api/admin/vouchers?id=${id}`, { method: 'DELETE' })
    fetchVouchers()
  }

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length && filtered.length > 0) setSelectedIds([])
    else setSelectedIds(filtered.map(v => v.id))
  }

  const handlePrintSelected = () => {
    if (selectedIds.length === 0) return
    window.open(`/admin/vouchers/print?ids=${selectedIds.join(',')}`, '_blank')
  }

  const filtered = vouchers.filter(v =>
    v.code.toLowerCase().includes(search.toLowerCase()) ||
    v.plans?.name_plan.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">Voucher Internet</h1>
          <p className="page-subtitle">{vouchers.length} voucher dalam database</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {selectedIds.length > 0 && (
            <button onClick={handlePrintSelected} className="btn btn-secondary btn-sm" style={{ background: 'rgba(59,130,246,0.2)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}>
              <Printer size={14} /> Cetak ({selectedIds.length})
            </button>
          )}
          <button onClick={fetchVouchers} className="btn btn-secondary btn-sm"><RefreshCw size={14} /></button>
          <Link href="/admin/vouchers/generate" className="btn btn-primary btn-sm">
            <Plus size={14} /> Generate Voucher
          </Link>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', maxWidth: '320px', flex: 1 }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
          <input className="form-input" style={{ paddingLeft: '36px' }} placeholder="Cari kode atau paket..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={14} color="#64748b" />
          <select className="form-input" style={{ width: 'auto', padding: '6px 12px' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">Semua Status</option>
            <option value="unused">Belum Terpakai</option>
            <option value="used">Terpakai</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      <div className="glass-card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input type="checkbox" checked={selectedIds.length === filtered.length && filtered.length > 0} onChange={toggleSelectAll} />
                </th>
                <th>Kode Voucher</th>
                <th>Paket</th>
                <th>Router</th>
                <th>Dibuat</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#475569' }}>Loading...</td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#475569' }}>Belum ada voucher</td></tr>}
              {filtered.map(v => (
                <tr key={v.id}>
                  <td>
                    <input type="checkbox" checked={selectedIds.includes(v.id)} onChange={() => toggleSelect(v.id)} />
                  </td>
                  <td style={{ fontWeight: 800, color: '#f1f5f9', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                    {v.code}
                  </td>
                  <td>{v.plans?.name_plan || '-'}</td>
                  <td>{v.routers?.name || '-'}</td>
                  <td style={{ fontSize: '0.75rem', color: '#64748b' }}>{timeAgo(v.created_at)}</td>
                  <td>
                    <span className={`badge ${
                      v.status === 'unused' ? 'badge-info' : 
                      v.status === 'used' ? 'badge-success' : 'badge-danger'
                    }`}>
                      {v.status === 'unused' && <Clock size={10} style={{marginRight: '4px'}} />}
                      {v.status === 'used' && <CheckCircle size={10} style={{marginRight: '4px'}} />}
                      {v.status === 'expired' && <XCircle size={10} style={{marginRight: '4px'}} />}
                      {v.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => window.open(`/admin/vouchers/print?ids=${v.id}`, '_blank')} className="btn btn-secondary btn-sm" style={{ padding: '5px 8px' }} title="Print"><Printer size={13} /></button>
                      <button onClick={() => handleDelete(v.id)} className="btn btn-danger btn-sm" style={{ padding: '5px 8px' }} title="Hapus"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Modal */}
      {showGenModal && (
        <div className="modal-overlay" onClick={() => setShowGenModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, color: '#f1f5f9' }}>Generate Voucher Masal</h3>
              <button onClick={() => setShowGenModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
            </div>
            <form onSubmit={handleGenerate}>
              <div className="modal-body" style={{ display: 'grid', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">Paket Internet *</label>
                    <select className="form-input" value={genForm.plan_id} onChange={e => setGenForm({...genForm, plan_id: e.target.value})} required>
                      <option value="">-- Pilih Paket --</option>
                      {plans.map(p => <option key={p.id} value={p.id}>{p.name_plan}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Router (Opsional)</label>
                    <select className="form-input" value={genForm.router_id} onChange={e => setGenForm({...genForm, router_id: e.target.value})}>
                      <option value="">-- Semua Router --</option>
                      {routers.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">Jumlah Voucher *</label>
                    <input type="number" className="form-input" value={genForm.quantity} onChange={e => setGenForm({...genForm, quantity: e.target.value})} required min="1" max="500" />
                  </div>
                  <div>
                    <label className="form-label">Tipe Login</label>
                    <select className="form-input" value={genForm.type} onChange={e => setGenForm({...genForm, type: e.target.value})}>
                      <option value="Hotspot">Hotspot</option>
                      <option value="PPPOE">PPPoE</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">Panjang Kode</label>
                    <input type="number" className="form-input" value={genForm.length} onChange={e => setGenForm({...genForm, length: e.target.value})} min="4" max="16" />
                  </div>
                  <div>
                    <label className="form-label">Prefix (Awalan)</label>
                    <input className="form-input" placeholder="Misal: WI-" value={genForm.prefix} onChange={e => setGenForm({...genForm, prefix: e.target.value})} />
                  </div>
                </div>

                <div style={{ background: 'rgba(59,130,246,0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.1)' }}>
                  <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    💡 Voucher yang digenerate di sini adalah <strong>stok voucher</strong> yang bisa digunakan oleh admin atau akan diambil otomatis saat pelanggan beli via storefront.
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowGenModal(false)} className="btn btn-secondary">Batal</button>
                <button type="submit" className="btn btn-primary" disabled={generating}>{generating ? 'Sedang Generate...' : 'Generate Sekarang'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
