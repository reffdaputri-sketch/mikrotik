'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { Plus, Edit, Trash2, Image as ImageIcon } from 'lucide-react'

export default function AdminNewsPage() {
  const [news, setNews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  
  // Form State
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchNews()
  }, [])

  async function fetchNews() {
    const res = await fetch('/api/admin/news')
    const data = await res.json()
    setNews(data.news || [])
    setLoading(false)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (data.url) {
        setImageUrl(data.url)
      } else {
        alert(data.error || 'Gagal upload gambar')
      }
    } catch (err) {
      alert('Terjadi kesalahan saat upload')
    } finally {
      setUploading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    
    const payload = { title, content, image_url: imageUrl, is_active: isActive }
    
    const url = editingId ? `/api/admin/news/${editingId}` : '/api/admin/news'
    const method = editingId ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (res.ok) {
      setShowModal(false)
      fetchNews()
      resetForm()
    } else {
      const data = await res.json()
      alert('Gagal: ' + data.error)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Yakin ingin menghapus berita ini?')) return
    const res = await fetch(`/api/admin/news/${id}`, { method: 'DELETE' })
    if (res.ok) fetchNews()
  }

  function openEdit(item: any) {
    setEditingId(item.id)
    setTitle(item.title)
    setContent(item.content)
    setImageUrl(item.image_url || '')
    setIsActive(item.is_active)
    setShowModal(true)
  }

  function resetForm() {
    setEditingId(null)
    setTitle('')
    setContent('')
    setImageUrl('')
    setIsActive(true)
  }

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Manajemen Berita & Informasi</h1>
          <p className="page-subtitle">Tulis pengumuman atau info terbaru untuk pelanggan</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => { resetForm(); setShowModal(true) }}
        >
          <Plus size={18} /> Tulis Berita
        </button>
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            <div className="spinner" style={{ margin: '0 auto 10px' }}></div>
            Memuat data...
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Cover</th>
                <th>Judul Berita</th>
                <th>Tanggal</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {news.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    Belum ada berita atau informasi yang dibuat.
                  </td>
                </tr>
              ) : (
                news.map(n => (
                  <tr key={n.id}>
                    <td>
                      {n.image_url ? (
                        <div style={{ 
                          width: '45px', height: '45px', borderRadius: '8px',
                          background: `url(${n.image_url}) center/cover`,
                          border: '1px solid #334155'
                        }} />
                      ) : (
                        <div style={{ 
                          width: '45px', height: '45px', borderRadius: '8px',
                          background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: '1px dashed #334155'
                        }}>
                          <ImageIcon size={16} color="#475569" />
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{n.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '250px' }}>
                        {n.content}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {new Date(n.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td>
                      <span className={`badge ${n.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {n.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(n)}>
                          <Edit size={14} />
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(n.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{editingId ? 'Edit Berita' : 'Tulis Berita Baru'}</h2>
            </div>
            <form onSubmit={handleSave} className="modal-body">
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Judul Berita</label>
                <input 
                  type="text" className="form-input" required
                  value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="Misal: Maintenance Jaringan Malam Ini"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Isi Berita / Konten</label>
                <textarea 
                  className="form-input" required rows={6}
                  value={content} onChange={e => setContent(e.target.value)}
                  placeholder="Tulis detail informasi di sini..."
                  style={{ resize: 'vertical' }}
                ></textarea>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Gambar Cover (Opsional)</label>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                    <ImageIcon size={14} /> {uploading ? 'Mengupload...' : 'Upload Gambar'}
                    <input type="file" hidden accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                  </label>
                </div>
                <input 
                  type="text" className="form-input"
                  value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                  placeholder="URL Gambar"
                />
                {imageUrl && (
                  <div style={{ marginTop: '12px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #334155', maxHeight: '200px' }}>
                    <img src={imageUrl} alt="Preview" style={{ width: '100%', display: 'block', objectFit: 'cover' }} />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                <input 
                  type="checkbox" id="isActive" style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  checked={isActive} onChange={e => setIsActive(e.target.checked)}
                />
                <label htmlFor="isActive" style={{ fontSize: '0.875rem', cursor: 'pointer', color: '#e2e8f0' }}>Berita Aktif (Ditampilkan ke pelanggan)</label>
              </div>

              <div className="modal-footer" style={{ marginTop: '24px', padding: 0 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  {editingId ? 'Simpan Perubahan' : 'Posting Berita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
