'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Edit2, Trash2, Activity, RefreshCw } from 'lucide-react'

interface Bandwidth {
  id: number
  name_bw: string
  rate_down: number
  rate_down_unit: string
  rate_up: number
  rate_up_unit: string
}

export default function BandwidthsPage() {
  const [bandwidths, setBandwidths] = useState<Bandwidth[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editBw, setEditBw] = useState<Bandwidth | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name_bw: '',
    rate_down: '',
    rate_down_unit: 'Mbps',
    rate_up: '',
    rate_up_unit: 'Mbps',
  })

  const fetchBandwidths = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/bandwidths')
    const data = await res.json()
    setBandwidths(data.bandwidths || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchBandwidths()
  }, [fetchBandwidths])

  function openAdd() {
    setEditBw(null)
    setForm({ name_bw: '', rate_down: '', rate_down_unit: 'Mbps', rate_up: '', rate_up_unit: 'Mbps' })
    setShowModal(true)
  }

  function openEdit(bw: Bandwidth) {
    setEditBw(bw)
    setForm({
      name_bw: bw.name_bw,
      rate_down: String(bw.rate_down),
      rate_down_unit: bw.rate_down_unit,
      rate_up: String(bw.rate_up),
      rate_up_unit: bw.rate_up_unit,
    })
    setShowModal(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const method = editBw ? 'PUT' : 'POST'
    const url = editBw ? `/api/admin/bandwidths/${editBw.id}` : '/api/admin/bandwidths'
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    setSaving(false)
    setShowModal(false)
    fetchBandwidths()
  }

  async function handleDelete(id: number) {
    if (!confirm('Hapus bandwidth ini?')) return
    await fetch(`/api/admin/bandwidths/${id}`, { method: 'DELETE' })
    fetchBandwidths()
  }

  const filtered = bandwidths.filter(b =>
    b.name_bw.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">Profil Bandwidth</h1>
          <p className="page-subtitle">{bandwidths.length} profil terdaftar</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchBandwidths} className="btn btn-secondary btn-sm"><RefreshCw size={14} /></button>
          <button onClick={openAdd} className="btn btn-primary btn-sm">
            <Plus size={14} /> Tambah Bandwidth
          </button>
        </div>
      </div>

      <div style={{ position: 'relative', maxWidth: '320px', marginBottom: '20px' }}>
        <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
        <input className="form-input" style={{ paddingLeft: '36px' }} placeholder="Cari profil..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="glass-card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama Profil</th>
                <th>Download</th>
                <th>Upload</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: '#475569' }}>Loading...</td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: '#475569' }}>Belum ada profil bandwidth</td></tr>}
              {filtered.map(b => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 600, color: '#f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Activity size={14} style={{ color: '#10b981' }} />
                      {b.name_bw}
                    </div>
                  </td>
                  <td style={{ color: '#3b82f6', fontWeight: 600 }}>{b.rate_down} {b.rate_down_unit}</td>
                  <td style={{ color: '#8b5cf6', fontWeight: 600 }}>{b.rate_up} {b.rate_up_unit}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => openEdit(b)} className="btn btn-secondary btn-sm" style={{ padding: '5px 8px' }}><Edit2 size={13} /></button>
                      <button onClick={() => handleDelete(b.id)} className="btn btn-danger btn-sm" style={{ padding: '5px 8px' }}><Trash2 size={13} /></button>
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
              <h3 style={{ fontWeight: 700, color: '#f1f5f9' }}>{editBw ? 'Edit Bandwidth' : 'Tambah Bandwidth'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: 'grid', gap: '14px' }}>
                <div>
                  <label className="form-label">Nama Profil Bandwidth *</label>
                  <input className="form-input" placeholder="Contoh: 5Mbps" value={form.name_bw} onChange={e => setForm({ ...form, name_bw: e.target.value })} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">Rate Download *</label>
                    <input type="number" className="form-input" placeholder="5" value={form.rate_down} onChange={e => setForm({ ...form, rate_down: e.target.value })} required />
                  </div>
                  <div>
                    <label className="form-label">Satuan</label>
                    <select className="form-input" value={form.rate_down_unit} onChange={e => setForm({ ...form, rate_down_unit: e.target.value })}>
                      <option value="Kbps">Kbps</option>
                      <option value="Mbps">Mbps</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">Rate Upload *</label>
                    <input type="number" className="form-input" placeholder="5" value={form.rate_up} onChange={e => setForm({ ...form, rate_up: e.target.value })} required />
                  </div>
                  <div>
                    <label className="form-label">Satuan</label>
                    <select className="form-input" value={form.rate_up_unit} onChange={e => setForm({ ...form, rate_up_unit: e.target.value })}>
                      <option value="Kbps">Kbps</option>
                      <option value="Mbps">Mbps</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Batal</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Bandwidth'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
