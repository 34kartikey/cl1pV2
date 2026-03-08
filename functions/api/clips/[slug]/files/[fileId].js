import { checkStorageCapacity } from '../../../_utils.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://cl1p.in',
  'Access-Control-Allow-Methods': 'GET, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-read-password, x-write-password',
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}

function ok(data) {
  return jsonResponse({ success: true, data });
}

function err(message, status = 400) {
  return jsonResponse({ success: false, error: message }, status);
}

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// GET /api/clips/[slug]/files/[fileId]
// Proxy file download from R2.
export async function onRequestGet({ params, env, request }) {
  const { slug, fileId } = params;

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

  // Access control
  if (!clip.is_public) {
    const provided = request.headers.get('x-read-password');
    if (!provided) {
      return err('Read password required', 401);
    }
    const hashed = await hashPassword(provided);
    if (hashed !== clip.read_password) {
      return err('Invalid read password', 401);
    }
  }

  const fileRecord = await env.DB.prepare(
    'SELECT filename, mime_type, r2_key FROM clip_files WHERE id = ? AND clip_slug = ?'
  )
    .bind(fileId, slug)
    .first();

  if (!fileRecord) {
    return err('File not found', 404);
  }

  const obj = await env.FILES.get(fileRecord.r2_key);

  if (!obj) {
    return err('File data not found in storage', 404);
  }

  const contentType =
    (obj.httpMetadata && obj.httpMetadata.contentType) ||
    fileRecord.mime_type ||
    'application/octet-stream';

  return new Response(obj.body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileRecord.filename)}`,
      ...CORS_HEADERS,
    },
  });
}

// PUT /api/clips/[slug]/files/[fileId]
// Accept a file upload and stream it to R2.
// This is the proxied upload target returned by upload-url.js.
export async function onRequestPut({ params, env, request }) {
  const { slug, fileId } = params;

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

  // Write-auth check — read_only clips allow the initial creation upload but not edits.
  // Password-protected clips require the write password on every upload.
  if (clip.edit_mode === 'password') {
    const provided = request.headers.get('x-write-password');
    if (!provided) return err('Write password required', 401);
    if (await hashPassword(provided) !== clip.write_password) return err('Invalid write password', 401);
  }

  // Check global storage capacity before accepting the upload
  const capacityError = await checkStorageCapacity(env);
  if (capacityError) return capacityError;

  // File size limit: 50 MB per file
  const contentLengthHeader = request.headers.get('Content-Length');
  if (contentLengthHeader && parseInt(contentLengthHeader, 10) > 50 * 1024 * 1024) {
    return err('File too large. Maximum size is 50 MB.', 413);
  }

  const fileRecord = await env.DB.prepare(
    'SELECT id, filename, mime_type, r2_key FROM clip_files WHERE id = ? AND clip_slug = ?'
  )
    .bind(fileId, slug)
    .first();

  if (!fileRecord) {
    return err('File record not found. Call upload-url first.', 404);
  }

  const contentType =
    request.headers.get('Content-Type') ||
    fileRecord.mime_type ||
    'application/octet-stream';

  await env.FILES.put(fileRecord.r2_key, request.body, {
    httpMetadata: { contentType },
  });

  // Update size_bytes if Content-Length header is present
  const contentLength = request.headers.get('Content-Length');
  if (contentLength) {
    await env.DB.prepare('UPDATE clip_files SET size_bytes = ? WHERE id = ?')
      .bind(parseInt(contentLength, 10), fileId)
      .run();
  }

  return ok({ fileId, r2Key: fileRecord.r2_key, uploaded: true });
}

// PATCH /api/clips/[slug]/files/[fileId]
// Rename a file (updates DB only, r2_key stays the same).
export async function onRequestPatch({ params, env, request }) {
  const { slug, fileId } = params;

  const clip = await env.DB.prepare(
    'SELECT edit_mode, write_password, expires_at FROM clips WHERE slug = ?'
  ).bind(slug).first();

  if (!clip) return err('Clip not found', 404);
  if (clip.expires_at !== null && clip.expires_at < Math.floor(Date.now() / 1000)) {
    return err('Clip not found', 404);
  }
  if (clip.edit_mode === 'read_only') return err('This clip is read-only', 403);
  if (clip.edit_mode === 'password') {
    const provided = request.headers.get('x-write-password');
    if (!provided) return err('Write password required', 401);
    if (await hashPassword(provided) !== clip.write_password) return err('Invalid write password', 401);
  }

  let body;
  try { body = await request.json() } catch { return err('Invalid JSON', 400) }
  const { filename } = body;
  if (!filename) return err('filename is required', 400);

  await env.DB.prepare('UPDATE clip_files SET filename = ? WHERE id = ? AND clip_slug = ?')
    .bind(filename, fileId, slug).run();

  return ok({ fileId, filename });
}

// DELETE /api/clips/[slug]/files/[fileId]
// Remove a file from R2 and D1.
export async function onRequestDelete({ params, env, request }) {
  const { slug, fileId } = params;

  const clip = await env.DB.prepare(
    'SELECT edit_mode, write_password, expires_at FROM clips WHERE slug = ?'
  ).bind(slug).first();

  if (!clip) return err('Clip not found', 404);
  if (clip.expires_at !== null && clip.expires_at < Math.floor(Date.now() / 1000)) {
    return err('Clip not found', 404);
  }
  if (clip.edit_mode === 'read_only') return err('This clip is read-only', 403);
  if (clip.edit_mode === 'password') {
    const provided = request.headers.get('x-write-password');
    if (!provided) return err('Write password required', 401);
    if (await hashPassword(provided) !== clip.write_password) return err('Invalid write password', 401);
  }

  const fileRecord = await env.DB.prepare(
    'SELECT r2_key FROM clip_files WHERE id = ? AND clip_slug = ?'
  ).bind(fileId, slug).first();

  if (!fileRecord) return err('File not found', 404);

  await env.FILES.delete(fileRecord.r2_key);
  await env.DB.prepare('DELETE FROM clip_files WHERE id = ?').bind(fileId).run();

  return ok({ fileId, deleted: true });
}

// OPTIONS preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
