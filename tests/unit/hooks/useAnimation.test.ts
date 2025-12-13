import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAnimation, usePrefersReducedMotion, buttonVariants } from "@/hooks/useAnimation";

describe("usePrefersReducedMotion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns false when reduced motion is not preferred", () => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
  });

  it("returns true when reduced motion is preferred", () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(true);
  });
});

describe("useAnimation", () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  it("returns variants when motion is allowed", () => {
    const { result } = renderHook(() => useAnimation(buttonVariants));

    expect(result.current.variants).toEqual(buttonVariants);
    expect(result.current.shouldAnimate).toBe(true);
  });

  it("returns empty variants when reduced motion is preferred", () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    const { result } = renderHook(() => useAnimation(buttonVariants));

    expect(result.current.variants).toEqual({});
    expect(result.current.shouldAnimate).toBe(false);
  });
});
