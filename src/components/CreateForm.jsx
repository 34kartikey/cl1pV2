import { useState, useEffect, useRef, useCallback } from 'react'
import { Plus, Upload, Clock, FileText } from 'lucide-react'
import { createClip, uploadFile } from '../utils/api.js'
import { detectLanguage, highlight, languageLabel, LANGUAGE_OPTIONS } from '../utils/language.js'
import FileUploadZone from './FileUploadZone.jsx'

const EXPIRY_OPTIONS = [
  { label: '1 hour',   value: 3600 },
  { label: '24 hours', value: 86400 },
  { label: '7 days',   value: 604800 },
  { label: '30 days',  value: 2592000 },
  { label: 'Never',    value: null },
]

/* ── shared styles ── */
const card = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: '8px', boxShadow: 'var(--shadow-sm)', padding: '24px', marginBottom: '0',
}
const cardTitle = {
  fontSize: '15px', fontWeight: 600, marginBottom: '20px',
  display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)',
}
const label = { display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px', color: 'var(--text)' }
const inputS = {
  display: 'block', width: '100%', padding: '8px 12px', fontSize: '13px',
  border: '1px solid var(--border)', borderRadius: '6px', outline: 'none',
  background: 'var(--surface)', color: 'var(--text)', fontFamily: 'inherit',
  transition: 'box-shadow 150ms, border-color 150ms',
}
const onFI = e => { e.target.style.boxShadow = '0 0 0 2px rgba(0,0,0,0.1)'; e.target.style.borderColor = '#000' }
const onBI = e => { e.target.style.boxShadow = 'none'; e.target.style.borderColor = 'var(--border)' }

const SegmentControl = ({ options, value, onChange }) => (
  <div style={{ display: 'inline-flex', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
    {options.map((opt, i) => (
      <button key={String(opt.value)} type="button" onClick={() => onChange(opt.value)}
        style={{
          padding: '6px 14px', border: 'none',
          borderRight: i < options.length - 1 ? '1px solid var(--border)' : 'none',
          fontFamily: 'inherit', fontSize: '13px', fontWeight: opt.value === value ? 500 : 400,
          cursor: 'pointer', transition: 'all 150ms', whiteSpace: 'nowrap',
          background: opt.value === value ? '#000' : 'transparent',
          color: opt.value === value ? '#fff' : '#374151',
        }}
        onMouseEnter={e => { if (opt.value !== value) e.currentTarget.style.background = 'var(--surface-3)' }}
        onMouseLeave={e => { if (opt.value !== value) e.currentTarget.style.background = 'transparent' }}
      >{opt.label}</button>
    ))}
  </div>
)

export default function CreateForm({ slug, onCreated }) {
  const [clipName, setClipName] = useState(slug)
  const [isPublic, setIsPublic] = useState(true)
  const [readPassword, setReadPassword] = useState('')
  const [editMode, setEditMode] = useState('none')
  const [writePassword, setWritePassword] = useState('')
  const [text, setText] = useState('')
  const [langOverride, setLangOverride] = useState('auto')
  const [detectedLang, setDetectedLang] = useState(null)
  const detectTimer = useRef(null)
  const [files, setFiles] = useState([])
  const [expirySeconds, setExpirySeconds] = useState(86400)
  const [customExpiry, setCustomExpiry] = useState(false)
  const [customDatetime, setCustomDatetime] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  useEffect(() => {
    clearTimeout(detectTimer.current)
    if (!text.trim()) { setDetectedLang(null); return }
    detectTimer.current = setTimeout(() => setDetectedLang(detectLanguage(text)), 400)
    return () => clearTimeout(detectTimer.current)
  }, [text])

  const effectiveLang = langOverride !== 'auto' ? langOverride : detectedLang
  const previewHtml = effectiveLang && text ? highlight(text, effectiveLang) : null
  const handleFilesChange = useCallback(u => setFiles(u), [])

  const MAX_TOTAL_BYTES = 50 * 1024 * 1024

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitError(null)
    const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0)
    if (totalSize > MAX_TOTAL_BYTES) {
      setSubmitError(`Total file size exceeds 50 MB (currently ${(totalSize / 1024 / 1024).toFixed(1)} MB). Please remove some files.`)
      return
    }
    setSubmitting(true)
    const finalSlug = clipName.trim().replace(/\s+/g, '-').toLowerCase() || slug

    let expiresIn = expirySeconds
    if (customExpiry && customDatetime) {
      const diff = Math.floor((new Date(customDatetime).getTime() - Date.now()) / 1000)
      expiresIn = diff > 0 ? diff : 60
    }

    const fileMeta = files.map(f => ({ id: f.id, filename: f.filename, mime_type: f.mimeType || f.file.type || 'application/octet-stream', size_bytes: f.size ?? f.file.size }))
    const payload = {
      text: text || null, language: effectiveLang || null, is_public: isPublic,
      read_password: (!isPublic && readPassword.trim()) ? readPassword.trim() : undefined,
      edit_mode: editMode === 'none' ? 'read_only' : editMode === 'owner' ? 'password' : 'public',
      write_password: (editMode === 'owner' && writePassword.trim()) ? writePassword.trim() : undefined,
      expires_in_seconds: expiresIn, files: fileMeta,
    }
    Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k])

    const result = await createClip(finalSlug, payload)
    if (!result.ok) { setSubmitError(result.error || 'Failed to create clip'); setSubmitting(false); return }

    if (files.length > 0) {
      setFiles(prev => prev.map(f => ({ ...f, status: 'uploading', progress: 0 })))
      const wp = (editMode === 'owner' && writePassword.trim()) ? writePassword.trim() : null
      await Promise.all(files.map(async fi => {
        const up = await uploadFile(finalSlug, fi.id, fi.file, p => setFiles(prev => prev.map(f => f.id === fi.id ? { ...f, progress: p, status: 'uploading' } : f)), wp)
        setFiles(prev => prev.map(f => f.id === fi.id ? { ...f, status: up.ok ? 'done' : 'error', progress: up.ok ? 100 : f.progress, errorMessage: up.error } : f))
      }))
    }

    setSubmitting(false)
    onCreated(result.clip, (!isPublic && readPassword.trim()) ? readPassword.trim() : null)
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      {/* Page title */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, marginBottom: '8px', letterSpacing: '-0.02em' }}>Create New Cl1p</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-2)' }}>Share your files and text with a unique link</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* ── Basic Information ── */}
        <div style={card}>
          <h2 style={cardTitle}><Plus size={18} />Basic Information</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={label}>Cl1p Name *</label>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden', background: 'var(--surface)', transition: 'box-shadow 150ms, border-color 150ms' }}
                onFocusCapture={e => { e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = '#000' }}
                onBlurCapture={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border)' }}
              >
                <span style={{ padding: '8px 10px 8px 12px', fontSize: '13px', color: 'var(--text)', fontFamily: 'monospace', whiteSpace: 'nowrap', flexShrink: 0, borderRight: '1px solid var(--border)', background: 'var(--surface-2)' }}>cl1p.in/</span>
                <input type="text" value={clipName} required
                  onChange={e => setClipName(e.target.value.replace(/\s+/g, '-').toLowerCase())}
                  style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'monospace', fontSize: '13px', color: 'var(--text)', padding: '8px 12px' }}
                />
              </div>
            </div>
            <div>
              <label style={label}>Privacy</label>
              <SegmentControl
                options={[{ label: 'Public', value: true }, { label: 'Private', value: false }]}
                value={isPublic} onChange={setIsPublic}
              />
              {!isPublic && <input type="password" placeholder="View password (required to open this cl1p)" value={readPassword} onChange={e => setReadPassword(e.target.value)} autoComplete="new-password" style={{ ...inputS, marginTop: '10px' }} onFocus={onFI} onBlur={onBI} />}
            </div>
            <div>
              <label style={label}>Editability</label>
              <SegmentControl
                options={[{ label: 'Read-only', value: 'none' }, { label: 'Everyone', value: 'public' }, { label: 'Owner', value: 'owner' }]}
                value={editMode} onChange={setEditMode}
              />
              {editMode === 'owner' && <input type="password" placeholder="Edit password (required to make changes)" value={writePassword} onChange={e => setWritePassword(e.target.value)} autoComplete="new-password" style={{ ...inputS, marginTop: '10px' }} onFocus={onFI} onBlur={onBI} />}
            </div>
          </div>
        </div>

        {/* ── Upload Files ── */}
        <div style={card}>
          <h2 style={cardTitle}><Upload size={18} />Upload Files</h2>
          <FileUploadZone files={files} onChange={handleFilesChange} />
        </div>

        {/* ── Expiry Settings ── */}
        <div style={card}>
          <h2 style={cardTitle}><Clock size={18} />Expiry Settings</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {EXPIRY_OPTIONS.map(opt => {
              const active = !customExpiry && expirySeconds === opt.value
              return (
                <button key={String(opt.value)} type="button"
                  onClick={() => { setCustomExpiry(false); setExpirySeconds(opt.value) }}
                  style={{ height: '34px', padding: '0 16px', borderRadius: '6px', border: '1px solid', fontFamily: 'inherit', fontSize: '13px', fontWeight: active ? 500 : 400, cursor: 'pointer', transition: 'all 150ms', borderColor: active ? '#000' : 'var(--border)', background: active ? '#000' : 'transparent', color: active ? '#fff' : '#374151' }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--surface-2)' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                >{opt.label}</button>
              )
            })}
            <button type="button"
              onClick={() => { setCustomExpiry(true); if (!customDatetime) { const d = new Date(Date.now() + 86400000); d.setSeconds(0,0); setCustomDatetime(d.toISOString().slice(0,16)) } }}
              style={{ height: '34px', padding: '0 16px', borderRadius: '6px', border: '1px solid', fontFamily: 'inherit', fontSize: '13px', fontWeight: customExpiry ? 500 : 400, cursor: 'pointer', transition: 'all 150ms', borderColor: customExpiry ? '#000' : 'var(--border)', background: customExpiry ? '#000' : 'transparent', color: customExpiry ? '#fff' : '#374151' }}
            >Custom</button>
          </div>
          {customExpiry && <input type="datetime-local" value={customDatetime} min={new Date(Date.now() + 60000).toISOString().slice(0,16)} onChange={e => setCustomDatetime(e.target.value)} style={{ marginTop: '12px' }} />}
        </div>

        {/* ── Text Content ── */}
        <div style={card}>
          <h2 style={cardTitle}><FileText size={18} />Text Content <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-3)' }}>(Optional)</span></h2>
          <div style={{ border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', gap: '10px' }}>
              <span style={{ fontSize: '12px', color: effectiveLang ? 'var(--text-2)' : 'var(--text-3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {effectiveLang
                  ? <><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#000', display: 'inline-block' }} />{langOverride === 'auto' ? `Detected: ${languageLabel(effectiveLang)}` : languageLabel(effectiveLang)}</>
                  : 'No language detected'}
              </span>
              <select value={langOverride} onChange={e => setLangOverride(e.target.value)}
                style={{ height: '26px', borderRadius: '4px', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', padding: '0 8px', fontSize: '11px', fontFamily: 'inherit', outline: 'none', cursor: 'pointer', colorScheme: 'light' }}
                onFocus={e => e.target.style.borderColor = '#000'} onBlur={e => e.target.style.borderColor = 'var(--border)'}
              >
                {LANGUAGE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <textarea
              style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text)', fontFamily: 'monospace', fontSize: '13px', lineHeight: 1.65, padding: '14px 16px', outline: 'none', resize: 'vertical', minHeight: '240px', display: 'block' }}
              placeholder="Add any text content you'd like to share…"
              value={text} onChange={e => setText(e.target.value)} spellCheck={false} autoComplete="off"
            />
            {previewHtml && text.trim() && (
              <>
                <div style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', padding: '5px 12px', background: 'var(--surface-2)', borderTop: '1px solid var(--border)' }}>Preview</div>
                <div style={{ padding: '14px 16px', overflowX: 'auto', background: 'var(--surface)' }}>
                  <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '13px', lineHeight: 1.65 }}>
                    <code dangerouslySetInnerHTML={{ __html: previewHtml }} />
                  </pre>
                </div>
              </>
            )}
          </div>
        </div>

        {submitError && (
          <div style={{ background: 'rgba(220,38,38,0.06)', color: 'var(--danger)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px' }}>⚠ {submitError}</div>
        )}

        {/* Submit */}
        <div style={{ textAlign: 'center', paddingTop: '4px', paddingBottom: '32px' }}>
          <button type="submit" disabled={submitting}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 32px', background: submitting ? 'rgba(0,0,0,0.4)' : '#000', color: '#fff', border: 'none', borderRadius: '6px', fontFamily: 'inherit', fontSize: '14px', fontWeight: 500, cursor: submitting ? 'not-allowed' : 'pointer', transition: 'opacity 150ms' }}
            onMouseEnter={e => { if (!submitting) e.currentTarget.style.opacity = '0.88' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
          >
            {submitting ? (
              <><div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Creating Cl1p…<style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></>
            ) : (
              <><Plus size={16} />Create Cl1p</>
            )}
          </button>
        </div>

      </form>
    </div>
  )
}
