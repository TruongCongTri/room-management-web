"use client";

import { useState } from "react";
import { fmt } from "@/i18n/config";
import { useT } from "@/i18n/I18nProvider";
import { useRooms } from "@/lib/data";
import { vnd, type TierId } from "@/lib/rooms";
import BuildingStack from "./BuildingStack";
import FloorMap from "./FloorMap";
import { glideTo } from "../fx/SmoothScroll";
import { clamp01, useMedia, useScrollProgress } from "../fx/useScrollProgress";
import { CellButton, Plus } from "../home/Rulers";

const px = "px-[clamp(16px,2.3vw,44px)]";
const cell = "px-[clamp(16px,1.75vw,34px)] py-[clamp(12px,1.1vw,20px)]";

const STATUS_COLOR = { available: "text-accent", reserved: "text-ink/70", let: "text-ink/50" } as const;

/** `reserved` is off when the data never says so (the public listing only knows free or not). */
function Legend({ reserved }: { reserved: boolean }) {
  const t = useT().explorer.legend;
  return (
    <ul className="t-mono-xs flex flex-wrap items-center gap-x-4 gap-y-1 text-ink/70">
      <li className="flex items-center gap-1.5">
        <i className="size-2.5 bg-accent" /> {t.available}
      </li>
      {reserved && (
        <li className="flex items-center gap-1.5">
          <i className="size-2.5 border-[1.5px] border-accent" /> {t.reserved}
        </li>
      )}
      <li className="flex items-center gap-1.5">
        <i className="size-2.5 border border-ink/30" /> {t.let}
      </li>
      <li className="flex items-center gap-1.5">
        <i className="h-2.5 w-4 bg-accent/20" /> {t.selected}
      </li>
    </ul>
  );
}

/** A value that eases in whenever it changes, without remounting the cell around it. */
function Val({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span key={String(children)} className={`block animate-[fade_.35s_ease] ${className}`}>
      {children}
    </span>
  );
}

