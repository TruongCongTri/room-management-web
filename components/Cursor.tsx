"use client";

import { useEffect, useRef } from "react";

const TRAIL_MS = 260; // how long a point stays in the tail

/** Accent square that follows the pointer, trailing a thin orange line that fades out behind it. */
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = dot.current;
    const cv = canvas.current;
    const ctx = cv?.getContext("2d");
    if (!el || !cv || !ctx || !window.matchMedia("(pointer: fine)").matches) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const points: { x: number; y: number; t: number }[] = [];
    let x = -100;
    let y = -100;
    let tx = x;
    let ty = y;
    let raf = 0;
    let shown = false;
    let accent = "#f15534";

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = window.innerWidth * dpr;
      cv.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || accent;
    };

    const drawTrail = (now: number) => {
      while (points.length && now - points[0].t > TRAIL_MS) points.shift();
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      if (reduce || points.length < 2) return;
      ctx.strokeStyle = accent;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      // draw segment by segment so the tail thins and fades toward the oldest point
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1];
        const b = points[i];
        const life = 1 - (now - b.t) / TRAIL_MS;
        ctx.globalAlpha = Math.max(0, life) * 0.9;
        ctx.lineWidth = 0.5 + life * 1.5;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };

    const loop = (now: number) => {
      x += (tx - x) * 0.22;
      y += (ty - y) * 0.22;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      // the tail ends at the dot, so the line looks attached to it; only record real movement
      const last = points[points.length - 1];
      if (!last || Math.abs(last.x - x) + Math.abs(last.y - y) > 0.3) points.push({ x, y, t: now });
      drawTrail(now);
      const settled = Math.abs(tx - x) + Math.abs(ty - y) < 0.1 && points.length < 2;
      raf = settled ? 0 : requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!shown) {
        shown = true;
        x = tx;
        y = ty;
        points.length = 0;
        el.dataset.on = "";
      }
      const t = e.target as Element | null;
      if (t?.closest("a, button, [role='button'], input, label")) el.dataset.hot = "";
      else delete el.dataset.hot;
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const onLeave = () => {
      shown = false;
      delete el.dataset.on;
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div aria-hidden="true" className="cursor">
      <canvas ref={canvas} className="absolute inset-0 size-full" />
      <div ref={dot} className="cursor-main">
        <div className="cursor-inner" />
      </div>
    </div>
  );
}
