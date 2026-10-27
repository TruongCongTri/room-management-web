"use client";

import { useT } from "@/i18n/I18nProvider";
import { useAbout } from "@/lib/data";
import type { AboutData } from "@/lib/api/types";
import { Tower } from "../home/Illustrations";
import { Plus, RulerFrame } from "../home/Rulers";
import { seg, useScrollProgress } from "../fx/useScrollProgress";

const px = "px-[clamp(16px,2.3vw,44px)]";

/* ----------------------------------------------------------------- hero */

/** The Atrium mark, large, drawn in stroke by stroke, with a dashed offset outline and construction lines. */
function Mark() {
  const paths = ["M50 5 L93 30 L93 80 L50 105 L7 80 L7 30 Z", "M7 30 L50 55 L93 30 M50 55 L50 105", "M50 18 L71 30 L50 42 L29 30 Z", "M29 30 L29 40 L50 52 L50 42"];
  return (
    <svg viewBox="-12 -12 124 134" className="h-full w-auto overflow-visible text-ink" aria-hidden="true">
      {/* offset outline */}
      <path d="M50 -1 L98.5 27 L98.5 83 L50 111 L1.5 83 L1.5 27 Z" fill="none" stroke="currentColor" strokeWidth="0.35" strokeDasharray="1.6 1.2" opacity="0.7" />
      <g fill="var(--paper)" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round" className="stroke-in">
        {paths.map((d, i) => (
          <path key={i} d={d} pathLength={1} style={{ animationDelay: `${0.2 + i * 0.25}s`, fill: i === 0 ? "var(--paper)" : "none" }} />
        ))}
      </g>
      {/* the open court, marked */}
      <rect x="69" y="66" width="3" height="3" fill="var(--accent)" />
      <line x1="72" y1="69" x2="104" y2="88" stroke="var(--accent)" strokeWidth="0.3" opacity="0.6" />
    </svg>
  );
}

