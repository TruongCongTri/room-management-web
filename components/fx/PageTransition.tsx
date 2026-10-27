"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { getLenis } from "./SmoothScroll";

/** Fold state: k = 0 open, 1 closed; vw/vh is the visible viewport (scrollbar excluded). */
type Box = { k: number; vw: number; vh: number; top: number };

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const scrollToHash = (hash: string, immediate = false) => {
  const el = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
  if (!el) return false;
  const lenis = getLenis();
  if (immediate) {
    // fresh route: page height changed, so jump natively and resync Lenis
    const y = el.getBoundingClientRect().top + window.scrollY - 16;
    window.scrollTo(0, y);
    lenis?.resize();
    lenis?.scrollTo(y, { immediate: true, force: true });
  } else if (lenis) lenis.scrollTo(el, { offset: -16 });
  else el.scrollIntoView({ behavior: "smooth" });
  return true;
};

/**
 * Route-change transition: the page is clipped by a rectangle that folds in to the exact centre
 * of the viewport (four guide lines track its edges), the route swaps, then it unfolds.
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [box, setBox] = useState<Box | null>(null);
  const pending = useRef<string | null>(null);
  const busy = useRef(false);
  const raf = useRef(0);

  const content = useRef<HTMLDivElement>(null);

  const animate = (from: number, to: number, ms: number) =>
    new Promise<void>((done) => {
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / ms);
        const vw = document.documentElement.clientWidth;
        const vh = document.documentElement.clientHeight;
        // the wrapper is page-tall: measure where the viewport sits inside it
        const top = Math.max(0, -(content.current?.getBoundingClientRect().top ?? 0));
        setBox({ k: from + (to - from) * ease(t), vw, vh, top });
        if (t < 1) raf.current = requestAnimationFrame(step);
        else done();
      };
      raf.current = requestAnimationFrame(step);
    });

  // intercept internal link clicks before Next's <Link> handles them
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest("a");
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;

      if (url.pathname === window.location.pathname) {
        // same page: glide to the anchor instead of jumping
        if (url.hash && scrollToHash(url.hash)) {
          e.preventDefault();
          e.stopPropagation();
          history.replaceState(null, "", url.hash);
        }
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      if (busy.current) return;
      busy.current = true;
      const target = url.pathname + url.search + url.hash;
      router.prefetch(url.pathname);
      getLenis()?.stop();
      animate(0, 1, 700).then(() => {
        window.scrollTo(0, 0);
        getLenis()?.scrollTo(0, { immediate: true, force: true });
        pending.current = url.hash;
        router.push(target, { scroll: false });
      });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  // the new route has committed: unfold
  useEffect(() => {
    if (pending.current === null) return;
    const hash = pending.current;
    pending.current = null;
    const id = requestAnimationFrame(() => {
      getLenis()?.start();
      if (hash) scrollToHash(hash, true);
      animate(1, 0, 850).then(() => {
        setBox(null);
        busy.current = false;
      });
    });
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  // half-gaps between the viewport edges and the folding rectangle; at k = 1 they meet in the centre
  const y = box ? (box.vh / 2) * box.k : 0;
  const x = box ? (box.vw / 2) * box.k : 0;
  const clip = box
    ? `inset(${box.top + y}px ${x}px calc(100% - ${box.top + box.vh - y}px) ${x}px)`
    : undefined;

  return (
    <>
      <div ref={content} className="flex min-h-full flex-1 flex-col" style={clip ? { clipPath: clip } : undefined}>
        {children}
      </div>
      {box && (
        <div aria-hidden="true" className="pointer-events-none fixed left-0 top-0 z-[95]" style={{ width: box.vw, height: box.vh }}>
          <div className="absolute inset-x-0 h-px bg-ink/30" style={{ top: y }} />
          <div className="absolute inset-x-0 h-px bg-ink/30" style={{ bottom: y }} />
          <div className="absolute inset-y-0 w-px bg-ink/30" style={{ left: x }} />
          <div className="absolute inset-y-0 w-px bg-ink/30" style={{ right: x }} />
          {/* the four lines meet in a cross; a small accent square marks the centre while the route loads */}
          <div
            className="absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 bg-accent"
            style={{ opacity: Math.max(0, box.k * 4 - 3) }}
          />
        </div>
      )}
    </>
  );
}
