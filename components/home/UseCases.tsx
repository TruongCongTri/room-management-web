"use client";

import { useState } from "react";
import { useT } from "@/i18n/I18nProvider";
import { useHome } from "@/lib/data";
import Building from "./Building";
import PlanDrawing from "./PlanDrawing";
import { Civic, Colonnade, Tower } from "./Illustrations";

const shape = "absolute";
const circle = `${shape} aspect-square rounded-full`;

/** One collage per resident type: accent geometry layered with a drawing, like a poster. */
function Art({ i }: { i: number }) {
  switch (i) {
    case 0:
      return (
        <>
          <div className={`${circle} left-[5%] top-[6%] w-[38%] bg-accent`} />
          <div className={`${shape} left-[64%] top-0 h-[38%] w-[24%] bg-accent/90`} />
          <div className={`${circle} left-[11%] top-[38%] w-[26%] bg-paper-2`} />
          <Colonnade id="uc0" className="absolute inset-x-0 bottom-0 w-full" />
        </>
      );
    case 1:
      return (
        <>
          <div className={`${shape} left-0 top-0 h-full w-[30%] bg-accent`} />
          <div className={`${circle} right-[6%] top-[8%] w-[22%] bg-paper-2`} />
          <div className="absolute inset-[8%] rotate-[-6deg] border border-line bg-paper p-4 shadow-[8px_8px_0_var(--ink)]">
            <PlanDrawing className="size-full" dims={0.6}>
              <rect x="434" y="264" width="132" height="106" fill="var(--accent)" opacity="0.85" style={{ mixBlendMode: "multiply" }} />
            </PlanDrawing>
          </div>
        </>
      );
    case 2:
      return (
        <>
          <div className={`${circle} right-[-10%] top-[4%] w-[70%] bg-accent`} />
          <Tower id="uc2" reveal={1} className="absolute inset-0 size-full" />
        </>
      );
    case 3:
      return (
        <>
          <div className={`${circle} bottom-[-30%] left-1/2 w-[90%] -translate-x-1/2 bg-accent/90`} />
          <div className={`${shape} left-[8%] top-[10%] h-[16%] w-[16%] bg-paper-2`} />
          <Civic id="uc3" reveal={1} className="absolute inset-x-[4%] top-[14%] w-[92%]" />
        </>
      );
    case 4:
      return (
        <>
          <div className={`${circle} right-[8%] top-[6%] w-[30%] bg-accent`} />
          <div className={`${shape} bottom-0 left-0 h-[30%] w-full bg-paper-2`} />
          <Building variant="render" idPrefix="uc4" className="absolute inset-x-0 top-[24%] w-full scale-[1.25]" />
        </>
      );
    case 5:
      return (
        <>
          <div className={`${shape} left-[38%] top-[6%] h-[44%] w-[12%] bg-accent`} />
          <div className={`${shape} left-[22%] top-[20%] h-[12%] w-[44%] bg-accent`} />
          <div className={`${circle} left-[6%] top-[4%] w-[28%] bg-paper-2`} />
          <Colonnade id="uc5" className="absolute inset-x-0 bottom-0 w-full -scale-x-100" />
        </>
      );
    case 6: {
      const nodes = [[120, 180], [250, 320], [470, 300], [500, 430], [140, 560], [320, 600], [480, 600], [380, 140]];
      return (
        <>
          <div className={`${circle} left-[-12%] top-[-12%] w-[56%] bg-accent`} />
          <PlanDrawing className="absolute inset-[10%] size-[80%] opacity-90" dims={0} furniture={0.4}>
            <g stroke="var(--accent)" strokeDasharray="4 4" strokeWidth="1.4">
              {nodes.map(([x, y], k) => {
                const [x2, y2] = nodes[(k * 3 + 2) % nodes.length];
                return <line key={k} x1={x} y1={y} x2={x2} y2={y2} />;
              })}
            </g>
            {nodes.map(([x, y]) => (
              <rect key={`${x}${y}`} x={x - 9} y={y - 9} width="18" height="18" fill="var(--accent)" />
            ))}
          </PlanDrawing>
        </>
      );
    }
    default:
      return (
        <>
          <div className={`${shape} bottom-0 left-0 h-[46%] w-[46%] bg-accent`} />
          <div className={`${circle} right-[6%] top-[8%] w-[34%] bg-paper-2`} />
          <div className="absolute inset-0 overflow-hidden">
            <Building variant="render" idPrefix="uc7" className="absolute left-[-60%] top-[10%] w-[190%]" />
          </div>
        </>
      );
  }
}

export default function UseCases() {
  const useCases = useHome()?.useCases ?? [];
  const t = useT().useCases;
  const [open, setOpen] = useState(0);

  if (!useCases.length) return null;

  return (
    <section className="grid border-t border-line md:grid-cols-2">
      <div className="relative aspect-square overflow-hidden border-b border-line md:border-b-0 md:border-r">
        {useCases.map((u, i) => (
          <div
            key={u.title}
            aria-hidden={open !== i}
            className="absolute inset-0 transition-[opacity,transform] duration-700 ease-[cubic-bezier(.23,1,.32,1)]"
            style={{ opacity: open === i ? 1 : 0, transform: open === i ? "none" : "scale(1.04)" }}
          >
            <Art i={i} />
          </div>
        ))}
      </div>

      <div className="flex flex-col">
        <div className="px-[clamp(16px,8.7vw,168px)] pb-12 pt-[clamp(32px,2.3vw,44px)] pr-[clamp(16px,2vw,40px)]">
          <p className="t-mono mb-[clamp(16px,1.6vw,30px)]">{t.label}</p>
          <h2 className="t-h2 !text-[clamp(30px,3vw,58px)]">
            {t.title.map((l, i) => (
              <span key={i} className="block">
                {l}
              </span>
            ))}
          </h2>
        </div>
        <ul className="mt-auto border-t border-line">
          {useCases.map((u, i) => {
            const on = open === i;
            return (
              <li key={u.title} className="border-b border-dashed border-line last:border-b-0">
                <button
                  type="button"
                  aria-expanded={on}
                  onClick={() => setOpen(i)}
                  className="group flex w-full items-start justify-between gap-4 px-[clamp(16px,8.7vw,168px)] py-[clamp(12px,1.1vw,20px)] pr-[clamp(16px,2vw,40px)] text-left"
                >
                  <span className="min-w-0">
                    <span className={`t-h3 block !text-[clamp(18px,1.55vw,30px)] transition-colors group-hover:text-accent ${on ? "text-ink" : ""}`}>
                      {u.title}
                    </span>
                    <span
                      className="grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(.23,1,.32,1)]"
                      style={{ gridTemplateRows: on ? "1fr" : "0fr" }}
                    >
                      <span className="overflow-hidden">
                        <span
                          className="t-body block pt-1 transition-opacity duration-500"
                          style={{ opacity: on ? 1 : 0 }}
                        >
                          {u.text}
                        </span>
                      </span>
                    </span>
                  </span>
                  <span aria-hidden="true" className="relative mt-[0.4em] size-3 shrink-0 text-ink/40">
                    <span className="absolute inset-x-0 top-1/2 h-px bg-current" />
                    <span
                      className="absolute inset-y-0 left-1/2 w-px bg-current transition-transform duration-500"
                      style={{ transform: on ? "scaleY(0)" : "none" }}
                    />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
