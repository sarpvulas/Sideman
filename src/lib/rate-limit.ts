/**
 * Minimal in-memory fixed-window rate limiter, used to cap Gemini cost on a
 * public demo. State is per server instance (it resets on cold start and is
 * not shared across serverless instances), so it is a safeguard, not a quota.
 */

const WINDOW_MS = 60 * 60 * 1000;
const DEFAULT_LIMIT = 20;
const DEFAULT_MAX_TRACKED = 5000;

interface Bucket {
  count: number;
  resetAt: number;
}

// Map keeps insertion order, so the first key is always the oldest bucket.
const buckets = new Map<string, Bucket>();

export function getLimit(env: string | undefined = process.env.RATE_LIMIT_PER_HOUR): number {
  const n = Number.parseInt(env ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_LIMIT;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSec: number;
}

export function checkRateLimit(
  key: string,
  limit: number = getLimit(),
  now: number = Date.now(),
  maxTracked: number = DEFAULT_MAX_TRACKED
): RateLimitResult {
  const bucket = buckets.get(key);
  if (bucket && bucket.resetAt > now) {
    if (bucket.count >= limit) {
      return { allowed: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
    }
    bucket.count += 1;
    return { allowed: true, retryAfterSec: 0 };
  }

  // New or expired bucket: re-insert so it becomes the newest, then evict oldest-first
  buckets.delete(key);
  buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
  while (buckets.size > maxTracked) {
    const oldest = buckets.keys().next().value as string;
    buckets.delete(oldest);
  }
  return { allowed: true, retryAfterSec: 0 };
}

/**
 * Best-effort client identity. x-forwarded-for is client-controllable (callers
 * can prepend their own values), so it is only a fallback, and then only its
 * last hop, which is the one appended by the nearest proxy. On Vercel,
 * x-real-ip is set by the platform and takes priority.
 */
export function clientIp(headers: Headers): string {
  const real = headers.get("x-real-ip")?.trim();
  if (real) return real;
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded.split(",").map((h) => h.trim()).filter(Boolean);
    if (hops.length > 0) return hops[hops.length - 1];
  }
  return "unknown";
}

export function resetRateLimits(): void {
  buckets.clear();
}
