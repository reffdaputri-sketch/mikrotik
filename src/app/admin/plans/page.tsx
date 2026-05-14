'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Edit2, Trash2, Package, RefreshCw } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Plan {
  id: number
  name_plan: string
  price: number
  price_old: number
  type: string
  typebp: string
  validity: number
  validity_unit: string
  data_limit?: number
  data_unit?: string
  enabled: boolean
  is_public: boolean
  description?: string
  id_bw?: number
  router_id?: number
  bandwidths?: { name_bw: string; rate_down: number; rate_down_unit: string }
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editPlan, setEditPlan] = useState<Plan | null>(null)
  const [saving, setSaving] = useState(false)
  const [routers, setRouters] = useState<{ id: number; name: string }[]>([])
  const [bandwidths, setBandwidths] = useState<{ id: number; name_bw: string; rate_down: number; rate_down_unit: string }[]>([])

  const [form, setForm] = useState({
    name_plan: '', price: '', price_old: '', type: 'Hotspot',
    typebp: 'Unlimited', validity: '30', validity_unit: 'Days',
    data_limit: '', data_unit: 'GB', router_id: '', id_bw: '',
    description: '', enabled: true, is_public: true,
  })

  const fetchPlans = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/plans')
    const data = await res.json()
    setPlans(data.plans || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchPlans()
    fetch('/api/admin/routers').then(r => r.json()).then(d => setRouters(d.routers || []))
    fetch('/api/admin/bandwidths').then(r => r.json()).then(d => setBandwidths(d.bandwidths || []))
  }, [fetchPlans])

  function openAdd() {
    setEditPlan(null)
    setForm({ name_plan: '', price: '', price_old: '', type: 'Hotspot', typebp: 'Unlimited', validity: '30', validity_unit: 'Days', data_limit: '', data_unit: 'GB', router_id: '', id_bw: '', description: '', enabled: true, is_public: true })
    setShowModal(true)
  }

  function openEdit(p: Plan) {
    setEditPlan(p)
    setForm({
      name_plan: p.name_plan, price: String(p.price), price_old: String(p.price_old || ''),
      type: p.type, typebp: p.typebp || 'Unlimited', validity: String(p.validity),
      validity_unit: p.validity_unit, data_limit: String(p.data_limit || ''),
      data_unit: p.data_unit || 'GB', router_id: String(p.router_id || ''), 
      id_bw: String(p.id_bw || ''),
      description: p.description || '', enabled: p.enabled, is_public: p.is_public,
    })
    setShowModal(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const method = editPlan ? 'PUT' : 'POST'
    const url = editPlan ? `/api/admin/plans/${editPlan.id}` : '/api/admin/plans'
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false)
    setShowModal(false)
    fetchPlans()
  }

  async function handleDelete(id: number) {
    if (!confirm('Hapus paket ini?')) return
    await fetch(`/api/admin/plans/${id}`, { method: 'DELETE' })
    fetchPlans()
  }

  const filtered = plans.filter(p =>
    p.name_plan.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">Paket Internet</h1>
          <p className="page-subtitle">{plans.length} paket terdaftar</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchPlans} className="btn btn-secondary btn-sm"><RefreshCw size={14} /></button>
          <button onClick={openAdd} className="btn btn-primary btn-sm" id="add-plan-btn">
            <Plus size={14} /> Tambah Paket
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: '320px', marginBottom: '20px' }}>
        <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
        <input className="form-input" style={{ paddingLeft: '36px' }} placeholder="Cari paket..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div className="glass-card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama Paket</th>
                <th>Tipe</th>
                <th>Bandwidth</th>
                <th>Masa Aktif</th>
                <th>Harga</th>
                <th>Status</th>
                <th>Publik</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#475569' }}>Loading...</td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#475569' }}>Belum ada paket</td></tr>}
              {filtered.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600, color: '#f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Package size={14} style={{ color: '#3b82f6' }} />
                      {p.name_plan}
                    </div>
                  </td>
                  <td><span className={`badge ${p.type === 'Hotspot' ? 'badge-info' : 'badge-purple'}`}>{p.type}</span></td>
                  <td style={{ color: '#60a5fa', fontWeight: 600 }}>{p.bandwidths?.name_bw || '-'}</td>
                  <td>{p.validity} {p.validity_unit}</td>
                  <td style={{ color: '#10b981', fontWeight: 700 }}>{formatCurrency(p.price)}</td>
                  <td><span className={`badge ${p.enabled ? 'badge-success' : 'badge-danger'}`}>{p.enabled ? 'Aktif' : 'Nonaktif'}</span></td>
                  <td><span className={`badge ${p.is_public ? 'badge-success' : 'badge-warning'}`}>{p.is_public ? 'Ya' : 'Tersembunyi'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => openEdit(p)} className="btn btn-secondary btn-sm" style={{ padding: '5px 8px' }}><Edit2 size={13} /></button>
                      <button onClick={() => handleDelete(p.id)} className="btn btn-danger btn-sm" style={{ padding: '5px 8px' }}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, color: '#f1f5f9' }}>{editPlan ? 'Edit Paket' : 'Tambah Paket'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: 'grid', gap: '14px' }}>
                <div>
                  <label className="form-label">Nama Paket *</label>
                  <input className="form-input" placeholder="Contoh: Paket 5Mbps 30 Hari" value={form.name_plan} onChange={e => setForm({ ...form, name_plan: e.target.value })} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">Tipe</label>
                    <select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                      <option value="Hotspot">Hotspot</option>
                      <option value="PPPOE">PPPoE</option>
                      <option value="Balance">Balance</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Jenis</label>
                    <select className="form-input" value={form.typebp} onChange={e => setForm({ ...form, typebp: e.target.value })}>
                      <option value="Unlimited">Unlimited</option>
                      <option value="Limited">Limited</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">Harga (RM) *</label>
                    <input type="number" className="form-input" placeholder="15000" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
                  </div>
                  <div>
                    <label className="form-label">Harga Coret</label>
                    <input type="number" className="form-input" placeholder="20000" value={form.price_old} onChange={e => setForm({ ...form, price_old: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">Masa Aktif *</label>
                    <input type="number" className="form-input" placeholder="30" value={form.validity} onChange={e => setForm({ ...form, validity: e.target.value })} required />
                  </div>
                  <div>
                    <label className="form-label">Satuan</label>
                    <select className="form-input" value={form.validity_unit} onChange={e => setForm({ ...form, validity_unit: e.target.value })}>
                      <option value="Mins">Menit</option>
                      <option value="Hrs">Jam</option>
                      <option value="Days">Hari</option>
                      <option value="Months">Bulan</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="form-label">Bandwidth</label>
                  <select className="form-input" value={form.id_bw} onChange={e => setForm({ ...form, id_bw: e.target.value })}>
                    <option value="">-- Pilih Bandwidth --</option>
                    {bandwidths.map(b => <option key={b.id} value={b.id}>{b.name_bw} ({b.rate_down}{b.rate_down_unit})</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Router</label>
                  <select className="form-input" value={form.router_id} onChange={e => setForm({ ...form, router_id: e.target.value })}>
                    <option value="">-- Pilih Router --</option>
                    {routers.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Deskripsi</label>
                  <textarea className="form-input" rows={2} placeholder="Deskripsi singkat paket..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem', color: '#94a3b8' }}>
                    <input type="checkbox" checked={form.enabled} onChange={e => setForm({ ...form, enabled: e.target.checked })} />
                    Aktifkan paket
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem', color: '#94a3b8' }}>
                    <input type="checkbox" checked={form.is_public} onChange={e => setForm({ ...form, is_public: e.target.checked })} />
                    Tampilkan di storefront
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Batal</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Paket'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
