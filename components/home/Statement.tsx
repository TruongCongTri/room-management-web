"use client";

import { useT } from "@/i18n/I18nProvider";
import { useHome } from "@/lib/data";
import Clients from "./Clients";
import { Tower } from "./Illustrations";
import { CellButton } from "./Rulers";
import { seg, useScrollProgress } from "../fx/useScrollProgress";

/** Tower drawing that inks in as you scroll, beside a statement that resolves word by word. */
export default function Statement() {
  const statement = useHome()?.statement ?? "";
  const WORDS = statement.split(" ");
  const [ref, p] = useScrollProgress<HTMLElement>("pass");
  const reveal = seg(p, 0.16, 0.5);
  const t = useT().statement;

  return (
    <section ref={ref} id="discover" className="grid scroll-mt-4 border-t border-line md:grid-cols-2">
      <div className="relative border-b border-line md:border-b-0 md:border-r">
        <Tower reveal={reveal} className="block size-full" />
      </div>
      <div className="flex flex-col">
        <div className="flex flex-1 flex-col justify-center gap-[clamp(20px,2vw,36px)] px-[clamp(16px,8.7vw,168px)] py-16 pr-[clamp(16px,4vw,80px)]">
          <p className="t-h2 !text-[clamp(26px,2.5vw,48px)]" aria-label={statement}>
            {WORDS.map((w, i) => {
              const a = 0.14 + (i / WORDS.length) * 0.26;
              const o = 0.12 + 0.88 * seg(p, a, a + 0.05);
              return (
                <span key={i} aria-hidden="true" style={{ opacity: o }}>
                  {w}{" "}
                </span>
              );
            })}
          </p>
          <CellButton href="/featured-products" className="self-start">
            {t.cta}
          </CellButton>
        </div>
        <Clients />
      </div>
    </section>
  );
}
