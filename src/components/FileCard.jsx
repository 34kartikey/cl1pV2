import { useState, useEffect } from 'react'
import { Eye, Download, File, Image as ImageIcon, Video, Music, FileText, Archive, Code } from 'lucide-react'
import { fileDownloadUrl, formatBytes } from '../utils/api.js'

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif']
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']

function FileIcon({ mimeType, size = 24 }) {
  const color = "#9ca3af"
  if (!mimeType) return <File size={size} color={color} />
  if (mimeType.startsWith('image/')) return <ImageIcon size={size} color={color} />
  if (mimeType.startsWith('video/')) return <Video size={size} color={color} />
  if (mimeType.startsWith('audio/')) return <Music size={size} color={color} />
  if (mimeType === 'application/pdf') return <FileText size={size} color={color} />
  if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('gzip')) return <Archive size={size} color={color} />
  if (mimeType.includes('text') || mimeType.includes('javascript') || mimeType.includes('json')) return <Code size={size} color={color} />
  return <File size={size} color={color} />
}

export default function FileCard({ file, slug, readPassword = null, hideActions = false }) {
  const { id, filename, mime_type, size_bytes } = file
  const downloadUrl = fileDownloadUrl(slug, id)
  const isImage = IMAGE_TYPES.includes(mime_type)
  const isVideo = VIDEO_TYPES.includes(mime_type)
  const ext = filename.split('.').pop()?.toUpperCase() || ''

  const [blobUrl, setBlobUrl] = useState(null)
  const [previewFailed, setPreviewFailed] = useState(false)

  useEffect(() => {
    if (!isImage && !isVideo) return
    let objectUrl = null
    const headers = {}
    if (readPassword) headers['x-read-password'] = readPassword
    fetch(downloadUrl, { headers })
      .then(r => r.ok ? r.blob() : Promise.reject(r.status))
      .then(blob => { objectUrl = URL.createObjectURL(blob); setBlobUrl(objectUrl) })
      .catch(() => setPreviewFailed(true))
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [downloadUrl, readPassword])

  return (
    <div className="group"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', transition: 'box-shadow 200ms', position: 'relative' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
    >
      {/* Preview */}
      <div style={{ position: 'relative', aspectRatio: '1/1', overflow: 'hidden', background: 'var(--surface-2)' }}>
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isImage && (blobUrl
            ? <img src={blobUrl} alt={filename} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}><ImageIcon size={28} color="#9ca3af" /><span style={{ fontSize: '10px', color: 'var(--text-3)' }}>{previewFailed ? 'Preview failed' : 'Loading…'}</span></div>
          )}
          {isVideo && (blobUrl
            ? (
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <video src={blobUrl} preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.85)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  </div>
                </div>
              </div>
            )
            : <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}><Video size={28} color="#9ca3af" /><span style={{ fontSize: '10px', color: 'var(--text-3)' }}>{previewFailed ? 'Preview failed' : 'Loading…'}</span></div>
          )}
          {!isImage && !isVideo && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px' }}>
              <FileIcon mimeType={mime_type} size={28} />
              <span style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{ext} File</span>
            </div>
          )}
        </div>

        {/* Hover overlay with actions */}
        {!hideActions && (
          <div className="opacity-0 group-hover:opacity-100"
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background 200ms, opacity 200ms' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.18)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'}
          >
            {(isImage || isVideo) && blobUrl && (
              <button type="button"
                style={{ padding: '7px', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', transition: 'background 150ms' }}
                onMouseEnter={e => e.currentTarget.style.background = '#fff'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.9)'}
                onClick={() => window.open(blobUrl, '_blank')}
                title="View"
              ><Eye size={14} color="#111" /></button>
            )}
            <a href={downloadUrl} download={filename}
              style={{ padding: '7px', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', transition: 'background 150ms', textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.background = '#fff'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.9)'}
              title="Download"
            ><Download size={14} color="#111" /></a>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px' }}>
        <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '3px' }} title={filename}>
          {filename}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-3)' }}>
          <span style={{ textTransform: 'uppercase' }}>{ext || mime_type?.split('/')[1] || 'unknown'}</span>
          {size_bytes != null && <><span>•</span><span>{formatBytes(size_bytes)}</span></>}
        </div>
      </div>
    </div>
  )
}
