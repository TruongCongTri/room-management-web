"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * The 404 shell is prerendered once for every unknown URL, so the requested
 * path is only known in the browser. Read it after hydration to avoid a mismatch.
 */
export default function MissingPath() {
  const pathname = useSyncExternalStore(
    subscribe,
    () => window.location.pathname,
    () => null,
  );
  return <span className="break-all text-accent">{pathname ?? "…"}</span>;
}
