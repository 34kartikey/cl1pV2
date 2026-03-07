const BASE = '/api/admin'

function authHeaders(token) {
  return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
}

export function getToken() {
  return localStorage.getItem('admin_token')
}

export function saveToken(token) {
  localStorage.setItem('admin_token', token)
}

export function clearToken() {
  localStorage.removeItem('admin_token')
}

export function isTokenValid(token) {
  if (!token) return false
  const dot = token.lastIndexOf('.')
  if (dot === -1) return false
  const exp = parseInt(token.slice(0, dot))
  return !isNaN(exp) && exp > Date.now()
}

export async function adminLogin(password) {
  const res = await fetch(`${BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  const body = await res.json()
  if (res.ok && body.success) return { ok: true, token: body.data.token }
  return { ok: false, error: body.error || 'Login failed' }
}

export async function fetchStats(token, days = 7) {
  const res = await fetch(`${BASE}/stats?days=${days}`, { headers: authHeaders(token) })
  const body = await res.json()
  if (res.ok && body.success) return { ok: true, data: body.data }
  if (res.status === 401) return { ok: false, unauthorized: true }
  return { ok: false, error: body.error }
}

export async function fetchClips(token, page = 0, search = '') {
  const params = new URLSearchParams({ page, ...(search ? { q: search } : {}) })
  const res = await fetch(`${BASE}/clips?${params}`, { headers: authHeaders(token) })
  const body = await res.json()
  if (res.ok && body.success) return { ok: true, data: body.data }
  if (res.status === 401) return { ok: false, unauthorized: true }
  return { ok: false, error: body.error }
}

export async function fetchClip(token, slug) {
  const res = await fetch(`${BASE}/clips/${encodeURIComponent(slug)}`, { headers: authHeaders(token) })
  const body = await res.json()
  if (res.ok && body.success) return { ok: true, clip: body.data }
  if (res.status === 401) return { ok: false, unauthorized: true }
  return { ok: false, error: body.error }
}

export async function deleteClip(token, slug) {
  const res = await fetch(`${BASE}/clips/${encodeURIComponent(slug)}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  const body = await res.json()
  if (res.ok && body.success) return { ok: true }
  if (res.status === 401) return { ok: false, unauthorized: true }
  return { ok: false, error: body.error }
}
