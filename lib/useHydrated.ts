"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** False during the server render and hydration, true once React runs the page in the browser. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
