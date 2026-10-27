"use client";

import Link from "next/link";
import { fmt } from "@/i18n/config";
import { useT } from "@/i18n/I18nProvider";
import { useRooms } from "@/lib/data";
import { vnd, vndShort, type RoomsModel } from "@/lib/rooms";
import FloorMap from "./FloorMap";
import PixelFill from "../fx/PixelFill";
import { RollIcon, RollText } from "../fx/Roll";
import { ArrowRight, Plus } from "../home/Rulers";

const px = "px-[clamp(16px,2.3vw,44px)]";

/** Live-availability board: stat tiles, a level plan and the free-this-week list, all from /rooms. */
function Board({ m }: { m: RoomsModel }) {
  const ui = useT();
  const t = ui.roomsHero;
  const free = m.allUnits.filter((u) => u.status === "available");
  const cheapest = Math.min(...m.tiers.map((t) => t.price));
  // a few free rooms to pin in the "free this week" card, one per tier where possible
  const picks = m.tiers
    .map((t) => free.find((u) => u.tier === t.id))
    .filter((u): u is (typeof free)[number] => Boolean(u))
    .slice(1, 4);
  const stats = [
    [t.stats.free, String(free.length), "bg-emerald-600"],
    [t.stats.from, vndShort(cheapest, ui.format), "bg-accent"],
    [t.stats.levels, String(m.floors.length), "bg-sky-600"],
    [t.stats.hiddenFees, "0", "bg-indigo-700"],
  ];
  // the level with the most free rooms makes the liveliest plan
  const level = [...m.floors].sort(
    (a, b) => [...b.north, ...b.south].filter((u) => u.status === "available").length - [...a.north, ...a.south].filter((u) => u.status === "available").length,
  )[0];
  const busiest = m.tiers.find((t) => [...level.north, ...level.south].some((u) => u.tier === t.id))?.id ?? null;

  return (
    <div className="relative mx-auto w-[86%] max-w-[760px] text-[clamp(9px,0.7vw,13px)]">
      <div className="grid grid-cols-4 gap-1.5">
        {stats.map(([k, v, c]) => (
          <div key={k} className="border border-ink/70 bg-paper p-2 shadow-[0_4px_0_var(--ink)]">
            <div className="t-mono-xs flex justify-between text-ink/60">
              {k} <i className={`size-1.5 ${c}`} />
            </div>
            <div className="mt-3 text-[clamp(15px,1.3vw,26px)] font-bold leading-none">{v}</div>
          </div>
        ))}
      </div>
      <div className="mt-2 w-[78%] border border-ink/70 bg-paper">
        <div className="flex items-baseline justify-between border-b border-line p-2">
          <p className="font-bold uppercase">{fmt(t.liveAvailability, { level: level.name })}</p>
          <span className="t-mono-xs text-accent">{t.allLevels}</span>
        </div>
        <FloorMap floor={level} highlight={busiest} className="w-full p-1" />
      </div>
      <div className="absolute -bottom-6 right-0 w-[48%] border border-ink bg-paper shadow-[0_4px_0_var(--ink)]">
        <div className="t-mono-xs flex justify-between bg-ink px-2 py-1.5 text-paper">
          {fmt(t.freeThisWeek, { n: picks.length })} <span>{t.viewAll}</span>
        </div>
        {picks.map((u) => {
          const tier = m.tierById[u.tier];
          return (
            <div key={u.id} className="border-t border-line p-2 first:border-t-0">
              <p className="font-bold uppercase">
                {fmt(ui.units.room, { id: u.id })} · {tier.name}
              </p>
              <p className="text-ink/60">{fmt(t.levelArea, { level: fmt(ui.units.level, { n: u.level }), area: tier.area })}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="t-mono-xs">{vnd(tier.price)}</span>
                <i className="h-1.5 flex-1 bg-paper-2">
                  <i className="block h-full bg-ink" style={{ width: `${(tier.price / (tier.price + m.fixedTotal(tier.id))) * 100}%` }} />
                </i>
                <span className="t-mono-xs bg-accent px-1.5 py-0.5 text-white">{t.view}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function RoomsHero() {
  const m = useRooms();
  const t = useT().roomsHero;
  if (!m) return null;
  return (
    <section aria-label={t.aria}>
      <div className="grid md:min-h-[calc(100svh-var(--header-h)-2*var(--frame)-clamp(56px,4.6vw,84px)-1px)] md:grid-cols-6">
        <div className="flex flex-col border-b border-line md:col-span-3 md:border-b-0 md:border-r">
          <div className={`flex-1 ${px} pb-12 pt-[clamp(32px,4vw,80px)]`}>
            <p className="t-mono mb-[clamp(16px,1.6vw,30px)] text-ink/70">{t.label}</p>
            <h1 className="t-h1 text-[clamp(34px,4vw,78px)]!">
              {t.title.map((l, i) => (
                <span key={i} className="rise">
                  <span style={{ "--d": `${i * 100}ms` } as React.CSSProperties}>{l}</span>
                </span>
              ))}
            </h1>
          </div>
          <div className="grid border-t border-line md:grid-cols-3">
            <p className="t-body text-[clamp(15px,1.25vw,24px)]! p-[clamp(16px,1.75vw,34px)] leading-[1.15]! text-ink/85 md:col-span-2">
              {fmt(t.body, { types: m.tiers.length, floors: m.floors.length })}
            </p>
            <Link
              href="#room-types"
              className="fx t-mono flex flex-col justify-between gap-8 overflow-hidden border-t border-line p-[clamp(8px,0.7vw,14px)] text-accent md:border-l md:border-t-0"
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
        </div>

        <div className="relative flex items-center overflow-hidden py-16 md:col-span-3 md:py-10">
          <div aria-hidden="true" className="sq-grid absolute inset-0 opacity-40" />
          <Plus className="left-3 top-3" />
          <Plus className="right-3 top-3" />
          <Plus className="bottom-3 left-3" />
          <Plus className="bottom-3 right-3" />
          <Board m={m} />
        </div>
      </div>

    </section>
  );
}
