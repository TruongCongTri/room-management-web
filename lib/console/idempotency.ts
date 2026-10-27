"use client";

import { useCallback, useRef } from "react";

/** A fresh Idempotency-Key (UUID v4). */
export const newKey = () => crypto.randomUUID();

/**
 * One key per user action (doc 05 §6.1): the same key is sent again when that action is retried (a timeout,
 * "try again"), and a new one once it has succeeded or the form changed — so a double click or a retry never
 * creates two records, and a second, different action is never mistaken for the first.
 */
export function useIdempotencyKey() {
  const key = useRef<string | null>(null);
  const current = useCallback(() => (key.current ??= newKey()), []);
  const reset = useCallback(() => {
    key.current = null;
  }, []);
  return { key: current, reset };
}