export default function Explorer() {
  const [wrap, p] = useScrollProgress<HTMLDivElement>("pin");
  const desktop = useMedia("(min-width: 768px)");
  const m = useRooms();
  const ui = useT();
  const T = ui.explorer;
  const [tier, setTier] = useState<TierId | null>(null);
  const [levelPick, setLevel] = useState<number | null>(null);
  const [selPick, setSel] = useState<string | null>(null);

  // scroll steps through these: everything first, then one type at a time
  const OPTIONS: (TierId | null)[] = [null, ...(m?.tiers ?? []).map((t) => t.id)];
  const LAST = Math.max(1, OPTIONS.length - 1);
  const step = Math.min(LAST, Math.round(clamp01(p) * LAST));
  const [seen, setSeen] = useState(step);
  if (!m) return null;

  // until someone picks, show the first free room and its level
  const first = m.allUnits.find((u) => u.status === "available") ?? m.allUnits[0];
  const level = levelPick ?? first.level;
  const sel = selPick ?? first.id;
  const floor = m.floors.find((f) => f.level === level) ?? m.floors[0];
  const unit = m.allUnits.find((u) => u.id === sel)!;
  const t = m.tierById[unit.tier as TierId];
  const fees = m.fixedTotal(t.id);
  const statusLabel = T.status[unit.status];
  const statusColor = STATUS_COLOR[unit.status];
  const rent = unit.rent ?? t.price;
  const hasReserved = m.allUnits.some((u) => u.status === "reserved");
  const freeHere = floor.north.concat(floor.south).filter((u) => u.tier !== "core" && u.status === "available");

  // keep a room selected on the level being shown
  const pickLevel = (l: number, type = tier) => {
    setLevel(l);
    const on = m.allUnits.filter((u) => u.level === l && (!type || u.tier === type));
    if (!on.some((u) => u.id === sel) && on.length) setSel((on.find((u) => u.status === "available") ?? on[0]).id);
  };

  const applyTier = (id: TierId | null) => {
    setTier(id);
    if (!id) return;
    const here = floor.north.concat(floor.south).some((u) => u.tier === id);
    pickLevel(here ? level : m.allUnits.find((u) => u.tier === id)!.level, id);
  };

  // desktop: the scroll position inside the pinned stage chooses the type
  if (desktop && step !== seen) {
    setSeen(step);
    applyTier(OPTIONS[step]);
  }

  const choose = (i: number) => {
    const el = wrap.current;
    if (!desktop || !el) return applyTier(OPTIONS[i]);
    const top = el.getBoundingClientRect().top + window.scrollY;
    glideTo(top + (i / LAST) * (el.offsetHeight - window.innerHeight) + 2);
  };

  return (
    <section id="explorer" aria-label={T.aria} className="scroll-mt-4 border-t border-line">
      <div className="grid md:grid-cols-6">
        <div className={`${px} pb-[clamp(24px,2.3vw,44px)] pt-[clamp(60px,6vw,120px)] md:col-span-4 md:border-r md:border-line`}>
          <p className="t-mono mb-[clamp(16px,1.6vw,30px)]">{T.label}</p>
          <h2 className="t-h2">
            {T.title[0]}
            <br />
            {T.title[1]}
          </h2>
        </div>
        <div className="flex flex-col justify-end gap-4 px-[clamp(16px,1.9vw,36px)] pb-[clamp(24px,2.3vw,44px)] md:col-span-2">
          <p className="t-body text-ink/85">{T.body}</p>
          <p className="t-mono text-ink/40">{T.scroll}</p>
        </div>
      </div>

      {/* desktop: a pinned stage the page scrolls through, one step per type */}
      <div ref={wrap} className="relative border-t border-line md:h-[380svh]">
        <div className="flex flex-col md:sticky md:top-(--stick-top) md:h-[calc(100svh-var(--stick-top)-var(--frame))] md:transition-[top,height] md:duration-500 md:ease-[cubic-bezier(.23,1,.32,1)]">
          {/* type filter: sticky on its own on phones, part of the pinned stage on desktop */}
          <div className="sticky top-(--stick-top) z-20 border-b border-line bg-paper transition-[top] duration-500 md:static">
            <div role="group" aria-label={T.filterAria} className="grid grid-cols-3 sm:grid-cols-6">
              {OPTIONS.map((id, i) => {
                const on = tier === id;
                return (
                  <button
                    key={id ?? "all"}
                    type="button"
                    aria-pressed={on}
                    onClick={() => choose(i)}
                    className={`t-mono flex h-[clamp(48px,3.9vw,72px)] items-center justify-between gap-2 border-line px-[clamp(12px,1.2vw,24px)] text-left transition-colors duration-500 ${i % 3 < 2 ? "border-r" : ""} ${i < 3 ? "border-b sm:border-b-0" : ""} sm:border-r sm:last:border-r-0 ${on ? "bg-ink text-paper" : "hover:bg-paper-2"}`}
                  >
                    <span className="truncate">{id ? m.tierById[id].name : T.allRooms}</span>
                    <span className={`t-mono-xs ${on ? "text-paper/50" : "text-ink/40"}`}>[{String(i).padStart(2, "0")}]</span>
                  </button>
                );
              })}
            </div>
            {/* phones: the legend rides along with the sticky filter */}
            <div className="border-t border-line px-4 py-2 md:hidden">
              <Legend reserved={hasReserved} />
            </div>
            <div aria-hidden="true" className="hidden h-px bg-line md:block">
              <div className="h-full bg-accent" style={{ width: `${clamp01(p) * 100}%` }} />
            </div>
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-6">
            {/* building: pick a level */}
            <div className="flex min-h-0 flex-col border-b border-line p-[clamp(14px,1.4vw,26px)] md:col-span-2 md:border-b-0 md:border-r">
              <p className="t-mono-xs text-ink/60">{T.pickLevel}</p>
              <div className="flex min-h-0 flex-1 items-center justify-center py-2">
                <BuildingStack highlight={tier} level={level} onLevel={(l) => pickLevel(l)} selectedUnit={sel} className="max-h-full w-full" />
              </div>
              <div className="flex flex-wrap gap-1">
                {[...m.floors].reverse().map((f) => (
                  <button
                    key={f.level}
                    type="button"
                    onClick={() => pickLevel(f.level)}
                    aria-pressed={f.level === level}
                    className={`t-mono-xs border px-2 py-1 transition-colors duration-300 ${f.level === level ? "border-accent bg-accent text-white" : "border-line hover:border-ink"}`}
                  >
                    L{f.level}
                  </button>
                ))}
                <span className="t-mono-xs border border-dashed border-line px-2 py-1 text-ink/50" title={m.ground.text}>
                  {T.groundLobby}
                </span>
              </div>
            </div>

            {/* level plan: pick a room. The plan stays mounted; only its units change */}
            <div className="relative flex min-h-0 flex-col md:col-span-4">
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-dashed border-line px-[clamp(16px,1.6vw,30px)] py-[clamp(8px,0.8vw,14px)]">
                <span className="t-mono">{floor.name}</span>
                <div className="hidden md:block">
                  <Legend reserved={hasReserved} />
                </div>
                <span className="t-mono text-accent">{fmt(T.freeOnLevel, { n: freeHere.length })}</span>
              </div>
              <div className="relative flex min-h-0 flex-1 items-center justify-center p-[clamp(12px,1.4vw,26px)]">
                <div aria-hidden="true" className="sq-grid absolute inset-0 opacity-30" />
                <Plus className="left-2 top-2" />
                <Plus className="right-2 top-2" />
                <Plus className="bottom-2 left-2" />
                <Plus className="bottom-2 right-2" />
                <FloorMap floor={floor} highlight={tier} selected={sel} onSelect={(u) => setSel(u.id)} className="relative max-h-full w-full" />
              </div>
            </div>
          </div>

          {/* price tag for the selected room, one value per column */}
          <div aria-live="polite" className="grid grid-cols-2 border-t border-line md:grid-cols-6">
            <div className={`${cell} col-span-2 border-b border-line md:border-b-0 md:border-r`}>
              <p className="t-mono-xs flex justify-between text-ink/60">
                <Val>{fmt(T.roomAtLevel, { room: fmt(ui.units.room, { id: unit.id }), level: fmt(ui.units.level, { n: unit.level }) })}</Val>
                <Val>{unit.area ?? t.area} m²</Val>
              </p>
              <p className="mt-1.5 flex items-baseline justify-between gap-3">
                <span className="t-h3">
                  <Val>{t.name}</Val>
                </span>
                <span className={`t-mono ${statusColor}`}>
                  <Val>● {statusLabel}</Val>
                </span>
              </p>
            </div>
            <div className={`${cell} border-r border-line`}>
              <p className="t-mono-xs text-ink/60">{fmt(T.rentPer, { per: ui.units.per[t.per] })}</p>
              <p className="mt-1.5 text-[clamp(16px,1.3vw,24px)] font-bold tracking-tight">
                <Val>{vnd(rent)}</Val>
              </p>
            </div>
            <div className={`${cell} border-line md:border-r`}>
              <p className="t-mono-xs text-ink/60">{T.fixedFees}</p>
              <p className="mt-1.5 text-[clamp(16px,1.3vw,24px)] font-bold tracking-tight">
                <Val>{vnd(fees)}</Val>
              </p>
            </div>
            <div className={`${cell} border-t border-r border-line md:border-t-0`}>
              <p className="t-mono-xs text-ink/60">{T.perMonth}</p>
              <p className="mt-1.5 text-[clamp(16px,1.3vw,24px)] font-bold tracking-tight text-accent">
                <Val>{vnd(rent + fees)}</Val>
              </p>
            </div>
            <div className={`${cell} flex items-center border-t border-line md:border-t-0`}>
              <CellButton href="/contact-us" accent className="w-full [&>span:first-child]:flex-1">
                {unit.status === "let" ? T.waitlist : T.book}
              </CellButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
