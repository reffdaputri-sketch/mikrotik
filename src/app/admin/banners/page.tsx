'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Image as ImageIcon } from 'lucide-react'

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [title, setTitle] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => { fetchBanners() }, [])

  async function fetchBanners() {
    const res = await fetch('/api/admin/banners')
    const data = await res.json()
    setBanners(data.banners || [])
    setLoading(false)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.url) setImageUrl(data.url)
      else alert(data.error || 'Gagal memuat naik gambar')
    } catch { alert('Ralat semasa memuat naik') }
    finally { setUploading(false) }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!imageUrl) { alert('Gambar wajib diisi/dimuat naik!'); return }
    const payload = { title, image_url: imageUrl, link_url: linkUrl, is_active: isActive }
    const url = editingId ? `/api/admin/banners/${editingId}` : '/api/admin/banners'
    const method = editingId ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (res.ok) { setShowModal(false); fetchBanners(); resetForm() }
    else { const data = await res.json(); alert('Gagal: ' + data.error) }
  }

  async function handleDelete(id: number) {
    if (!confirm('Yakin mahu padam banner ini?')) return
    const res = await fetch(`/api/admin/banners/${id}`, { method: 'DELETE' })
    if (res.ok) fetchBanners()
  }

  function openEdit(banner: any) {
    setEditingId(banner.id); setTitle(banner.title); setImageUrl(banner.image_url)
    setLinkUrl(banner.link_url || ''); setIsActive(banner.is_active); setShowModal(true)
  }

  function resetForm() { setEditingId(null); setTitle(''); setImageUrl(''); setLinkUrl(''); setIsActive(true) }

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Banner Promosi</h1>
          <p className="page-subtitle">Urus paparan slaid promosi di halaman utama</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true) }}>
          <Plus size={18} /> Tambah Banner
        </button>
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            <div className="spinner" style={{ margin: '0 auto 10px' }}></div>Memuatkan data...
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Pratonton</th><th>Tajuk Promo</th><th>Status</th>
                <th style={{ textAlign: 'right' }}>Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {banners.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Tiada banner promosi lagi.</td></tr>
              ) : banners.map(b => (
                <tr key={b.id}>
                  <td>
                    <div style={{ width: '120px', height: '50px', borderRadius: '8px', background: `url(${b.image_url}) center/cover`, backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{b.title}</div>
                    {b.link_url && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Pautan: {b.link_url}</div>}
                  </td>
                  <td><span className={`badge ${b.is_active ? 'badge-success' : 'badge-danger'}`}>{b.is_active ? 'Aktif' : 'Tidak Aktif'}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(b)}><Edit size={14} /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(b.id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{editingId ? 'Edit Banner' : 'Tambah Banner Baharu'}</h2>
            </div>
            <form onSubmit={handleSave} className="modal-body">
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Tajuk Promo / Banner</label>
                <input type="text" className="form-input" required value={title} onChange={e => setTitle(e.target.value)} placeholder="Contoh: Promosi Akhir Tahun 50Mbps" />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Gambar Banner</label>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                    <ImageIcon size={14} /> {uploading ? 'Memuat naik...' : 'Muat Naik dari PC'}
                    <input type="file" hidden accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                  </label>
                </div>
                <input type="text" className="form-input" required value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="Atau tampal URL gambar di sini" />
                {imageUrl && <div style={{ marginTop: '12px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #334155' }}><img src={imageUrl} alt="Pratonton" style={{ width: '100%', display: 'block' }} /></div>}
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Pautan Destinasi (Pilihan)</label>
                <input type="text" className="form-input" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://..." />
                <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>Jika diklik, banner akan menuju ke pautan ini.</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                <input type="checkbox" id="isActive" style={{ width: '18px', height: '18px', cursor: 'pointer' }} checked={isActive} onChange={e => setIsActive(e.target.checked)} />
                <label htmlFor="isActive" style={{ fontSize: '0.875rem', cursor: 'pointer', color: '#e2e8f0' }}>Paparkan Banner ini di halaman utama</label>
              </div>
              <div className="modal-footer" style={{ marginTop: '24px', padding: 0 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={uploading}>{editingId ? 'Simpan Perubahan' : 'Cipta Banner'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
