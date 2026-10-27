import type { ReactNode } from "react";

/** Label that rolls up to a copy of itself when its `fx` parent is hovered. */
export function RollText({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`roll ${className}`}>
      <span className="roll-a">{children}</span>
      <span className="roll-b" aria-hidden="true">
        {children}
      </span>
    </span>
  );
}

/** Icon that slides out sideways and is replaced by a copy sliding in. */
export function RollIcon({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`roll roll-x ${className}`} aria-hidden="true">
      <span className="roll-a">{children}</span>
      <span className="roll-b">{children}</span>
    </span>
  );
}
