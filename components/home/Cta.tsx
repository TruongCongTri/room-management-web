"use client";

import { Civic } from "./Illustrations";
import { CellButton } from "./Rulers";
import { seg, useScrollProgress } from "../fx/useScrollProgress";
import { useSite } from "@/lib/data";

// column spans on the site's twelve-column grid (written out in full so Tailwind generates them):
// 3 + 6 + 3 on most pages, 2 + 8 + 2 to match the rooms page
const LAYOUT = {
  home: {
    top: "grid-cols-12",
    row: "md:grid-cols-12",
    topSide: "col-span-3",
    topMid: "col-span-6",
    side: "md:col-span-3",
    mid: "md:col-span-6",
  },
  sixths: {
    top: "grid-cols-12",
    row: "md:grid-cols-12",
    topSide: "col-span-2",
    topMid: "col-span-8",
    side: "md:col-span-2",
    mid: "md:col-span-8",
  },
};

export default function Cta({ cols = "home" }: { cols?: keyof typeof LAYOUT }) {
  const L = LAYOUT[cols];
  const [ref, p] = useScrollProgress<HTMLElement>("pass");
  const reveal = seg(p, 0.42, 0.7);
  const cta = useSite()?.cta;

  return (
    <section ref={ref} className="border-t border-line">
      <div aria-hidden="true" className={`grid h-[clamp(80px,11vw,200px)] ${L.top}`}>
        <div className={`relative border-r border-dashed border-line ${L.topSide}`}>
          <span className="t-mono-xs absolute bottom-2 left-2 text-ink/60">[0,246]</span>
        </div>
        <div className={`relative border-r border-dashed border-line ${L.topMid}`}>
          <span className="t-mono-xs absolute left-2 top-2 text-ink/60">[831,0]</span>
        </div>
        <div className={`relative ${L.topSide}`}>
          <span className="t-mono-xs absolute left-2 top-2 text-ink/60">[2303,0]</span>
        </div>
      </div>
      <div className={`grid border-t border-dashed border-line ${L.row}`}>
        <div className={`relative hidden border-r border-dashed border-line md:block ${L.side}`}>
          <span className="t-mono-xs absolute bottom-3 left-2 text-ink/60">[0,544]</span>
        </div>
        <div className={`border-dashed border-line px-4 py-[clamp(24px,2vw,40px)] text-center md:border-r ${L.mid}`}>
          <h2 className="t-h2 !text-[clamp(30px,3vw,58px)]">
            {cta?.title.map((l) => (
              <span key={l} className="block">
                {l}
              </span>
            ))}
          </h2>
          <p className="t-body mt-4">{cta?.body}</p>
          {cta && (
            <CellButton href={cta.button.href} accent className="mt-[clamp(20px,2.3vw,44px)]">
              {cta.button.label}
            </CellButton>
          )}
        </div>
        <div className={`hidden md:block ${L.side}`} />
      </div>
      <div className={`grid border-t border-dashed border-line ${L.row}`}>
        <div className={`hidden border-r border-dashed border-line md:block ${L.side}`} />
        <div className={`border-dashed border-line px-4 py-6 md:border-r ${L.mid}`}>
          <Civic reveal={reveal} className="mx-auto w-full max-w-[640px]" />
        </div>
        <div className={`hidden md:block ${L.side}`} />
      </div>
    </section>
  );
}
