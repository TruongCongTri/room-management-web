"use client";

import { useT } from "@/i18n/I18nProvider";
import { useHome } from "@/lib/data";
import Building from "./Building";
import PlanDrawing from "./PlanDrawing";
import { Plus } from "./Rulers";
import { clamp01, useScrollProgress } from "../fx/useScrollProgress";

const px = "px-[clamp(16px,2.3vw,44px)]";
const SLOT = 80; // svh between consecutive drawings

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto w-[78%] max-w-[560px] py-10">
      <div className="sq-grid pointer-events-none absolute -inset-6 opacity-40" />
      <Plus className="-left-6 -top-6" />
      <Plus className="-right-6 -top-6" />
      <Plus className="-bottom-6 -left-6" />
      <Plus className="-bottom-6 -right-6" />
      <div className="relative">{children}</div>
    </div>
  );
}

function Callout({ code, text, className, faded = false }: { code: string; text: string; className: string; faded?: boolean }) {
  return (
    <div className={`absolute w-[clamp(120px,11vw,210px)] bg-accent p-[clamp(8px,0.75vw,14px)] text-white ${faded ? "opacity-55" : ""} ${className}`}>
      <span className="absolute right-1.5 top-1.5 grid size-3 place-items-center border border-white text-[8px] leading-none">×</span>
      <p className="t-mono-xs opacity-80">{code}</p>
      <p className="mt-1 text-[clamp(11px,0.9vw,17px)] font-bold uppercase leading-[0.95]">{text}</p>
    </div>
  );
}

function StepArt({ i }: { i: number }) {
  const t = useT().whyUs;
  const c = t.callouts;
  if (i === 0)
    return (
      <Frame>
        <Building variant="render" idPrefix="why0" className="w-full" />
        <Callout code={c.letCode} text={c.letText} className="left-[4%] top-[14%]" faded />
        <Callout code={c.freeCode} text={c.freeText} className="left-[38%] top-[56%]" />
      </Frame>
    );
  if (i === 1)
    return (
      <Frame>
        <PlanDrawing className="w-[70%]" dims={0} />
        <Callout code={c.viewingCode} text={c.viewingText} className="left-[34%] top-[30%]" />
        <div className="absolute bottom-[4%] right-0 w-[56%] border border-ink bg-paper shadow-[0_4px_0_var(--ink)]">
          <div className="t-mono-xs bg-ink px-2 py-1.5 text-paper">{t.viewing.title}</div>
          <div className="p-2.5 text-[clamp(9px,0.7vw,13px)] leading-snug">
            <p className="t-mono-xs text-accent">{t.viewing.booking}</p>
            <p className="mt-1 font-bold uppercase">{t.viewing.room}</p>
            <p className="mt-1 text-ink/60">{t.viewing.when}</p>
            <div className="mt-2 bg-paper-2 p-2">
              <p className="t-mono-xs">{t.viewing.alsoTitle}</p>
              <p className="text-ink/70">{t.viewing.also}</p>
            </div>
          </div>
        </div>
      </Frame>
    );
  if (i === 2)
    return (
      <Frame>
        <div className="space-y-3">
          {t.documents.map((doc, k) => (
            <div key={doc} className={`border bg-paper ${k === 1 ? "border-accent" : "border-line"}`}>
              <PlanDrawing className="mx-auto h-[clamp(70px,7vw,130px)] w-auto py-2" dims={0} furniture={k === 1 ? 1 : 0.3} />
              <div className="t-mono-xs flex items-center justify-between border-t border-line px-2 py-1.5">
                <span className="text-[clamp(10px,0.8vw,15px)] font-bold">{doc.toUpperCase()}</span>
                {k === 1 && <span className="grid size-4 place-items-center border border-accent text-accent">✓</span>}
              </div>
            </div>
          ))}
        </div>
        <div className="t-mono-xs absolute -bottom-2 left-0 bg-ink/70 px-2 py-1 text-paper">{t.signing}</div>
      </Frame>
    );
  const nodes = [
    [120, 180], [250, 320], [470, 300], [500, 430], [140, 560], [320, 600], [480, 600], [380, 140], [90, 420],
  ];
  return (
    <Frame>
      <PlanDrawing className="w-[80%] opacity-80" dims={0} furniture={0.4}>
        <g stroke="var(--accent)" strokeDasharray="4 4" strokeWidth="1.2">
          {nodes.map(([x, y], k) => {
            const [x2, y2] = nodes[(k * 4 + 3) % nodes.length];
            return <line key={k} x1={x} y1={y} x2={x2} y2={y2} />;
          })}
        </g>
        {nodes.map(([x, y]) => (
          <g key={`${x}${y}`}>
            <rect x={x - 9} y={y - 9} width="18" height="18" fill="var(--accent)" />
            <rect x={x - 3} y={y - 3} width="6" height="6" fill="#fff" />
          </g>
        ))}
      </PlanDrawing>
      <div className="absolute bottom-[8%] left-[4%] w-[46%] border border-ink bg-paper shadow-[0_4px_0_var(--ink)]">
        <div className="t-mono-xs bg-ink px-2 py-1.5 text-paper">{t.monthTitle}</div>
        <ul className="t-mono-xs space-y-1 p-2.5 text-ink/80">
          {t.monthItems.map((item, k) => (
            <li key={k}>{item}</li>
          ))}
        </ul>
      </div>
    </Frame>
  );
}

