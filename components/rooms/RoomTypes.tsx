"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { fmt } from "@/i18n/config";
import { useT } from "@/i18n/I18nProvider";
import { useRooms } from "@/lib/data";
import { vnd, vndShort, type Photo, type RoomsModel, type Tier } from "@/lib/rooms";
import RoomPlan from "./RoomPlan";
import { getLenis, glideTo } from "../fx/SmoothScroll";
import { clamp01, useMedia, useScrollProgress } from "../fx/useScrollProgress";
import { ArrowRight, CellButton, Plus } from "../home/Rulers";

const SHOWN = 3; // photos visible in the strip at once

function Copy({ t, m, active }: { t: Tier; m: RoomsModel; active?: number }) {
  const ui = useT();
  const T = ui.roomTypes;
  const units = m.unitsOf(t.id).length;
  const extras = m.featureLabels
    .filter(([k]) => t.features[k])
    .map(([k, l]) => (typeof t.features[k] === "string" ? fmt(T.bathroom, { value: t.features[k] }) : l));
  return (
    <div>
      <div className="t-mono flex items-center gap-3">
        <span className="text-accent">{t.name}</span>
        {active !== undefined && (
          <span className="flex gap-1" aria-hidden="true">
            {m.tiers.map((x, i) => (
              <i key={x.id} className={`size-1.5 transition-colors duration-500 ${i === active ? "bg-accent" : "bg-ink/20"}`} />
            ))}
          </span>
        )}
      </div>
      <h3 className="t-h2 mt-[clamp(10px,1vw,18px)] text-[clamp(26px,2.4vw,46px)]!">{t.summary}</h3>
      <p className="t-body mt-[clamp(12px,1.2vw,22px)] max-w-[34em] text-ink/85">{t.text}</p>

      <div className="mt-[clamp(18px,1.9vw,36px)] flex flex-wrap items-end gap-x-6 gap-y-2">
        <p className="text-[clamp(26px,2.4vw,46px)] font-bold leading-none tracking-tight">
          {vnd(t.price)}
          <span className="t-mono ml-2 font-normal text-ink/50">{fmt(T.perMonth, { per: ui.units.per[t.per] })}</span>
        </p>
        <p className="t-mono-xs text-ink/60">{fmt(T.yearlyPrice, { price: vnd(m.leasePrice(t.price, true)) })}</p>
      </div>

      <dl className="mt-[clamp(16px,1.6vw,30px)] grid max-w-[560px] grid-cols-2 border-t border-line">
        {[
          [T.size, `${t.area} m²`],
          [T.sleeps, t.id === "dorm" ? T.dormSleeps : String(t.sleeps)],
          [T.where, t.floors],
          [T.freeNow, fmt(t.id === "dorm" ? T.freeOfRooms : T.freeOfUnits, { free: m.availableOf(t.id), total: units })],
        ].map(([k, v]) => (
          <div key={k} className="border-b border-line py-2 odd:border-r odd:pr-3 even:pl-3">
            <dt className="t-mono-xs text-ink/50">{k}</dt>
            <dd className="t-body mt-0.5 text-ink!">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="t-mono-xs mt-3 max-w-[560px] text-ink/60">{extras.join(" · ")}</p>
    </div>
  );
}

function ArrowBtn({ dir, onClick, disabled, label, className = "" }: { dir: -1 | 1; onClick: () => void; disabled?: boolean; label: string; className?: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`grid place-items-center transition-colors duration-300 hover:bg-ink hover:text-paper disabled:pointer-events-none disabled:opacity-25 ${className}`}
    >
      <ArrowRight className={dir < 0 ? "rotate-180" : ""} />
    </button>
  );
}

/** Full-screen photo view: arrows or ←/→ to browse, Esc or the backdrop to close. */
function Viewer({ list, index, name, onIndex, onClose }: { list: Photo[]; index: number; name: string; onIndex: (i: number) => void; onClose: () => void }) {
  const close = useRef<HTMLButtonElement>(null);
  const go = (d: number) => onIndex((index + d + list.length) % list.length);
  const goRef = useRef(go);
  const closeRef = useRef(onClose);
  useEffect(() => {
    goRef.current = go;
    closeRef.current = onClose;
  });

  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    close.current?.focus();
    getLenis()?.stop();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goRef.current(1);
      else if (e.key === "ArrowLeft") goRef.current(-1);
      else if (e.key === "Escape") closeRef.current();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      getLenis()?.start();
      before?.focus({ preventScroll: true });
    };
  }, []);

  const p = list[index];
  const T = useT().roomTypes;
  const backdrop = (e: React.MouseEvent) => e.target === e.currentTarget && onClose();
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={fmt(T.photosOf, { name })} className="fixed inset-0 z-95 flex animate-[fade_.3s_ease] flex-col bg-ink/95 text-paper" onClick={backdrop}>
      <div className="t-mono flex items-center justify-between border-b border-paper/15 px-[clamp(16px,1.75vw,34px)] py-3">
        <span>
          {name} · {p.caption}
        </span>
        <span className="flex items-center gap-4">
          <span className="text-paper/50 tabular-nums">
            {String(index + 1).padStart(2, "0")} / {String(list.length).padStart(2, "0")}
          </span>
          <button ref={close} type="button" onClick={onClose} aria-label={T.closeViewer} className="grid size-9 place-items-center border border-paper/30 transition-colors hover:bg-paper hover:text-ink">
            ×
          </button>
        </span>
      </div>
      <div className="relative flex min-h-0 flex-1 items-stretch" onClick={backdrop}>
        <ArrowBtn dir={-1} onClick={() => go(-1)} label={T.prevPhoto} className="w-[clamp(48px,5vw,96px)] border-r border-paper/15 hover:bg-paper! hover:text-ink!" />
        <div className="relative flex-1" onClick={backdrop}>
          <Image src={p.src} alt={p.alt} fill sizes="90vw" className="object-contain p-[clamp(12px,2vw,40px)]" />
        </div>
        <ArrowBtn dir={1} onClick={() => go(1)} label={T.nextPhoto} className="w-[clamp(48px,5vw,96px)] border-l border-paper/15 hover:bg-paper! hover:text-ink!" />
      </div>
      {/* filmstrip */}
      <div className="flex gap-1 overflow-x-auto border-t border-paper/15 p-2">
        {list.map((x, i) => (
          <button
            key={x.src}
            type="button"
            onClick={() => onIndex(i)}
            aria-label={fmt(T.showPhoto, { n: i + 1, caption: x.caption })}
            aria-current={i === index ? "true" : undefined}
            className={`relative h-14 w-20 shrink-0 overflow-hidden border transition-opacity ${i === index ? "border-accent opacity-100" : "border-transparent opacity-50 hover:opacity-90"}`}
          >
            <Image src={x.src} alt="" fill sizes="80px" className="object-cover" />
          </button>
        ))}
      </div>
    </div>,
    document.body,
  );
}

