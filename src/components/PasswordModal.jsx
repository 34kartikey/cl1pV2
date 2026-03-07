import { useState } from 'react'
import { X } from 'lucide-react'

export default function PasswordModal({ slug, error, onSubmit, inline = false, onCancel, promptLabel = 'View password' }) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!password.trim()) return
    setLoading(true)
    await onSubmit(password.trim())
    setLoading(false)
  }

  const card = (
    <div style={{ position: 'relative', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow)', padding: '28px', width: '100%', maxWidth: '400px', margin: inline ? '0 auto' : undefined }}>
      {onCancel && (
        <button type="button" onClick={onCancel} aria-label="Close"
          style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-2)', transition: 'all 150ms' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#000'; e.currentTarget.style.color = '#000' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)' }}
        ><X size={14} /></button>
      )}
      <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>Password required</div>
      <div style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '20px', lineHeight: 1.5 }}>
        <code style={{ fontFamily: 'monospace', color: 'var(--text)', background: 'var(--surface-2)', padding: '1px 6px', borderRadius: '4px', border: '1px solid var(--border)' }}>{slug}</code> is protected. Enter the password to continue.
      </div>
      {error && (
        <div style={{ background: 'rgba(220,38,38,0.06)', color: 'var(--danger)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '6px', padding: '8px 12px', fontSize: '12px', marginBottom: '14px' }}>⚠ {error}</div>
      )}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>Password</label>
          <input type="password" placeholder={promptLabel} value={password} onChange={e => setPassword(e.target.value)} autoFocus autoComplete="current-password"
            style={{ display: 'block', width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '6px', outline: 'none', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'inherit', transition: 'box-shadow 150ms, border-color 150ms' }}
            onFocus={e => { e.target.style.boxShadow = '0 0 0 2px rgba(0,0,0,0.1)'; e.target.style.borderColor = '#000' }}
            onBlur={e => { e.target.style.boxShadow = 'none'; e.target.style.borderColor = 'var(--border)' }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          {onCancel && (
            <button type="button" onClick={onCancel}
              style={{ height: '36px', padding: '0 16px', background: 'transparent', color: '#374151', border: '1px solid var(--border)', borderRadius: '6px', fontFamily: 'inherit', fontSize: '13px', fontWeight: 500, cursor: 'pointer', transition: 'all 150ms' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#000'; e.currentTarget.style.color = '#000' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = '#374151' }}
            >Cancel</button>
          )}
          <button type="submit" disabled={loading || !password.trim()}
            style={{ height: '36px', padding: '0 20px', background: !password.trim() ? '#d1d5db' : '#000', color: !password.trim() ? '#9ca3af' : '#fff', border: 'none', borderRadius: '6px', fontFamily: 'inherit', fontSize: '13px', fontWeight: 500, cursor: loading || !password.trim() ? 'not-allowed' : 'pointer', transition: 'opacity 150ms' }}
            onMouseEnter={e => { if (!loading && password.trim()) e.currentTarget.style.opacity = '0.88' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
          >{loading ? 'Unlocking…' : 'Unlock'}</button>
        </div>
      </form>
    </div>
  )

  if (inline) return card
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      {card}
    </div>
  )
}
