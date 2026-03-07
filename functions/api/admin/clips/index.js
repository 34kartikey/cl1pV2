import { verifyAdminToken, corsHeaders, json } from '../_auth.js'

export async function onRequestGet({ request, env }) {
  const cors = corsHeaders(request)
  if (!await verifyAdminToken(request, env)) return json({ success: false, error: 'Unauthorized' }, 401, cors)

  const url = new URL(request.url)
  const page = Math.max(0, parseInt(url.searchParams.get('page') || '0'))
  const limit = 20
  const offset = page * limit
  const search = url.searchParams.get('q') || ''

  const where = search ? `WHERE c.slug LIKE ?` : ''
  const binds = search ? [`%${search}%`, limit, offset] : [limit, offset]

  const [countRow, clipsResult] = await Promise.all([
    search
      ? env.DB.prepare(`SELECT COUNT(*) as n FROM clips WHERE slug LIKE ?`).bind(`%${search}%`).first()
      : env.DB.prepare(`SELECT COUNT(*) as n FROM clips`).first(),
    env.DB.prepare(
      `SELECT c.slug, c.is_public, c.edit_mode, c.expires_at, c.created_at,
              (SELECT COUNT(*) FROM clip_files cf WHERE cf.clip_slug = c.slug) as file_count
       FROM clips c ${where}
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`
    ).bind(...binds).all(),
  ])

  const total = countRow?.n || 0
  return json({
    success: true,
    data: {
      clips: clipsResult.results || [],
      total,
      page,
      pages: Math.ceil(total / limit),
    },
  }, 200, cors)
}

export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: corsHeaders(request) })
}
