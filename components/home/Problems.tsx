"use client";

import { useT } from "@/i18n/I18nProvider";
import { useHome } from "@/lib/data";
import { IsoIcon } from "./Illustrations";
import { Plus } from "./Rulers";
import Reveal from "../Reveal";

const px = "px-[clamp(16px,2.3vw,44px)]";

export default function Problems() {
  const problems = useHome()?.problems;
  const t = useT().problems;
  if (!problems) return null;

  return (
    <section className="border-t border-line">
      <div className={`flex flex-col justify-between gap-6 ${px} py-[clamp(24px,2.3vw,44px)] md:flex-row md:items-end`}>
        <Reveal>
          <p className="t-mono mb-[clamp(16px,1.6vw,30px)]">{t.label}</p>
          <h2 className="t-h2">
            {t.title[0]}
            <br />
            {t.title[1]}
          </h2>
        </Reveal>
        <Reveal delay={150}>
          <p className="t-body max-w-[clamp(260px,23vw,440px)] text-ink/85 md:mb-[clamp(60px,5.5vw,100px)]">
            {t.body}
          </p>
        </Reveal>
      </div>
      <div className="grid border-t border-line sm:grid-cols-2 lg:grid-cols-4">
        {problems.map((p, i) => (
          <article key={p.key} className="group flex flex-col border-b border-line sm:border-r lg:border-b-0 lg:last:border-r-0">
            <div className="t-mono flex items-center justify-between border-b border-dashed border-line px-[clamp(16px,1.75vw,34px)] py-[clamp(10px,0.9vw,16px)]">
              <span className="flex items-center gap-2">
                <span className="size-2 scale-0 bg-accent transition-transform duration-300 group-hover:scale-100" />
                {p.key}
              </span>
              <span className="text-ink/40">[{String(i + 1).padStart(2, "0")}]</span>
            </div>
            <div className="relative h-[clamp(200px,20.8vw,400px)] border-b border-dashed border-line">
              <div className="sq-grid absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-50" />
              <Plus className="left-3 top-3 opacity-0 transition-opacity group-hover:opacity-100" />
              <Plus className="right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100" />
              <Plus className="bottom-3 left-3 opacity-0 transition-opacity group-hover:opacity-100" />
              <Plus className="bottom-3 right-3 opacity-0 transition-opacity group-hover:opacity-100" />
              <Reveal delay={i * 120} className="absolute inset-0">
                <IsoIcon n={i as 0 | 1 | 2 | 3} className="absolute inset-0 m-auto h-[62%] w-auto" />
              </Reveal>
            </div>
            <Reveal delay={i * 120 + 80} className="flex flex-1 flex-col justify-between gap-10 px-[clamp(16px,1.75vw,34px)] py-[clamp(16px,1.75vw,34px)]">
              <h3 className="t-h3">
                {p.title.map((t) => (
                  <span key={t} className="block">
                    {t}
                  </span>
                ))}
              </h3>
              <p className="t-body text-ink/80">{p.text}</p>
            </Reveal>
          </article>
        ))}
      </div>
    </section>
  );
}
