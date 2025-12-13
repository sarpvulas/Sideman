"use client";

import { useEffect, useState } from "react";
import type { Variants } from "framer-motion";

export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return prefersReducedMotion;
}

export function useAnimation(variants: Variants) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return {
    variants: prefersReducedMotion ? {} : variants,
    shouldAnimate: !prefersReducedMotion,
  };
}

// Common animation variants
export const fadeInVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

export const slideUpVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.25 },
  },
};

export const buttonVariants: Variants = {
  idle: { scale: 1 },
  hover: { scale: 1.02, transition: { duration: 0.15 } },
  tap: { scale: 0.98, transition: { duration: 0.1 } },
};

export const successVariants: Variants = {
  initial: { scale: 1 },
  success: {
    scale: [1, 1.05, 1],
    boxShadow: [
      "0 0 0 rgba(212, 175, 55, 0)",
      "0 0 30px rgba(212, 175, 55, 0.6)",
      "0 0 0 rgba(212, 175, 55, 0)",
    ],
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export const errorVariants: Variants = {
  initial: { x: 0 },
  error: {
    x: [0, -8, 8, -8, 8, 0],
    boxShadow: [
      "0 0 0 rgba(255, 107, 107, 0)",
      "0 0 20px rgba(255, 107, 107, 0.5)",
      "0 0 0 rgba(255, 107, 107, 0)",
    ],
    transition: { duration: 0.5 },
  },
};

export const staggerContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const staggerItemVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};
