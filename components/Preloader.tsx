"use client";

import { useEffect, useState } from "react";
import Building from "./home/Building";
import { fmt } from "@/i18n/config";
import { useT } from "@/i18n/I18nProvider";
import { useSite } from "@/lib/data";

// when each line of the welcome sheet types in (share of preloader progress)
const META_AT = [0.12, 0.24, 0.34, 0.48];

type Phase = "active" | "exit" | "done";

/** Types out `text` over the progress window [start, start + span]. */
function typed(text: string, p: number, start: number, span = 0.12) {
  const t = Math.min(1, Math.max(0, (p - start) / span));
  return text.slice(0, Math.round(text.length * t));
}

export default function Preloader() {
  const [p, setP] = useState(0);
  const [phase, setPhase] = useState<Phase>("active");
  const site = useSite();
  const t = useT().preloader;
  const LOG = site?.preloader.log ?? [];
  const META = (site?.preloader.meta ?? []).map(([k, v], i) => [k, v, META_AT[i] ?? 0.12 + i * 0.12] as const);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reduce ? 300 : 4200;
    const start = performance.now();
    let raf = 0;
    let timer = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // stepped, slightly irregular progress, like a real load
      const eased = t < 1 ? Math.min(0.99, t + Math.sin(t * 18) * 0.012) : 1;
      setP(eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else timer = window.setTimeout(() => setPhase("exit"), reduce ? 0 : 450);
    };
    raf = requestAnimationFrame(tick);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPhase((s) => (s === "active" ? "exit" : s));
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  // tell the page the intro can start (hero ink reveal)
  useEffect(() => {
    if (phase === "active") return;
    document.documentElement.dataset.loaded = "";
    window.dispatchEvent(new Event("atrium:loaded"));
  }, [phase]);

  if (phase === "done") return null;

  const pct = Math.min(99, Math.floor(p * 100));
  const logCount = p < 0.3 ? 0 : Math.min(LOG.length, Math.floor((p - 0.3) / 0.065) + 1);

  return (
    <div
      data-preloader={phase}
      role="status"
      aria-label={fmt(t.loading, { pct })}
      onTransitionEnd={(e) => {
        if (e.target === e.currentTarget && phase === "exit") setPhase("done");
      }}
      className="fixed inset-0 z-[100] overflow-hidden bg-paper text-ink transition-opacity duration-[900ms] ease-out"
      style={{ opacity: phase === "exit" ? 0 : 1 }}
    >
      {/* sheet border */}
      <div className="pointer-events-none absolute inset-(--frame) border border-line" />

      {/* building linework, in the same slot the hero image occupies */}
      <div
        className="hero-slot absolute inset-x-0 flex items-center justify-center"
        style={{ top: "calc(var(--frame) + var(--header-h))" }}
      >
        <Building variant="line" progress={p * 1.08} className="hero-art" />
      </div>

      {/* scan line */}
      <div className="absolute left-(--frame) right-(--frame) top-1/2">
        <span className="t-mono-xs absolute -top-5 left-[clamp(16px,1.75vw,34px)] text-accent tabular-nums">
          {pct}%
        </span>
        <div className="h-px bg-accent" style={{ width: `${p * 100}%` }} />
      </div>

      {/* statement */}
      <p className="t-h3 absolute bottom-[clamp(24px,2.3vw,44px)] left-[clamp(16px,2.3vw,44px)] max-w-[24ch] !text-[clamp(22px,1.95vw,38px)] !leading-[0.92] text-ink">
        {site?.preloader.statement.map((l) => (
          <span key={l} className="block">
            {l}
          </span>
        ))}
      </p>

      {/* welcome sheet */}
      <div className="t-mono-xs absolute bottom-[clamp(24px,2.3vw,44px)] left-2/3 hidden w-[16vw] min-w-[240px] text-ink/80 lg:block">
        <p>{typed(site?.preloader.welcome ?? "", p, 0.02, 0.08)}</p>
        <div
          className="my-2 border-b border-dashed border-ink/60 transition-[width] duration-300"
          style={{ width: p > 0.08 ? "100%" : "0%" }}
        />
        {META.map(([k, v, at]) => (
          <dl key={k} className="mb-1.5 grid grid-cols-[34%_1fr]" style={{ opacity: p >= at ? 1 : 0 }}>
            <dt>{k}</dt>
            <dd className="flex before:mr-3 before:content-[':']">
              <span>{typed(v, p, at)}</span>
            </dd>
          </dl>
        ))}
      </div>

      {/* boot log */}
      <ol className="t-mono-xs absolute bottom-[clamp(24px,2.3vw,44px)] right-[clamp(16px,1.75vw,34px)] hidden min-w-[180px] text-ink/80 sm:block">
        {LOG.map((line, i) => (
          <li key={line} style={{ visibility: i < logCount ? "visible" : "hidden" }}>
            {String(i + 1).padStart(3, "0")} {line}
          </li>
        ))}
      </ol>

      <button
        type="button"
        onClick={() => setPhase("exit")}
        className="t-mono-xs absolute right-[clamp(16px,1.75vw,34px)] top-[clamp(18px,1.6vw,30px)] text-ink/50 transition-colors hover:text-accent"
      >
        {t.skip}
      </button>
    </div>
  );
}
