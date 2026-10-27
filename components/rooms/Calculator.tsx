"use client";

import { useState } from "react";
import { fmt } from "@/i18n/config";
import { useT } from "@/i18n/I18nProvider";
import { useRooms } from "@/lib/data";
import { vnd, type AddonId, type EstimateLine, type TierId } from "@/lib/rooms";
import { CellButton } from "../home/Rulers";

const cell = "px-[clamp(12px,1.2vw,24px)]";
const SEL_H = "h-[clamp(56px,4.6vw,84px)]"; // height of the sticky room selector

function Stepper({ label, value, min, max, onChange, hint }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void; hint: string }) {
  const t = useT().calculator;
  return (
    <div className={`flex flex-col justify-between gap-3 ${cell} py-3`}>
      <div>
        <p className="t-mono">{label}</p>
        <p className="t-mono-xs mt-1 text-ink/50">{hint}</p>
      </div>
      <div className="flex items-stretch self-start border border-line">
        <button type="button" aria-label={fmt(t.fewer, { label })} disabled={value <= min} onClick={() => onChange(value - 1)} className="w-9 transition-colors hover:bg-ink hover:text-paper disabled:pointer-events-none disabled:opacity-30">
          −
        </button>
        <output aria-live="polite" className="t-mono grid w-10 place-items-center border-x border-line py-1.5 tabular-nums">
          {value}
        </output>
        <button type="button" aria-label={fmt(t.more, { label })} disabled={value >= max} onClick={() => onChange(value + 1)} className="w-9 transition-colors hover:bg-ink hover:text-paper disabled:pointer-events-none disabled:opacity-30">
          +
        </button>
      </div>
    </div>
  );
}

