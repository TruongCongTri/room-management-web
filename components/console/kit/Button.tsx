"use client";

import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";
import { useHydrated } from "@/lib/useHydrated";
import LocaleLink from "../../LocaleLink";
import PixelFill from "../../fx/PixelFill";
import { RollIcon, RollText } from "../../fx/Roll";

/**
 * The site's buttons (pixel-fill hover, rolling label) for actions. Variants follow the site: outline, solid
 * (ink), accent (the one main action of a screen) and danger (destructive: outline in accent, fills accent).
 */
type Variant = "outline" | "solid" | "accent" | "danger" | "ghost";
type Size = "md" | "sm";

const VARIANT: Record<Variant, string> = {
  outline: "",
  solid: "btn-solid",
  accent: "btn-accent",
  danger: "border-accent! text-accent hover:text-white",
  ghost: "border-transparent! hover:text-white",
};
const FILL: Record<Variant, string> = { outline: "--ink", solid: "--accent", accent: "--ink", danger: "--accent", ghost: "--ink" };
const SIZE: Record<Size, string> = { md: "", sm: "h-9! px-3! text-[11px]! gap-2!" };

export function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg className={`arrow ${className}`} width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M1 7h11M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

type Common = { variant?: Variant; size?: Size; arrow?: boolean; busy?: boolean; className?: string; children: ReactNode };

function Inner({ variant = "outline", arrow, busy, children }: Pick<Common, "variant" | "arrow" | "busy" | "children">) {
  return (
    <>
      <PixelFill color={FILL[variant]} />
      <RollText>{children}</RollText>
      {busy ? (
        <span aria-hidden="true" className="spin-slow inline-block size-3 border border-current border-t-transparent" />
      ) : (
        arrow && (
          <RollIcon>
            <Arrow />
          </RollIcon>
        )
      )}
    </>
  );
}

export function Btn({ variant = "outline", size = "md", arrow, busy, className = "", children, disabled, type = "button", ...rest }: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  const hydrated = useHydrated();
  return (
    <button
      type={type}
      disabled={disabled || busy || (type === "submit" && !hydrated)}
      aria-busy={busy || undefined}
      className={`btn fx ${VARIANT[variant]} ${SIZE[size]} disabled:pointer-events-none disabled:opacity-45 ${className}`}
      {...rest}
    >
      <Inner variant={variant} arrow={arrow} busy={busy}>
        {children}
      </Inner>
    </button>
  );
}

export function LinkBtn({ variant = "outline", size = "md", arrow = true, className = "", children, ...rest }: Common & Omit<ComponentProps<typeof LocaleLink>, "className" | "children">) {
  return (
    <LocaleLink className={`btn fx ${VARIANT[variant]} ${SIZE[size]} ${className}`} {...rest}>
      <Inner variant={variant} arrow={arrow}>
        {children}
      </Inner>
    </LocaleLink>
  );
}

/** Small square text action inside tables and toolbars ("open", "void"). */
export function TextAction({ children, tone = "ink", className = "", ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "ink" | "accent" }) {
  return (
    <button
      type="button"
      className={`t-mono-xs link-line disabled:pointer-events-none disabled:opacity-40 ${tone === "accent" ? "text-accent" : "text-ink"} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
