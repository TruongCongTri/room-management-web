"use client";

import { useState } from "react";
import { useT } from "@/i18n/I18nProvider";
import { useHome } from "@/lib/data";
import { ArrowRight } from "./Rulers";

const VISIBLE = 6; // one per column of the half it sits in

/** Simple geometric wordmarks so the partner row reads like a logo strip. */
function Wordmark({ name, i }: { name: string; i: number }) {
  const shapes = [
    <path key="a" d="M0 18 L9 0 L18 18 Z" />,
    <circle key="b" cx="9" cy="9" r="8" />,
    <path key="c" d="M0 0 H18 V18 H0 Z M5 5 H13 V13 H5 Z" />,
    <path key="d" d="M0 9 Q9 -6 18 9 Q9 24 0 9 Z" />,
    <path key="e" d="M0 0 H6 V18 H0 Z M12 0 H18 V18 H12 Z" />,
  ];
  return (
    <span className="flex flex-col items-center gap-2 text-ink/75">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        {shapes[i % shapes.length]}
      </svg>
      <span className="whitespace-nowrap text-[clamp(9px,0.66vw,12px)] font-bold uppercase tracking-[0.06em]">{name}</span>
    </span>
  );
}

export default function Clients() {
  const [start, setStart] = useState(0);
  const partners = useHome()?.partners;
  const t = useT().clients;
  const names = partners?.names ?? [];
  const n = names.length;
  const shown = n ? Array.from({ length: Math.min(VISIBLE, n) }, (_, k) => names[(start + k) % n]) : [];

  if (!partners) return null;

  return (
    <div className="border-t border-line">
      <div className="flex items-stretch border-b border-line">
        <h3 className="t-mono flex flex-1 items-center px-[clamp(16px,1.75vw,34px)]">{t.title}</h3>
        <button
          type="button"
          aria-label={t.prev}
          onClick={() => setStart((s) => (s - 1 + n) % n)}
          className="flex size-[clamp(36px,2.6vw,50px)] items-center justify-center border-l border-line transition-colors hover:bg-ink hover:text-paper"
        >
          <ArrowRight className="rotate-180" />
        </button>
        <button
          type="button"
          aria-label={t.next}
          onClick={() => setStart((s) => (s + 1) % n)}
          className="flex size-[clamp(36px,2.6vw,50px)] items-center justify-center border-l border-line transition-colors hover:bg-ink hover:text-paper"
        >
          <ArrowRight />
        </button>
      </div>
      <ul className="grid grid-cols-3 sm:grid-cols-6">
        {shown.map((c, k) => (
          <li
            key={`${start}-${k}`}
            className={`flex h-[clamp(70px,6.6vw,120px)] items-center justify-center border-dashed border-line animate-[fade_.5s_ease] ${k < VISIBLE - 1 ? "border-r" : ""} ${k > 2 ? "hidden sm:flex" : ""}`}
          >
            <Wordmark name={c} i={(start + k) % n} />
          </li>
        ))}
      </ul>
      <p className="t-mono-xs border-t border-line px-[clamp(16px,1.75vw,34px)] py-2 text-ink/70">
        {partners.note}
      </p>
    </div>
  );
}
