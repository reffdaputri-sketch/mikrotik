'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Router, Users, Navigation, Search } from 'lucide-react'
import 'leaflet/dist/leaflet.css'

export default function MapsPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [routers, setRouters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const mapRef = useRef<any>(null)
  const LRef = useRef<any>(null)

  useEffect(() => {
    // Import Leaflet secara dinamis (karena butuh window)
    import('leaflet').then((L) => {
      LRef.current = L.default
      initMap()
    })

    async function fetchData() {
      const [resCust, resRouters] = await Promise.all([
        fetch('/api/admin/customers'),
        fetch('/api/admin/routers')
      ])
      const dataCust = await resCust.json()
      const dataRouters = await resRouters.json()
      setCustomers(dataCust.customers || [])
      setRouters(dataRouters.routers || [])
      setLoading(false)
    }
    fetchData()
  }, [])

  function initMap() {
    if (!LRef.current || mapRef.current) return

    const L = LRef.current
    
    // 1. Definisikan Layer Peta (Google Maps "Hack" Style)
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

    const dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CARTO'
    })

    // 2. Inisialisasi Map
    const map = L.map('map-container', {
      center: [3.1390, 101.6869],
      zoom: 13,
      layers: [googleStreets] // Default pakai Google Streets
    })
    
    // 3. Tambah Kontrol Layer
    const baseMaps = {
      "Google Streets": googleStreets,
      "Google Satellite": googleSatellite,
      "Google Hybrid": googleHybrid,
      "Dark Mode (Premium)": dark
    }
    L.control.layers(baseMaps).addTo(map)

    mapRef.current = map
  }

  // Update markers saat data sudah ada
  useEffect(() => {
    if (!mapRef.current || !LRef.current || loading) return
    const L = LRef.current
    const map = mapRef.current

    // Clear existing markers (simpelnya kita simpan di layer group kalau mau pro, tapi ini buat demo)
    
    // 1. Tambah Marker Router (Merah)
    routers.forEach(r => {
      if (r.coordinates) {
        const [lat, lng] = r.coordinates.split(',').map(Number)
        if (!isNaN(lat) && !isNaN(lng)) {
          const icon = L.divIcon({
            html: `<div style="background: #ef4444; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; display: flex; alignItems: center; justifyContent: center; color: white; box-shadow: 0 0 10px rgba(239,68,68,0.5)"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><path d="M6 14v-4a6 6 0 0 1 12 0v4"></path><line x1="12" y1="2" x2="12" y2="8"></line></svg></div>`,
            className: '',
            iconSize: [30, 30]
          })
          L.marker([lat, lng], { icon })
            .addTo(map)
            .bindPopup(`<b>Router: ${r.name}</b><br>${r.ip_address || ''}`)
        }
      }
    })

    // 2. Tambah Marker Pelanggan (Biru)
    customers.forEach(c => {
      if (c.coordinates) {
        const [lat, lng] = c.coordinates.split(',').map(Number)
        if (!isNaN(lat) && !isNaN(lng)) {
          const icon = L.divIcon({
            html: `<div style="background: #3b82f6; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; alignItems: center; justifyContent: center; color: white; box-shadow: 0 0 8px rgba(59,130,246,0.5)"><svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>`,
            className: '',
            iconSize: [24, 24]
          })
          L.marker([lat, lng], { icon })
            .addTo(map)
            .bindPopup(`<b>Pelanggan: ${c.fullname}</b><br>Status: ${c.status}`)
        }
      }
    })

  }, [loading, customers, routers])

  return (
    <div className="page-content" style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header" style={{ marginBottom: '16px' }}>
        <div>
          <h1 className="page-title">Geo-Location Map</h1>
          <p className="page-subtitle">Peta sebaran router dan pelanggan NuxBill</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '16px', flex: 1 }}>
        {/* Sidebar Info */}
        <div className="glass-card" style={{ padding: '20px', overflowY: 'auto' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Navigation size={16} color="#3b82f6" /> Legenda Peta
          </h3>
          
          <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }}></div>
              <span style={{ fontSize: '13px' }}>Router ({routers.filter(r => r.coordinates).length})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#3b82f6' }}></div>
              <span style={{ fontSize: '13px' }}>Pelanggan ({customers.filter(c => c.coordinates).length})</span>
            </div>
          </div>

          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>Cari Lokasi</h3>
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input className="form-input" placeholder="Nama pelanggan..." style={{ paddingLeft: '32px', fontSize: '13px' }} />
          </div>

          <div style={{ fontSize: '11px', color: '#64748b', background: 'rgba(59,130,246,0.05)', padding: '12px', borderRadius: '8px', lineHeight: 1.6 }}>
            💡 <b>Tips:</b> Koordinat pelanggan bisa diatur melalui menu "Edit Pelanggan". Gunakan format <code>lat,lng</code>.
          </div>
        </div>

        {/* Map Container */}
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden', position: 'relative' }}>
          <div id="map-container" style={{ width: '100%', height: '100%', zIndex: 1 }}></div>
          {loading && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.8)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              Memuat Peta...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
