const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://cl1p.in',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-read-password, x-write-password',
};

function corsResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
      ...extraHeaders,
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

async function deleteClipData(env, slug) {
  // Delete all R2 objects for this clip
  const files = await env.DB.prepare(
    'SELECT r2_key FROM clip_files WHERE clip_slug = ?'
  )
    .bind(slug)
    .all();

  if (files.results && files.results.length > 0) {
    await Promise.all(files.results.map((f) => env.FILES.delete(f.r2_key)));
  }

  // Delete the clip row (cascade deletes clip_files rows)
  await env.DB.prepare('DELETE FROM clips WHERE slug = ?').bind(slug).run();
}

// GET /api/clips/[slug]
export async function onRequestGet({ params, env, request }) {
  const { slug } = params;

  const clip = await env.DB.prepare('SELECT * FROM clips WHERE slug = ?')
    .bind(slug)
    .first();

  if (!clip) {
    return err('Clip not found', 404);
  }

  // Lazy expiry check
  if (clip.expires_at !== null && clip.expires_at < Math.floor(Date.now() / 1000)) {
    await deleteClipData(env, slug);
    return err('Clip not found', 404);
  }

  // Access control
  if (!clip.is_public) {
    const provided = request.headers.get('x-read-password');
    if (!provided) {
      return err('Read password required', 401);
    }
    if (await hashPassword(provided) !== clip.read_password) {
      return err('Invalid read password', 401);
    }
  }

  // Fetch associated files
  const filesResult = await env.DB.prepare(
    'SELECT id, filename, mime_type, size_bytes, r2_key FROM clip_files WHERE clip_slug = ?'
  )
    .bind(slug)
    .all();

  const files = (filesResult.results || []).map((f) => ({
    id: f.id,
    filename: f.filename,
    mime_type: f.mime_type,
    size_bytes: f.size_bytes,
  }));

  return ok({
    slug: clip.slug,
    text: clip.text,
    language: clip.language,
    is_public: clip.is_public === 1,
    edit_mode: clip.edit_mode,
    expires_at: clip.expires_at,
    created_at: clip.created_at,
    files,
  });
}

// POST /api/clips/[slug]
export async function onRequestPost({ params, env, request }) {
  const { slug } = params;

  // Validate slug
  if (!slug || slug.length > 100 || !/^[a-zA-Z0-9_-]+$/.test(slug)) {
    return err('Invalid slug. Use 1-100 alphanumeric characters, hyphens, or underscores.', 400);
  }

  // Check if clip already exists
  const existing = await env.DB.prepare('SELECT slug FROM clips WHERE slug = ?')
    .bind(slug)
    .first();

  if (existing) {
    return err('Clip with this slug already exists', 409);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return err('Invalid JSON body', 400);
  }

  const {
    text = null,
    language = null,
    is_public = true,
    read_password = null,
    edit_mode = 'public',
    write_password = null,
    expires_in_seconds = null,
    files = [],
  } = body;

  // Input size limits
  if (text && text.length > 500_000) return err('Text content too large. Maximum 500,000 characters.', 413);
  if (read_password && read_password.length > 128) return err('Read password too long.', 400);
  if (write_password && write_password.length > 128) return err('Write password too long.', 400);
  if (!Array.isArray(files) || files.length > 20) return err('Too many files. Maximum 20 per clip.', 400);
  const totalFileSize = files.reduce((sum, f) => sum + (Number(f.size_bytes) || 0), 0);
  if (totalFileSize > 50 * 1024 * 1024) return err('Total file size exceeds 50 MB limit.', 413);

  // Validate edit_mode
  if (!['public', 'password', 'read_only'].includes(edit_mode)) {
    return err('edit_mode must be one of: public, password, read_only', 400);
  }

  // Hash passwords if provided
  const hashedReadPassword = read_password ? await hashPassword(read_password) : null;
  const hashedWritePassword = write_password ? await hashPassword(write_password) : null;

  const now = Math.floor(Date.now() / 1000);
  const expires_at =
    expires_in_seconds !== null && expires_in_seconds > 0
      ? now + expires_in_seconds
      : null;

  await env.DB.prepare(
    `INSERT INTO clips (slug, text, language, is_public, read_password, edit_mode, write_password, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      slug,
      text,
      language,
      is_public ? 1 : 0,
      hashedReadPassword,
      edit_mode,
      hashedWritePassword,
      expires_at,
      now
    )
    .run();

  // Insert file metadata if provided
  if (files.length > 0) {
    for (const file of files) {
      const { id, filename, mime_type = null, size_bytes = null } = file;
      if (!id || !filename) continue;
      const r2Key = `${slug}/${id}/${filename}`;
      await env.DB.prepare(
        `INSERT INTO clip_files (id, clip_slug, filename, mime_type, size_bytes, r2_key)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
        .bind(id, slug, filename, mime_type, size_bytes, r2Key)
        .run();
    }
  }

  return ok({
    slug,
    created_at: now,
    expires_at,
  });
}

// PUT /api/clips/[slug]
export async function onRequestPut({ params, env, request }) {
  const { slug } = params;

  const clip = await env.DB.prepare('SELECT * FROM clips WHERE slug = ?')
    .bind(slug)
    .first();

  if (!clip) {
    return err('Clip not found', 404);
  }

  // Lazy expiry check
  if (clip.expires_at !== null && clip.expires_at < Math.floor(Date.now() / 1000)) {
    await deleteClipData(env, slug);
    return err('Clip not found', 404);
  }

  // Edit mode checks
  if (clip.edit_mode === 'read_only') {
    return err('This clip is read-only', 403);
  }

  if (clip.edit_mode === 'password') {
    const provided = request.headers.get('x-write-password');
    if (!provided) {
      return err('Write password required', 401);
    }
    if (await hashPassword(provided) !== clip.write_password) {
      return err('Invalid write password', 401);
    }
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return err('Invalid JSON body', 400);
  }

  const { text, language } = body;

  if (text && text.length > 500_000) return err('Text content too large. Maximum 500,000 characters.', 413);

  await env.DB.prepare('UPDATE clips SET text = ?, language = ? WHERE slug = ?')
    .bind(text ?? null, language ?? null, slug)
    .run();

  return ok({ slug, text: text ?? null, language: language ?? null });
}

// DELETE /api/clips/[slug]
export async function onRequestDelete({ params, env, request }) {
  const { slug } = params;

  const clip = await env.DB.prepare('SELECT * FROM clips WHERE slug = ?')
    .bind(slug)
    .first();

  if (!clip) {
    return err('Clip not found', 404);
  }

  // Verify write password if edit_mode is password
  if (clip.edit_mode === 'password') {
    const provided = request.headers.get('x-write-password');
    if (!provided) {
      return err('Write password required', 401);
    }
    if (await hashPassword(provided) !== clip.write_password) {
      return err('Invalid write password', 401);
    }
  }

  await deleteClipData(env, slug);

  return ok({ slug, deleted: true });
}

// OPTIONS preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
