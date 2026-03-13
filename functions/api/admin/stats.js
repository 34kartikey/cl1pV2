import { verifyAdminToken, corsHeaders, json } from './_auth.js'

export async function onRequestGet({ request, env }) {
  const cors = corsHeaders(request)
  if (!await verifyAdminToken(request, env)) return json({ success: false, error: 'Unauthorized' }, 401, cors)

  const url = new URL(request.url)
  const days = parseInt(url.searchParams.get('days') || '7')
  const since = days === 0 ? 0 : Math.floor(Date.now() / 1000) - days * 86400

  const [total, active, expired, daily, totalEver] = await Promise.all([
    env.DB.prepare('SELECT COUNT(*) as n FROM clips').first(),
    env.DB.prepare('SELECT COUNT(*) as n FROM clips WHERE expires_at IS NULL OR expires_at > unixepoch()').first(),
    env.DB.prepare('SELECT COUNT(*) as n FROM clips WHERE expires_at IS NOT NULL AND expires_at <= unixepoch()').first(),
    env.DB.prepare(
      `SELECT strftime('%Y-%m-%d', created_at, 'unixepoch') as day, COUNT(*) as count
       FROM clips WHERE created_at >= ?
       GROUP BY day ORDER BY day ASC`
    ).bind(since).all(),
    env.DB.prepare(`SELECT value FROM meta WHERE key = 'total_clips_created'`).first(),
  ])

  return json({
    success: true,
    data: {
      summary: {
        total: total?.n || 0,
        active: active?.n || 0,
        expired: expired?.n || 0,
        total_ever: totalEver?.value || 0,
      },
      daily: daily.results || [],
    },
  }, 200, cors)
}

export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: corsHeaders(request) })
}
