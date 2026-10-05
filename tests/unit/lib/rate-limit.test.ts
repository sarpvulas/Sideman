import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, clientIp, getLimit, resetRateLimits } from "@/lib/rate-limit";

describe("rate limiter", () => {
  beforeEach(() => resetRateLimits());

  it("allows up to the limit then blocks with a retry hint", () => {
    const t0 = 1_000_000;
    expect(checkRateLimit("ip", 2, t0).allowed).toBe(true);
    expect(checkRateLimit("ip", 2, t0).allowed).toBe(true);
    const blocked = checkRateLimit("ip", 2, t0 + 1000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBe(3599);
  });

  it("tracks clients independently and resets after the window", () => {
    const t0 = 5_000_000;
    checkRateLimit("a", 1, t0);
    expect(checkRateLimit("a", 1, t0).allowed).toBe(false);
    expect(checkRateLimit("b", 1, t0).allowed).toBe(true);
    expect(checkRateLimit("a", 1, t0 + 60 * 60 * 1000).allowed).toBe(true);
  });

  it("parses the limit from env and falls back to 20", () => {
    expect(getLimit("5")).toBe(5);
    expect(getLimit("abc")).toBe(20);
    expect(getLimit("-3")).toBe(20);
    expect(getLimit(undefined)).toBe(20);
  });

  it("prefers x-real-ip and ignores client-prepended x-forwarded-for values", () => {
    expect(clientIp(new Headers({ "x-real-ip": "9.9.9.9", "x-forwarded-for": "1.1.1.1, 2.2.2.2" }))).toBe("9.9.9.9");
    expect(clientIp(new Headers({ "x-forwarded-for": "spoofed, 10.0.0.1" }))).toBe("10.0.0.1");
    expect(clientIp(new Headers())).toBe("unknown");
  });

  it("evicts the oldest bucket first instead of clearing everyone", () => {
    const t = 1_000;
    checkRateLimit("a", 1, t, 2);
    checkRateLimit("b", 1, t, 2);
    checkRateLimit("c", 1, t, 2); // evicts "a"
    expect(checkRateLimit("b", 1, t, 2).allowed).toBe(false); // still tracked
    expect(checkRateLimit("c", 1, t, 2).allowed).toBe(false); // still tracked
    expect(checkRateLimit("a", 1, t, 2).allowed).toBe(true); // forgotten
  });
});
