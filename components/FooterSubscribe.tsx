"use client";

import { useState, type FormEvent } from "react";
import { useLocale, useT } from "@/i18n/I18nProvider";
import { useSubscribeMutation, type MutationError } from "@/lib/api/apiSlice";
import { validateSubscribe } from "@/lib/api/validation";

type State = "idle" | "sending" | "success" | "error";

/** Newsletter sign-up: POST /subscriptions. Checks the email locally first, then trusts the API's answer. */
export default function FooterSubscribe() {
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");
  const [subscribe] = useSubscribeMutation();
  const locale = useLocale();
  const ui = useT();
  const t = ui.subscribe;

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const email = String(new FormData(form).get("email") ?? "").trim();
    const local = validateSubscribe({ email });
    if (local.email) {
      setMessage(ui.validation[local.email]);
      return setState("error");
    }
    setState("sending");
    try {
      await subscribe({ locale, body: { email } }).unwrap();
      form.reset();
      setState("success");
    } catch (err) {
      const e = err as MutationError;
      setMessage(e.message || (e.offline ? ui.errors.offline : ui.errors.generic));
      setState("error");
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="mt-auto">
      <p aria-live="polite" className="t-mono-xs min-h-4 px-[clamp(12px,0.85vw,16px)] pb-1 text-accent">
        {state === "success" && t.success}
        {state === "error" && message}
      </p>
      <div className="flex border-t border-line">
        <label htmlFor="footer-email" className="sr-only">
          {t.emailLabel}
        </label>
        <input
          id="footer-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder={t.placeholder}
          aria-invalid={state === "error"}
          onChange={() => state === "error" && setState("idle")}
          className="t-body min-w-0 flex-1 bg-transparent px-[clamp(12px,0.85vw,16px)] py-3 text-ink outline-none placeholder:text-ink/50"
        />
        <button
          type="submit"
          aria-label={t.submit}
          disabled={state === "sending"}
          className="w-[clamp(40px,2.7vw,52px)] border-l border-line text-ink/60 transition-colors hover:bg-accent hover:text-white"
        >
          →
        </button>
      </div>
    </form>
  );
}
