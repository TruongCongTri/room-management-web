"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { fmt } from "@/i18n/config";
import { useT } from "@/i18n/I18nProvider";
import { useHome } from "@/lib/data";
import Building from "./Building";
import { ArrowRight, RulerFrame } from "./Rulers";
import PixelFill from "../fx/PixelFill";
import { RollIcon, RollText } from "../fx/Roll";

type Pt = { x: number; y: number };
type Box = { a: Pt; b: Pt };

const norm = ({ a, b }: Box) => ({
  left: Math.min(a.x, b.x),
  top: Math.min(a.y, b.y),
  width: Math.abs(a.x - b.x),
  height: Math.abs(a.y - b.y),
});

export default function Hero() {
  const home = useHome();
  const t = useT().hero;
  const hero = home?.hero;
  const hotspots = home?.hotspots ?? [];
  const stage = useRef<HTMLDivElement>(null);
  const art = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState<Pt | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [dragging, setDragging] = useState(false);
  const [found, setFound] = useState<string[]>([]);
  const [intro, setIntro] = useState(0);

  // once the preloader leaves, the rendered building bleeds in over the linework
  useEffect(() => {
    let raf = 0;
    const run = (duration: number) => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        setIntro(1 - Math.pow(1 - t, 2));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const onLoaded = () => run(2200);
    if ("loaded" in document.documentElement.dataset) run(1);
    else window.addEventListener("atrium:loaded", onLoaded, { once: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("atrium:loaded", onLoaded);
    };
  }, []);

  const local = (e: PointerEvent) => {
    const r = stage.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  /** Hotspot centres in stage pixels. */
  const spotPositions = () => {
    const s = stage.current!.getBoundingClientRect();
    const a = art.current!.getBoundingClientRect();
    return hotspots.map((h) => ({
      id: h.id,
      x: a.left - s.left + (h.x / 100) * a.width,
      y: a.top - s.top + (h.y / 100) * a.height,
    }));
  };

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || (e.target as HTMLElement).closest("button")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = local(e);
    setDragging(true);
    setBox({ a: p, b: p });
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const p = local(e);
    setCursor(p);
    if (dragging) setBox((b) => (b ? { a: b.a, b: p } : b));
  };
  const onUp = () => {
    if (!dragging || !box) return;
    setDragging(false);
    const r = norm(box);
    if (r.width < 6 && r.height < 6) {
      setBox(null);
      return;
    }
    const hits = spotPositions()
      .filter((s) => s.x >= r.left && s.x <= r.left + r.width && s.y >= r.top && s.y <= r.top + r.height)
      .map((s) => s.id);
    setFound((f) => Array.from(new Set([...f, ...hits])));
  };

  const toggle = (id: string) => setFound((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));

  const rect = box ? norm(box) : null;

  if (!hero) return null;

  return (
    <section className="relative">
      {/* drawing stage */}
      <div
        ref={stage}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={() => !dragging && setCursor(null)}
        className="hero-slot relative flex select-none items-center justify-center overflow-hidden md:cursor-crosshair"
      >
        <RulerFrame />

        <div ref={art} className="hero-art relative">
          <Building variant="ink" reveal={intro} idPrefix="hero" className="absolute inset-0 size-full" />

          {/* free-room markers */}
          {hotspots.map((h) => {
            const on = found.includes(h.id);
            return (
              <div key={h.id} className="absolute" style={{ left: `${h.x}%`, top: `${h.y}%` }}>
                {on && (
                  <>
                    <div aria-hidden="true" className="pointer-events-none absolute left-0 top-0 w-[100vw] border-t border-dashed border-accent/70" />
                    <div aria-hidden="true" className="pointer-events-none absolute left-0 top-0 h-[100vh] border-l border-dashed border-accent/70" />
                  </>
                )}
                <button
                  type="button"
                  onClick={() => toggle(h.id)}
                  aria-pressed={on}
                  aria-label={`${h.code}: ${h.text}`}
                  className="absolute size-[clamp(9px,0.85vw,14px)] -translate-x-1/2 -translate-y-1/2 bg-accent transition-[transform,opacity] duration-500 hover:scale-150"
                  style={{ opacity: intro > 0.85 ? 1 : 0 }}
                />
                <div
                  className={`pointer-events-none absolute left-3 top-3 w-[clamp(150px,13vw,240px)] bg-accent p-[clamp(8px,0.75vw,14px)] text-white transition-all duration-500 ${on ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
                >
                  <p className="t-mono-xs opacity-80">{h.code}</p>
                  <p className="mt-1 text-[clamp(12px,0.95vw,18px)] font-bold uppercase leading-[0.95] tracking-tight">
                    {h.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {found.length > 0 && <div aria-hidden="true" className="absolute bottom-[14px] right-[14px] top-[14px] w-px bg-accent/70" />}

        {/* selection */}
        {rect && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute border border-accent"
            style={{
              ...rect,
              background: "linear-gradient(90deg, rgb(241 85 52 / 0.05), rgb(241 85 52 / 0.45))",
            }}
          />
        )}

        {/* crosshair + coordinates + hint */}
        {cursor && (
          <div aria-hidden="true" className="pointer-events-none hidden md:block">
            <div className="absolute inset-x-0 h-px bg-line" style={{ top: cursor.y }} />
            <div className="absolute inset-y-0 w-px bg-line" style={{ left: cursor.x }} />
            <div className="t-mono-xs absolute text-ink/60 tabular-nums" style={{ left: cursor.x - 40, top: cursor.y + 6 }}>
              X:{Math.round(cursor.x)}PX
              <br />
              Y:{Math.round(cursor.y)}PX
            </div>
            {!dragging && (
              <div
                className="t-mono-xs absolute bg-ink px-2 py-1.5 leading-tight text-paper"
                style={{ left: cursor.x + 10, top: cursor.y + 10 }}
              >
                {found.length === hotspots.length ? (
                  <>
                    {fmt(t.allFound, { n: hotspots.length })}
                    <br />
                    {t.hideHint}
                  </>
                ) : (
                  <>
                    {t.dragHint[0]}
                    <br />
                    {t.dragHint[1]}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        <p className="t-mono-xs absolute bottom-5 left-5 text-ink/60 md:hidden">{t.tapHint}</p>
      </div>

      {/* title row */}
      <div className="grid border-t border-line md:h-(--hero-bottom) md:grid-cols-12">
        <h1 className="t-h1 flex items-end px-[clamp(16px,2.3vw,44px)] py-[clamp(16px,1.6vw,30px)] md:col-span-6 md:border-r md:border-line">
          <span>
            <span className="rise">
              <span>{hero.title[0]}</span>
            </span>
            <span className="rise">
              <span style={{ "--d": "120ms" } as React.CSSProperties}>{hero.title[1]}</span>
            </span>
          </span>
        </h1>
        <div className="flex min-w-0 flex-col border-t border-line md:col-span-6 md:border-t-0">
          <div className="grid flex-1 grid-cols-[minmax(0,1fr)_auto] md:grid-cols-6">
            <p className="t-body p-[clamp(12px,0.85vw,16px)] text-ink/85 md:col-span-5">{hero.body}</p>
            <Link
              href="#discover"
              className="fx t-mono flex w-[clamp(110px,9.7vw,186px)] flex-col justify-between overflow-hidden border-l border-line p-[clamp(8px,0.7vw,14px)] text-accent md:w-auto"
            >
              <PixelFill color="--accent" />
              <RollText>{t.discover}</RollText>
              <span className="self-end">
                <RollIcon>
                  <ArrowRight className="rotate-90" />
                </RollIcon>
              </span>
            </Link>
          </div>
          <div className="overflow-hidden border-t border-line py-[clamp(8px,0.75vw,14px)]">
            <div className="tick-marquee">
              {[0, 1, 2].flatMap((k) =>
                hero.ticker.map((t) => (
                  <span key={`${k}${t}`} aria-hidden={k > 0} className="t-mono flex items-center gap-2 pr-6 text-ink/70">
                    <svg width="11" height="12" viewBox="0 0 11 12" aria-hidden="true">
                      <path d="M5.5 .5l4.5 2.6v5.8L5.5 11.5 1 8.9V3.1z" fill="none" stroke="currentColor" />
                    </svg>
                    {t}
                  </span>
                )),
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