export default function Calculator() {
  const m = useRooms();
  const T = useT().calculator;
  const [picked, setTier] = useState<TierId | null>(null);
  const [yearly, setYearly] = useState(false);
  const [people, setPeople] = useState(1);
  const [vehicles, setVehicles] = useState(1);
  const [extras, setExtras] = useState<AddonId[]>(["microwave"]);
  if (!m) return null;

  const { tiers, tierById, addons, fixedFees } = m;
  // starts on the studio (a middle-priced room) when the API has one, otherwise the first tier
  const tier: TierId = picked ?? (tierById.studio ? "studio" : tiers[0].id);
  const t = tierById[tier];
  const est = m.estimate({ tier, yearly, people: Math.min(people, t.sleeps), vehicles, extras });

  const pickTier = (id: TierId) => {
    setTier(id);
    setPeople((p) => Math.min(p, tierById[id].sleeps));
  };
  const toggle = (id: AddonId) => setExtras((x) => (x.includes(id) ? x.filter((v) => v !== id) : [...x, id]));
  const lineLabel = (l: EstimateLine) => (l.kind === "rent" ? fmt(T.rentLine, { name: l.name }) : l.qty > 1 ? `${l.name} × ${l.qty}` : l.name);
  const lease = yearly ? T.yearlyLease : T.monthlyLease;

  return (
    <section id="fees" aria-label={T.aria} className="scroll-mt-4 border-t border-line">
      <div className="grid md:grid-cols-6">
        <div className="px-[clamp(16px,2.3vw,44px)] pb-[clamp(24px,2.3vw,44px)] pt-[clamp(60px,6vw,120px)] md:col-span-4 md:border-r md:border-line">
          <p className="t-mono mb-[clamp(16px,1.6vw,30px)]">{T.label}</p>
          <h2 className="t-h2">
            {T.title[0]}
            <br />
            {T.title[1]}
          </h2>
        </div>
        <div className="flex flex-col justify-end gap-6 px-[clamp(16px,1.9vw,36px)] pb-[clamp(24px,2.3vw,44px)] md:col-span-2">
          <p className="t-body text-ink/85">{T.body}</p>
        </div>
      </div>

      {/* everything below the selector scrolls under it; the selector stays pinned under the header */}
      <div className="relative">
        <div role="radiogroup" aria-label={T.roomType} className="stick z-20 grid grid-cols-3 border-y border-line bg-paper sm:grid-cols-6">
          <div className={`hidden flex-col justify-center border-r border-line sm:flex ${cell} ${SEL_H}`}>
            <span className="t-mono-xs text-ink/50">{T.estimateFor}</span>
            <span className="t-mono mt-1 text-ink/70">{lease}</span>
          </div>
          {tiers.map((x, i) => {
            const on = tier === x.id;
            return (
              <button
                key={x.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => pickTier(x.id)}
                className={`flex flex-col justify-center gap-1 border-line text-left transition-colors duration-300 ${cell} ${SEL_H} ${i < tiers.length - 1 ? "border-r" : ""} ${i < 3 ? "border-b sm:border-b-0" : ""} ${on ? "bg-ink text-paper" : "hover:bg-paper-2"}`}
              >
                <span className="t-mono">{x.name}</span>
                <span className={`t-mono-xs ${on ? "text-paper/60" : "text-ink/50"}`}>{vnd(x.price)}</span>
              </button>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-6">
          <div className="lg:col-span-4 lg:border-r lg:border-line">
            {/* lease, people, vehicles: 2 + 1 + 1 columns */}
            <div className="grid grid-cols-2 border-b border-line sm:grid-cols-4">
              <div className={`col-span-2 flex flex-col justify-between gap-3 border-b border-line py-3 sm:border-b-0 sm:border-r ${cell}`}>
                <div>
                  <p className="t-mono">{T.lease}</p>
                  <p className="t-mono-xs mt-1 text-ink/50">{fmt(T.leaseHint, { pct: m.leaseDiscount * 100 })}</p>
                </div>
                <div role="radiogroup" aria-label={T.leaseAria} className="flex self-start border border-line">
                  {[
                    [false, T.monthly],
                    [true, T.twelveMonths],
                  ].map(([v, l]) => (
                    <button
                      key={String(v)}
                      type="button"
                      role="radio"
                      aria-checked={yearly === v}
                      onClick={() => setYearly(v as boolean)}
                      className={`t-mono-xs px-3 py-2 transition-colors ${yearly === v ? "bg-ink text-paper" : "hover:bg-paper-2"}`}
                    >
                      {l as string}
                    </button>
                  ))}
                </div>
              </div>
              <div className="border-r border-line">
                <Stepper label={T.people} value={people} min={1} max={t.sleeps} onChange={setPeople} hint={t.sleeps > 1 ? fmt(T.upTo, { n: t.sleeps }) : T.waterPerPerson} />
              </div>
              <Stepper label={T.motorbikes} value={vehicles} min={0} max={2} onChange={setVehicles} hint={T.parkingHint} />
            </div>

            {/* fixed */}
            <p className={`t-mono flex justify-between border-b border-line py-3 ${cell}`}>
              {T.fixed} <span className="text-ink/40">[{fixedFees.length}]</span>
            </p>
            <ul>
              {fixedFees.map((f) => (
                <li key={f.id} className="grid grid-cols-2 border-b border-dashed border-line sm:grid-cols-4">
                  <span className={`t-body col-span-1 border-r border-line py-2.5 text-ink! ${cell}`}>{f.name}</span>
                  <span className={`t-mono-xs col-span-2 hidden items-center border-r border-line py-2.5 text-ink/50 sm:flex ${cell}`}>
                    {f.note}
                  </span>
                  <span className={`t-mono flex min-w-0 flex-wrap items-center justify-between gap-x-2 py-2.5 tabular-nums ${cell}`}>
                    <span key={f.amount[tier]} className="animate-[fade_.35s_ease]">
                      {vnd(f.amount[tier])}
                    </span>
                    <span className="t-mono-xs text-ink/40">{f.unit}</span>
                  </span>
                </li>
              ))}
            </ul>

            {/* flexible */}
            <p className={`t-mono flex justify-between border-b border-line py-3 pt-[clamp(24px,2.3vw,44px)] ${cell}`}>
              {T.flexible} <span className="text-ink/40">[{addons.length}]</span>
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4">
              {addons.map((a, i) => {
                const included = t.included.includes(a.id);
                const on = included || extras.includes(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    aria-pressed={on}
                    disabled={included}
                    onClick={() => toggle(a.id)}
                    className={`group flex min-h-[clamp(96px,7.5vw,140px)] flex-col justify-between border-line p-3 text-left transition-colors duration-300 ${i % 4 < 3 ? "sm:border-r" : ""} ${i % 2 === 0 ? "border-r" : ""} ${i < addons.length - 2 ? "border-b" : ""} ${i >= addons.length - 4 ? "sm:border-b-0" : ""} ${
                      included ? "bg-paper-2" : on ? "bg-accent text-white" : "bg-paper hover:bg-paper-2"
                    }`}
                  >
                    <span className="flex items-start justify-between gap-2">
                      <span className="text-[clamp(13px,1vw,18px)] font-bold uppercase leading-tight tracking-tight">{a.name}</span>
                      <span aria-hidden="true" className={`grid size-4 shrink-0 place-items-center border text-[10px] ${on ? "border-current" : "border-line"}`}>
                        {on ? "✓" : ""}
                      </span>
                    </span>
                    <span>
                      <span className={`t-mono-xs block ${on && !included ? "text-white/75" : "text-ink/50"}`}>{a.note}</span>
                      <span className="t-mono mt-1 block">{included ? T.included : fmt(T.perMonth, { price: vnd(a.price) })}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* receipt: sticks below the selector */}
          <div className="border-t border-line lg:col-span-2 lg:border-t-0">
            <div className="lg:sticky lg:top-[calc(var(--stick-top)+clamp(56px,4.6vw,84px)+16px)] lg:transition-[top] lg:duration-500">
              <div className="m-[clamp(16px,1.6vw,30px)] border border-ink bg-paper shadow-[0_5px_0_var(--ink)]">
                <div className="t-mono-xs flex justify-between bg-ink px-3 py-2 text-paper">
                  <span>{t.name}</span>
                  <span>{lease}</span>
                </div>
                <ul className="space-y-1.5 p-3">
                  {est.lines.map((l) => (
                    <li key={`${l.kind}:${l.id}`} className="t-body flex justify-between gap-4">
                      <span>{lineLabel(l)}</span>
                      <span key={l.amount} className="animate-[fade_.35s_ease] tabular-nums text-ink!">
                        {vnd(l.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-dashed border-line p-3">
                  <p className="t-mono-xs text-ink/60">{T.youPay}</p>
                  <p key={est.monthly} className="mt-1 animate-[fade_.35s_ease] text-[clamp(28px,2.4vw,46px)] font-bold leading-none tracking-tight">
                    {vnd(est.monthly)}
                  </p>
                </div>
                <dl className="t-body space-y-1 border-t border-line p-3">
                  <div className="flex justify-between gap-4">
                    <dt>{fmt(t.deposit > 1 ? T.depositMany : T.depositOne, { n: t.deposit })}</dt>
                    <dd className="tabular-nums text-ink!">{vnd(est.deposit)}</dd>
                  </div>
                  <div className="flex justify-between gap-4 font-bold">
                    <dt className="text-ink!">{T.due}</dt>
                    <dd className="tabular-nums text-ink!">{vnd(est.deposit + est.monthly)}</dd>
                  </div>
                </dl>
                <div className="p-3 pt-0">
                  <CellButton href="/contact-us" accent className="w-full [&>span:first-child]:flex-1">
                    {T.book}
                  </CellButton>
                </div>
              </div>
              <p className="t-mono-xs mx-[clamp(16px,1.6vw,30px)] mb-6 text-ink/50">
                {T.depositNote}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
