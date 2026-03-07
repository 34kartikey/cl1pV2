import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Trash2, Search, ChevronLeft, ChevronRight, LogOut, Globe, Lock, EyeOff, Pencil, KeyRound, X, File, FileText } from 'lucide-react'
import { getToken, clearToken, isTokenValid, fetchStats, fetchClips, fetchClip, deleteClip } from '../utils/adminApi.js'
import { formatBytes } from '../utils/api.js'
import { highlight, languageLabel } from '../utils/language.js'

/* ── helpers ── */
function fmt(unix) {
  if (!unix) return '—'
  return new Date(unix * 1000).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function fmtExpiry(unix) {
  if (!unix) return 'Never'
  const now = Math.floor(Date.now() / 1000)
  if (unix < now) return `Expired`
  const diff = unix - now
  const d = Math.floor(diff / 86400), h = Math.floor((diff % 86400) / 3600), m = Math.floor((diff % 3600) / 60)
  return d > 0 ? `in ${d}d ${h}h` : h > 0 ? `in ${h}h ${m}m` : `in ${m}m`
}
function expiryStatus(unix) {
  if (!unix) return { label: 'No expiry', color: '#6b7280', bg: '#f3f4f6' }
  if (unix < Math.floor(Date.now() / 1000)) return { label: 'Expired', color: '#dc2626', bg: 'rgba(220,38,38,0.08)' }
  return { label: 'Active', color: '#16a34a', bg: 'rgba(22,163,74,0.08)' }
}

/* ── Bar Chart ── */
function BarChart({ data }) {
  const [tooltip, setTooltip] = useState(null)
  if (!data.length) return <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: '13px' }}>No data for this period</div>

  const max = Math.max(...data.map(d => d.count), 1)
  const showEvery = Math.ceil(data.length / 12)

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '160px', padding: '0 2px' }}>
        {data.map((d, i) => {
          const pct = (d.count / max) * 100
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0', height: '100%', justifyContent: 'flex-end', position: 'relative' }}
              onMouseEnter={() => setTooltip({ i, day: d.day, count: d.count })}
              onMouseLeave={() => setTooltip(null)}
            >
              {tooltip?.i === i && (
                <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', background: '#111', color: '#fff', borderRadius: '5px', padding: '4px 8px', fontSize: '11px', whiteSpace: 'nowrap', zIndex: 10, marginBottom: '6px', pointerEvents: 'none' }}>
                  {d.day}: <strong>{d.count}</strong>
                </div>
              )}
              <div style={{ width: '100%', background: tooltip?.i === i ? '#374151' : '#000', borderRadius: '3px 3px 0 0', height: `${Math.max(pct, d.count > 0 ? 4 : 0)}%`, transition: 'background 100ms' }} />
            </div>
          )
        })}
      </div>
      {/* X axis labels */}
      <div style={{ display: 'flex', gap: '3px', padding: '6px 2px 0', overflow: 'hidden' }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: '9px', color: 'var(--text-3)', overflow: 'hidden' }}>
            {i % showEvery === 0 ? d.day.slice(5) : ''}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Clip Detail Modal ── */
