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

  it("uses the first x-forwarded-for address", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }))).toBe("1.2.3.4");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});