/**
 * Photo strip: a few at a time, arrows to move along, click one to open it full screen.
 * It stays mounted when the type changes; only its photos are swapped.
 */
function Gallery({ t, list, cols = SHOWN, className = "" }: { t: Tier; list: Photo[]; cols?: number; className?: string }) {
  const [start, setStart] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const [tierSeen, setTierSeen] = useState(t.id);
  if (tierSeen !== t.id) {
    // new type: back to its first photos
    setTierSeen(t.id);
    setStart(0);
    setOpen(null);
  }
  const max = list.length - cols;
  const T = useT().roomTypes;

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-stretch border-b border-line">
        <p className="t-mono-xs flex flex-1 items-center gap-3 px-[clamp(12px,1.2vw,24px)] text-ink/60">
          <span>{T.photos}</span>
          <span className="tabular-nums">
            {String(start + 1).padStart(2, "0")}–{String(start + cols).padStart(2, "0")} / {String(list.length).padStart(2, "0")}
          </span>
        </p>
        <ArrowBtn dir={-1} onClick={() => setStart((s) => Math.max(0, s - 1))} disabled={start === 0} label={T.prevPhotos} className="size-[clamp(34px,2.6vw,48px)] border-l border-line" />
        <ArrowBtn dir={1} onClick={() => setStart((s) => Math.min(max, s + 1))} disabled={start >= max} label={T.morePhotos} className="size-[clamp(34px,2.6vw,48px)] border-l border-line" />
      </div>
      <div className="relative overflow-hidden">
        <ul className="flex transition-transform duration-500 ease-[cubic-bezier(.23,1,.32,1)]" style={{ transform: `translateX(-${(start * 100) / cols}%)` }}>
          {list.map((p, i) => (
            <li key={i} className="shrink-0 border-r border-line" style={{ width: `${100 / cols}%` }}>
              <button
                type="button"
                onClick={() => setOpen(i)}
                aria-label={fmt(T.openPhoto, { n: i + 1, caption: p.caption })}
                tabIndex={i >= start && i < start + cols ? 0 : -1}
                className="group relative block aspect-4/3 w-full overflow-hidden"
              >
                <Image src={p.src} alt={p.alt} fill sizes="(min-width: 768px) 17vw, 50vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                <span className="t-mono-xs absolute bottom-0 left-0 bg-paper/90 px-1.5 py-0.5 text-ink">{p.caption}</span>
                <span aria-hidden="true" className="t-mono-xs absolute right-0 top-0 bg-ink px-1.5 py-0.5 text-paper opacity-0 transition-opacity group-hover:opacity-100">
                  {T.view}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      {open !== null && <Viewer list={list} index={open} name={t.name} onIndex={setOpen} onClose={() => setOpen(null)} />}
    </div>
  );
}

/** The furnished unit plan on top, the photo strip below; edges sit on the page's column lines. */
function Art({ t, m }: { t: Tier; m: RoomsModel }) {
  return (
    <div className="flex h-full flex-col">
      <div className="relative min-h-0 flex-1">
        <div aria-hidden="true" className="sq-grid absolute inset-0 opacity-30" />
        <Plus className="right-3 top-3" />
        <Plus className="bottom-3 right-3" />
        <span className="t-mono-xs absolute left-0 top-0 bg-ink px-2 py-1 text-paper">{useT().roomTypes.unitPlan}</span>
        <RoomPlan tier={t.id} className="relative size-full p-[clamp(14px,1.8vw,34px)]" />
      </div>
      <Gallery t={t} list={m.photos[t.id] ?? []} className="border-t border-line" />
    </div>
  );
}

// height of the sticky type strip; the pinned stage sits right below it
const STRIP = "clamp(56px,4.6vw,84px)";

/** The room-type menu: sticks under the header through the whole section, follows the active type, shows progress. */
function TierStrip({ m, active, progress, onPick }: { m: RoomsModel; active: number | null; progress: number; onPick: (i: number) => void }) {
  const ui = useT();
  const list = useRef<HTMLUListElement>(null);
  const T = useT().roomTypes;

  // phones: the strip scrolls sideways, so keep the active type in view
  useEffect(() => {
    const ul = list.current;
    const li = active === null ? null : (ul?.querySelectorAll("button")[active]?.parentElement as HTMLElement | undefined);
    if (!ul || !li || ul.scrollWidth <= ul.clientWidth) return;
    ul.scrollTo({ left: li.offsetLeft - (ul.clientWidth - li.offsetWidth) / 2, behavior: "smooth" });
  }, [active]);

  return (
    <nav aria-label={T.typesLabel} className="sticky top-(--stick-top) z-30 bg-paper transition-[top] duration-500 ease-[cubic-bezier(.23,1,.32,1)]">
      <ul ref={list} className="flex overflow-x-auto sm:grid sm:grid-cols-6 sm:overflow-visible">
        <li className="hidden flex-col justify-center border-r border-line px-[clamp(12px,1.2vw,24px)] sm:flex" style={{ height: STRIP }}>
          <span className="t-mono-xs text-ink/50">{T.typesLabel}</span>
          <span className="t-mono mt-1 text-ink/70">{fmt(T.typesCount, { types: m.tiers.length, rooms: m.allUnits.length })}</span>
        </li>
        {m.tiers.map((x, i) => {
          const on = i === active;
          return (
            <li key={x.id} className={`shrink-0 border-line ${i < m.tiers.length - 1 ? "border-r" : ""}`}>
              <button
                type="button"
                aria-current={on ? "true" : undefined}
                onClick={() => onPick(i)}
                className={`flex w-[44vw] flex-col justify-between px-[clamp(12px,1.2vw,24px)] py-[clamp(8px,0.7vw,14px)] text-left transition-colors duration-500 sm:w-full ${on ? "bg-ink text-paper" : "hover:bg-paper-2"}`}
                style={{ height: STRIP }}
              >
                <span className={`t-mono-xs flex justify-between gap-2 ${on ? "text-paper/60" : "text-ink/50"}`}>
                  [{x.n}] <span className="truncate">{x.audience}</span>
                </span>
                <span className="flex items-end justify-between gap-2">
                  <span className="truncate text-[clamp(13px,1.05vw,20px)] font-bold uppercase leading-none tracking-tight">{x.name}</span>
                  <span className="t-mono text-accent">{vndShort(x.price, ui.format)}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {/* progress through the section, like the explorer's */}
      <div aria-hidden="true" className="h-px bg-line">
        <div className="h-full bg-accent" style={{ width: `${clamp01(progress) * 100}%` }} />
      </div>
    </nav>
  );
}

export default function RoomTypes() {
  const m = useRooms();
  const T = useT().roomTypes;
  const n = Math.max(2, m?.tiers.length ?? 2);
  const [wrap, p] = useScrollProgress<HTMLDivElement>("pin");
  const [stack, mp] = useScrollProgress<HTMLDivElement>("pin");
  const desktop = useMedia("(min-width: 768px)");
  const articles = useRef<(HTMLElement | null)[]>([]);
  const [mobileActive, setMobileActive] = useState<number | null>(null);
  const active = Math.min(n - 1, Math.round(clamp01(p) * (n - 1)));

  // on phones the types are stacked: the active one is the last whose top has passed a line near the top
  useEffect(() => {
    if (desktop) return;
    let raf = 0;
    const check = () => {
      raf = 0;
      const line = window.innerHeight * 0.35;
      let k: number | null = null;
      articles.current.forEach((el, i) => {
        if (el && el.getBoundingClientRect().top < line) k = i;
      });
      setMobileActive(k);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    raf = requestAnimationFrame(check);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, [desktop]);

  const pick = (i: number) => {
    if (desktop) {
      const el = wrap.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY;
      glideTo(top + (i / (n - 1)) * (el.offsetHeight - window.innerHeight) + 2);
    } else {
      const el = articles.current[i];
      const strip = el?.closest("section")?.querySelector("nav");
      if (el) glideTo(el.getBoundingClientRect().top + window.scrollY - (strip?.getBoundingClientRect().bottom ?? 0) + 1);
    }
  };

  // highlight only once the section is under way
  const current = desktop ? (p > 0 ? active : null) : mobileActive;

  if (!m) return null;
  const t = m.tiers[Math.min(active, m.tiers.length - 1)];

  return (
    <section id="room-types" aria-label={T.aria} className="scroll-mt-4 border-t border-line">
      <TierStrip m={m} active={current} progress={desktop ? p : mp} onPick={pick} />

      {/* pinned stage (desktop): one set of panels whose content follows the active type */}
      <div ref={wrap} className="relative hidden md:block" style={{ height: `${(n + 1) * 70}svh` }}>
        {/* anchors for /featured-products#<tier>, one at each tier's scroll position */}
        {m.tiers.map((x, i) => (
          <span key={x.id} id={x.id} aria-hidden="true" className="absolute left-0" style={{ top: `calc(${i / (n - 1)} * (100% - 100svh) + 18px)` }} />
        ))}
        <div
          className="sticky grid grid-cols-6 overflow-hidden transition-[top,height] duration-500 ease-[cubic-bezier(.23,1,.32,1)]"
          style={{ top: `calc(var(--stick-top) + ${STRIP} + 1px)`, height: `calc(100svh - var(--stick-top) - ${STRIP} - 1px - var(--frame))` }}
        >
          <div className="col-span-3 flex items-center overflow-hidden border-r border-line px-[clamp(16px,2.3vw,44px)]">
            <div className="w-full">
              <Copy t={t} m={m} active={active} />
              <div className="mt-[clamp(18px,1.9vw,36px)] flex flex-wrap gap-2">
                <CellButton href="#explorer" accent>
                  {T.findIt}
                </CellButton>
                <CellButton href="#pricing">{T.compare}</CellButton>
              </div>
            </div>
          </div>
          <div className="col-span-3 min-h-0">
            <Art t={t} m={m} />
          </div>
        </div>
      </div>

      {/* stacked (mobile) */}
      <div ref={stack} className="md:hidden">
        {m.tiers.map((x, i) => (
          <article
            key={x.id}
            id={`${x.id}-m`}
            ref={(el) => {
              articles.current[i] = el;
            }}
            className="border-t border-line first:border-t-0"
          >
            <div className="px-4 py-10">
              <p className="t-mono mb-3 text-ink/50">[{x.n}]</p>
              <Copy t={x} m={m} />
            </div>
            <div className="border-t border-line">
              <RoomPlan tier={x.id} className="h-75 w-full p-3" />
            </div>
            <Gallery t={x} list={m.photos[x.id] ?? []} cols={2} className="border-t border-line" />
          </article>
        ))}
      </div>
    </section>
  );
}
