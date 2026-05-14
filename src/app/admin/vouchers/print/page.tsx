'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Printer, ArrowLeft, Download } from 'lucide-react'
import QRCode from 'qrcode'

function PrintContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [vouchers, setVouchers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [qrCodes, setQrCodes] = useState<any>({})

  useEffect(() => {
    const ids = searchParams.get('ids')
    const planId = searchParams.get('plan_id')
    
    let url = '/api/admin/vouchers'
    if (ids) url += `?ids=${ids}`
    else if (planId) url += `?plan_id=${planId}&status=unused&limit=50`

    fetch(url)
      .then(r => r.json())
      .then(async data => {
        const list = data.vouchers || []
        setVouchers(list)
        
        // Generate QR Codes
        const qrs: any = {}
        for (const v of list) {
          try {
            qrs[v.id] = await QRCode.toDataURL(v.code)
          } catch (err) {
            console.error(err)
          }
        }
        setQrCodes(qrs)
        setLoading(false)
      })
  }, [searchParams])

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Menyiapkan dokumen cetak...</div>

  return (
    <div className="print-page">
      {/* Controls - Hidden during print */}
      <div className="no-print" style={{ 
        position: 'fixed', top: 0, left: 0, right: 0, 
        background: '#0f172a', padding: '12px 24px', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        zIndex: 100, borderBottom: '1px solid #1e293b'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <ArrowLeft size={20} />
          </button>
          <span style={{ fontWeight: 600, color: '#f1f5f9' }}>Print {vouchers.length} Voucher</span>
        </div>
        <button onClick={() => window.print()} className="btn btn-primary" style={{ padding: '8px 20px' }}>
          <Printer size={16} style={{ marginRight: '8px' }} /> Cetak Sekarang
        </button>
      </div>

      <div className="print-grid" style={{ paddingTop: '80px', padding: '20px' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
          gap: '15px' 
        }}>
          {vouchers.map(v => (
            <div key={v.id} className="voucher-card-print" style={{
              border: '2px dashed #000',
              padding: '12px',
              background: '#fff',
              color: '#000',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              pageBreakInside: 'avoid',
              position: 'relative',
              minHeight: '220px'
            }}>
              <div style={{ fontSize: '12px', fontWeight: 800, marginBottom: '5px', textTransform: 'uppercase' }}>
                {v.plans?.name_plan || 'Internet Voucher'}
              </div>
              
              <div style={{ margin: '8px 0' }}>
                {qrCodes[v.id] && <img src={qrCodes[v.id]} alt="QR" style={{ width: '80px', height: '80px' }} />}
              </div>

              <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>KODE VOUCHER</div>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: 900, 
                letterSpacing: '2px', 
                background: '#eee', 
                padding: '4px 10px', 
                borderRadius: '4px',
                width: '100%',
                marginBottom: '8px'
              }}>
                {v.code}
              </div>

              <div style={{ fontSize: '9px', lineHeight: '1.2', color: '#333', marginBottom: '4px' }}>
                Hubungkan ke WiFi, lalu masukkan kode di atas pada halaman login.
              </div>

              <div style={{ fontSize: '11px', fontWeight: 800, color: '#10b981' }}>
                HARGA: RM {parseFloat(String(v.plans?.price || 0)).toFixed(2)}
              </div>
              
              <div style={{ 
                marginTop: 'auto', 
                fontSize: '8px', 
                fontWeight: 700, 
                color: '#000', 
                borderTop: '1px solid #ccc',
                paddingTop: '5px',
                width: '100%'
              }}>
                BY NUXBILL BILLING SYSTEM
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .print-page { padding: 0 !important; }
          .print-grid { padding: 0 !important; }
        }
        .voucher-card-print {
          transition: transform 0.2s;
        }
      `}</style>
    </div>
  )
}

export default function VouchersPrintPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PrintContent />
    </Suspense>
  )
}
