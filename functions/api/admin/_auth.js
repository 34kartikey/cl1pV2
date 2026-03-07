export async function hmacSign(data, secret) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export async function verifyAdminToken(request, env) {
  const auth = request.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return false
  const token = auth.slice(7)
  const dot = token.lastIndexOf('.')
  if (dot === -1) return false
  const expStr = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  if (parseInt(expStr) < Date.now()) return false
  const expected = await hmacSign(expStr, env.ADMIN_SECRET || 'change-me')
  return expected === sig
}

export function corsHeaders(request) {
  const origin = request.headers.get('Origin') || ''
  const allowed = ['https://cl1p.in', 'https://admin.cl1p.in', 'http://localhost:5173', 'http://localhost:5174']
  return {
    'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : 'https://cl1p.in',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

export function json(body, status, cors) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  })
}
