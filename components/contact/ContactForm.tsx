"use client";

import { useState, type FormEvent } from "react";
import { fmt } from "@/i18n/config";
import { useLocale, useT } from "@/i18n/I18nProvider";
import { useSendContactMessageMutation, type MutationError } from "@/lib/api/apiSlice";
import type { ContactRequest, TierId } from "@/lib/api/types";
import { validateContact } from "@/lib/api/validation";
import { useRooms } from "@/lib/data";
import { ArrowRight } from "../home/Rulers";
import PixelFill from "../fx/PixelFill";
import { RollIcon, RollText } from "../fx/Roll";

type Field = "first" | "last" | "email" | "phone" | "message";

// form field -> API field
const API_FIELD: Record<Field, keyof ContactRequest> = { first: "firstName", last: "lastName", email: "email", phone: "phone", message: "message" };

const input =
  "t-h3 w-full bg-transparent px-[clamp(16px,1.75vw,34px)] py-[clamp(18px,1.7vw,32px)] text-[clamp(18px,1.55vw,30px)]! normal-case! outline-none placeholder:uppercase placeholder:text-ink/25 focus:bg-paper-2/60";

/** Contact form in full-width ruled rows: POST /contact/messages. Validates locally, then shows any errors the API returns. */
export default function ContactForm({ title, interestLabel }: { title: string; interestLabel: string }) {
  const rooms = useRooms();
  const locale = useLocale();
  const ui = useT();
  const t = ui.form;
  const [values, setValues] = useState<Record<Field, string>>({ first: "", last: "", email: "", phone: "", message: "" });
  const [interest, setInterest] = useState<TierId | null>(null);
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [serverErrors, setServerErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState("");
  const [send, { isLoading, isSuccess }] = useSendContactMessageMutation();

  const request: ContactRequest = {
    firstName: values.first.trim(),
    lastName: values.last.trim() || undefined,
    email: values.email.trim(),
    phone: values.phone.trim() || undefined,
    interest,
    message: values.message.trim(),
  };
  // same rules as the API (lib/api/validation.ts), so most mistakes never leave the browser
  const local = validateContact(request);
  const errors: Partial<Record<Field, string>> = {};
  (Object.keys(API_FIELD) as Field[]).forEach((k) => {
    const code = local[API_FIELD[k]];
    const e = code ? ui.validation[code] : serverErrors[k];
    if (e) errors[k] = e;
  });

  const set = (k: Field) => (e: { target: { value: string } }) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    setServerErrors((s) => ({ ...s, [k]: undefined }));
  };
  const blur = (k: Field) => () => setTouched((t) => ({ ...t, [k]: true }));
  const show = (k: Field) => touched[k] && errors[k];

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched({ first: true, last: true, email: true, phone: true, message: true });
    setFormError("");
    if (Object.keys(errors).length) return;
    try {
      await send({ locale, body: request }).unwrap();
    } catch (err) {
      const apiError = err as MutationError;
      const back: Partial<Record<Field, string>> = {};
      (Object.keys(API_FIELD) as Field[]).forEach((k) => {
        const m = apiError.fields?.[API_FIELD[k]];
        if (m) back[k] = m;
      });
      setServerErrors(back);
      setFormError(apiError.message || (apiError.offline ? ui.errors.offline : ui.errors.generic));
    }
  };

  if (isSuccess)
    return (
      <div role="status" className="flex flex-1 flex-col justify-center px-[clamp(16px,1.75vw,34px)] py-16">
        <p className="t-mono text-accent">{t.sent}</p>
        <h2 className="t-h2 mt-4">{t.thanksTitle}</h2>
        <p className="t-body mt-4 max-w-[30em]">{fmt(t.thanksBody, { name: request.firstName, email: request.email })}</p>
      </div>
    );

  const err = (k: Field) =>
    show(k) ? (
      <span id={`err-${k}`} className="t-mono-xs absolute right-[clamp(16px,1.75vw,34px)] top-1/2 -translate-y-1/2 text-accent">
        {errors[k]}
      </span>
    ) : null;

  return (
    <form noValidate onSubmit={submit} className="flex flex-1 flex-col">
      <h2 className="t-h2 border-b border-line px-[clamp(16px,1.75vw,34px)] py-[clamp(18px,1.7vw,32px)] text-[clamp(26px,2.4vw,46px)]!">
        {title}
      </h2>
      <div className="grid grid-cols-2 border-b border-line">
        <label className="relative border-r border-line">
          <span className="sr-only">{t.firstName}</span>
          <input className={input} placeholder={t.firstName} autoComplete="given-name" value={values.first} onChange={set("first")} onBlur={blur("first")} aria-invalid={Boolean(show("first"))} aria-describedby="err-first" />
          {err("first")}
        </label>
        <label className="relative">
          <span className="sr-only">{t.lastName}</span>
          <input className={input} placeholder={t.lastName} autoComplete="family-name" value={values.last} onChange={set("last")} />
        </label>
      </div>
      <label className="relative border-b border-line">
        <span className="sr-only">{t.email}</span>
        <input className={input} type="email" placeholder={t.email} autoComplete="email" value={values.email} onChange={set("email")} onBlur={blur("email")} aria-invalid={Boolean(show("email"))} aria-describedby="err-email" />
        {err("email")}
      </label>
      <label className="relative border-b border-line">
        <span className="sr-only">{t.phone}</span>
        <input className={input} type="tel" placeholder={t.phone} autoComplete="tel" value={values.phone} onChange={set("phone")} onBlur={blur("phone")} aria-invalid={Boolean(show("phone"))} aria-describedby="err-phone" />
        {err("phone")}
      </label>
      <fieldset className="border-b border-line px-[clamp(16px,1.75vw,34px)] py-[clamp(14px,1.3vw,24px)]">
        <legend className="sr-only">{t.interestLegend}</legend>
        <p className="t-mono-xs mb-3 text-ink/50">{interestLabel}</p>
        <div className="flex flex-wrap gap-1.5">
          {(rooms?.tiers ?? []).map((t) => {
            const on = interest === t.id;
            return (
              <button
                key={t.id}
                type="button"
                aria-pressed={on}
                onClick={() => setInterest(on ? null : t.id)}
                className={`t-mono-xs border px-2.5 py-1.5 transition-colors ${on ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"}`}
              >
                {t.name}
              </button>
            );
          })}
        </div>
      </fieldset>
      <label className="relative flex-1 border-b border-line">
        <span className="sr-only">{t.message}</span>
        <textarea className={`${input} block h-full min-h-[clamp(120px,10vw,190px)] resize-none`} placeholder={t.message} value={values.message} onChange={set("message")} onBlur={blur("message")} aria-invalid={Boolean(show("message"))} aria-describedby="err-message" />
        {show("message") && <span className="t-mono-xs absolute right-[clamp(16px,1.75vw,34px)] top-[clamp(22px,2vw,38px)] text-accent">{errors.message}</span>}
      </label>
      {formError && (
        <p role="alert" className="t-mono-xs border-b border-line px-[clamp(16px,1.75vw,34px)] py-2.5 text-accent">
          {formError}
        </p>
      )}
      <button type="submit" disabled={isLoading} className="fx group relative flex items-end justify-between overflow-hidden px-[clamp(16px,1.75vw,34px)] py-[clamp(18px,1.7vw,32px)] text-left disabled:opacity-60">
        <PixelFill color="--accent" />
        <span className="t-h3 text-[clamp(18px,1.55vw,30px)]! text-ink/30 transition-colors group-hover:text-white">
          <RollText>{isLoading ? t.sending : t.submit}</RollText>
        </span>
        <span className="text-ink/50 transition-colors group-hover:text-white">
          <RollIcon>
            <ArrowRight />
          </RollIcon>
        </span>
      </button>
    </form>
  );
}
