const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://cl1p.in',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-read-password, x-write-password',
};

function corsResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}

function ok(data) {
  return corsResponse({ success: true, data });
}

function err(message, status = 400) {
  return corsResponse({ success: false, error: message }, status);
}

async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// GET /api/clips/[slug]/verify-read
export async function onRequestGet({ params, env, request }) {
  const { slug } = params;

  const clip = await env.DB.prepare(
    'SELECT slug, is_public, read_password, expires_at FROM clips WHERE slug = ?'
  )
    .bind(slug)
    .first();

  if (!clip) {
    return err('Clip not found', 404);
  }

  // Lazy expiry check
  if (clip.expires_at !== null && clip.expires_at < Math.floor(Date.now() / 1000)) {
    // Delete clip data
    const files = await env.DB.prepare(
      'SELECT r2_key FROM clip_files WHERE clip_slug = ?'
    )
      .bind(slug)
      .all();
    if (files.results && files.results.length > 0) {
      await Promise.all(files.results.map((f) => env.FILES.delete(f.r2_key)));
    }
    await env.DB.prepare('DELETE FROM clips WHERE slug = ?').bind(slug).run();
    return err('Clip not found', 404);
  }

  // If clip is public, no password needed
  if (clip.is_public) {
    return ok({ verified: true });
  }

  const provided = request.headers.get('x-read-password');
  if (!provided) {
    return err('Read password required', 401);
  }

  if (await hashPassword(provided) !== clip.read_password) {
    return err('Invalid read password', 401);
  }

  return ok({ verified: true });
}

// OPTIONS preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
