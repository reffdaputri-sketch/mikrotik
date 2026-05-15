'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Ticket, ArrowLeft, Save, RefreshCw, Zap, Info } from 'lucide-react'

export default function GenerateVoucherPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [plans, setPlans] = useState<any[]>([])
  const [routers, setRouters] = useState<any[]>([])
  
  const [form, setForm] = useState({
    plan_id: '',
    router_id: '',
    quantity: '10',
    type: 'Hotspot',
    length: '8',
    prefix: '',
    char_type: 'ALPHANUMERIC' // ALPHANUMERIC, NUMERIC, UPPERCASE
  })

  useEffect(() => {
    fetch('/api/admin/plans').then(r => r.json()).then(d => setPlans(d.plans || []))
    fetch('/api/admin/routers').then(r => r.json()).then(d => setRouters(d.routers || []))
  }, [])

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/admin/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        alert('Baucar berjaya dijana!')
        router.push('/admin/vouchers')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={() => router.back()} className="btn btn-secondary btn-sm" style={{ padding: '8px' }}>
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="page-title">Jana Baucar Pukal</h1>
          <p className="page-subtitle">Cipta ribuan baucar sekaligus untuk stok fizikal</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        <div className="glass-card" style={{ padding: '24px' }}>
          <form onSubmit={handleGenerate} style={{ display: 'grid', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', borderBottom: '1px solid #1e293b', paddingBottom: '12px' }}>
              <Zap size={20} color="#fbbf24" />
              <h3 style={{ fontWeight: 700, color: '#f1f5f9' }}>Konfigurasi Baucar</h3>
            </div>

            <div>
              <label className="form-label">Pilih Pakej Internet *</label>
              <select className="form-input" value={form.plan_id} onChange={e => setForm({...form, plan_id: e.target.value})} required>
                <option value="">-- Pilih Pakej --</option>
                {plans.map(p => <option key={p.id} value={p.id}>{p.name_plan} ({p.type})</option>)}
              </select>
            </div>

            <div>
              <label className="form-label">Router (Pilihan)</label>
              <select className="form-input" value={form.router_id} onChange={e => setForm({...form, router_id: e.target.value})}>
                <option value="">-- Semua Router --</option>
                {routers.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label className="form-label">Bilangan Baucar</label>
                <input type="number" className="form-input" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} min="1" max="1000" />
              </div>
              <div>
                <label className="form-label">Jenis Log Masuk</label>
                <select className="form-input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                  <option value="Hotspot">Hotspot</option>
                  <option value="PPPOE">PPPoE</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label className="form-label">Panjang Kod</label>
                <input type="number" className="form-input" value={form.length} onChange={e => setForm({...form, length: e.target.value})} min="4" max="16" />
              </div>
              <div>
                <label className="form-label">Jenis Karakter</label>
                <select className="form-input" value={form.char_type} onChange={e => setForm({...form, char_type: e.target.value})}>
                  <option value="ALPHANUMERIC">Huruf & Nombor</option>
                  <option value="UPPERCASE">Hanya Huruf Besar</option>
                  <option value="NUMERIC">Hanya Nombor</option>
                </select>
              </div>
            </div>

            <div>
              <label className="form-label">Awalan Kod (Prefix)</label>
              <input className="form-input" placeholder="Contoh: WI-" value={form.prefix} onChange={e => setForm({...form, prefix: e.target.value})} />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '12px' }}>
              {loading ? <><RefreshCw size={18} className="animate-spin" style={{marginRight: '8px'}}/> Menjana...</> : <><Ticket size={18} style={{marginRight: '8px'}}/> Jana Sekarang</>}
            </button>
          </form>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Info size={20} color="#60a5fa" />
              <h3 style={{ fontWeight: 700, color: '#f1f5f9' }}>Tips & Maklumat</h3>
            </div>
            <ul style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.6', display: 'grid', gap: '12px' }}>
              <li>• Baucar yang dijana akan berstatus <strong>unused</strong> (belum digunakan).</li>
              <li>• Gunakan <strong>Prefix</strong> untuk membezakan stok baucar antara jurujual atau lokasi.</li>
              <li>• Jika <strong>Router</strong> tidak dipilih, baucar boleh digunakan di mana-mana router yang mempunyai pakej dengan nama yang sama.</li>
              <li>• Kod baucar akan dijana secara rawak untuk mengelakkan percubaan tekaan oleh pengguna.</li>
            </ul>
          </div>

          <div className="glass-card" style={{ padding: '24px', borderLeft: '4px solid #4ade80' }}>
            <h4 style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: '8px' }}>Anggaran Selesai</h4>
            <p style={{ color: '#64748b', fontSize: '0.8rem' }}>
              Sistem kami mampu menjana 1000 baucar dalam masa kurang dari 2 saat.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
