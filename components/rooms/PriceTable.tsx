"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fmt, type Dictionary } from "@/i18n/config";
import { useT } from "@/i18n/I18nProvider";
import { useRooms } from "@/lib/data";
import { vnd, type RoomsModel, type Tier } from "@/lib/rooms";
import { CellButton } from "../home/Rulers";

type Cell = boolean | string;
type Row = { label: string; cells: Cell[] };

/** The comparison rows, built from whatever tiers, fees and add-ons the API returns. */
function groupsOf({ tiers, featureLabels, fixedFees, addons }: RoomsModel, t: Dictionary["priceTable"]): { title: string; rows: Row[] }[] {
  return [
    {
      title: t.groups.room,
      rows: [
        { label: t.size, cells: tiers.map((x) => `${x.area} m²`) },
        { label: t.sleeps, cells: tiers.map((x) => (x.id === "dorm" ? t.dormSleeps : String(x.sleeps))) },
        ...featureLabels.map(([k, label]) => ({ label, cells: tiers.map((x) => x.features[k]) })),
        { label: t.levels, cells: tiers.map((x) => x.floors) },
      ],
    },
    {
      title: t.groups.fees,
      rows: fixedFees.map((f) => ({ label: `${f.name} ${f.unit}`, cells: tiers.map((x) => vnd(f.amount[x.id] ?? 0)) })),
    },
    {
      title: t.groups.furniture,
      rows: addons
        .filter((a) => tiers.some((x) => x.included.includes(a.id)))
        .map((a) => ({ label: a.name, cells: tiers.map((x) => x.included.includes(a.id)) })),
    },
    {
      title: t.groups.lease,
      rows: [
        { label: t.deposit, cells: tiers.map((x) => fmt(x.deposit > 1 ? t.depositMany : t.depositOne, { n: x.deposit })) },
        { label: t.shortestStay, cells: tiers.map((x) => x.minStay) },
      ],
    },
  ];
}

// one shared column template so every row's lines fall on the same six columns as the rest of the page
// a label column plus one per tier, however many tiers the API returns
const cols = (n: number) => ({ gridTemplateColumns: `repeat(${n}, minmax(170px, 1fr))` });

function Check() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-label={useT().priceTable.included} role="img" className="text-ink/80">
      <rect x="0.5" y="0.5" width="15" height="15" fill="currentColor" />
      <path d="M4 8.2l2.6 2.6L12 5.4" fill="none" stroke="var(--paper)" strokeWidth="1.4" />
    </svg>
  );
}

function Head({ t, yearly, stuck, leasePrice }: { t: Tier; yearly: boolean; stuck: boolean; leasePrice: RoomsModel["leasePrice"] }) {
  const price = leasePrice(t.price, yearly);
  const ui = useT();
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-dashed border-line px-[clamp(12px,1.2vw,24px)] pt-[clamp(10px,1vw,20px)]">
        <p className="t-mono pb-2">{t.name}</p>
        {/* the summary folds away once the header is stuck, so the bar stays short */}
        <div className="grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(.23,1,.32,1)]" style={{ gridTemplateRows: stuck ? "0fr" : "1fr" }}>
          <p className="t-body min-h-0 overflow-hidden text-[clamp(11px,0.8vw,15px)]!">
            <span className="block min-h-[2.7em] pb-3">{t.summary}</span>
          </p>
        </div>
      </div>
      <div className={`flex flex-1 flex-col justify-between px-[clamp(12px,1.2vw,24px)] py-[clamp(10px,1vw,20px)] transition-[gap] duration-500 ${stuck ? "gap-2" : "gap-4"}`}>
        <p className="flex flex-wrap items-baseline gap-x-1.5">
          <span key={price} className="animate-[fade_.4s_ease] text-[clamp(20px,1.6vw,32px)] font-bold leading-none tracking-tight">
            {vnd(price)}
          </span>
          <span className="t-mono-xs text-ink/60">{fmt(ui.priceTable.perMonth, { per: ui.units.per[t.per] })}</span>
        </p>
        <CellButton href="/contact-us" accent className="w-full [&>span:first-child]:flex-1">
          {ui.priceTable.book}
        </CellButton>
      </div>
    </div>
  );
}

