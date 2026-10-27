"use client";

import { useState } from "react";
import { fmt } from "@/i18n/config";
import { useT } from "@/i18n/I18nProvider";
import { useHome } from "@/lib/data";
import PlanDrawing from "./PlanDrawing";
import { RulerFrame } from "./Rulers";
import { easeOut, seg, useScrollProgress } from "../fx/useScrollProgress";

const ICONS = [
  <path key="0" d="M2 7l5-5 5 5-5 5z" />,
  <path key="1" d="M2 2h10v10H2zM2 7h10" />,
  <path key="2" d="M2 3h10M2 7h7M2 11h10" />,
  <path key="3" d="M3 7l3 3 6-7" />,
];

function AgentPanel({ points, className = "", style }: { points: string[]; className?: string; style?: React.CSSProperties }) {
  const t = useT().story;
  return (
    <div className={`flex flex-col bg-paper ${className}`} style={style}>
      <div className="flex flex-1 flex-col justify-center px-[clamp(16px,1.9vw,36px)] py-12">
        <h2 className="t-h2">
          {t.panelTitle.map((l, i) => (
            <span key={i} className="block">
              {l}
            </span>
          ))}
        </h2>
        <p className="t-body mt-[clamp(16px,1.6vw,30px)] text-ink/85">{t.panelBody}</p>
      </div>
      <ul>
        {points.map((t, i) => (
          <li key={t} className="flex items-stretch border-t border-line">
            <span className="t-body flex-1 px-[clamp(16px,1.9vw,36px)] py-[clamp(12px,1.1vw,20px)] text-ink">{t}</span>
            <span className="flex w-[clamp(40px,3.6vw,68px)] items-center justify-center border-l border-line text-ink/50">
              <svg width="18" height="18" viewBox="0 0 14 14" fill="none" stroke="currentColor" aria-hidden="true">
                {ICONS[i]}
              </svg>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Pinned scroll sequence: two statements fade through, the floor plan assembles
 * (walls fly in → fill → furniture → dimensions → room pins), then the plan pans left
 * and the summary panel slides in from the right.
 */
export default function Story() {
  const home = useHome();
  const t = useT().story;
  const storyPhrases = home?.storyPhrases ?? [];
  const storySteps = home?.storySteps ?? [];
  const planIssues = home?.planIssues ?? [];
  const agentPoints = home?.agentPoints ?? [];
  const [wrap, p] = useScrollProgress<HTMLElement>("pin");
  const [openIssue, setOpenIssue] = useState<string | null>(null);
  const [resolved, setResolved] = useState<string[]>([]);

  // statements: fade in, hold, fade out
  const phrase = (i: number) => {
    const a = i * 0.1;
    return seg(p, a, a + 0.025) * (1 - seg(p, a + 0.075, a + 0.1));
  };
  const ghost = seg(p, 0.19, 0.21) * (1 - seg(p, 0.26, 0.3)) * 0.14;

  const outline = seg(p, 0.2, 0.34);
  const fill = seg(p, 0.34, 0.42);
  const furniture = seg(p, 0.42, 0.52);
  const dims = seg(p, 0.52, 0.6);
  const issuesOn = p > 0.62;
  const panel = easeOut(seg(p, 0.74, 0.9));
  const step = p < 0.36 ? 0 : p < 0.5 ? 1 : p < 0.62 ? 2 : 3;
  const cardOn = p > 0.2;
  const bar = seg(p, 0.2, 0.74);

  const issue = planIssues.find((i) => i.id === openIssue);

  if (!home) return null;

  return (
    <>
      <section ref={wrap} className="relative h-[700svh] border-t border-line" aria-label={t.aria}>
        <div className="sticky top-0 h-svh overflow-hidden">
          {/* plan stage; narrows as the panel comes in */}
          <div className="absolute inset-y-0 left-0 md:right-[calc(100%/3*var(--k))]" style={{ "--k": panel } as React.CSSProperties}>
            <RulerFrame />

            {storyPhrases.map((t, i) => (
              <p
                key={t}
                className="t-statement absolute inset-x-4 top-1/2 -translate-y-1/2 text-center"
                style={{ opacity: phrase(i), filter: `blur(${(1 - phrase(i)) * 6}px)` }}
              >
                {t}
              </p>
            ))}
            <p aria-hidden="true" className="t-statement absolute inset-x-4 top-1/2 -translate-y-1/2 text-center" style={{ opacity: ghost }}>
              {storyPhrases[1]}
            </p>

            <div className="absolute inset-0 flex items-center justify-center p-[clamp(24px,3vw,56px)]">
              <div className="relative h-full max-h-190 w-auto" style={{ aspectRatio: "640 / 720", opacity: outline > 0 ? 1 : 0 }}>
                <PlanDrawing outline={outline} fill={fill} furniture={furniture} dims={dims} className="size-full" />

                {planIssues.map((it, k) => {
                  const shown = issuesOn && p > 0.62 + k * 0.03;
                  const done = resolved.includes(it.id);
                  return (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => setOpenIssue(openIssue === it.id ? null : it.id)}
                      aria-label={`${it.room}: ${it.title}`}
                      aria-expanded={openIssue === it.id}
                      tabIndex={shown ? 0 : -1}
                      className={`t-mono-xs absolute grid size-[clamp(26px,2.2vw,40px)] -translate-x-1/2 -translate-y-1/2 place-items-center text-white transition-all duration-500 ${done ? "bg-ink" : "bg-accent/85 hover:bg-accent"} ${shown ? "scale-100 opacity-100" : "pointer-events-none scale-50 opacity-0"}`}
                      style={{ left: `${it.x}%`, top: `${it.y}%` }}
                    >
                      {done ? "✓" : it.n}
                      {!done && openIssue !== it.id && k === 1 && shown && (
                        <span className="absolute -top-7 left-1/2 h-5 w-px -translate-x-1/2 bg-accent after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:border-x-4 after:border-t-[6px] after:border-x-transparent after:border-t-accent after:content-['']" />
                      )}
                    </button>
                  );
                })}

                {issue && (
                  <div
                    role="dialog"
                    aria-label={`${issue.room} ${issue.title}`}
                    className="absolute z-10 w-[clamp(220px,17vw,320px)] border border-ink bg-paper shadow-[0_5px_0_var(--ink)]"
                    style={{ left: `${Math.min(issue.x, 55)}%`, top: `${issue.y + 5}%` }}
                  >
                    <div className="t-mono-xs flex justify-between bg-ink px-2.5 py-2 text-paper">
                      {issue.room}
                      <button type="button" onClick={() => setOpenIssue(null)} aria-label={t.close} className="hover:text-accent">
                        ×
                      </button>
                    </div>
                    <div className="p-3 text-[clamp(10px,0.75vw,14px)] leading-snug">
                      <p className="t-mono-xs text-accent">{fmt(t.roomNo, { n: issue.n })}</p>
                      <p className="mt-1 text-[clamp(12px,0.95vw,18px)] font-bold uppercase leading-tight">
                        {fmt(t.issueHeading, { title: issue.title, number: issue.room.replace(/^\D+/, "") })}
                      </p>
                      <p className="mt-1.5 text-ink/70">{issue.text}</p>
                      <div className="mt-3 bg-paper-2 p-2.5">
                        <p className="t-mono-xs mb-1">{t.priceExtras}</p>
                        <ul className="space-y-0.5 text-ink/75">
                          {issue.fix.map((f) => (
                            <li key={f}>• {f}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="t-mono-xs mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setResolved((r) => [...r, issue.id]);
                            setOpenIssue(null);
                          }}
                          className="flex-1 bg-accent py-2 text-white transition-colors hover:bg-ink"
                        >
                          {t.shortlist}
                        </button>
                        <button
                          type="button"
                          onClick={() => setOpenIssue(null)}
                          className="flex-1 border border-line py-2 transition-colors hover:border-ink"
                        >
                          {t.close}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* intro card */}
            <div
              className="absolute bottom-[clamp(20px,2.3vw,44px)] left-[clamp(16px,2.3vw,34px)] w-[clamp(220px,16.2vw,310px)] border border-line bg-paper transition-all duration-500"
              style={{ opacity: cardOn ? 1 : 0, transform: cardOn ? "none" : "translateY(12px)" }}
            >
              <p className="t-mono-xs bg-ink px-2.5 py-2 font-bold text-paper">{t.intro}</p>
              <div className="p-2.5">
                {step < 3 && (
                  <p key={step} className="t-body animate-[fade_.5s_ease] text-ink/85">
                    {storySteps[step]}
                  </p>
                )}
                <p className="t-mono-xs mt-3 text-ink/40">
                  {step < 3
                    ? t.scroll
                    : resolved.length === planIssues.length
                      ? t.allShortlisted
                      : storySteps[3]}
                </p>
              </div>
              <div className="h-1 bg-paper-2">
                <div className="h-full bg-ink" style={{ width: `${bar * 100}%` }} />
              </div>
            </div>
          </div>

          {/* summary panel slides in from the right */}
          <AgentPanel
            points={agentPoints}
            className="absolute inset-y-0 right-0 hidden w-1/3 border-l border-line md:flex"
            style={{ transform: `translateX(${(1 - panel) * 101}%)` }}
          />
        </div>
      </section>
      {/* on small screens the panel follows the story instead of sliding in */}
      <AgentPanel points={agentPoints} className="border-t border-line md:hidden" />
    </>
  );
}
