"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useC } from "@/i18n/ConsoleI18nProvider";

/**
 * Modal sheet on the native <dialog> (top layer, focus trap, Escape): a ruled panel with an ink title strip,
 * like a drawing's title block. `open` controls it; closing (Escape, ✕, backdrop) calls onClose.
 */
export function Dialog({
  open,
  onClose,
  title,
  kicker,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  kicker?: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const t = useC().common;

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={`m-auto max-h-[88svh] w-[calc(100%-24px)] overflow-hidden border border-ink bg-paper p-0 text-ink backdrop:bg-ink/45 ${wide ? "max-w-[960px]" : "max-w-[640px]"}`}
    >
      {open && (
        <div className="flex max-h-[88svh] flex-col">
          <div className="flex items-stretch justify-between border-b border-line bg-ink text-paper">
            <div className="px-[clamp(14px,1.4vw,26px)] py-3">
              {kicker && <p className="t-mono-xs text-paper/55">{kicker}</p>}
              <h2 className="t-h3 mt-1">{title}</h2>
            </div>
            <button type="button" onClick={onClose} aria-label={t.close} className="t-mono border-l border-paper/20 px-4 hover:bg-accent">
              ✕
            </button>
          </div>
          <div className="overflow-y-auto" data-lenis-prevent>
            {children}
          </div>
        </div>
      )}
    </dialog>
  );
}
