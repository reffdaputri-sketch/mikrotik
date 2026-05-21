'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function PaymentCallbackContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')
  const status = searchParams.get('status')
  const [countdown, setCountdown] = useState(3)
  const [redirected, setRedirected] = useState(false)

  useEffect(() => {
    // Cuba buka deep link ke app Flutter
    const deepLink = `purnamawifi://payment-success?order_id=${orderId}&status=${status}`
    
    // Cuba launch deep link
    window.location.href = deepLink

    // Countdown untuk fallback
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          setRedirected(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [orderId, status])

  const isSuccess = status === 'success' || status === 'SUCCESS'

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #16a34a, #15803d)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        padding: '48px 36px',
        maxWidth: '420px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
      }}>
        {/* Icon */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: isSuccess ? '#dcfce7' : '#fef2f2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: '40px'
        }}>
          {isSuccess ? '✅' : '❌'}
        </div>

        <h1 style={{
          fontSize: '24px',
          fontWeight: '900',
          color: '#111',
          margin: '0 0 12px'
        }}>
          {isSuccess ? 'Pembayaran Berjaya!' : 'Pembayaran Gagal'}
        </h1>

        <p style={{
          fontSize: '15px',
          color: '#555',
          lineHeight: '1.6',
          margin: '0 0 8px'
        }}>
          {isSuccess
            ? 'Terima kasih! Baki wallet anda akan dikemaskini dalam beberapa saat.'
            : 'Pembayaran tidak berjaya. Sila cuba semula.'}
        </p>

        {orderId && (
          <p style={{
            fontSize: '13px',
            color: '#999',
            margin: '0 0 28px'
          }}>
            ID Pesanan: <strong>{orderId}</strong>
          </p>
        )}

        {/* Deep link button */}
        <a
          href={`purnamawifi://payment-success?order_id=${orderId}&status=${status}`}
          style={{
            display: 'block',
            background: '#16a34a',
            color: 'white',
            padding: '16px',
            borderRadius: '14px',
            textDecoration: 'none',
            fontWeight: '800',
            fontSize: '15px',
            marginBottom: '12px',
            letterSpacing: '0.5px'
          }}
        >
          📱 BUKA DALAM APLIKASI
        </a>

        <a
          href="/pelanggan"
          style={{
            display: 'block',
            color: '#16a34a',
            fontSize: '14px',
            fontWeight: '600',
            textDecoration: 'none'
          }}
        >
          Atau buka portal web pelanggan →
        </a>

        {!redirected && (
          <p style={{
            marginTop: '20px',
            fontSize: '12px',
            color: '#ccc'
          }}>
            Membuka aplikasi secara automatik dalam {countdown}s...
          </p>
        )}
      </div>
    </div>
  )
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#16a34a',
        color: 'white',
        fontSize: '18px',
        fontWeight: '700'
      }}>
        Memproses pembayaran...
      </div>
    }>
      <PaymentCallbackContent />
    </Suspense>
  )
}
