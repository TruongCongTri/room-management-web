"use client";

import type { ReactNode } from "react";
import { useSession } from "./MeContext";

/**
 * Wraps every console screen (in its page.tsx): renders the screen once the account and its building are
 * known, a ruled skeleton before. Keeping this inside the page segment lets the page render on the server
 * too, so navigations into it can be prerendered and validated.
 */
export default function Screen({ children }: { children: ReactNode }) {
  const { ready } = useSession();
  if (ready) return children;
  return (
    <div role="status" aria-busy="true" className="skeleton">
      <div className="h-[clamp(120px,10vw,180px)] border-b border-line" />
      <div className="h-12 border-b border-line" />
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="h-12 border-b border-line" />
      ))}
    </div>
  );
}
