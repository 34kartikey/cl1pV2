import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { adminLogin, saveToken } from '../utils/adminApi.js'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!password.trim()) return
    setLoading(true); setError(null)
    const result = await adminLogin(password.trim())
    setLoading(false)
    if (result.ok) {
      saveToken(result.token)
      navigate('/admin')
    } else {
      setError(result.error)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', background: '#000', borderRadius: '12px', marginBottom: '16px' }}>
            <Lock size={22} color="#fff" />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>Admin Panel</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '4px' }}>cl1p.in</p>
        </div>

        {/* Card */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: 'var(--shadow)', padding: '28px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px', color: 'var(--text)' }}>
                Admin Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  autoFocus
                  style={{ display: 'block', width: '100%', padding: '9px 40px 9px 12px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '6px', outline: 'none', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'inherit', transition: 'box-shadow 150ms, border-color 150ms' }}
                  onFocus={e => { e.target.style.boxShadow = '0 0 0 2px rgba(0,0,0,0.1)'; e.target.style.borderColor = '#000' }}
                  onBlur={e => { e.target.style.boxShadow = 'none'; e.target.style.borderColor = 'var(--border)' }}
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', padding: 0 }}
                >{showPw ? <EyeOff size={15} /> : <Eye size={15} />}</button>
              </div>
            </div>

            {error && (
              <div style={{ background: 'rgba(220,38,38,0.06)', color: 'var(--danger)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '6px', padding: '8px 12px', fontSize: '12px' }}>
                ⚠ {error}
              </div>
            )}

            <button type="submit" disabled={loading || !password.trim()}
              style={{ height: '40px', background: loading || !password.trim() ? '#d1d5db' : '#000', color: '#fff', border: 'none', borderRadius: '6px', fontFamily: 'inherit', fontSize: '13px', fontWeight: 600, cursor: loading || !password.trim() ? 'not-allowed' : 'pointer', transition: 'opacity 150ms' }}
              onMouseEnter={e => { if (!loading && password.trim()) e.currentTarget.style.opacity = '0.88' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
