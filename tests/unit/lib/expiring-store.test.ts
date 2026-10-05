import { describe, it, expect } from "vitest";
import { ExpiringStore } from "@/lib/dummy-data";

describe("ExpiringStore", () => {
  it("drops entries after the TTL", () => {
    const s = new ExpiringStore<{ n: number }>(1000, 10);
    s.set("a", { n: 1 }, 0);
    expect(s.get("a", 999)).toEqual({ n: 1 });
    expect(s.get("a", 1001)).toBeUndefined();
  });

  it("evicts the oldest entry when over the size cap", () => {
    const s = new ExpiringStore<number>(10_000, 2);
    s.set("a", 1, 0);
    s.set("b", 2, 1);
    s.set("c", 3, 2);
    expect(s.get("a", 3)).toBeUndefined();
    expect(s.get("b", 3)).toBe(2);
    expect(s.get("c", 3)).toBe(3);
  });

  it("update merges fields without extending the lifetime", () => {
    const s = new ExpiringStore<{ a: number; b: number }>(1000, 10);
    s.set("x", { a: 1, b: 1 }, 0);
    s.update("x", { b: 2 }, 500);
    expect(s.get("x", 600)).toEqual({ a: 1, b: 2 });
    expect(s.get("x", 1001)).toBeUndefined();
  });
});
