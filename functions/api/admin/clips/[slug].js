import { verifyAdminToken, corsHeaders, json } from '../_auth.js'

async function deleteClipData(env, slug) {
  const files = await env.DB.prepare('SELECT r2_key FROM clip_files WHERE clip_slug = ?').bind(slug).all()
  if (files.results?.length > 0) {
    await Promise.all(files.results.map(f => env.FILES.delete(f.r2_key)))
  }
  await env.DB.prepare('DELETE FROM clips WHERE slug = ?').bind(slug).run()
}

// GET /api/admin/clips/:slug — full clip bypassing password
export async function onRequestGet({ params, env, request }) {
  const cors = corsHeaders(request)
  if (!await verifyAdminToken(request, env)) return json({ success: false, error: 'Unauthorized' }, 401, cors)

  const { slug } = params
  const clip = await env.DB.prepare('SELECT * FROM clips WHERE slug = ?').bind(slug).first()
  if (!clip) return json({ success: false, error: 'Clip not found' }, 404, cors)

  const filesResult = await env.DB.prepare(
    'SELECT id, filename, mime_type, size_bytes FROM clip_files WHERE clip_slug = ?'
  ).bind(slug).all()

  return json({
    success: true,
    data: {
      slug: clip.slug,
      text: clip.text,
      language: clip.language,
      is_public: clip.is_public === 1,
      edit_mode: clip.edit_mode,
      expires_at: clip.expires_at,
      created_at: clip.created_at,
      files: filesResult.results || [],
    },
  }, 200, cors)
}

// DELETE /api/admin/clips/:slug
export async function onRequestDelete({ params, env, request }) {
  const cors = corsHeaders(request)
  if (!await verifyAdminToken(request, env)) return json({ success: false, error: 'Unauthorized' }, 401, cors)

  const { slug } = params
  const clip = await env.DB.prepare('SELECT slug FROM clips WHERE slug = ?').bind(slug).first()
  if (!clip) return json({ success: false, error: 'Clip not found' }, 404, cors)

  await deleteClipData(env, slug)
  return json({ success: true, data: { slug, deleted: true } }, 200, cors)
}

export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: corsHeaders(request) })
}