function ClipModal({ slug, token, onClose }) {
  const [clip, setClip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchClip(token, slug).then(r => {
      setLoading(false)
      if (r.ok) setClip(r.clip)
      else setError(r.error || 'Failed to load')
    })
  }, [slug, token])

  const highlighted = clip?.text && clip?.language && clip.language !== 'text'
    ? highlight(clip.text, clip.language) : null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: 'var(--shadow)', width: '100%', maxWidth: '680px', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', fontFamily: 'monospace' }}>{slug}</span>
          <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-2)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#000'; e.currentTarget.style.color = '#000' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)' }}
          ><X size={14} /></button>
        </div>

        <div style={{ overflow: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loading && <div style={{ color: 'var(--text-3)', fontSize: '13px' }}>Loading…</div>}
          {error && <div style={{ color: 'var(--danger)', fontSize: '13px' }}>⚠ {error}</div>}
          {clip && (
            <>
              {/* Meta badges */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {[
                  { icon: clip.is_public ? Globe : Lock, label: clip.is_public ? 'Public' : 'Private' },
                  clip.edit_mode === 'read_only' ? { icon: EyeOff, label: 'Read-only' }
                    : clip.edit_mode === 'public' ? { icon: Pencil, label: 'Anyone can edit' }
                    : { icon: KeyRound, label: 'Owner edit' },
                ].map(({ icon: Icon, label }, i) => (
                  <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#374151', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 10px', fontWeight: 600 }}>
                    <Icon size={12} strokeWidth={2} />{label}
                  </span>
                ))}
                <span style={{ fontSize: '12px', color: '#374151', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 10px', fontWeight: 500 }}>
                  Created: {fmt(clip.created_at)}
                </span>
                <span style={{ fontSize: '12px', color: '#374151', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 10px', fontWeight: 500 }}>
                  Expires: {clip.expires_at ? fmt(clip.expires_at) : 'Never'}
                </span>
              </div>

              {/* Text content */}
              {clip.text && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={13} />Text Content
                    {clip.language && clip.language !== 'text' && (
                      <span style={{ fontSize: '10px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '4px', padding: '1px 6px', fontWeight: 500 }}>{languageLabel(clip.language)}</span>
                    )}
                  </div>
                  <div style={{ border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ padding: '12px 14px', background: 'var(--surface-2)', maxHeight: '300px', overflowY: 'auto' }}>
                      <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '12px', lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {highlighted
                          ? <code dangerouslySetInnerHTML={{ __html: highlighted }} />
                          : clip.text}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* Files */}
              {clip.files?.length > 0 && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <File size={13} />Files ({clip.files.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {clip.files.map(f => (
                      <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>{f.filename}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{f.size_bytes != null ? formatBytes(f.size_bytes) : '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!clip.text && (!clip.files || clip.files.length === 0) && (
                <div style={{ color: 'var(--text-3)', fontSize: '13px' }}>This clip is empty.</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Main Dashboard ── */
export default function AdminDashboard() {
  const navigate = useNavigate()
  const token = getToken()

  const [stats, setStats] = useState(null)
  const [chartDays, setChartDays] = useState(7)
  const [clips, setClips] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [pages, setPages] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loadingClips, setLoadingClips] = useState(true)
  const [loadingStats, setLoadingStats] = useState(true)
  const [viewSlug, setViewSlug] = useState(null)
  const [deletingSlug, setDeletingSlug] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => {
    if (!isTokenValid(token)) { navigate('/admin/login'); return }
  }, [token, navigate])

  const loadStats = useCallback(async (days) => {
    setLoadingStats(true)
    const r = await fetchStats(token, days)
    setLoadingStats(false)
    if (r.unauthorized) { clearToken(); navigate('/admin/login'); return }
    if (r.ok) setStats(r.data)
  }, [token, navigate])

  const loadClips = useCallback(async (p, q) => {
    setLoadingClips(true)
    const r = await fetchClips(token, p, q)
    setLoadingClips(false)
    if (r.unauthorized) { clearToken(); navigate('/admin/login'); return }
    if (r.ok) { setClips(r.data.clips); setTotal(r.data.total); setPage(r.data.page); setPages(r.data.pages) }
  }, [token, navigate])

  useEffect(() => { loadStats(chartDays) }, [chartDays, loadStats])
  useEffect(() => { loadClips(0, search) }, [search, loadClips])

  async function handleDelete(slug) {
    if (confirmDelete !== slug) { setConfirmDelete(slug); return }
    setDeletingSlug(slug); setConfirmDelete(null)
    const r = await deleteClip(token, slug)
    setDeletingSlug(null)
    if (r.unauthorized) { clearToken(); navigate('/admin/login'); return }
    if (r.ok) { loadClips(page, search); loadStats(chartDays) }
  }

  function handleSearch(e) {
    e.preventDefault()
    setSearch(searchInput.trim())
    setPage(0)
  }

  function logout() { clearToken(); navigate('/admin/login') }

  const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', boxShadow: 'var(--shadow-sm)', padding: '20px' }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/favicon.ico" style={{ width: '28px', height: '28px' }} alt="Cl1p" />
          <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text)' }}>Cl1p</span>
          <span style={{ fontSize: '12px', color: 'var(--text-3)', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px 8px', fontWeight: 500 }}>Admin</span>
        </div>
        <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '32px', padding: '0 12px', background: 'transparent', color: 'var(--text-2)', border: '1px solid var(--border)', borderRadius: '6px', fontFamily: 'inherit', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#000'; e.currentTarget.style.color = '#000' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)' }}
        ><LogOut size={13} />Logout</button>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {[
            { label: 'Total Clips', value: stats?.summary.total ?? '—', color: '#000' },
            { label: 'Active', value: stats?.summary.active ?? '—', color: '#16a34a' },
            { label: 'Expired', value: stats?.summary.expired ?? '—', color: '#dc2626' },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-2)', marginBottom: '8px' }}>{s.label}</div>
              <div style={{ fontSize: '32px', fontWeight: 700, color: s.color, letterSpacing: '-0.02em' }}>
                {loadingStats ? <span style={{ fontSize: '20px', color: 'var(--text-3)' }}>…</span> : s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <span style={{ fontSize: '15px', fontWeight: 600 }}>Clips Created</span>
            <select value={chartDays} onChange={e => setChartDays(Number(e.target.value))}
              style={{ height: '32px', padding: '0 10px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'inherit', fontSize: '12px', outline: 'none', cursor: 'pointer' }}
              onFocus={e => e.target.style.borderColor = '#000'} onBlur={e => e.target.style.borderColor = 'var(--border)'}
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={0}>All time</option>
            </select>
          </div>
          {loadingStats
            ? <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: '13px' }}>Loading…</div>
            : <BarChart data={stats?.daily || []} />
          }
        </div>

        {/* Clips Table */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <span style={{ fontSize: '15px', fontWeight: 600 }}>All Clips <span style={{ fontWeight: 400, color: 'var(--text-3)', fontSize: '13px' }}>({total})</span></span>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden', background: 'var(--surface)' }}>
                <Search size={14} color="#9ca3af" style={{ margin: '0 10px', flexShrink: 0 }} />
                <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Search by name…"
                  style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: '13px', color: 'var(--text)', padding: '7px 10px 7px 0', width: '200px' }} />
              </div>
              <button type="submit" style={{ height: '34px', padding: '0 14px', background: '#000', color: '#fff', border: 'none', borderRadius: '6px', fontFamily: 'inherit', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>Search</button>
              {search && <button type="button" onClick={() => { setSearch(''); setSearchInput('') }}
                style={{ height: '34px', padding: '0 12px', background: 'transparent', color: 'var(--text-2)', border: '1px solid var(--border)', borderRadius: '6px', fontFamily: 'inherit', fontSize: '12px', cursor: 'pointer' }}>Clear</button>}
            </form>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  {['Name', 'Created', 'Expires At', 'Status', 'Files', 'Actions'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: '11px', fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loadingClips ? (
                  <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-3)' }}>Loading…</td></tr>
                ) : clips.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-3)' }}>No clips found</td></tr>
                ) : clips.map(c => {
                  const status = expiryStatus(c.expires_at)
                  const isDeleting = deletingSlug === c.slug
                  const isConfirming = confirmDelete === c.slug
                  return (
                    <tr key={c.slug} style={{ borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text)', fontFamily: 'monospace' }}>{c.slug}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{fmt(c.created_at)}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>
                        <div>{c.expires_at ? fmt(c.expires_at) : 'Never'}</div>
                        {c.expires_at && <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{fmtExpiry(c.expires_at)}</div>}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '99px', fontSize: '11px', fontWeight: 600, background: status.bg, color: status.color }}>{status.label}</span>
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-2)', textAlign: 'center' }}>{c.file_count}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <button onClick={() => setViewSlug(c.slug)} title="View"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#000' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
                          ><Eye size={13} /></button>
                          <button
                            onClick={() => handleDelete(c.slug)}
                            disabled={isDeleting}
                            title={isConfirming ? 'Click again to confirm' : 'Delete'}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', height: '30px', padding: '0 10px', background: isConfirming ? 'rgba(220,38,38,0.1)' : 'var(--surface-2)', color: isConfirming ? '#dc2626' : 'var(--text-2)', border: `1px solid ${isConfirming ? 'rgba(220,38,38,0.3)' : 'var(--border)'}`, borderRadius: '6px', cursor: isDeleting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' }}
                            onMouseEnter={e => { if (!isConfirming) { e.currentTarget.style.borderColor = '#dc2626'; e.currentTarget.style.color = '#dc2626' } }}
                            onMouseLeave={e => { if (!isConfirming) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)' } }}
                          >
                            {isDeleting ? '…' : isConfirming ? 'Confirm?' : <Trash2 size={13} />}
                          </button>
                          {isConfirming && (
                            <button onClick={() => setConfirmDelete(null)}
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-3)', fontSize: '11px' }}
                            >✕</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>Page {page + 1} of {pages}</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button disabled={page === 0} onClick={() => loadClips(page - 1, search)}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '32px', padding: '0 12px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', fontFamily: 'inherit', fontSize: '12px', cursor: page === 0 ? 'not-allowed' : 'pointer', color: page === 0 ? 'var(--text-3)' : 'var(--text)' }}
                ><ChevronLeft size={13} />Prev</button>
                <button disabled={page >= pages - 1} onClick={() => loadClips(page + 1, search)}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '32px', padding: '0 12px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', fontFamily: 'inherit', fontSize: '12px', cursor: page >= pages - 1 ? 'not-allowed' : 'pointer', color: page >= pages - 1 ? 'var(--text-3)' : 'var(--text)' }}
                >Next<ChevronRight size={13} /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View Modal */}
      {viewSlug && <ClipModal slug={viewSlug} token={token} onClose={() => setViewSlug(null)} />}
    </div>
  )
}
