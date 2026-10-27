"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

/** Short confirmations after an action ("Room saved"), stacked bottom-right, gone after a few seconds. */
type Toast = { id: number; text: ReactNode; tone: "ok" | "accent" };
type Push = (text: ReactNode, tone?: Toast["tone"]) => void;

const ToastContext = createContext<Push>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback<Push>((text, tone = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-3), { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, []);
  const value = useMemo(() => push, [push]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-[calc(var(--frame)+12px)] right-[calc(var(--frame)+12px)] z-[95] flex w-[min(380px,calc(100vw-40px))] flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} role="status" className={`pointer-events-auto flex animate-[fade_.3s_ease] items-start gap-3 border px-4 py-3 shadow-[4px_4px_0_0_var(--ink)] ${t.tone === "accent" ? "border-accent bg-accent text-white" : "border-ink bg-paper text-ink"}`}>
            <span aria-hidden="true" className={`mt-1.5 size-1.5 shrink-0 ${t.tone === "accent" ? "bg-white" : "bg-accent"}`} />
            <span className="t-body text-current!">{t.text}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
