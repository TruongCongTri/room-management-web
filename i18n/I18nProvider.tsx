"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Dictionary, Locale } from "./config";

type I18n = { locale: Locale; t: Dictionary };

const I18nContext = createContext<I18n | null>(null);

/** Hands the current locale and its UI strings to client components (set once, in the root layout). */
export default function I18nProvider({ locale, dictionary, children }: { locale: Locale; dictionary: Dictionary; children: ReactNode }) {
  return <I18nContext.Provider value={{ locale, t: dictionary }}>{children}</I18nContext.Provider>;
}

function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}

export const useLocale = () => useI18n().locale;
/** UI strings for the current locale, e.g. `useT().header.menu`. Fill placeholders with `fmt`. */
export const useT = () => useI18n().t;
