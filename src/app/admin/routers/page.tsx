'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Edit2, Trash2, Router, RefreshCw, Wifi, WifiOff, MapPin, Activity } from 'lucide-react'
import { timeAgo } from '@/lib/utils'

interface RouterData {
  id: number
  name: string
  ip_address: string
  username: string
  description?: string
  status: 'Online' | 'Offline'
  last_seen?: string
  enabled: boolean
}

export default function RoutersPage() {
  const [routers, setRouters] = useState<RouterData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editRouter, setEditRouter] = useState<RouterData | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: '',
    ip_address: '',
    username: '',
    password: '',
    description: '',
    enabled: true,
  })

  const fetchRouters = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/routers')
      const data = await res.json()
      setRouters(data.routers || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRouters()
  }, [fetchRouters])

  function openAdd() {
    setEditRouter(null)
    setForm({ name: '', ip_address: '', username: '', password: '', description: '', enabled: true })
    setShowModal(true)
  }

  function openEdit(r: RouterData) {
    setEditRouter(r)
    setForm({
      name: r.name,
      ip_address: r.ip_address,
      username: r.username,
      password: '', // Password not returned for security
      description: r.description || '',
      enabled: r.enabled,
    })
    setShowModal(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const method = editRouter ? 'PUT' : 'POST'
      const url = editRouter ? `/api/admin/routers/${editRouter.id}` : '/api/admin/routers'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setShowModal(false)
        fetchRouters()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Hapus router ini? Semua data terkait (paket, voucher) mungkin terpengaruh.')) return
    try {
      await fetch(`/api/admin/routers/${id}`, { method: 'DELETE' })
      fetchRouters()
    } catch (err) {
      console.error(err)
    }
  }

  const filtered = routers.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.ip_address.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">Router MikroTik</h1>
          <p className="page-subtitle">{routers.length} router terdaftar dalam sistem</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchRouters} className="btn btn-secondary btn-sm"><RefreshCw size={14} /></button>
          <button onClick={openAdd} className="btn btn-primary btn-sm">
            <Plus size={14} /> Tambah Router
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="glass-card" style={{ padding: '16px', marginBottom: '24px', borderLeft: '4px solid #3b82f6' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Activity size={20} style={{ color: '#3b82f6' }} />
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5 }}>
            Pastikan <strong>Local Agent</strong> sudah terinstall dan berjalan di jaringan lokal router ini agar perintah dapat dieksekusi secara otomatis.
          </p>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: '320px', marginBottom: '20px' }}>
        <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
        <input className="form-input" style={{ paddingLeft: '36px' }} placeholder="Cari nama atau IP..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Grid of Routers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {loading && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#475569' }}>Loading routers...</div>}
        {!loading && filtered.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#475569' }}>Belum ada router terdaftar</div>}
        
        {filtered.map(r => (
          <div key={r.id} className="glass-card" style={{ padding: '20px', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  width: '40px', height: '40px', borderRadius: '10px', 
                  background: r.status === 'Online' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Router size={20} color={r.status === 'Online' ? '#10b981' : '#ef4444'} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9' }}>{r.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#64748b' }}>
                    <MapPin size={10} /> {r.ip_address}
                  </div>
                </div>
              </div>
              <span className={`badge ${r.status === 'Online' ? 'badge-success' : 'badge-danger'}`}>
                {r.status === 'Online' ? <><Wifi size={10} style={{ marginRight: '4px' }} /> Online</> : <><WifiOff size={10} style={{ marginRight: '4px' }} /> Offline</>}
              </span>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '0.8rem', color: '#94a3b8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Username:</span>
                <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{r.username}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Terakhir Terlihat:</span>
                <span style={{ color: '#e2e8f0' }}>{r.last_seen ? timeAgo(r.last_seen) : 'Belum pernah'}</span>
              </div>
            </div>

            {r.description && (
              <p style={{ fontSize: '0.75rem', color: '#475569', marginBottom: '16px', fontStyle: 'italic' }}>
                "{r.description}"
              </p>
            )}

            <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #1e293b', paddingTop: '16px' }}>
              <button onClick={() => openEdit(r)} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                <Edit2 size={14} /> Edit
              </button>
              <button onClick={() => handleDelete(r.id)} className="btn btn-danger btn-sm" style={{ padding: '8px' }}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, color: '#f1f5f9' }}>{editRouter ? 'Edit Router' : 'Tambah Router Baru'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: 'grid', gap: '14px' }}>
                <div>
                  <label className="form-label">Nama Router *</label>
                  <input className="form-input" placeholder="Contoh: Router Pusat" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div>
                  <label className="form-label">IP Address / Hostname *</label>
                  <input className="form-input" placeholder="192.168.88.1" value={form.ip_address} onChange={e => setForm({ ...form, ip_address: e.target.value })} required />
                  <p style={{ fontSize: '0.65rem', color: '#475569', marginTop: '4px' }}>Gunakan IP lokal yang bisa diakses oleh Local Agent</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">RouterOS API User *</label>
                    <input className="form-input" placeholder="admin" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
                  </div>
                  <div>
                    <label className="form-label">RouterOS API Password</label>
                    <input type="password" className="form-input" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={!editRouter} />
                  </div>
                </div>
                <div>
                  <label className="form-label">Keterangan / Lokasi</label>
                  <textarea className="form-input" rows={2} placeholder="Misal: Lantai 2, Dekat Server" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem', color: '#94a3b8' }}>
                  <input type="checkbox" checked={form.enabled} onChange={e => setForm({ ...form, enabled: e.target.checked })} />
                  Aktifkan router ini
                </label>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Batal</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Router'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
