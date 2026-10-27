"use client";

import { createContext, useContext, type ReactNode } from "react";
import type en from "./console/en.json";

export type ConsoleDictionary = typeof en;

const ConsoleI18nContext = createContext<ConsoleDictionary | null>(null);

/** Hands the console strings of the current locale to client components (set by the console and auth layouts). */
export default function ConsoleI18nProvider({ dictionary, children }: { dictionary: ConsoleDictionary; children: ReactNode }) {
  return <ConsoleI18nContext.Provider value={dictionary}>{children}</ConsoleI18nContext.Provider>;
}

/** Console strings, e.g. `useC().common.save`. Fill placeholders with `fmt`. */
export function useC(): ConsoleDictionary {
  const ctx = useContext(ConsoleI18nContext);
  if (!ctx) throw new Error("useC must be used inside <ConsoleI18nProvider>");
  return ctx;
}
