import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Copy, Check } from 'lucide-react'
import { getClip } from '../utils/api.js'
import ClipViewer from '../components/ClipViewer.jsx'
import CreateForm from '../components/CreateForm.jsx'
import PasswordModal from '../components/PasswordModal.jsx'

export default function ClipPage() {
  const { slug } = useParams()
  const [state, setState] = useState('loading')
  const [clip, setClip] = useState(null)
  const [readPassword, setReadPassword] = useState(null)
  const [error, setError] = useState(null)
  const [passwordError, setPasswordError] = useState(null)
  const [copied, setCopied] = useState(false)

  const fetchClip = useCallback(async (password = null) => {
    setState('loading')
    const result = await getClip(slug, password)
    if (result.ok) {
      setClip(result.clip); setReadPassword(password); setState('exists'); setPasswordError(null)
    } else if (result.status === 404) {
      setState('not-found')
    } else if (result.status === 401 || result.status === 403) {
      if (password) setPasswordError('Incorrect password. Please try again.')
      setState('password')
    } else {
      setError(result.error || 'Failed to load clip'); setState('error')
    }
  }, [slug])

  useEffect(() => { fetchClip() }, [fetchClip])

  function copyUrl() {
    navigator.clipboard.writeText(window.location.href).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ minHeight: '100vh', padding: '32px 24px', maxWidth: '860px', margin: '0 auto' }}>

      {/* Slug heading + copy — only when clip exists or loading/error, not on create form */}
      {state !== 'not-found' && <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
        <div onClick={copyUrl} style={{ display: 'flex', alignItems: 'center', height: '38px', padding: '0 16px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-2)', cursor: 'pointer', transition: 'all 150ms' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#000' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
        >
          <strong style={{ color: 'var(--text)' }}>{window.location.href}</strong>
        </div>
        <button onClick={copyUrl}
          style={{ display: 'flex', alignItems: 'center', gap: '7px', height: '38px', padding: '0 16px', background: 'transparent', color: copied ? 'var(--success)' : 'var(--text-2)', border: '1px solid var(--border)', borderRadius: '8px', fontFamily: 'inherit', fontSize: '13px', fontWeight: 500, cursor: 'pointer', transition: 'all 150ms', whiteSpace: 'nowrap' }}
          onMouseEnter={e => { if (!copied) { e.currentTarget.style.borderColor = '#000'; e.currentTarget.style.color = 'var(--text)' }}}
          onMouseLeave={e => { if (!copied) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)' }}}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy link'}
        </button>
      </div>}

      {state === 'loading' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '64px 0', color: 'var(--text-2)', fontSize: '13px' }}>
          <div style={{ width: '16px', height: '16px', border: '2px solid var(--border)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          Loading…
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}
      {state === 'error' && (
        <div style={{ background: 'rgba(220,38,38,0.06)', color: 'var(--danger)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '8px', padding: '12px 16px', fontSize: '13px' }}>
          ⚠ {error}
        </div>
      )}
      {state === 'exists' && clip && (
        <ClipViewer clip={clip} slug={slug} readPassword={readPassword} onRefresh={wp => fetchClip(wp || readPassword)} />
      )}
      {state === 'not-found' && (
        <CreateForm slug={slug} onCreated={(c, pw) => fetchClip(pw || null)} />
      )}

      {/* Password modal — always rendered as overlay, not inline */}
      {state === 'password' && (
        <PasswordModal
          slug={slug}
          error={passwordError}
          onSubmit={p => { setPasswordError(null); fetchClip(p) }}
          onCancel={() => window.history.back()}
        />
      )}
    </div>
  )
}
