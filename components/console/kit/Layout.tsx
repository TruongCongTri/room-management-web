"use client";

import type { ReactNode } from "react";
import LocaleLink from "../../LocaleLink";

export const PAD = "px-[clamp(14px,1.4vw,26px)]";

/**
 * Screen heading: kicker ("[03] People"), title, optional summary, and the screen's actions in a ruled cell
 * on the right — the same 8 + 4 column split the site uses for its section heads.
 */
export function PageHead({ kicker, title, children, actions, back }: { kicker?: ReactNode; title: ReactNode; children?: ReactNode; actions?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <header className="grid border-b border-line md:grid-cols-12">
      <div className={`md:col-span-8 ${PAD} py-[clamp(18px,1.9vw,36px)]`}>
        {back && (
          <LocaleLink href={back.href} className="t-mono-xs mb-3 inline-flex items-center gap-1.5 text-ink/55 hover:text-accent">
            ← {back.label}
          </LocaleLink>
        )}
        {kicker && <p className="t-mono-xs text-ink/50">{kicker}</p>}
        <h1 className="t-h1 mt-2 break-words">{title}</h1>
        {children && <div className="t-body mt-3 max-w-[52em]">{children}</div>}
      </div>
      {actions && <div className={`flex flex-wrap items-end gap-2 border-t border-line md:col-span-4 md:justify-end md:border-l md:border-t-0 ${PAD} py-4`}>{actions}</div>}
    </header>
  );
}

/** A titled band: ink title strip (like the price table's groups), optional actions, then content. */
export function Section({ title, actions, children, id, dark = true }: { title: ReactNode; actions?: ReactNode; children: ReactNode; id?: string; dark?: boolean }) {
  return (
    <section id={id} aria-label={typeof title === "string" ? title : undefined} className="scroll-mt-24 border-b border-line">
      <div className={`flex min-h-9 flex-wrap items-center justify-between gap-2 border-b border-line ${PAD} py-1.5 ${dark ? "bg-ink text-paper" : "bg-paper-2"}`}>
        <h2 className="t-mono-xs">{title}</h2>
        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

/** Key / value cells (contact cells' style): label on top in mono, value below. */
export function Facts({ items, cols = 4 }: { items: { label: ReactNode; value: ReactNode; wide?: boolean }[]; cols?: 2 | 3 | 4 | 6 }) {
  const c = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4", 6: "sm:grid-cols-3 lg:grid-cols-6" }[cols];
  return (
    <dl className={`ruled ${c}`}>
      {items.map((it, i) => (
        <div key={i} className={`flex min-w-0 flex-col justify-between gap-3 bg-paper ${PAD} py-3 ${it.wide ? "sm:col-span-2" : ""}`}>
          <dt className="t-mono-xs text-ink/50">{it.label}</dt>
          <dd className="t-body break-words text-ink!">{it.value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Figures for dashboards: large number, mono label, optional note. */
export function Stats({ items }: { items: { label: ReactNode; value: ReactNode; note?: ReactNode; tone?: "accent" | "ink"; href?: string }[] }) {
  return (
    <div className="ruled grid-cols-2 lg:grid-cols-4">
      {items.map((s, i) => {
        const body = (
          <>
            <p className="t-mono-xs text-ink/50">{s.label}</p>
            <p className={`mt-[clamp(14px,1.6vw,30px)] text-[clamp(30px,3vw,58px)] font-bold leading-none tracking-[-0.04em] tabular-nums ${s.tone === "accent" ? "text-accent" : ""}`}>{s.value}</p>
            {s.note && <p className="t-mono-xs mt-2 text-ink/50 normal-case tracking-normal">{s.note}</p>}
          </>
        );
        return s.href ? (
          <LocaleLink key={i} href={s.href} className={`block bg-paper ${PAD} py-4 transition-colors hover:bg-paper-2`}>
            {body}
          </LocaleLink>
        ) : (
          <div key={i} className={`bg-paper ${PAD} py-4`}>
            {body}
          </div>
        );
      })}
    </div>
  );
}

/** Ruled tab cells; the active one in ink. */
export function Tabs<K extends string>({ tabs, active, onChange, label }: { tabs: { key: K; label: ReactNode; count?: number }[]; active: K; onChange: (k: K) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="flex overflow-x-auto border-b border-line">
      {tabs.map((t) => {
        const on = t.key === active;
        return (
          <button
            key={t.key}
            role="tab"
            type="button"
            aria-selected={on}
            onClick={() => onChange(t.key)}
            className={`t-mono shrink-0 border-r border-line ${PAD} py-3 transition-colors ${on ? "bg-ink text-paper" : "text-ink/60 hover:bg-paper-2 hover:text-ink"}`}
          >
            {t.label}
            {t.count !== undefined && <span className={`ml-2 ${on ? "text-paper/60" : "text-ink/40"}`}>{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** A row of filter cells (FilterSelect / FilterInput) ruled 1px apart. */
export function Toolbar({ children, cols = 4 }: { children: ReactNode; cols?: 2 | 3 | 4 | 5 | 6 }) {
  const c = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4", 5: "sm:grid-cols-3 lg:grid-cols-5", 6: "sm:grid-cols-3 lg:grid-cols-6" }[cols];
  return <div className={`ruled ${c}`}>{children}</div>;
}

/** Buttons at the foot of a form or dialog. */
export function Actions({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`flex flex-wrap items-center justify-end gap-2 ${PAD} py-3 ${className}`}>{children}</div>;
}