export default function PriceTable() {
  const [yearly, setYearly] = useState(false);
  const [stuck, setStuck] = useState(false);
  const head = useRef<HTMLDivElement>(null);
  const table = useRef<HTMLDivElement>(null);
  const m = useRooms();
  const t = useT().priceTable;
  const groups = useMemo(() => (m ? groupsOf(m, t) : []), [m, t]);

  // the header counts as stuck while its natural spot has scrolled above the sticky line
  useEffect(() => {
    let raf = 0;
    const check = () => {
      raf = 0;
      const h = head.current;
      const tb = table.current;
      if (!h || !tb) return;
      const line = parseFloat(getComputedStyle(h).top) || 0;
      const r = tb.getBoundingClientRect();
      setStuck(getComputedStyle(h).position === "sticky" && r.top < line - 1 && r.bottom > line + h.offsetHeight);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  if (!m) return null;

  return (
    <section id="pricing" aria-label={t.aria} className="scroll-mt-4 border-t border-line">
      <div className="grid md:grid-cols-6">
        <div className="hidden md:block md:border-r md:border-line" />
        <div className="px-4 py-[clamp(48px,5vw,96px)] text-center md:col-span-4 md:border-r md:border-line">
          <h2 className="t-h2 text-[clamp(32px,3.6vw,68px)]!">
            {t.title[0]}
            <br />
            {t.title[1]}
          </h2>
          <p className="t-body mx-auto mt-4 max-w-[40em] text-[clamp(14px,1.1vw,20px)]!">
            {fmt(t.body, { pct: m.leaseDiscount * 100 })}
          </p>
        </div>
        <div className="hidden md:block" />
      </div>

      {/* lease toggle: two halves over the four middle columns */}
      <div className="grid border-t border-line md:grid-cols-6">
        <div className="hidden md:block md:border-r md:border-line" />
        <div role="radiogroup" aria-label={t.leaseAria} className="grid grid-cols-2 md:col-span-4 md:border-r md:border-line">
          {[
            [false, t.monthly],
            [true, fmt(t.yearly, { pct: m.leaseDiscount * 100 })],
          ].map(([v, label], i) => {
            const on = yearly === v;
            return (
              <button
                key={String(v)}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setYearly(v as boolean)}
                className={`t-mono flex items-center justify-center gap-2 py-[clamp(12px,1.1vw,20px)] transition-colors duration-500 ${i === 0 ? "border-r border-line" : ""} ${on ? "bg-ink text-paper" : "hover:bg-paper-2"}`}
              >
                {v && <span className={on ? "text-paper" : "text-accent"}>✳</span>}
                {label as string}
              </button>
            );
          })}
        </div>
        <div className="hidden md:block" />
      </div>

      {/* scrolls sideways on small screens; on desktop it fits, so the header can stick to the page */}
      <div className="relative overflow-x-auto border-t border-line lg:overflow-visible">
        <div ref={table} className="min-w-255 lg:min-w-0" role="table" aria-label={t.tableAria}>
          <div
            ref={head}
            role="row"
            style={cols(m.tiers.length + 1)}
            className={`grid z-20 border-b border-line bg-paper lg:sticky lg:top-(--stick-top) lg:transition-[top,box-shadow] lg:duration-500 ${stuck ? "shadow-[0_6px_0_-5px_var(--ink)]" : ""}`}
          >
            <div role="columnheader" className="flex items-end border-r border-line px-[clamp(12px,1.75vw,34px)] py-[clamp(10px,1vw,20px)]">
              <span className={`t-mono-xs text-ink/50 transition-opacity duration-500 ${stuck ? "opacity-100" : "opacity-0"}`}>
                {yearly ? t.yearlyShort : t.monthly}
              </span>
            </div>
            {m.tiers.map((t, i) => (
              <div key={t.id} role="columnheader" className={i < m.tiers.length - 1 ? "border-r border-line" : ""}>
                <Head t={t} yearly={yearly} stuck={stuck} leasePrice={m.leasePrice} />
              </div>
            ))}
          </div>
          {groups.map((g) => (
            <div key={g.title} role="rowgroup">
              <div role="row" className="t-mono-xs border-b border-line bg-ink px-[clamp(12px,1.75vw,34px)] py-2 text-paper">
                <span role="cell">{g.title}</span>
              </div>
              {g.rows.map((r) => (
                <div key={r.label} role="row" style={cols(m.tiers.length + 1)} className="grid border-b border-line last:border-b-0">
                  <div role="rowheader" className="t-body flex items-center border-r border-line px-[clamp(12px,1.75vw,34px)] py-[clamp(10px,0.9vw,16px)] text-ink!">
                    {r.label}
                  </div>
                  {r.cells.map((c, i) => (
                    <div
                      key={i}
                      role="cell"
                      className={`t-body flex items-center px-[clamp(12px,1.2vw,24px)] py-[clamp(10px,0.9vw,16px)] ${i < r.cells.length - 1 ? "border-r border-line" : ""} ${c === false ? "bg-ink/6" : ""}`}
                    >
                      {c === true ? <Check /> : c === false ? <span className="sr-only">{t.notIncluded}</span> : c}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
