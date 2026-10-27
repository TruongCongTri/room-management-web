"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { fmt, locales, stripLocale } from "@/i18n/config";
import { useLocale, useT } from "@/i18n/I18nProvider";
import { useSite } from "@/lib/data";
import LocaleLink from "./LocaleLink";
import LogoMark from "./LogoMark";
import PixelFill from "./fx/PixelFill";
import { RollIcon, RollText } from "./fx/Roll";

const pad = "p-[clamp(8px,0.7vw,14px)]";

function Tick({ className }: { className: string }) {
  return (
    <svg width="6" height="6" viewBox="0 0 6 6" className={className} aria-hidden="true">
      <path d="M5.5 0v5.5H0" fill="none" stroke="currentColor" />
    </svg>
  );
}

function ArrowSm() {
  return (
    <svg width="14" height="10" viewBox="0 0 14 10" aria-hidden="true">
      <path d="M0 5h12.5M8.5 1l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

/** VI / EN: the same page in the other language. */
function LanguageSwitch({ path, onPick }: { path: string; onPick: () => void }) {
  const locale = useLocale();
  const t = useT().language;
  return (
    <nav aria-label={t.label} className="t-mono flex items-center gap-1.5">
      {locales.map((l, i) => (
        <span key={l} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-ink/30">/</span>}
          {l === locale ? (
            <span aria-current="true" className="text-ink">
              {l.toUpperCase()}
            </span>
          ) : (
            <Link
              href={`/${l}${path === "/" ? "" : path}`}
              hrefLang={l}
              lang={l}
              aria-label={t.switchTo}
              title={t.names[l]}
              onClick={onPick}
              className="text-ink/50 transition-colors hover:text-accent"
            >
              {l.toUpperCase()}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

export default function Header() {
  const pathname = stripLocale(usePathname());
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const site = useSite();
  const t = useT().header;
  const ITEMS = site?.nav ?? [];
  const cta = site?.contactCta ?? { label: "", href: "/contact-us" };
  const brand = site?.brand.name ?? "Atrium";

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // hide on scroll down, show on scroll up
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) < 4) return;
      setHidden(y > last && y > 80);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // sticky page parts (table headers, selectors) read this to sit below the header when it's showing
  useEffect(() => {
    document.documentElement.dataset.header = hidden && !open ? "hidden" : "shown";
  }, [hidden, open]);

  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      {/* keeps page content below the fixed header */}
      <div aria-hidden="true" className="mt-(--frame) h-(--header-h) shrink-0" />
      <header
        className="fixed inset-x-(--frame) top-(--frame) z-50 flex h-(--header-h) border-x border-b border-line bg-paper md:grid md:grid-cols-12 transition-transform duration-500 ease-[cubic-bezier(.23,1,.32,1)]"
        style={{ transform: hidden && !open ? "translateY(calc(-100% - var(--frame) - 2px))" : "none" }}
      >
        <div className="flex flex-1 items-center justify-between gap-4 px-[clamp(16px,1.75vw,34px)] md:col-span-6">
          <LocaleLink href="/" aria-label={fmt(t.home, { brand })} onClick={() => setOpen(false)} className="flex h-full items-center gap-2">
            <LogoMark className="h-[clamp(26px,2.4vw,44px)] w-auto" strokeWidth={5} />
            <span className="text-[clamp(18px,1.45vw,28px)] font-bold uppercase tracking-[-0.04em]">{brand}</span>
          </LocaleLink>
          <LanguageSwitch path={pathname} onPick={() => setOpen(false)} />
        </div>

        <nav aria-label={t.mainNav} className="hidden h-full md:col-span-6 md:grid md:grid-cols-3">
          {ITEMS.map((item) => {
            const on = active(item.href);
            return (
              <div key={item.href} className="group relative h-full border-l border-line">
                <LocaleLink
                  href={item.href}
                  aria-current={on ? "page" : undefined}
                  className={`fx t-mono block h-full overflow-hidden ${pad} ${on ? "text-ink" : "text-ink/60"}`}
                >
                  <PixelFill color="--ink" />
                  <span className="flex items-center gap-1.5">
                    {on && <span className="size-1.5 bg-accent" />}
                    <RollText>{item.label}</RollText>
                  </span>
                  {item.children && (
                    <>
                      <Tick className="tick-top" />
                      <Tick className="tick-bot" />
                    </>
                  )}
                </LocaleLink>
                {item.children && (
                  <ul className="invisible absolute -left-px top-full min-w-[calc(100%+2px)] border border-line bg-paper opacity-0 [clip-path:inset(0_0_100%_0)] transition-all duration-500 ease-[cubic-bezier(.23,1,.32,1)] group-focus-within:visible group-focus-within:opacity-100 group-focus-within:[clip-path:inset(0)] group-hover:visible group-hover:opacity-100 group-hover:[clip-path:inset(0)]">
                    {item.children.map((c) => (
                      <li key={c.href + c.label} className="border-b border-line last:border-0">
                        <LocaleLink href={c.href} className={`fx t-mono block whitespace-nowrap px-[clamp(8px,0.7vw,14px)] py-3 text-ink/60`}>
                          <PixelFill color="--ink" />
                          <RollText>{c.label}</RollText>
                        </LocaleLink>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
          <LocaleLink
            href={cta.href}
            aria-current={active(cta.href) ? "page" : undefined}
            className={`fx t-mono relative flex h-full flex-col justify-between overflow-hidden border-l border-line ${pad} text-accent`}
          >
            <PixelFill color="--accent" />
            <RollText>{cta.label}</RollText>
            <span className="self-end">
              <RollIcon>
                <ArrowSm />
              </RollIcon>
            </span>
          </LocaleLink>
        </nav>

        <button
          type="button"
          className="t-mono relative h-full w-27.5 border-l border-line p-3 text-left md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? t.close : t.menu}
          <Tick className="tick-bot" />
        </button>

        <div
          id="mobile-menu"
          hidden={!open}
          className="fixed inset-x-(--frame) bottom-(--frame) top-[calc(var(--frame)+var(--header-h))] z-40 flex flex-col overflow-y-auto border border-line bg-paper md:hidden"
        >
          {ITEMS.map((item, i) => (
            <LocaleLink
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-baseline justify-between border-b border-line p-4"
            >
              <span className={`t-h2 ${active(item.href) ? "text-accent" : ""}`}>{item.label}</span>
              <span className="t-mono text-ink/50">[{String(i + 1).padStart(2, "0")}]</span>
            </LocaleLink>
          ))}
          <LocaleLink
            href={cta.href}
            onClick={() => setOpen(false)}
            className="t-mono mt-auto flex items-center justify-between bg-accent p-4 text-white"
          >
            {cta.label} <ArrowSm />
          </LocaleLink>
        </div>
      </header>
    </>
  );
}
