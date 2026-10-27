"use client";

import { useEffect } from "react";

/**
 * Marks <html data-hydrated> once React has taken over the page: forms work from then on (before, a submit
 * would reload the page and typed values could be reset). End-to-end tests wait for it before typing.
 */
export default function HydrationMark() {
  useEffect(() => {
    document.documentElement.dataset.hydrated = "1";
  }, []);
  return null;
}