function Hero({ a }: { a: AboutData }) {
  return (
    <section aria-label={useT().about.aria}>
      <div className="relative flex items-center justify-center overflow-hidden" style={{ height: "max(420px, calc(100svh - var(--header-h) - 2 * var(--frame) - clamp(120px, 12vw, 220px)))" }}>
        <RulerFrame />
        {/* construction lines through the centre */}
        <svg aria-hidden="true" className="absolute inset-0 size-full" preserveAspectRatio="none" viewBox="0 0 100 100">
          <g stroke="var(--line)" strokeWidth="1" vectorEffect="non-scaling-stroke">
            {[
              [0, 0, 100, 100],
              [100, 0, 0, 100],
              [0, 25, 100, 75],
              [0, 75, 100, 25],
              [0, 50, 100, 50],
              [50, 0, 50, 100],
            ].map(([a, b, c, d], i) => (
              <line key={i} x1={a} y1={b} x2={c} y2={d} vectorEffect="non-scaling-stroke" />
            ))}
          </g>
        </svg>
        <div className="relative h-[62%]">
          <Mark />
        </div>
      </div>

      {/* statement band: 3 + 6 + 3 columns */}
      <div className="grid border-t border-line md:grid-cols-12">
        <div className="relative hidden md:col-span-3 md:block">
          <p className="t-mono absolute inset-x-0 top-1/2 -translate-y-[calc(100%+6px)] px-[clamp(8px,0.7vw,14px)] text-ink/70">{a.left}</p>
          <div aria-hidden="true" className="absolute inset-x-0 top-1/2 border-t border-dashed border-line" />
        </div>
        <div className="px-4 py-[clamp(48px,6vw,110px)] text-center md:col-span-6 md:border-x md:border-line">
          <h1 className="t-h2 text-[clamp(28px,2.9vw,56px)]!">
            {a.title.map((l, i) => (
              <span key={l} className="rise">
                <span style={{ "--d": `${i * 100}ms` } as React.CSSProperties}>{l}</span>
              </span>
            ))}
          </h1>
          <p className="t-body mx-auto mt-[clamp(16px,1.6vw,30px)] max-w-[30em] text-[clamp(15px,1.15vw,22px)]! text-ink/85">{a.body}</p>
        </div>
        <div className="relative hidden md:col-span-3 md:block">
          <p className="t-mono absolute inset-x-0 top-1/2 -translate-y-[calc(100%+6px)] px-[clamp(8px,0.7vw,14px)] text-right text-ink/70">{a.right}</p>
          <div aria-hidden="true" className="absolute inset-x-0 top-1/2 border-t border-dashed border-line" />
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- story */

const MISSION_ICONS = [
  <path key="0" d="M6 6h12v12H6zM6 12h12M12 6v12" />,
  <path key="1" d="M7 8h10M7 12h10M7 16h6" />,
  <path key="2" d="M8 15l-2 3 3-1 7-7-2-2zM14 8l2 2" />,
  <path key="3" d="M8 9h8l-1 9H9zM10 9V7h4v2" />,
];

function Hex({ i }: { i: number }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true" className="text-ink/60">
      <path d="M12 1.5l9.1 5.25v10.5L12 22.5l-9.1-5.25V6.75z" />
      {MISSION_ICONS[i]}
    </svg>
  );
}

function Story({ a }: { a: AboutData }) {
  const [ref, p] = useScrollProgress<HTMLElement>("pass");
  const reveal = seg(p, 0.15, 0.5);
  const t = useT().about;
  return (
    <section ref={ref} aria-label={t.storyAria} className="grid border-t border-line md:grid-cols-12">
      <div className="relative overflow-hidden border-b border-line md:col-span-6 md:border-b-0 md:border-r">
        <Tower reveal={reveal} id="about-tower" className="block size-full" />
        {/* accent discs, like a stamp on the drawing */}
        <span aria-hidden="true" className="absolute left-[30%] top-[18%] aspect-square w-[11%] rounded-full bg-accent mix-blend-multiply transition-opacity duration-700" style={{ opacity: reveal }} />
        <span aria-hidden="true" className="absolute bottom-[10%] left-[12%] aspect-square w-[17%] rounded-full bg-accent mix-blend-multiply transition-opacity duration-700" style={{ opacity: seg(p, 0.3, 0.55) }} />
      </div>
      <div className="flex flex-col md:col-span-6">
        <div className="px-[clamp(16px,8.7vw,168px)] pb-[clamp(24px,2.3vw,44px)] pr-[clamp(16px,4vw,80px)] pt-[clamp(32px,2.3vw,44px)]">
          <p className="t-mono mb-[clamp(10px,1vw,18px)] text-ink/70">{t.storyLabel}</p>
          <h2 className="t-h2">{t.storyTitle}</h2>
          <p className="mt-[clamp(32px,4vw,80px)] text-[clamp(16px,1.25vw,24px)] leading-[1.2] tracking-tight text-ink">{a.storyLead}</p>
          <p className="t-body mt-[clamp(16px,1.6vw,30px)]">{a.story}</p>
        </div>
        <div className="mt-auto">
          <h3 className="t-h3 border-t border-line px-[clamp(16px,8.7vw,168px)] py-[clamp(16px,1.6vw,30px)]">{t.mission}</h3>
          <ul>
            {a.mission.map((m, i) => (
              <li key={m} className="group grid grid-cols-6 border-t border-line">
                <span className="t-mono col-span-4 flex items-center py-[clamp(14px,1.4vw,26px)] pl-[clamp(16px,8.7vw,168px)] pr-4 transition-colors group-hover:text-accent">{m}</span>
                <span className="col-span-1 grid place-items-center border-x border-line transition-colors group-hover:bg-ink group-hover:[&_svg]:text-paper">
                  <Hex i={i} />
                </span>
                <span className="col-span-1" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- team */

const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);

/** A drafted portrait card: construction circle and initials in outline; inks in on hover. */
function Member({ name, role, i }: { name: string; role: string; i: number }) {
  return (
    <li className="group col-span-12 border-b border-line sm:col-span-6 sm:border-r sm:max-lg:[&:nth-child(2n)]:border-r-0 lg:col-span-4 lg:[&:nth-child(3n)]:border-r-0">
      <div className="relative aspect-[1/0.95] overflow-hidden transition-colors duration-500 group-hover:bg-ink">
        <Plus className="left-3 top-3 opacity-0 transition-opacity group-hover:opacity-100 group-hover:text-paper/70" />
        <Plus className="right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100 group-hover:text-paper/70" />
        <Plus className="bottom-3 left-3 opacity-0 transition-opacity group-hover:opacity-100 group-hover:text-paper/70" />
        <Plus className="bottom-3 right-3 opacity-0 transition-opacity group-hover:opacity-100 group-hover:text-paper/70" />
        <svg viewBox="0 0 400 380" className="absolute inset-0 size-full" aria-hidden="true">
          <g fill="none" className="stroke-ink/25 transition-colors duration-500 group-hover:stroke-paper/25" strokeWidth="1">
            <circle cx="200" cy="190" r="128" />
            <circle cx="200" cy="190" r="96" strokeDasharray="3 5" />
            <line x1="40" y1="190" x2="360" y2="190" />
            <line x1="200" y1="30" x2="200" y2="350" />
            <line x1="90" y1="80" x2="310" y2="300" strokeDasharray="2 6" />
            <line x1="310" y1="80" x2="90" y2="300" strokeDasharray="2 6" />
          </g>
          <text
            x="200"
            y="232"
            textAnchor="middle"
            className="fill-transparent stroke-ink transition-[fill,stroke] duration-500 group-hover:fill-paper group-hover:stroke-paper"
            strokeWidth="1.4"
            style={{ fontSize: 132, fontWeight: 700, letterSpacing: "-0.04em", fontFamily: "var(--font-inter-tight)" }}
          >
            {initials(name)}
          </text>
          {/* rounded: Math.sin/cos can differ in the last digit between server and browser */}
          <rect x={(200 + 128 * Math.cos(-0.6 + i)).toFixed(2)} y={(190 + 128 * Math.sin(-0.6 + i)).toFixed(2)} width="9" height="9" fill="var(--accent)" transform="translate(-4.5 -4.5)" />
        </svg>
      </div>
      <div className="border-t border-line py-[clamp(14px,1.4vw,26px)] text-center transition-colors duration-500 group-hover:bg-ink group-hover:text-paper">
        <p className="t-h3 text-[clamp(18px,1.45vw,28px)]!">{name}</p>
        <p className="t-mono-xs mt-1.5 text-ink/60 transition-colors group-hover:text-paper/70">{role}</p>
      </div>
    </li>
  );
}

function Team({ a }: { a: AboutData }) {
  const t = useT().about;
  return (
    <section aria-label={t.teamAria} className="border-t border-line">
      <div className="grid md:grid-cols-12">
        <div className={`${px} pb-[clamp(24px,2.3vw,44px)] pt-[clamp(60px,8vw,150px)] md:col-span-6`}>
          <p className="t-mono mb-[clamp(16px,1.6vw,30px)] text-ink/70">{t.teamLabel}</p>
          <h2 className="t-h2">
            {a.teamTitle[0]}
            <br />
            {a.teamTitle[1]}
          </h2>
        </div>
        <div className="flex items-end px-[clamp(16px,1.75vw,34px)] pb-[clamp(24px,2.3vw,44px)] md:col-span-6 md:pl-[clamp(16px,8.7vw,168px)]">
          <p className="text-[clamp(16px,1.25vw,24px)] leading-[1.2] tracking-tight text-ink/85">{a.teamBody}</p>
        </div>
      </div>
      <ul className="grid grid-cols-12 border-t border-line">
        {a.team.map((m, i) => (
          <Member key={m.name} {...m} i={i} />
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------- partners */

function Partners({ a }: { a: AboutData }) {
  const shapes = ["M0 18 L9 0 L18 18 Z", "M9 1a8 8 0 1 0 0.01 0Z", "M0 0 H18 V18 H0 Z M5 5 H13 V13 H5 Z", "M0 9 Q9 -6 18 9 Q9 24 0 9 Z", "M0 0 H6 V18 H0 Z M12 0 H18 V18 H12 Z"];
  const t = useT().about;
  return (
    <section aria-label={t.partnersAria} className="border-t border-line">
      <div className="grid md:grid-cols-12">
        <div
          aria-hidden="true"
          className="hidden border-r border-line md:col-span-4 md:block"
          style={{ backgroundImage: "radial-gradient(var(--line) 1.2px, transparent 1.2px)", backgroundSize: "9px 9px" }}
        />
        <div className="px-[clamp(16px,8.7vw,168px)] py-[clamp(48px,4vw,80px)] md:col-span-8">
          <p className="t-mono mb-[clamp(16px,1.6vw,30px)] text-ink/70">{t.partnersLabel}</p>
          <h2 className="t-h2">
            {a.partnersTitle.map((l) => (
              <span key={l} className="block">
                {l}
              </span>
            ))}
          </h2>
        </div>
      </div>
      <div className="grid border-t border-line md:grid-cols-12">
        <p className="t-mono px-[clamp(16px,1.75vw,34px)] py-3 md:col-span-8 md:col-start-5 md:px-[clamp(16px,8.7vw,168px)]">{a.partnersLabel}</p>
      </div>
      <div className="overflow-hidden border-t border-line">
        <ul className="tick-marquee">
          {[0, 1].flatMap((k) =>
            a.partners.map((c, i) => (
              <li
                key={`${k}${c}`}
                aria-hidden={k > 0}
                className="flex h-[clamp(70px,6.6vw,120px)] w-[clamp(150px,12.5vw,240px)] shrink-0 items-center justify-center gap-2 border-r border-dashed border-line text-ink/70"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d={shapes[i % shapes.length]} />
                </svg>
                <span className="text-[clamp(11px,0.85vw,15px)] font-bold uppercase tracking-[0.08em]">{c}</span>
              </li>
            )),
          )}
        </ul>
      </div>
    </section>
  );
}

export default function About() {
  const a = useAbout();
  if (!a) return null;
  return (
    <>
      <Hero a={a} />
      <Story a={a} />
      <Team a={a} />
      <Partners a={a} />
    </>
  );
}
