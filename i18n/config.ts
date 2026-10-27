/**
 * Locales the site is served in. Every route lives under `app/[locale]`; `proxy.ts` sends
 * un-prefixed URLs to the visitor's last locale (cookie) or the default.
 * Safe to import anywhere: no messages here, those load on the server (i18n/messages.ts).
 */
import type en from "./messages/en.json";

export const locales = ["vi", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "vi";

/** Remembers the last locale a visitor browsed, for URLs that arrive without one. */
export const LOCALE_COOKIE = "NEXT_LOCALE";

/** BCP 47 tags for APIs that want a region (Accept-Language on the listing API). */
export const languageTag: Record<Locale, string> = { vi: "vi-VN", en: "en-US" };

export const hasLocale = (value: string | null | undefined): value is Locale => locales.includes(value as Locale);

/** Everything in a locale file: page metadata, UI strings and the mock API content. */
export type Messages = typeof en;
/** The part client components read (see I18nProvider). */
export type Dictionary = Messages["ui"];

/** "/featured-products#faq" → "/vi/featured-products#faq". Hashes, external and already-prefixed URLs pass through. */
export function localizeHref(locale: Locale, href: string) {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  const first = href.split(/[/?#]/)[1];
  if (hasLocale(first)) return href;
  return href === "/" ? `/${locale}` : `/${locale}${href}`;
}

/** "/vi/featured-products" → "/featured-products" (and "/vi" → "/"). */
export function stripLocale(pathname: string) {
  const first = pathname.split("/")[1];
  if (!hasLocale(first)) return pathname;
  return pathname.slice(first.length + 1) || "/";
}

/** Fills `{name}` placeholders: fmt("{n} free now", { n: 3 }) → "3 free now". */
export function fmt(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (all, k: string) => (k in values ? String(values[k]) : all));
}
