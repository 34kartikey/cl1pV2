import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { FileText, Files, Globe, Lock, EyeOff, Pencil, KeyRound, Clock } from 'lucide-react'
import FileCard from './FileCard.jsx'
import PasswordModal from './PasswordModal.jsx'
import { highlight, languageLabel, detectLanguage, LANGUAGE_OPTIONS } from '../utils/language.js'
import { formatBytes, updateClip, registerFile, deleteFile, renameFile, uploadFile } from '../utils/api.js'
import { Progress } from './ui/progress'

function formatExpiry(expiresAt) {
  if (!expiresAt) return null
  const d = new Date(expiresAt * 1000)
  const diff = d - Date.now()
  const dateStr = d.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  if (diff <= 0) return `Expired · ${dateStr}`
  const mins = Math.floor(diff / 60000), hours = Math.floor(diff / 3600000), days = Math.floor(diff / 86400000)
  const rel = days > 0 ? `in ${days}d ${Math.floor((diff % 86400000) / 3600000)}h` : hours > 0 ? `in ${hours}h ${Math.floor((diff % 3600000) / 60000)}m` : mins > 0 ? `in ${mins}m` : 'soon'
  return `Expires ${rel} · ${dateStr}`
}

const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', padding: '24px' }
const cardTitle = { fontSize: '15px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)' }
const inputS = { display: 'block', width: '100%', height: '34px', background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0 10px', fontFamily: 'inherit', fontSize: '12px', fontWeight: 400, outline: 'none', transition: 'border-color 150ms' }
const onFI = e => e.target.style.borderColor = '#000'
const onBI = e => e.target.style.borderColor = 'var(--border)'
export default function ClipViewer({ clip, slug, readPassword = null, onRefresh }) {
  const { text, language: initialLang, is_public, edit_mode, expires_at, files = [] } = clip

  const [copied, setCopied] = useState(false)
  const [passwordError, setPasswordError] = useState(null)
  const [writePassword, setWritePassword] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(text || '')
  const [editLang, setEditLang] = useState(initialLang || 'auto')
  const [editFiles, setEditFiles] = useState(files.map(f => ({ ...f, _deleted: false, _renamed: f.filename })))
  const [newFiles, setNewFiles] = useState([])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [showWriteModal, setShowWriteModal] = useState(false)

  const canEdit = edit_mode !== 'read_only'
  const needsPassword = edit_mode === 'password'
  const isUnlocked = !needsPassword || writePassword !== null
  const hasText = text && text.trim().length > 0
  const hasFiles = files && files.length > 0
  const showCode = hasText && initialLang && initialLang !== 'text'
  const highlighted = showCode ? highlight(text, initialLang) : null
  const editDetectedLang = editLang === 'auto' ? detectLanguage(editText) : editLang
  const editHighlighted = editDetectedLang && editDetectedLang !== 'text' && editText ? highlight(editText, editDetectedLang) : null

  function copyText() { navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }).catch(() => {}) }

  function handleUnlock(pw) {
    setWritePassword(pw); setPasswordError(null)
    setEditText(text || ''); setEditLang(initialLang || 'auto')
    setEditFiles(files.map(f => ({ ...f, _deleted: false, _renamed: f.filename })))
    setNewFiles([]); setSaveError(null); setIsEditing(true); setShowWriteModal(false)
  }

  function enterEditMode() {
    setEditText(text || ''); setEditLang(initialLang || 'auto')
    setEditFiles(files.map(f => ({ ...f, _deleted: false, _renamed: f.filename })))
    setNewFiles([]); setSaveError(null); setIsEditing(true)
  }

  function handleCancel() { setIsEditing(false); setSaveError(null); setPasswordInput(''); if (!isUnlocked) setWritePassword(null) }

  function addNewFiles(droppedFiles) {
    setNewFiles(prev => [...prev, ...droppedFiles.map(f => ({ id: uuidv4(), file: f, filename: f.name, mime_type: f.type || 'application/octet-stream', size_bytes: f.size, progress: 0, status: 'pending' }))])
  }

  async function handleSave() {
    setSaving(true); setSaveError(null)
    const wp = needsPassword ? writePassword : null
    const textResult = await updateClip(slug, { text: editText || null, language: editLang === 'auto' ? (detectLanguage(editText) || null) : editLang }, wp)
    if (!textResult.ok) {
      setSaveError(textResult.error === 'Invalid write password' ? 'Wrong write password.' : textResult.error)
      setSaving(false)
      if (textResult.error === 'Invalid write password') { setWritePassword(null); setIsEditing(false) }
      return
    }
    for (const f of editFiles.filter(f => f._deleted)) await deleteFile(slug, f.id, wp)
    for (const f of editFiles.filter(f => !f._deleted && f._renamed !== f.filename)) await renameFile(slug, f.id, f._renamed, wp)
    for (const nf of newFiles) {
      const reg = await registerFile(slug, { fileId: nf.id, filename: nf.filename, mime_type: nf.mime_type, size_bytes: nf.size_bytes }, wp)
      if (!reg.ok) continue
      await uploadFile(slug, nf.id, nf.file, p => setNewFiles(prev => prev.map(f => f.id === nf.id ? { ...f, progress: p, status: 'uploading' } : f)), wp)
    }
    setSaving(false); setIsEditing(false)
    if (onRefresh) onRefresh(wp)
  }

  const btnOutline = { border: '1px solid var(--border)', borderRadius: '6px', fontFamily: 'inherit', fontSize: '12px', fontWeight: 500, cursor: 'pointer', transition: 'all 150ms', background: 'transparent', color: '#374151', padding: '5px 14px' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Meta */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', flex: 1 }}>
          {[
            { icon: is_public ? Globe : Lock, label: is_public ? 'Public' : 'Private' },
            edit_mode === 'read_only'
              ? { icon: EyeOff, label: 'Read-only' }
              : edit_mode === 'public'
              ? { icon: Pencil, label: 'Anyone can edit' }
              : { icon: KeyRound, label: 'Owner edit' },
            formatExpiry(expires_at) ? { icon: Clock, label: formatExpiry(expires_at) } : null,
          ].filter(Boolean).map(({ icon: Icon, label }, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#374151', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '5px 12px', fontWeight: 600 }}>
              <Icon size={13} strokeWidth={2} />{label}
            </span>
          ))}
        </div>
        {canEdit && !isEditing && (
          <button style={btnOutline} onClick={() => { if (needsPassword && !isUnlocked) { setShowWriteModal(true); return; } enterEditMode() }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#000'; e.currentTarget.style.color = '#000' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = '#374151' }}
          >Edit</button>
        )}
        {isEditing && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={btnOutline} onClick={handleCancel} disabled={saving}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#000'; e.currentTarget.style.color = '#000' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = '#374151' }}
            >Cancel</button>
            <button style={{ ...btnOutline, background: '#000', color: '#fff', border: 'none', opacity: saving ? 0.5 : 1 }} onClick={handleSave} disabled={saving}
              onMouseEnter={e => { if (!saving) e.currentTarget.style.opacity = '0.85' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = saving ? '0.5' : '1' }}
            >{saving ? 'Saving…' : 'Save'}</button>
          </div>
        )}
      </div>

      {showWriteModal && (
        <PasswordModal
          slug={slug}
          error={passwordError}
          promptLabel="Edit password"
          onSubmit={pw => { setPasswordError(null); handleUnlock(pw) }}
          onCancel={() => { setShowWriteModal(false); setPasswordError(null) }}
        />
      )}

      {saveError && <div style={{ background: 'rgba(220,38,38,0.06)', color: 'var(--danger)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px' }}>⚠ {saveError}</div>}

      {/* Text / code */}
      {(hasText || isEditing) && (
        <div style={card}>
          <div style={{ ...cardTitle, justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={16} />Text Content</span>
            {!isEditing && hasText && (
              <button style={btnOutline} onClick={copyText}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#000'; e.currentTarget.style.color = '#000' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = '#374151' }}
              >{copied ? 'Copied!' : 'Copy'}</button>
            )}
          </div>
          {isEditing ? (
            <div style={{ border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: editDetectedLang ? 'var(--text-2)' : 'var(--text-3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {editDetectedLang ? <><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#000', display: 'inline-block' }} />{languageLabel(editDetectedLang)}</> : 'No language detected'}
                </span>
                <select value={editLang} onChange={e => setEditLang(e.target.value)} style={{ height: '26px', borderRadius: '4px', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', padding: '0 8px', fontSize: '11px', fontFamily: 'inherit', outline: 'none', colorScheme: 'light' }}
                  onFocus={e => e.target.style.borderColor = '#000'} onBlur={e => e.target.style.borderColor = 'var(--border)'}
                >
                  {LANGUAGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <textarea style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text)', fontFamily: 'monospace', fontSize: '13px', lineHeight: 1.65, padding: '14px 16px', outline: 'none', resize: 'vertical', minHeight: '160px', display: 'block' }}
                value={editText} onChange={e => setEditText(e.target.value)} spellCheck={false} />
              {editHighlighted && editText.trim() && (
                <>
                  <div style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', padding: '5px 12px', background: 'var(--surface-2)', borderTop: '1px solid var(--border)' }}>Preview</div>
                  <div style={{ padding: '14px 16px', overflowX: 'auto' }}>
                    <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '13px', lineHeight: 1.65 }}><code dangerouslySetInnerHTML={{ __html: editHighlighted }} /></pre>
                  </div>
                </>
              )}
            </div>
          ) : showCode ? (
            <div style={{ border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', padding: '6px 12px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{languageLabel(initialLang)}</span>
              </div>
              <div style={{ padding: '14px 16px', overflowX: 'auto', background: 'var(--surface-2)' }}>
                <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '13px', lineHeight: 1.65, whiteSpace: 'pre' }}><code dangerouslySetInnerHTML={{ __html: highlighted }} /></pre>
              </div>
            </div>
          ) : (
            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '14px 16px', maxHeight: '384px', overflowY: 'auto' }}>
              <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '13px', lineHeight: 1.65, whiteSpace: 'pre-wrap', color: 'var(--text)' }}>{text}</pre>
            </div>
          )}
        </div>
      )}

      {/* Files */}
      {(hasFiles || isEditing) && (
        <div style={card}>
          <div style={cardTitle}>
            <Files size={16} />
            Files ({isEditing ? editFiles.filter(f => !f._deleted).length + newFiles.length : files.length})
            <span style={{ fontSize: '13px', color: 'var(--text-3)', fontWeight: 400 }}>Click on any file to view or download</span>
          </div>
          {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gap: '14px', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
                {editFiles.filter(f => !f._deleted).map(f => (
                  <div key={f.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <FileCard file={{ ...f, filename: f._renamed }} slug={slug} readPassword={readPassword} hideActions />
                    <input value={f._renamed} style={inputS} onFocus={onFI} onBlur={onBI}
                      onChange={e => setEditFiles(prev => prev.map(x => x.id === f.id ? { ...x, _renamed: e.target.value } : x))} />
                    <button style={{ height: '28px', background: 'rgba(220,38,38,0.06)', color: 'var(--danger)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '6px', fontFamily: 'inherit', fontSize: '11px', fontWeight: 500, cursor: 'pointer' }}
                      onClick={() => setEditFiles(prev => prev.map(x => x.id === f.id ? { ...x, _deleted: true } : x))}>Remove</button>
                  </div>
                ))}
                {newFiles.map(f => (
                  <div key={f.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>📄</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{formatBytes(f.size_bytes)}</div>
                    {f.status === 'uploading' && <Progress value={f.progress} />}
                    <button style={{ height: '28px', background: 'rgba(220,38,38,0.06)', color: 'var(--danger)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '6px', fontFamily: 'inherit', fontSize: '11px', fontWeight: 500, cursor: 'pointer' }}
                      onClick={() => setNewFiles(prev => prev.filter(x => x.id !== f.id))}>Remove</button>
                  </div>
                ))}
              </div>
              <div style={{ border: '2px dashed var(--border)', borderRadius: '8px', padding: '16px', textAlign: 'center', cursor: 'pointer', color: 'var(--text-3)', fontSize: '13px', transition: 'all 150ms' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#9ca3af'; e.currentTarget.style.color = 'var(--text)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-3)' }}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); addNewFiles(Array.from(e.dataTransfer?.files || [])) }}
                onClick={() => document.getElementById('edit-file-input').click()}
              >
                + Drop or click to add files
                <input id="edit-file-input" type="file" multiple style={{ display: 'none' }} onChange={e => addNewFiles(Array.from(e.target.files))} />
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '14px', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
              {files.map(f => <FileCard key={f.id} file={f} slug={slug} readPassword={readPassword} />)}
            </div>
          )}
        </div>
      )}

      {!hasText && !hasFiles && !isEditing && (
        <div style={{ ...card, color: 'var(--text-2)', fontSize: '13px' }}>ℹ This clip is empty.</div>
      )}
    </div>
  )
}