function Bar({ k, text }: { k: string; text: string }) {
  return (
    <div className="flex items-center gap-[clamp(16px,5.5vw,110px)] bg-ink px-[clamp(16px,1.4vw,26px)] py-[clamp(10px,0.9vw,16px)] text-paper">
      <span key={k} className="t-h3 w-[clamp(90px,8vw,150px)] animate-[fade_.5s_ease]">
        {k}
      </span>
      <span key={text} className="t-body flex-1 animate-[fade_.5s_ease] !text-paper/90">
        {text}
      </span>
      <span className="size-2 bg-accent" />
    </div>
  );
}

export default function WhyUs() {
  const whySteps = useHome()?.whySteps ?? [];
  const t = useT().whyUs;
  const [wrap, p] = useScrollProgress<HTMLDivElement>("pin");
  const n = Math.max(1, whySteps.length);
  // the drawings track scroll; the active step is the one crossing the centre line
  const pos = clamp01(p) * (n - 1);
  const active = Math.min(n - 1, Math.round(pos));
  const barRight = active % 2 === 0; // drawing on the left, bar on the right
  const s = whySteps[active];

  if (!s) return null;

  return (
    <section className="border-t border-line">
      <div className="grid md:grid-cols-12">
        <div className={`${px} pb-[clamp(24px,2.3vw,44px)] pt-[clamp(80px,8vw,150px)] md:col-span-8 md:border-r md:border-line`}>
          <p className="t-mono mb-[clamp(16px,1.6vw,30px)]">{t.label}</p>
          <h2 className="t-h2 !text-[clamp(30px,3vw,58px)]">
            {t.title[0]}
            <br />
            {t.title[1]}
          </h2>
        </div>
        <div className="flex flex-col justify-end gap-6 px-[clamp(16px,1.9vw,36px)] pb-[clamp(24px,2.3vw,44px)] md:col-span-4">
          <p className="t-body text-ink/85">{t.body}</p>
          <p className="t-mono text-ink/40">{t.scroll}</p>
        </div>
      </div>

      {/* pinned stage (desktop) */}
      <div ref={wrap} className="relative hidden border-t border-line md:block" style={{ height: `${(n + 1) * 70}svh` }}>
        <div className="sticky top-0 h-svh overflow-hidden">
          <div aria-hidden="true" className="absolute inset-y-0 left-1/2 w-px bg-line" />
          {whySteps.map((step, i) => {
            const left = i % 2 === 0;
            const y = (i - pos) * SLOT;
            return (
              <div
                key={step.key}
                className={`absolute top-1/2 w-1/2 ${left ? "left-0" : "left-1/2"}`}
                style={{ transform: `translateY(calc(-50% + ${y}svh))`, opacity: 1 - Math.min(1, Math.abs(i - pos) * 0.55) }}
              >
                <StepArt i={i} />
              </div>
            );
          })}

          {/* accent guide across the active drawing */}
          <div
            aria-hidden="true"
            className="absolute top-1/2 h-px w-1/2 bg-accent/70 transition-[left] duration-700 ease-[cubic-bezier(.23,1,.32,1)]"
            style={{ left: barRight ? "0%" : "50%" }}
          />
          {/* the bar, locked to the centre line */}
          <div
            className="absolute top-1/2 w-1/2 -translate-y-1/2 px-[clamp(16px,1.75vw,34px)] transition-[left] duration-700 ease-[cubic-bezier(.23,1,.32,1)]"
            style={{ left: barRight ? "50%" : "0%" }}
          >
            <Bar k={s.key} text={s.text} />
          </div>
        </div>
      </div>

      {/* stacked steps (mobile) */}
      <div className="md:hidden">
        {whySteps.map((step, i) => (
          <div key={step.key} className="border-t border-line py-10">
            <div className="px-4 pb-8">
              <Bar k={step.key} text={step.text} />
            </div>
            <StepArt i={i} />
          </div>
        ))}
      </div>
    </section>
  );
}
