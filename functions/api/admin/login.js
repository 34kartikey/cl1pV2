import { hmacSign, corsHeaders, json } from './_auth.js'

export async function onRequestPost({ request, env }) {
  const cors = corsHeaders(request)
  let body
  try { body = await request.json() } catch { return json({ success: false, error: 'Invalid JSON' }, 400, cors) }

  const { password } = body
  if (!password || password.trim() !== (env.ADMIN_PASSWORD || '').trim()) {
    return json({ success: false, error: 'Invalid password' }, 401, cors)
  }

  const exp = Date.now() + 24 * 60 * 60 * 1000
  const sig = await hmacSign(String(exp), env.ADMIN_SECRET || 'change-me')
  const token = `${exp}.${sig}`

  return json({ success: true, data: { token } }, 200, cors)
}

export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: corsHeaders(request) })
}
