/** Drafting-sheet furniture: tick rulers, "+" registration marks and the cell button. */
import type { ReactNode } from "react";
import LocaleLink from "../LocaleLink";
import PixelFill from "../fx/PixelFill";
import { RollIcon, RollText } from "../fx/Roll";

export function Ruler({ vertical = false, className = "" }: { vertical?: boolean; className?: string }) {
  return <div aria-hidden="true" className={`${vertical ? "ruler-y" : "ruler-x"} pointer-events-none ${className}`} />;
}

export function Plus({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      width="11"
      height="11"
      viewBox="0 0 11 11"
      className={`pointer-events-none absolute text-ink/70 ${className}`}
    >
      <path d="M5.5 0v11M0 5.5h11" stroke="currentColor" />
    </svg>
  );
}

/** Ruler frame on all four sides with + at the corners. */
export function RulerFrame({ sides = "all" }: { sides?: "all" | "x" }) {
  return (
    <>
      <Ruler className="absolute inset-x-4 top-0" />
      <Ruler className="absolute inset-x-4 bottom-0" />
      {sides === "all" && (
        <>
          <Ruler vertical className="absolute inset-y-4 left-0" />
          <Ruler vertical className="absolute inset-y-4 right-0" />
        </>
      )}
      <Plus className="left-[2px] top-[2px]" />
      <Plus className="right-[2px] top-[2px]" />
      <Plus className="bottom-[2px] left-[2px]" />
      <Plus className="bottom-[2px] right-[2px]" />
    </>
  );
}

export function ArrowRight({ className = "" }: { className?: string }) {
  return (
    <svg width="14" height="10" viewBox="0 0 14 10" className={className} aria-hidden="true">
      <path d="M0 5h12.5M8.5 1l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function CellButton({
  href,
  children,
  accent = false,
  className = "",
}: {
  href: string;
  children: ReactNode;
  accent?: boolean;
  className?: string;
}) {
  return (
    <LocaleLink href={href} className={`cell-btn fx t-mono ${accent ? "cell-btn-accent" : ""} ${className}`}>
      <PixelFill color="--ink" />
      <span>
        <RollText>{children}</RollText>
      </span>
      <span>
        <RollIcon>
          <ArrowRight />
        </RollIcon>
      </span>
    </LocaleLink>
  );
}
