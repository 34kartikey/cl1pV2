const CORS_ORIGIN = 'https://cl1p.in';

/**
 * Rate limit check using Cloudflare KV.
 * Returns a 429 Response if the IP has exceeded the limit, otherwise null.
 * Silently skips if env.RATE_LIMIT (KV namespace) is not bound.
 */
export async function checkRateLimit(env, request) {
  if (!env.RATE_LIMIT) return null;

  const ip =
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0].trim() ||
    'unknown';

  const windowKey = Math.floor(Date.now() / 60000); // 1-minute window
  const key = `rl:${ip}:${windowKey}`;
  const limit = parseInt(env.RATE_LIMIT_WRITES_PER_MIN || '20', 10);

  const current = await env.RATE_LIMIT.get(key);
  const count = current ? parseInt(current, 10) : 0;

  if (count >= limit) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Too many requests. Please slow down and try again in a minute.',
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60',
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': '0',
          'Access-Control-Allow-Origin': CORS_ORIGIN,
        },
      }
    );
  }

  // Increment counter (fire-and-forget, TTL = 2 minutes for cleanup)
  env.RATE_LIMIT.put(key, String(count + 1), { expirationTtl: 120 });
  return null;
}

/**
 * Storage capacity check using D1.
 * Returns a 503 Response if total stored bytes >= MAX_STORAGE_BYTES, otherwise null.
 * Default cap: 5 GB.
 */
export async function checkStorageCapacity(env) {
  const maxBytes = parseInt(
    env.MAX_STORAGE_BYTES || String(5 * 1024 * 1024 * 1024),
    10
  );

  const row = await env.DB.prepare(
    'SELECT SUM(size_bytes) as total FROM clip_files'
  ).first();
  const used = Number(row?.total) || 0;

  if (used >= maxBytes) {
    return new Response(
      JSON.stringify({
        success: false,
        error:
          "Sorry, our storage is currently full. We're working on it — please try again later.",
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': CORS_ORIGIN,
        },
      }
    );
  }

  return null;
}
