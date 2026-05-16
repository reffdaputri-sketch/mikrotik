'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Wifi, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login gagal')
      router.push('/admin/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login gagal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-animated min-h-screen flex items-center justify-center p-4">
      {/* Background decorations */}
      <div style={{
        position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none'
      }}>
        <div style={{
          position: 'absolute', top: '-20%', left: '-10%',
          width: '600px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-20%', right: '-10%',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
        }} />
      </div>

      <div style={{ width: '100%', maxWidth: '400px', position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 0 30px rgba(59,130,246,0.4)',
          }}>
            <Wifi size={32} color="white" />
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            <span className="gradient-text">Purnama WiFi</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '4px' }}>
            Sistem Billing MikroTik
          </p>
        </div>

        {/* Card */}
        <div className="glass-card" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '24px', color: '#f1f5f9' }}>
            Login Admin Panel
          </h2>

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '8px', padding: '12px', marginBottom: '16px',
              color: '#f87171', fontSize: '0.875rem',
            }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label className="form-label">Username</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{
                  position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                  color: '#64748b',
                }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  placeholder="Username admin"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  id="login-username"
                />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{
                  position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                  color: '#64748b',
                }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingLeft: '38px', paddingRight: '44px' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  id="login-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#64748b',
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px' }}
              disabled={loading}
              id="login-submit"
            >
              {loading ? <><span className="spinner" />Masuk...</> : 'Masuk ke Dashboard'}
            </button>
          </form>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <a
              href="/beli"
              style={{ color: '#64748b', fontSize: '0.8rem', textDecoration: 'none' }}
            >
              Pelanggan? <span style={{ color: '#3b82f6' }}>Beli Voucher di sini →</span>
            </a>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', color: '#334155', fontSize: '0.75rem' }}>
          © 2025 Purnama WiFi — Powered by Next.js & Supabase
        </p>
      </div>
    </div>
  )
}
