"use client";

import { useState } from "react";
import { useT } from "@/i18n/I18nProvider";
import { useRooms } from "@/lib/data";

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const faqs = useRooms()?.faqs;
  const t = useT().faq;
  if (!faqs) return null;
  return (
    <section id="faq" aria-label={t.aria} className="scroll-mt-4 grid border-t border-line md:grid-cols-6">
      <div
        className="border-b border-line px-[clamp(16px,2.3vw,44px)] py-[clamp(24px,2.3vw,44px)] md:col-span-2 md:border-b-0 md:border-r"
        style={{ backgroundImage: "radial-gradient(var(--line) 1px, transparent 1px)", backgroundSize: "6px 6px" }}
      >
        <p className="t-mono mb-[clamp(16px,1.6vw,30px)]">{t.label}</p>
        <h2 className="t-h2">
          {t.title.map((l, i) => (
            <span key={i} className="block">
              {l}
            </span>
          ))}
        </h2>
      </div>
      <ul className="md:col-span-4">
        {faqs.map(({ q, a }, i) => {
          const on = open === i;
          return (
            <li key={q} className="border-b border-dashed border-line last:border-b-0">
              <button
                type="button"
                aria-expanded={on}
                onClick={() => setOpen(on ? null : i)}
                className="group flex w-full items-start justify-between gap-4 px-[clamp(16px,1.75vw,34px)] py-[clamp(14px,1.3vw,24px)] text-left"
              >
                <span className="min-w-0">
                  <span className="t-h3 block text-[clamp(17px,1.4vw,27px)]! transition-colors group-hover:text-accent">{q}</span>
                  <span className="grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(.23,1,.32,1)]" style={{ gridTemplateRows: on ? "1fr" : "0fr" }}>
                    <span className="overflow-hidden">
                      <span className="t-body block max-w-[44em] pt-2 transition-opacity duration-500" style={{ opacity: on ? 1 : 0 }}>
                        {a}
                      </span>
                    </span>
                  </span>
                </span>
                <span aria-hidden="true" className="relative mt-[0.4em] size-3 shrink-0 text-ink/40">
                  <span className="absolute inset-x-0 top-1/2 h-px bg-current" />
                  <span className="absolute inset-y-0 left-1/2 w-px bg-current transition-transform duration-500" style={{ transform: on ? "scaleY(0)" : "none" }} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
