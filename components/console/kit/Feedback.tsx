"use client";

import { useEffect, useState, type ReactNode } from "react";
import { fmt } from "@/i18n/config";
import { useC } from "@/i18n/ConsoleI18nProvider";
import type { ApiProblem } from "@/lib/console/problem";

/** Status tags: square dot + mono label. `alert` (solid accent) is reserved for what needs action now. */
export type Tone = "ok" | "accent" | "muted" | "solid" | "alert";

const TONE: Record<Tone, string> = {
  ok: "border-ink/35 text-ink [&>i]:bg-ink",
  accent: "border-accent text-accent [&>i]:bg-accent",
  muted: "border-line text-ink/50 [&>i]:bg-ink/30",
  solid: "border-ink bg-ink text-paper [&>i]:bg-paper",
  alert: "border-accent bg-accent text-white [&>i]:bg-white",
};

export function Badge({ tone = "ok", children, title }: { tone?: Tone; children: ReactNode; title?: string }) {
  return (
    <span title={title} className={`t-mono-xs inline-flex items-center gap-1.5 whitespace-nowrap border px-1.5 py-0.5 leading-none ${TONE[tone]}`}>
      <i aria-hidden="true" className="size-1.5 shrink-0" />
      {children}
    </span>
  );
}

/** Seconds left from `seconds`, ticking down to 0 (Retry-After countdowns, OTP resend). */
export function useCountdown(seconds: number | undefined, key?: unknown): number {
  const [left, setLeft] = useState(seconds ?? 0);
  useEffect(() => {
    setLeft(seconds ?? 0);
    if (!seconds) return;
    const end = Date.now() + seconds * 1000;
    const id = setInterval(() => {
      const s = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setLeft(s);
      if (!s) clearInterval(id);
    }, 250);
    return () => clearInterval(id);
  }, [seconds, key]);
  return left;
}

/**
 * A failed call: the API's message (already in the visitor's language), a countdown when it said when to
 * retry, and the trace id to quote to support. Network failures get a local message.
 */
export function ProblemBox({ problem, className = "", children }: { problem: ApiProblem | null | undefined; className?: string; children?: ReactNode }) {
  const t = useC().common;
  const left = useCountdown(problem?.retryAfter, problem);
  if (!problem) return null;
  const message = problem.message || (problem.offline ? t.offline : problem.code === "REQ_TIMEOUT" ? t.timeout : t.genericError);
  return (
    <div role="alert" data-problem={problem.code} className={`border border-accent bg-accent/[0.06] px-[clamp(14px,1.4vw,26px)] py-3 ${className}`}>
      <p className="t-body text-ink!">{message}</p>
      {left > 0 && <p className="t-mono-xs mt-1.5 text-accent">{fmt(t.retryIn, { s: left })}</p>}
      {children}
      <p className="t-mono-xs mt-1.5 text-ink/45">
        {problem.code}
        {problem.traceId && <> · {fmt(t.trace, { id: problem.traceId })}</>}
      </p>
    </div>
  );
}

/** An empty list: a small drawn room and a line of text, plus an optional action. */
export function Empty({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 px-[clamp(14px,1.4vw,26px)] py-[clamp(28px,3vw,56px)]">
      <svg aria-hidden="true" width="56" height="40" viewBox="0 0 56 40" className="text-ink/35">
        <rect x="1" y="1" width="54" height="38" fill="none" stroke="currentColor" />
        <path d="M18 39V24a10 10 0 0 1 20 0v15" fill="none" stroke="var(--accent)" strokeDasharray="3 3" />
        <path d="M1 12h54" stroke="currentColor" strokeDasharray="2 3" />
      </svg>
      <p className="t-h3">{title}</p>
      {body && <p className="t-body max-w-[42em]">{body}</p>}
      {action}
    </div>
  );
}

/** Inline loading line for sections (lists use table skeletons). */
export function Loading({ label }: { label?: string }) {
  const t = useC().common;
  return (
    <p role="status" className="t-mono-xs flex items-center gap-2 px-[clamp(14px,1.4vw,26px)] py-4 text-ink/50">
      <span aria-hidden="true" className="blink size-1.5 bg-accent" />
      {label ?? t.loading}
    </p>
  );
}

/** A note strip (warnings, hints) inside a section. */
export function Note({ tone = "muted", children }: { tone?: "muted" | "accent"; children: ReactNode }) {
  return (
    <p className={`t-mono-xs border-b border-line px-[clamp(14px,1.4vw,26px)] py-2.5 normal-case tracking-normal ${tone === "accent" ? "bg-accent/[0.06] text-accent" : "text-ink/55"}`}>{children}</p>
  );
}
