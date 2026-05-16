'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Users, Search, Plus, Edit2, Trash2, RefreshCw, UserCheck, UserX, Mail, Phone, MapPin, Navigation, Map as MapIcon, X, Wallet } from 'lucide-react'
import { formatCurrency, timeAgo } from '@/lib/utils'

interface Customer {
  id: number
  username: string
  fullname: string
  email?: string
  phonenumber?: string
  status: 'Active' | 'Banned' | 'Disabled' | 'Inactive'
  balance: number
  service_type: string
  expired_at?: string
  auto_cut: boolean
  created_at: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showMapPicker, setShowMapPicker] = useState(false)
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null)
  const [saving, setSaving] = useState(false)
  const [plans, setPlans] = useState<any[]>([])
  const [routers, setRouters] = useState<any[]>([])
  const [showTopupModal, setShowTopupModal] = useState(false)
  const [selectedCustomerForTopup, setSelectedCustomerForTopup] = useState<Customer | null>(null)
  const [topupAmount, setTopupAmount] = useState('')
  const [topupLoading, setTopupLoading] = useState(false)

  const [form, setForm] = useState({
    username: '', password: '', fullname: '', email: '',
    phonenumber: '', address: '', service_type: 'Others',
    balance: '0', status: 'Active', expired_at: '', auto_cut: true,
    plan_id: '', router_id: '', coordinates: ''
  })

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/customers')
    const data = await res.json()
    setCustomers(data.customers || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchCustomers()
    fetch('/api/admin/plans?type=PPPOE').then(r => r.json()).then(d => setPlans(d.plans || []))
    fetch('/api/admin/routers').then(r => r.json()).then(d => setRouters(d.routers || []))
  }, [fetchCustomers])

  function openAdd() {
    setEditCustomer(null)
    setForm({ username: '', password: '', fullname: '', email: '', phonenumber: '', address: '', service_type: 'Others', balance: '0', status: 'Active', expired_at: '', auto_cut: true, plan_id: '', router_id: '', coordinates: '' })
    setShowModal(true)
  }

  function openEdit(c: any) {
    setEditCustomer(c)
    setForm({
      username: c.username,
      password: '', // Biarkan kosong kalau nggak mau ganti
      fullname: c.fullname,
      email: c.email || '',
      phonenumber: c.phonenumber || '',
      address: '', 
      service_type: c.service_type,
      balance: String(c.balance),
      status: c.status,
      expired_at: c.expired_at ? c.expired_at.split('T')[0] : '',
      auto_cut: c.auto_cut,
      plan_id: String(c.plan_id || ''),
      router_id: String(c.router_id || ''),
      coordinates: c.coordinates || ''
    })
    setShowModal(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const method = editCustomer ? 'PUT' : 'POST'
    const url = editCustomer ? `/api/admin/customers/${editCustomer.id}` : '/api/admin/customers'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    if (res.ok) {
      setShowModal(false)
      fetchCustomers()
    }
    setSaving(false)
  }

  async function handleRenew(c: Customer) {
    if (!confirm(`Lanjutkan tempoh aktif ${c.fullname} selama 1 bulan?`)) return
    
    setLoading(true)
    const res = await fetch(`/api/admin/customers/${c.id}/renew`, { method: 'POST' })
    const data = await res.json()
    if (res.ok) {
      alert('Tempoh aktif berjaya dilanjutkan!')
      fetchCustomers()
    } else {
      alert('Gagal: ' + (data.error || 'Ralat sistem'))
    }
    setLoading(false)
  }

  async function handleCashTopup(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCustomerForTopup || !topupAmount) return
    
    setTopupLoading(true)
    const res = await fetch(`/api/admin/customers/${selectedCustomerForTopup.id}/topup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: parseFloat(topupAmount) })
    })

    if (res.ok) {
      alert(`Berhasil menambah saldo RM ${topupAmount} untuk ${selectedCustomerForTopup.fullname}`)
      setShowTopupModal(false)
      setTopupAmount('')
      fetchCustomers()
    } else {
      const data = await res.json()
      alert('Gagal: ' + (data.error || 'Ralat sistem'))
    }
    setTopupLoading(false)
  }

  const filtered = customers.filter(c =>
    c.fullname.toLowerCase().includes(search.toLowerCase()) ||
    c.username.toLowerCase().includes(search.toLowerCase()) ||
    c.phonenumber?.includes(search)
  )

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">Senarai Pelanggan</h1>
          <p className="page-subtitle">{customers.length} pelanggan berdaftar</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchCustomers} className="btn btn-secondary btn-sm"><RefreshCw size={14} /></button>
          <button onClick={openAdd} className="btn btn-primary btn-sm">
            <Plus size={14} /> Tambah Pelanggan
          </button>
        </div>
      </div>

      <div style={{ position: 'relative', maxWidth: '320px', marginBottom: '20px' }}>
        <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
        <input className="form-input" style={{ paddingLeft: '36px' }} placeholder="Cari nama, username, atau nombor telefon..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="glass-card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Pelanggan</th>
                <th>Hubungi</th>
                <th>Jenis</th>
                <th>Baki</th>
                <th>Status</th>
                <th>Tempoh Aktif</th>
                <th>Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#475569' }}>Memuatkan...</td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#475569' }}>Tiada pelanggan dijumpai</td></tr>}
              {filtered.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'white' }}>
                        {c.fullname[0]}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{c.fullname}</span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>@{c.username}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {c.phonenumber && <div style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={10} /> {c.phonenumber}</div>}
                      {c.email && <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={10} /> {c.email}</div>}
                    </div>
                  </td>
                  <td><span className="badge badge-info">{c.service_type}</span></td>
                  <td><span style={{ fontWeight: 700, color: '#10b981' }}>{formatCurrency(c.balance)}</span></td>
                  <td>
                    <span className={`badge ${c.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                      {c.status === 'Active' ? <UserCheck size={10} style={{marginRight: '4px'}}/> : <UserX size={10} style={{marginRight: '4px'}}/>}
                      {c.status}
                    </span>
                  </td>
                  <td>
                    {c.expired_at ? (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ 
                          fontSize: '0.85rem', 
                          fontWeight: 700, 
                          color: new Date(c.expired_at) < new Date() ? '#f87171' : '#60a5fa' 
                        }}>
                          {new Date(c.expired_at).toLocaleDateString('ms-MY')}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: '#64748b' }}>
                          {c.auto_cut ? 'Auto-Cut On' : 'Auto-Cut Off'}
                        </span>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#475569' }}>-</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => handleRenew(c)} title="Lanjutkan 1 Bulan" className="btn btn-primary btn-sm" style={{ padding: '5px 8px', background: '#16a34a' }}>
                        <RefreshCw size={13} />
                      </button>
                       <button onClick={() => { setSelectedCustomerForTopup(c); setShowTopupModal(true); }} title="Isi Saldo Cash" className="btn btn-secondary btn-sm" style={{ padding: '5px 8px', background: '#fbbf24', borderColor: '#fbbf24' }}>
                        <Wallet size={13} color="white" />
                      </button>
                      <button onClick={() => openEdit(c)} className="btn btn-secondary btn-sm" style={{ padding: '5px 8px' }}><Edit2 size={13} /></button>
                      <button className="btn btn-danger btn-sm" style={{ padding: '5px 8px' }}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal (Simplified) */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, color: '#f1f5f9' }}>{editCustomer ? 'Edit Pelanggan' : 'Tambah Pelanggan Baharu'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: 'grid', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">Username *</label>
                    <input className="form-input" placeholder="johndoe" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
                  </div>
                  <div>
                    <label className="form-label">Password *</label>
                    <input type="password" className="form-input" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                  </div>
                </div>
                <div>
                  <label className="form-label">Nama Penuh *</label>
                  <input className="form-input" placeholder="Ahmad bin Ali" value={form.fullname} onChange={e => setForm({ ...form, fullname: e.target.value })} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">Nombor WhatsApp</label>
                    <input className="form-input" placeholder="0123456789" value={form.phonenumber} onChange={e => setForm({ ...form, phonenumber: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">Email</label>
                    <input type="email" className="form-input" placeholder="john@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="form-label">Koordinat Lokasi (Lat, Lng)</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      className="form-input" 
                      placeholder="Contoh: -6.1234, 106.1234" 
                      value={form.coordinates || ''} 
                      onChange={e => setForm({ ...form, coordinates: e.target.value })} 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowMapPicker(true)}
                      className="btn btn-secondary" 
                      style={{ padding: '0 12px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <MapIcon size={14} /> Pilih di Peta
                    </button>
                  </div>
                  <p style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                    Klik tombol untuk memilih lokasi dari peta secara langsung.
                  </p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">Jenis Perkhidmatan</label>
                    <select className="form-input" value={form.service_type} onChange={e => setForm({ ...form, service_type: e.target.value })}>
                      <option value="Hotspot">Hotspot</option>
                      <option value="PPPoE">PPPoE</option>
                      <option value="Others">Lain-lain</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Status</label>
                    <select className="form-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                      <option value="Active">Aktif</option>
                      <option value="Inactive">Tidak Aktif</option>
                      <option value="Banned">Disekat</option>
                    </select>
                  </div>
                </div>
                {form.service_type === 'PPPoE' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(59,130,246,0.05)', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Pilih Pakej PPPoE</label>
                      <select className="form-input" value={form.plan_id} onChange={e => {
                        const plan = plans.find(p => p.id === parseInt(e.target.value))
                        const exp = new Date()
                        if (plan) {
                          if (plan.validity_unit === 'Months') exp.setMonth(exp.getMonth() + parseInt(plan.validity))
                          else exp.setDate(exp.getDate() + parseInt(plan.validity))
                        }
                        setForm({ ...form, plan_id: e.target.value, expired_at: exp.toISOString().split('T')[0] })
                      }}>
                        <option value="">-- Pilih Pakej --</option>
                        {plans.map(p => <option key={p.id} value={p.id}>{p.name_plan} ({formatCurrency(p.price)})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Pilih Router</label>
                      <select className="form-input" value={form.router_id} onChange={e => setForm({ ...form, router_id: e.target.value })}>
                        <option value="">-- Pilih Router --</option>
                        {routers.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Tempoh Aktif (Tamat)</label>
                      <input type="date" className="form-input" value={form.expired_at} onChange={e => setForm({ ...form, expired_at: e.target.value })} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '10px' }}>
                      <input type="checkbox" checked={form.auto_cut} onChange={e => setForm({ ...form, auto_cut: e.target.checked })} />
                      <label className="form-label" style={{ marginBottom: 0 }}>Auto-Cut</label>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Batal</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Pelanggan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cash Topup Modal */}
      {showTopupModal && selectedCustomerForTopup && (
        <div className="modal-overlay" onClick={() => setShowTopupModal(false)}>
          <div className="modal-box" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, color: '#f1f5f9' }}>Top Up Saldo Cash</h3>
              <button onClick={() => setShowTopupModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
            </div>
            <form onSubmit={handleCashTopup}>
              <div className="modal-body">
                <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Pelanggan:</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f1f5f9' }}>{selectedCustomerForTopup.fullname}</div>
                </div>
                <label className="form-label">Jumlah Top Up (RM)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  style={{ height: '50px', fontSize: '20px', fontWeight: 800, textAlign: 'center' }}
                  placeholder="0.00"
                  value={topupAmount} 
                  onChange={e => setTopupAmount(e.target.value)} 
                  required 
                  autoFocus
                />
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowTopupModal(false)} className="btn btn-secondary">Batal</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#10b981', borderColor: '#10b981' }} disabled={topupLoading}>
                  {topupLoading ? 'Memproses...' : 'ISI SALDO SEKARANG'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Map Picker Modal */}
      {showMapPicker && (
        <LocationPickerModal 
          initialValue={form.coordinates} 
          onSelect={(coords) => {
            setForm({ ...form, coordinates: coords })
            setShowMapPicker(false)
          }} 
          onClose={() => setShowMapPicker(false)} 
        />
      )}
    </div>
  )
}

function LocationPickerModal({ initialValue, onSelect, onClose }: { initialValue: string, onSelect: (c: string) => void, onClose: () => void }) {
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [L, setL] = useState<any>(null)

  useEffect(() => {
    import('leaflet').then(leaflet => {
      setL(leaflet.default)
    })
  }, [])

  useEffect(() => {
    if (!L) return
    
    let defaultPos: [number, number] = [3.1390, 101.6869] // KL
    if (initialValue) {
      const parts = initialValue.split(',').map(Number)
      if (parts.length === 2 && !isNaN(parts[0])) defaultPos = [parts[0], parts[1]]
    }

    const map = L.map('picker-map').setView(defaultPos, 13)
    
    // Google Maps Layers
    const googleStreets = L.tileLayer('https://{s}.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}&s=Ga', {
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; Google Maps'
    })

    const googleSatellite = L.tileLayer('https://{s}.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}&s=Ga', {
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; Google Maps'
    })

    const googleHybrid = L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&hl=en&x={x}&y={y}&z={z}&s=Ga', {
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; Google Maps'
    })

    // Add default layer
    googleStreets.addTo(map)

    // Add Layer Control
    L.control.layers({
      "Google Streets": googleStreets,
      "Google Satellite": googleSatellite,
      "Google Hybrid": googleHybrid
    }).addTo(map)
    
    const marker = L.marker(defaultPos, { draggable: true }).addTo(map)
    markerRef.current = marker
    mapRef.current = map

    map.on('click', (e: any) => {
      marker.setLatLng(e.latlng)
    })

    return () => map.remove()
  }, [L])

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div className="modal-box" style={{ maxWidth: '800px', width: '95%', height: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <h3 style={{ fontWeight: 700, color: '#f1f5f9' }}>Pilih Lokasi di Peta</h3>
          <button onClick={onClose} className="btn-close"><X size={20}/></button>
        </div>
        <div style={{ flex: 1, position: 'relative', background: '#0f172a' }}>
          <div id="picker-map" style={{ height: '100%', width: '100%' }}></div>
          <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, pointerEvents: 'none' }}>
            <div style={{ background: 'rgba(15,23,42,0.9)', padding: '8px 16px', borderRadius: '20px', color: 'white', fontSize: '12px', border: '1px solid #16a34a' }}>
              Klik pada peta atau geser pin untuk tentukan lokasi
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">Batal</button>
          <button 
            onClick={() => {
              const pos = markerRef.current.getLatLng()
              onSelect(`${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`)
            }} 
            className="btn btn-primary"
          >
            Gunakan Lokasi Ini
          </button>
        </div>
      </div>
    </div>
  )
}
