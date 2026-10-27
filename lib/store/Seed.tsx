"use client";

import type { ReactNode } from "react";
import { useStore } from "react-redux";
import { useLocale } from "@/i18n/I18nProvider";
import type { Seed as SeedData } from "../api/apiSlice";
import { seedStore, type AppStore } from "./store";

/**
 * A page's server-fetched data, handed to the client cache before the page renders.
 * Only fills gaps (anything already cached and fresh is kept), so navigating back to a page
 * doesn't overwrite newer data the client fetched itself.
 */
export default function Seed({ data, children }: { data: SeedData; children: ReactNode }) {
  const store = useStore() as AppStore;
  seedStore(store, data, useLocale());
  return children;
}
