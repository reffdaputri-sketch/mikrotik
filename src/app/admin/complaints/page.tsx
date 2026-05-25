'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, RefreshCw, Trash2, CheckCircle, Clock } from 'lucide-react'

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchComplaints = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/complaints')
      const data = await res.json()
      setComplaints(data.complaints || [])
    } catch (e) {
      console.error('Error fetching complaints:', e)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchComplaints()
  }, [])

  const updateStatus = async (id: string, newStatus: string) => {
    if (!confirm(`Tukar status kepada ${newStatus}?`)) return
    
    try {
      const res = await fetch('/api/admin/complaints', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      })
      
      if (res.ok) {
        fetchComplaints()
      } else {
        alert('Gagal mengemas kini status')
      }
    } catch (e) {
      alert('Error updating status')
    }
  }

  const deleteComplaint = async (id: string) => {
    if (!confirm('Padam laporan ini secara kekal?')) return
    
    try {
      const res = await fetch(`/api/admin/complaints?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchComplaints()
      } else {
        alert('Gagal memadam laporan')
      }
    } catch (e) {
      alert('Error deleting complaint')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <span className="badge badge-warning" style={{ background: '#fef3c7', color: '#d97706', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>Menunggu</span>
      case 'in-progress':
        return <span className="badge badge-info" style={{ background: '#e0f2fe', color: '#0284c7', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>Diproses</span>
      case 'resolved':
      case 'selesai':
        return <span className="badge badge-success" style={{ background: '#dcfce7', color: '#16a34a', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>Selesai</span>
      default:
        return <span className="badge">{status}</span>
    }
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title"><MessageSquare size={24} style={{ marginRight: '10px' }} /> Laporan Gangguan</h1>
        <button onClick={fetchComplaints} className="btn btn-secondary btn-sm" disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} style={{ marginRight: '6px' }} /> Segar Semula
        </button>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Pelanggan</th>
                <th>Subjek</th>
                <th>Butiran</th>
                <th>Tarikh</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '30px' }}>
                    <RefreshCw className="animate-spin" style={{ margin: '0 auto', color: '#94a3b8' }} />
                  </td>
                </tr>
              ) : complaints.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    Tiada laporan ditemui.
                  </td>
                </tr>
              ) : (
                complaints.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{c.customers?.fullname || 'Unknown'}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>@{c.customers?.username}</div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{c.subject}</td>
                    <td style={{ maxWidth: '250px', whiteSpace: 'normal', fontSize: '13px' }}>
                      {c.description}
                    </td>
                    <td style={{ fontSize: '13px', color: '#64748b' }}>
                      {new Date(c.created_at).toLocaleString()}
                    </td>
                    <td>{getStatusBadge(c.status)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                        {c.status !== 'resolved' && c.status !== 'selesai' && (
                          <button
                            onClick={() => updateStatus(c.id, 'resolved')}
                            className="btn btn-sm"
                            style={{ background: '#dcfce7', color: '#16a34a', border: 'none' }}
                            title="Tandakan Selesai"
                          >
                            <CheckCircle size={14} />
                          </button>
                        )}
                        {c.status === 'pending' && (
                          <button
                            onClick={() => updateStatus(c.id, 'in-progress')}
                            className="btn btn-sm"
                            style={{ background: '#e0f2fe', color: '#0284c7', border: 'none' }}
                            title="Tandakan Sedang Diproses"
                          >
                            <Clock size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => deleteComplaint(c.id)}
                          className="btn btn-sm"
                          style={{ background: '#fee2e2', color: '#ef4444', border: 'none' }}
                          title="Padam"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
