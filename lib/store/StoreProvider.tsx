"use client";

import { setupListeners } from "@reduxjs/toolkit/query";
import { useEffect, useState, type ReactNode } from "react";
import { Provider } from "react-redux";
import type { Locale } from "../../i18n/config";
import type { Seed } from "../api/apiSlice";
import { setLocale } from "../console/slice";
import { makeStore, seedStore } from "./store";

/** Creates the store once, seeded with the data the root layout fetched on the server (in `locale`). */
export default function StoreProvider({ seed, locale, children }: { seed: Seed; locale: Locale; children: ReactNode }) {
  const [store] = useState(() => makeStore());
  // runs again after a language switch, adding that locale's site data (entries already cached are kept)
  seedStore(store, seed, locale);
  // console calls ask the API for messages in the page's language
  if (store.getState().console.locale !== locale) store.dispatch(setLocale(locale));

  // enables refetchOnFocus / refetchOnReconnect
  useEffect(() => setupListeners(store.dispatch), [store]);

  return <Provider store={store}>{children}</Provider>;
}
