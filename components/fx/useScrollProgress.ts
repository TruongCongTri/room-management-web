"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

export const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
/** Maps p from [a, b] onto [0, 1]. */
export const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Scroll progress of an element.
 * - "pass": 0 when its top enters the bottom of the viewport, 1 when its bottom leaves the top.
 * - "pin":  0 when its top reaches the top of the viewport, 1 when its bottom reaches the bottom
 *           (use for tall wrappers around a sticky stage).
 */
export function useScrollProgress<T extends HTMLElement>(mode: "pass" | "pin" = "pass") {
  const ref = useRef<T>(null);
  const [p, setP] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const v = mode === "pin" ? -r.top / Math.max(1, r.height - vh) : (vh - r.top) / (vh + r.height);
      setP(clamp01(v));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [mode]);

  return [ref, p] as const;
}

/** Live match for a media query (false on the server). */
export function useMedia(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
