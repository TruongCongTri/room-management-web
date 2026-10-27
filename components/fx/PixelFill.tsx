"use client";

import { useEffect, useRef } from "react";

/**
 * Pixel-dither hover fill. Drop inside any `relative` element with the `fx` class:
 * on hover the parent fills with squares that fade in at random, in quantised steps.
 */
export default function PixelFill({ color = "--ink", cell = 12 }: { color?: string; cell?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    const host = cv?.parentElement;
    if (!cv || !host) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let delays: number[] = [];
    let cols = 0;
    let rows = 0;
    let t = 0; // 0 = empty, 1 = filled
    let target = 0;
    let last = 0;
    let raf = 0;
    const DURATION = reduce ? 1 : 420;

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const { width, height } = host.getBoundingClientRect();
      cv.width = Math.ceil(width * dpr);
      cv.height = Math.ceil(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(width / cell);
      rows = Math.ceil(height / cell);
      delays = Array.from({ length: cols * rows }, () => Math.random() * 0.6);
      draw();
    };

    const draw = () => {
      const w = cv.width;
      const h = cv.height;
      ctx.clearRect(0, 0, w, h);
      if (t <= 0) return;
      ctx.fillStyle = getComputedStyle(host).getPropertyValue(color).trim() || "#282828";
      for (let i = 0; i < delays.length; i++) {
        const k = Math.min(1, Math.max(0, (t - delays[i]) / 0.4));
        if (k <= 0) continue;
        ctx.globalAlpha = Math.ceil(k * 4) / 4; // stepped, like a dither
        ctx.fillRect((i % cols) * cell, Math.floor(i / cols) * cell, cell + 0.5, cell + 0.5);
      }
      ctx.globalAlpha = 1;
    };

    const tick = (now: number) => {
      const dt = last ? now - last : 16;
      last = now;
      const step = dt / DURATION;
      t = target > t ? Math.min(target, t + step) : Math.max(target, t - step);
      draw();
      raf = t !== target ? requestAnimationFrame(tick) : 0;
      if (!raf) last = 0;
    };
    const go = (to: number) => {
      target = to;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const enter = () => go(1);
    const leave = () => go(0);

    const ro = new ResizeObserver(resize);
    ro.observe(host);
    host.addEventListener("pointerenter", enter);
    host.addEventListener("pointerleave", leave);
    host.addEventListener("focusin", enter);
    host.addEventListener("focusout", leave);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      host.removeEventListener("pointerenter", enter);
      host.removeEventListener("pointerleave", leave);
      host.removeEventListener("focusin", enter);
      host.removeEventListener("focusout", leave);
    };
  }, [color, cell]);

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 size-full" />;
}
