"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fmt, type Dictionary } from "@/i18n/config";
import { useT } from "@/i18n/I18nProvider";
import { useRooms } from "@/lib/data";
import LocaleLink from "../LocaleLink";
import { vnd, vndShort, type RoomsModel, type TierId } from "@/lib/rooms";
import RoomPlan from "../rooms/RoomPlan";
import { ArrowRight } from "./Rulers";
import PixelFill from "../fx/PixelFill";
import { RollIcon, RollText } from "../fx/Roll";
import { clamp01, seg } from "../fx/useScrollProgress";

type Row = { n: string; id: TierId; name: string; text: string; href: string };

/** One row per room type: first sentence of its description, price and live availability. */
const rowsOf = (m: RoomsModel, ui: Dictionary): Row[] =>
  m.tiers.map((t) => ({
    n: t.n,
    id: t.id,
    name: t.name,
    text: fmt(ui.products.rowText, { first: t.text.split(". ")[0], price: vndShort(t.price, ui.format), free: m.availableOf(t.id) }),
    href: `/featured-products#${t.id}`,
  }));

/* ------------------------------------------------------------- room card */

/** A tier's furnished plan with its price tag pinned to the corner. */
function RoomCard({ row, m }: { row: Row; m: RoomsModel }) {
  const t = m.tierById[row.id];
  const ui = useT();
  return (
    <div className="relative mx-auto w-[88%] py-6 text-[clamp(9px,0.7vw,13px)]">
      <div className="border border-ink/70 bg-paper px-2 py-3">
        <RoomPlan tier={t.id} className="mx-auto h-[clamp(190px,18vw,340px)] w-full" />
      </div>
      <div className="absolute -bottom-2 right-0 w-[48%] border border-ink bg-paper shadow-[0_4px_0_var(--ink)]">
        <div className="t-mono-xs flex justify-between bg-ink px-2 py-1.5 text-paper">
          <span>{t.name}</span>
          <span>{t.area} m²</span>
        </div>
        <div className="space-y-1 p-2 leading-snug">
          <p className="text-[clamp(14px,1.15vw,22px)] font-bold leading-none">
            {vnd(t.price)}
            <span className="t-mono-xs ml-1 font-normal text-ink/50">{fmt(ui.products.perMonth, { per: ui.units.per[t.per] })}</span>
          </p>
          <p className="text-ink/60">{fmt(ui.products.fixedFees, { amount: vnd(m.fixedTotal(t.id)) })}</p>
          <p className="t-mono-xs flex justify-between border-t border-line pt-1.5">
            <span className="text-accent">{fmt(ui.products.freeNow, { n: m.availableOf(t.id) })}</span>
            <span className="text-ink/50">{t.floors}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

/** Grey skeleton of a room card with the real one inked in over it, top-down. */
function Screen({ row, m, reveal }: { row: Row; m: RoomsModel; reveal: number }) {
  const edge = reveal * 130 - 15;
  const mask = `linear-gradient(180deg, #000 ${edge - 15}%, transparent ${edge}%)`;
  return (
    <div className="relative">
      <div className="skeleton" aria-hidden="true">
        <RoomCard row={row} m={m} />
      </div>
      <div className="absolute inset-0" style={{ maskImage: mask, WebkitMaskImage: mask }}>
        <RoomCard row={row} m={m} />
      </div>
    </div>
  );
}

function LearnMore({ href, className = "" }: { href: string; className?: string }) {
  return (
    <LocaleLink href={href} className={`fx t-mono flex items-stretch overflow-hidden ${className}`}>
      <PixelFill color="--ink" />
      <span className="flex-1 px-[clamp(16px,1.9vw,36px)] py-[clamp(10px,0.9vw,16px)]">
        <RollText>{useT().products.seeRoom}</RollText>
      </span>
      <span className="flex w-[clamp(40px,3.6vw,68px)] items-center justify-center border-l border-dashed border-line">
        <RollIcon>
          <ArrowRight />
        </RollIcon>
      </span>
    </LocaleLink>
  );
}

/* -------------------------------------------------------------- section */

// where the ink edge sits inside a card for a given reveal (matches the mask in Screen)
const edgeOf = (reveal: number) => clamp01((reveal * 130 - 22.5) / 100);

export default function Products() {
  const rooms = useRooms();
  const ui = useT();
  const productRows = useMemo(() => (rooms ? rowsOf(rooms, ui) : []), [rooms, ui]);
  const shots = useRef<(HTMLDivElement | null)[]>([]);
  const grid = useRef<HTMLDivElement>(null);
  const leftBox = useRef<HTMLDivElement>(null);
  const rightBox = useRef<HTMLDivElement>(null);
  const line = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [reveal, setReveal] = useState<number[]>(() => productRows.map(() => 0));
  const row = productRows[active] ?? productRows[0];
  const words = row?.text.split(" ") ?? [];

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      // skeleton until a card is half way up, fully inked by the time it reaches the top
      const r = shots.current.map((el) => (el ? seg(1 - el.getBoundingClientRect().top / vh, 0.45, 0.95) : 0));
      // the active card is the one being inked now (the last one that has started)
      let next = 0;
      r.forEach((v, i) => {
        if (v > 0) next = i;
      });
      setActive(next);
      setReveal((prev) => (prev.every((v, i) => Math.abs(v - r[i]) < 0.002) ? prev : r));

      // the side boxes ride the ink edge down the stack; cards butt together, so the path is continuous
      const shot = shots.current[next];
      const g = grid.current;
      if (!shot || !g) return;
      const edge = shot.offsetTop + edgeOf(r[next]) * shot.offsetHeight;
      const total = g.offsetHeight;
      for (const box of [leftBox.current, rightBox.current]) {
        if (!box) continue;
        const h = box.offsetHeight;
        const y = Math.min(total - h, Math.max(0, edge - h / 2));
        box.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
      }
      if (line.current) {
        line.current.style.transform = `translate3d(0, ${edge.toFixed(1)}px, 0)`;
        line.current.style.opacity = r[next] > 0 && r[next] < 1 ? "1" : "0";
      }
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
  }, []);

  if (!rooms || !row) return null;

  return (
    <section aria-label={ui.products.aria}>
      {/* desktop: cards butt together in the centre; the side boxes travel down with the ink edge */}
      <div ref={grid} className="relative hidden grid-cols-12 border-t border-line md:grid">
        {/* left: index + rolling room name */}
        <div className="relative col-span-3 border-r border-line">
          <div ref={leftBox} className="absolute inset-x-0 top-0 z-10 will-change-transform">
            <div className="w-full border-y border-line bg-paper px-[clamp(16px,1.75vw,34px)] py-[clamp(16px,1.6vw,30px)]">
              <div className="t-mono flex items-center gap-3 text-ink/40">
                <span>[{row.n}]</span>
                <span className="flex gap-1">
                  {productRows.map((r, i) => (
                    <i key={r.n} className={`size-1.5 transition-colors duration-500 ${i === active ? "bg-accent" : "bg-ink/20"}`} />
                  ))}
                </span>
              </div>
              <div className="relative mt-[clamp(28px,3.4vw,64px)] overflow-hidden">
                {/* sizing copy keeps the box height stable */}
                <span className="t-h3 invisible block">{row.name}</span>
                {productRows.map((r, i) => (
                  <h3
                    key={r.n}
                    aria-hidden={i !== active}
                    className="t-h3 absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(.625,.05,0,1)]"
                    style={{ transform: `translateY(${(i - active) * 105}%)` }}
                  >
                    {r.name}
                  </h3>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* centre: room cards stacked edge to edge, each inking in over its skeleton */}
        <div className="sq-grid relative col-span-5 border-r border-line">
          {productRows.map((r, i) => (
            <div
              key={r.n}
              ref={(el) => {
                shots.current[i] = el;
              }}
              className="relative border-b border-line bg-paper/60 last:border-b-0"
            >
              <Screen row={r} m={rooms!} reveal={reveal[i] ?? 0} />
            </div>
          ))}
          {/* the ink edge, joining the two side boxes */}
          <div ref={line} aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-accent opacity-0 transition-opacity duration-300 will-change-transform" />
        </div>

        {/* right: description + link */}
        <div className="relative col-span-4">
          <div ref={rightBox} className="absolute inset-x-0 top-0 z-10 will-change-transform">
            <div className="w-full border-y border-line bg-paper">
              <p key={row.n} className="t-body min-h-[6.6em] px-[clamp(16px,1.9vw,36px)] py-[clamp(16px,1.9vw,36px)] text-ink/85" aria-label={row.text}>
                {words.map((w, i) => (
                  <span
                    key={i}
                    aria-hidden="true"
                    className="inline-block animate-[word-in_.6s_cubic-bezier(.23,1,.32,1)_both]"
                    style={{ animationDelay: `${i * 18}ms` }}
                  >
                    {w}&nbsp;
                  </span>
                ))}
              </p>
              <LearnMore href={row.href} className="border-t border-line" />
            </div>
          </div>
        </div>
      </div>

      {/* stacked rows (mobile) */}
      <div className="md:hidden">
        {productRows.map((r) => (
          <div key={r.n} className="border-t border-line">
            <div className="flex items-baseline justify-between px-4 pt-6">
              <h3 className="t-h3">{r.name}</h3>
              <span className="t-mono text-ink/40">[{r.n}]</span>
            </div>
            <Screen row={r} m={rooms!} reveal={1} />
            <p className="t-body px-4 pb-4 text-ink/85">{r.text}</p>
            <LearnMore href={r.href} className="border-t border-line" />
          </div>
        ))}
      </div>
    </section>
  );
}
