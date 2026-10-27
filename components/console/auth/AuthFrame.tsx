"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { locales, stripLocale } from "@/i18n/config";
import { useC } from "@/i18n/ConsoleI18nProvider";
import { useLocale } from "@/i18n/I18nProvider";
import { useSite } from "@/lib/data";
import { useHydrated } from "@/lib/useHydrated";
import LocaleLink from "../../LocaleLink";
import LogoMark from "../../LogoMark";
import Building from "../../home/Building";
import { ArrowRight, Plus } from "../../home/Rulers";
import PixelFill from "../../fx/PixelFill";
import { RollIcon, RollText } from "../../fx/Roll";

const PAD = "px-[clamp(16px,1.75vw,34px)]";

/**
 * Sign-in pages: the site's header strip (brand, language, back to the site), the form on the left half
 * and the building drawing on a square grid on the right, like the contact page.
 */
export default function AuthFrame({ children }: { children: ReactNode }) {
  const t = useC().auth;
  const site = useSite();
  const locale = useLocale();
  const path = stripLocale(usePathname());
  const brand = site?.brand.name ?? "Atrium";
  return (
    <>
      <div aria-hidden="true" className="mt-(--frame) h-(--header-h) shrink-0" />
      <header className="fixed inset-x-(--frame) top-(--frame) z-50 flex h-(--header-h) border-x border-b border-line bg-paper">
        <LocaleLink href="/" className={`flex h-full items-center gap-2 border-r border-line ${PAD}`}>
          <LogoMark className="h-[clamp(24px,2.2vw,40px)] w-auto" strokeWidth={5} />
          <span className="text-[clamp(18px,1.45vw,28px)] font-bold uppercase tracking-[-0.04em]">{brand}</span>
        </LocaleLink>
        <nav aria-label={t.language} className={`t-mono ml-auto flex items-center gap-1.5 border-l border-line ${PAD}`}>
          {locales.map((l, i) => (
            <span key={l} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-ink/30">/</span>}
              {l === locale ? (
                <span aria-current="true">{l.toUpperCase()}</span>
              ) : (
                <Link href={`/${l}${path}`} hrefLang={l} lang={l} className="text-ink/50 hover:text-accent">
                  {l.toUpperCase()}
                </Link>
              )}
            </span>
          ))}
        </nav>
        <LocaleLink href="/" className={`t-mono hidden h-full items-center border-l border-line text-ink/60 hover:text-accent sm:flex ${PAD}`}>
          ← {t.backToSite}
        </LocaleLink>
      </header>
      <main className="sheet grid flex-1 md:grid-cols-12">
        <div className="flex flex-col border-b border-line md:col-span-6 md:border-b-0 md:border-r">{children}</div>
        <div aria-hidden="true" className="relative hidden items-center overflow-hidden md:col-span-6 md:flex">
          <div className="sq-grid absolute inset-0 opacity-25" />
          <Plus className="left-4 top-4" />
          <Plus className="right-4 top-4" />
          <Plus className="bottom-4 left-4" />
          <Plus className="bottom-4 right-4" />
          <Building variant="render" idPrefix="auth" className="relative w-[120%] max-w-none translate-x-[6%]" />
        </div>
      </main>
    </>
  );
}

/** The heading row of an auth form: step label + big title + one line of explanation. */
export function AuthHead({ step, title, body }: { step: string; title: string; body?: ReactNode }) {
  return (
    <div className={`border-b border-line ${PAD} py-[clamp(20px,2.2vw,42px)]`}>
      <p className="t-mono-xs text-ink/50">{step}</p>
      <h1 className="t-h1 mt-2 text-[clamp(32px,3.4vw,64px)]!">{title}</h1>
      {body && <p className="t-body mt-3 max-w-[34em]">{body}</p>}
    </div>
  );
}

/** The wide submit row at the foot of the form (the contact form's send button). */
export function SubmitRow({ label, busy, disabled }: { label: string; busy?: boolean; disabled?: boolean }) {
  // enabled once the page is interactive: a submit before that would reload the page instead of signing in
  const hydrated = useHydrated();
  return (
    <button
      type="submit"
      disabled={busy || disabled || !hydrated}
      className={`fx group relative flex items-end justify-between overflow-hidden border-b border-line ${PAD} py-[clamp(18px,1.7vw,32px)] text-left disabled:opacity-50`}
    >
      <PixelFill color="--accent" />
      <span className="t-h3 text-[clamp(18px,1.55vw,30px)]! text-ink transition-colors group-hover:text-white">
        <RollText>{busy ? "…" : label}</RollText>
      </span>
      <span className="text-ink/50 transition-colors group-hover:text-white">
        <RollIcon>
          <ArrowRight />
        </RollIcon>
      </span>
    </button>
  );
}

export function AuthLinks({ children }: { children: ReactNode }) {
  return <div className={`t-mono-xs flex flex-wrap gap-x-6 gap-y-2 ${PAD} py-4 text-ink/60`}>{children}</div>;
}
