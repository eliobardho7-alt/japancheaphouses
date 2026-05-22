/**
 * Lightweight in-memory IP rate limiter for Next.js API routes.
 *
 * NOTE: this lives in module memory, so on Vercel serverless each cold
 * instance gets its own counters. That's still enough to stop most casual
 * abuse (rapid-fire bots usually hit the same warm instance). For stronger
 * guarantees swap to @upstash/ratelimit once you have a Redis/KV store.
 */

const BUCKETS = new Map();

/**
 * @param {Request} request
 * @param {{ key?: string, limit?: number, windowMs?: number }} opts
 * @returns {{ ok: boolean, remaining: number, resetAt: number }}
 */
export function rateLimit(request, opts = {}) {
  const key = opts.key || 'default';
  const limit = opts.limit ?? 5;
  const windowMs = opts.windowMs ?? 60_000;

  const ip = getClientIp(request) || 'unknown';
  const bucketKey = `${key}:${ip}`;
  const now = Date.now();

  const existing = BUCKETS.get(bucketKey);
  if (!existing || existing.resetAt <= now) {
    BUCKETS.set(bucketKey, { count: 1, resetAt: now + windowMs });
    pruneIfBig();
    return { ok: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (existing.count >= limit) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { ok: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}

export function getClientIp(request) {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const real = request.headers.get('x-real-ip');
  if (real) return real.trim();
  return null;
}

function pruneIfBig() {
  if (BUCKETS.size <= 5000) return;
  const now = Date.now();
  for (const [k, v] of BUCKETS) {
    if (v.resetAt <= now) BUCKETS.delete(k);
  }
}
