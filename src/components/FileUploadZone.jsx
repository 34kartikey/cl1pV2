import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { v4 as uuidv4 } from 'uuid'
import { formatBytes } from '../utils/api.js'
import { Upload, File, Image, Video, Music } from 'lucide-react'

const MAX_TOTAL_BYTES = 50 * 1024 * 1024 // 50 MB

const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif', 'image/svg+xml']

function getFileIcon(mimeType, size = 24) {
  if (!mimeType) return <File size={size} color="#9ca3af" />
  if (mimeType.startsWith('image/')) return <Image size={size} color="#9ca3af" />
  if (mimeType.startsWith('video/')) return <Video size={size} color="#9ca3af" />
  if (mimeType.startsWith('audio/')) return <Music size={size} color="#9ca3af" />
  return <File size={size} color="#9ca3af" />
}

function FilePreviewCard({ item, onRemove }) {
  const isUploading = item.status === 'uploading'
  const isDone = item.status === 'done'
  const ext = item.filename.split('.').pop()?.toUpperCase() || ''

  return (
    <div className="group" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', transition: 'box-shadow 200ms', position: 'relative' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
    >
      {/* Preview area */}
      <div style={{ position: 'relative', aspectRatio: '1/1', overflow: 'hidden', background: 'var(--surface-2)' }}>
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', filter: isUploading ? 'blur(1px)' : 'none', transition: 'filter 200ms' }}>
          {item.objectUrl
            ? <img src={item.objectUrl} alt={item.filename} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px' }}>
                {getFileIcon(item.mimeType, 28)}
                <span style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{ext} File</span>
              </div>
            )}
        </div>

        {/* Hover overlay with actions */}
        {!isUploading && !isDone && (
          <div className="opacity-0 group-hover:opacity-100"
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 200ms, opacity 200ms' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.18)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'}
          >
            <button type="button" onClick={() => onRemove(item.id)}
              style={{ padding: '7px', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 150ms' }}
              onMouseEnter={e => e.currentTarget.style.background = '#fff'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.9)'}
              title="Remove"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="#111" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
          </div>
        )}

        {/* Upload progress overlay */}
        {isUploading && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0' }}>
            <span style={{ fontSize: '22px', fontWeight: 700, color: '#000' }}>{item.progress}%</span>
          </div>
        )}

        {/* Done badge */}
        {isDone && (
          <div style={{ position: 'absolute', top: '6px', right: '6px', background: 'var(--success)', color: '#fff', borderRadius: '99px', padding: '2px 8px', fontSize: '10px', fontWeight: 600 }}>✓ Done</div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '3px' }} title={item.filename}>
              {item.filename}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-3)' }}>
              <span style={{ textTransform: 'uppercase' }}>{ext || 'unknown'}</span>
              <span>•</span>
              <span>{formatBytes(item.size)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function FileUploadZone({ files, onChange }) {
  const [sizeError, setSizeError] = useState(null)

  const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0)

  const onDrop = useCallback((accepted) => {
    setSizeError(null)
    const incomingSize = accepted.reduce((sum, f) => sum + f.size, 0)
    if (totalSize + incomingSize > MAX_TOTAL_BYTES) {
      setSizeError(`Total size would exceed 50 MB. Current: ${formatBytes(totalSize)}, adding: ${formatBytes(incomingSize)}.`)
      return
    }
    const newFiles = accepted.map(f => ({
      id: uuidv4(), file: f, filename: f.name, progress: 0, status: 'pending',
      objectUrl: IMAGE_MIMES.includes(f.type) ? URL.createObjectURL(f) : null,
      mimeType: f.type, size: f.size,
    }))
    onChange([...files, ...newFiles])
  }, [files, onChange, totalSize])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: true })

  function removeFile(id) {
    const removed = files.find(f => f.id === id)
    if (removed?.objectUrl) URL.revokeObjectURL(removed.objectUrl)
    onChange(files.filter(f => f.id !== id))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Drop zone */}
      <div {...getRootProps()} style={{
        minHeight: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px',
        border: `2px dashed ${isDragActive ? '#6b7280' : '#d1d5db'}`,
        borderRadius: '8px', background: isDragActive ? 'var(--surface-3)' : 'var(--surface-2)',
        cursor: 'pointer', transition: 'all 200ms', padding: '24px',
      }}
        onMouseEnter={e => { if (!isDragActive) e.currentTarget.style.borderColor = '#9ca3af' }}
        onMouseLeave={e => { if (!isDragActive) e.currentTarget.style.borderColor = '#d1d5db' }}
      >
        <input {...getInputProps()} />
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          {isDragActive ? (
            <Upload size={28} color="#6b7280" />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <File size={22} color="#9ca3af" />
              <Image size={22} color="#9ca3af" />
              <Video size={22} color="#9ca3af" />
              <Music size={22} color="#9ca3af" />
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
            <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text)' }}>
              {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-2)' }}>
              {isDragActive ? 'Release to upload your files' : 'or click to browse from your computer'}
            </p>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-3)' }}>
            Supports: Images, Videos, Documents, Audio, Archives, and more · Max 50 MB total
          </p>
        </div>
      </div>

      {/* Size error */}
      {sizeError && (
        <div style={{ background: 'rgba(220,38,38,0.06)', color: 'var(--danger)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '6px', padding: '8px 12px', fontSize: '12px' }}>
          ⚠ {sizeError}
        </div>
      )}

      {/* File grid */}
      {files.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600 }}>Selected Files ({files.length})</h3>
            <span style={{ fontSize: '12px', color: totalSize > MAX_TOTAL_BYTES * 0.9 ? 'var(--danger)' : 'var(--text-3)' }}>
              {formatBytes(totalSize)} / 50 MB
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {files.map(item => (
              <FilePreviewCard key={item.id} item={item} onRemove={removeFile} />
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
