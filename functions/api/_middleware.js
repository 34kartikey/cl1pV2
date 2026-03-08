import { checkRateLimit } from './_utils.js';

// Apply rate limiting to all write operations under /api/
export async function onRequest({ request, env, next }) {
  const method = request.method;

  // Only rate-limit write operations; let reads through freely
  if (method === 'GET' || method === 'OPTIONS' || method === 'HEAD') {
    return next();
  }

  const limited = await checkRateLimit(env, request);
  if (limited) return limited;

  return next();
}
