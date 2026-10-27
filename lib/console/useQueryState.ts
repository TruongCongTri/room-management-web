"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

/**
 * List filters kept in the URL (?status=ACTIVE&page=2): a filtered list can be shared, bookmarked and
 * survives a reload. Changing any filter other than the page goes back to page 1.
 */
export function useQueryState() {
  const search = useSearchParams();
  const router = useRouter();
  const set = useCallback(
    (patch: Record<string, string | number | null | undefined>) => {
      const q = new URLSearchParams(search.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === undefined || v === "") q.delete(k);
        else q.set(k, String(v));
      }
      if (!("page" in patch)) q.delete("page");
      const s = q.toString();
      router.replace(s ? `?${s}` : "?", { scroll: false });
    },
    [search, router],
  );
  const get = useCallback((k: string) => search.get(k) ?? "", [search]);
  const num = useCallback((k: string, fallback = 1) => Number(search.get(k)) || fallback, [search]);
  return { get, num, set };
}
