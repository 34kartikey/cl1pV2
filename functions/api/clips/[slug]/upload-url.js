const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://cl1p.in',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// POST /api/clips/[slug]/upload-url
//
// R2 does not support native presigned URLs in Workers. Instead, we return a
// Worker-proxied upload endpoint URL that the client can PUT the file body to.
// The actual upload is handled by the [fileId].js PUT route under files/.
// We record the file metadata in D1 here so it is available immediately.
export async function onRequestPost({ params, env, request }) {
  const { slug } = params;

  const clip = await env.DB.prepare(
    'SELECT slug, edit_mode, write_password, expires_at FROM clips WHERE slug = ?'
  )
    .bind(slug)
    .first();

  if (!clip) {
    return err('Clip not found', 404);
  }

  // Lazy expiry check
  if (clip.expires_at !== null && clip.expires_at < Math.floor(Date.now() / 1000)) {
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

  // Check write permission
  if (clip.edit_mode === 'read_only') {
    return err('This clip is read-only', 403);
  }

  if (clip.edit_mode === 'password') {
    const provided = request.headers.get('x-write-password');
    if (!provided) {
      return err('Write password required', 401);
    }
    const hashed = await hashPassword(provided);
    if (hashed !== clip.write_password) {
      return err('Invalid write password', 401);
    }
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return err('Invalid JSON body', 400);
  }

  const { fileId, filename, mime_type = null, size_bytes = null } = body;

  if (!fileId || !filename) {
    return err('fileId and filename are required', 400);
  }

  // Enforce 50 MB total per clip
  const totalRow = await env.DB.prepare(
    'SELECT SUM(size_bytes) as total FROM clip_files WHERE clip_slug = ?'
  ).bind(slug).first();
  const currentTotal = Number(totalRow?.total) || 0;
  if (currentTotal + (Number(size_bytes) || 0) > 50 * 1024 * 1024) {
    return err('Total file size would exceed the 50 MB limit for this clip.', 413);
  }

  const r2Key = `${slug}/${fileId}/${filename}`;

  // Upsert file record into D1
  const existing = await env.DB.prepare('SELECT id FROM clip_files WHERE id = ?')
    .bind(fileId)
    .first();

  if (!existing) {
    await env.DB.prepare(
      `INSERT INTO clip_files (id, clip_slug, filename, mime_type, size_bytes, r2_key)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(fileId, slug, filename, mime_type, size_bytes, r2Key)
      .run();
  }

  // Build the proxied upload URL — client should PUT the file body to this URL.
  // The URL points to the file proxy endpoint which handles the actual R2 write.
  const uploadUrl = `/api/clips/${encodeURIComponent(slug)}/files/${encodeURIComponent(fileId)}`;

  return ok({ uploadUrl, r2Key });
}

// OPTIONS preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
