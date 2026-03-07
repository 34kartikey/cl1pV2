const BASE = '/api'

/**
 * Fetch a clip by slug. Optionally pass a read password.
 * Returns { ok: true, clip } or { ok: false, status, error }
 */
export async function getClip(slug, readPassword = null) {
  const headers = {}
  if (readPassword) {
    headers['x-read-password'] = readPassword
  }

  let res
  try {
    res = await fetch(`${BASE}/clips/${encodeURIComponent(slug)}`, { headers })
  } catch (e) {
    return { ok: false, status: 0, error: 'Network error. Is the server running?' }
  }

  if (res.ok) {
    const body = await res.json()
    return { ok: true, clip: body.data }
  }

  let error = `Error ${res.status}`
  try {
    const body = await res.json()
    if (body.error) error = body.error
    else if (body.message) error = body.message
  } catch (_) {}

  return { ok: false, status: res.status, error }
}

/**
 * Create a new clip.
 * @param {string} slug
 * @param {object} payload - { text, language, is_public, read_password, edit_mode, write_password, expires_in_seconds, files }
 * Returns { ok: true, clip } or { ok: false, error }
 */
export async function createClip(slug, payload) {
  let res
  try {
    res = await fetch(`${BASE}/clips/${encodeURIComponent(slug)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (e) {
    return { ok: false, error: 'Network error. Is the server running?' }
  }

  if (res.ok) {
    const body = await res.json()
    return { ok: true, clip: body.data }
  }

  let error = `Error ${res.status}`
  try {
    const body = await res.json()
    if (body.error) error = body.error
    else if (body.message) error = body.message
  } catch (_) {}

  return { ok: false, error }
}

/**
 * Upload a single file.
 * @param {string} slug
 * @param {string} fileId - UUID
 * @param {File} file
 * @param {function} onProgress - called with 0-100
 * Returns { ok: true } or { ok: false, error }
 */
export async function uploadFile(slug, fileId, file, onProgress) {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', `${BASE}/clips/${encodeURIComponent(slug)}/files/${encodeURIComponent(fileId)}`)
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100)
        resolve({ ok: true })
      } else {
        let error = `Upload failed (${xhr.status})`
        try {
          const body = JSON.parse(xhr.responseText)
          if (body.error) error = body.error
        } catch (_) {}
        resolve({ ok: false, error })
      }
    })

    xhr.addEventListener('error', () => {
      resolve({ ok: false, error: 'Network error during upload' })
    })

    xhr.send(file)
  })
}

/**
 * Update clip text/language.
 */
export async function updateClip(slug, { text, language }, writePassword = null) {
  const headers = { 'Content-Type': 'application/json' }
  if (writePassword) headers['x-write-password'] = writePassword
  try {
    const res = await fetch(`${BASE}/clips/${encodeURIComponent(slug)}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ text, language }),
    })
    const body = await res.json()
    if (res.ok) return { ok: true }
    return { ok: false, error: body.error || `Error ${res.status}` }
  } catch { return { ok: false, error: 'Network error' } }
}

/**
 * Register a new file record on an existing clip (before uploading).
 */
export async function registerFile(slug, { fileId, filename, mime_type, size_bytes }, writePassword = null) {
  const headers = { 'Content-Type': 'application/json' }
  if (writePassword) headers['x-write-password'] = writePassword
  try {
    const res = await fetch(`${BASE}/clips/${encodeURIComponent(slug)}/upload-url`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ fileId, filename, mime_type, size_bytes }),
    })
    const body = await res.json()
    if (res.ok) return { ok: true, uploadUrl: body.data?.uploadUrl }
    return { ok: false, error: body.error || `Error ${res.status}` }
  } catch { return { ok: false, error: 'Network error' } }
}

/**
 * Delete a file from a clip.
 */
export async function deleteFile(slug, fileId, writePassword = null) {
  const headers = {}
  if (writePassword) headers['x-write-password'] = writePassword
  try {
    const res = await fetch(`${BASE}/clips/${encodeURIComponent(slug)}/files/${encodeURIComponent(fileId)}`, {
      method: 'DELETE', headers,
    })
    const body = await res.json()
    if (res.ok) return { ok: true }
    return { ok: false, error: body.error || `Error ${res.status}` }
  } catch { return { ok: false, error: 'Network error' } }
}

/**
 * Rename a file.
 */
export async function renameFile(slug, fileId, filename, writePassword = null) {
  const headers = { 'Content-Type': 'application/json' }
  if (writePassword) headers['x-write-password'] = writePassword
  try {
    const res = await fetch(`${BASE}/clips/${encodeURIComponent(slug)}/files/${encodeURIComponent(fileId)}`, {
      method: 'PATCH', headers,
      body: JSON.stringify({ filename }),
    })
    const body = await res.json()
    if (res.ok) return { ok: true }
    return { ok: false, error: body.error || `Error ${res.status}` }
  } catch { return { ok: false, error: 'Network error' } }
}

/**
 * Get the URL to download a file.
 */
export function fileDownloadUrl(slug, fileId) {
  return `${BASE}/clips/${encodeURIComponent(slug)}/files/${encodeURIComponent(fileId)}`
}

/**
 * Format bytes into human-readable size.
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}
