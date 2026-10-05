/**
 * Minimal in-memory fixed-window rate limiter, used to cap Gemini cost on a
 * public demo. State is per server instance (it resets on cold start and is
 * not shared across serverless instances), so it is a safeguard, not a quota.
 */

const WINDOW_MS = 60 * 60 * 1000;
const DEFAULT_LIMIT = 20;
const MAX_TRACKED = 5000;

interface Bucket {
  count: number;
  resetAt: number;
}

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
  now: number = Date.now()
): RateLimitResult {
  if (buckets.size >= MAX_TRACKED) {
    buckets.forEach((b, k) => {
      if (b.resetAt <= now) buckets.delete(k);
    });
    if (buckets.size >= MAX_TRACKED) buckets.clear();
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSec: 0 };
  }
  if (bucket.count >= limit) {
    return { allowed: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count += 1;
  return { allowed: true, retryAfterSec: 0 };
}

export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}

export function resetRateLimits(): void {
  buckets.clear();
}
