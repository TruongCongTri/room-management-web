"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useDispatch } from "react-redux";
import { fmt, localizeHref } from "@/i18n/config";
import { useC } from "@/i18n/ConsoleI18nProvider";
import { useLocale } from "@/i18n/I18nProvider";
import { consoleApi } from "@/lib/console/api";
import { useActivateMutation, useRequestOtpMutation, useResetPasswordMutation, type OtpAccepted } from "@/lib/console/endpoints/identity";
import { detailIssues, detailValue, type ApiProblem } from "@/lib/console/problem";
import { isOtp, isPhone, normalizePhone, passwordIssues } from "@/lib/console/validation";
import LocaleLink from "../../LocaleLink";
import { Note, ProblemBox, useCountdown } from "../kit/Feedback";
import { FormGrid, PasswordField, TextField } from "../kit/Field";
import { AuthHead, AuthLinks, SubmitRow } from "./AuthFrame";

type Purpose = "ACTIVATE_ACCOUNT" | "RESET_PASSWORD";

/**
 * Activation (from the invitation SMS) and password reset share one flow: phone → a 6-digit code (sent by
 * SMS; the API never says whether the number has an account) → code + new password. Activation signs the
 * account in; a reset sends the visitor back to sign in with the new password.
 */
export default function OtpPasswordFlow({ purpose }: { purpose: Purpose }) {
  const c = useC();
  const t = c.auth;
  const copy = purpose === "ACTIVATE_ACCOUNT" ? t.activate : t.reset;
  const locale = useLocale();
  const router = useRouter();
  const search = useSearchParams();
  const dispatch = useDispatch();

  const [phone, setPhone] = useState(search.get("phone") ?? "");
  const [sent, setSent] = useState<(OtpAccepted & { at: number }) | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState(false);
  const [done, setDone] = useState(false);
  const [problem, setProblem] = useState<ApiProblem | null>(null);
  const [requestOtp, requestState] = useRequestOtpMutation();
  const [activate, activateState] = useActivateMutation();
  const [reset, resetState] = useResetPasswordMutation();
  const resendLeft = useCountdown(sent?.resendAfterSeconds, sent?.at);

  const phoneError = touched && !sent && (!phone.trim() ? c.validation.required : !isPhone(phone) ? c.validation.phone : null);

  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    setTouched(true);
    setProblem(null);
    if (!isPhone(phone)) return;
    try {
      const accepted = await requestOtp({ phone: normalizePhone(phone), purpose }).unwrap();
      setSent({ ...accepted, at: Date.now() });
      setTouched(false);
    } catch (err) {
      setProblem(err as ApiProblem);
    }
  };

  const local = passwordIssues(password, confirm, phone);
  const issueText = (i: string) => c.passwordIssues[i as keyof typeof c.passwordIssues] ?? i;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setProblem(null);
    if (!isOtp(code) || local.length) return;
    const body = { phone: normalizePhone(phone), code: code.trim(), newPassword: password };
    try {
      if (purpose === "ACTIVATE_ACCOUNT") {
        await activate(body).unwrap();
        dispatch(consoleApi.util.resetApiState());
        router.replace(localizeHref(locale, "/app"));
      } else {
        await reset(body).unwrap();
        setDone(true);
      }
    } catch (err) {
      setProblem(err as ApiProblem);
    }
  };

  if (done) {
    return (
      <div className="flex flex-1 flex-col">
        <AuthHead step={copy.stepDone} title={copy.doneTitle} body={copy.doneBody} />
        <AuthLinks>
          <LocaleLink href={`/sign-in?phone=${encodeURIComponent(normalizePhone(phone))}`} className="link-line text-ink">
            {t.signIn} →
          </LocaleLink>
        </AuthLinks>
      </div>
    );
  }

  if (!sent) {
    return (
      <form noValidate onSubmit={send} className="flex flex-1 flex-col">
        <AuthHead step={copy.stepPhone} title={copy.title} body={copy.body} />
        <FormGrid cols={1}>
          <TextField label={t.phone} required type="tel" autoComplete="tel" inputMode="tel" placeholder="0901 234 567" value={phone} onChange={(e) => setPhone(e.target.value)} error={phoneError || null} />
        </FormGrid>
        {problem && (
          <div className="border-b border-line p-[clamp(12px,1.2vw,22px)]">
            <ProblemBox problem={problem} />
          </div>
        )}
        <SubmitRow label={t.sendCode} busy={requestState.isLoading} />
        <AuthLinks>
          <LocaleLink href="/sign-in" className="link-line">
            {t.backToSignIn}
          </LocaleLink>
        </AuthLinks>
      </form>
    );
  }

  const policy = problem?.code === "AUTH_PASSWORD_POLICY_VIOLATION" ? detailIssues(problem) : [];
  const attempts = detailValue<number>(problem, "attemptsRemaining");
  const passwordError = touched && local.filter((i) => i !== "MISMATCH").length ? issueText(local.find((i) => i !== "MISMATCH")!) : null;
  const confirmError = touched && local.includes("MISMATCH") ? issueText("MISMATCH") : null;

  return (
    <form noValidate onSubmit={submit} className="flex flex-1 flex-col">
      <AuthHead step={copy.stepCode} title={copy.codeTitle} body={fmt(t.codeSentTo, { phone: normalizePhone(phone) })} />
      {sent.debugCode && <Note tone="accent">{fmt(t.debugCode, { code: sent.debugCode })}</Note>}
      <FormGrid cols={1}>
        <TextField
          label={t.code}
          required
          autoFocus
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          error={touched && !isOtp(code) ? c.validation.otp : null}
          className="[&_input]:font-mono [&_input]:text-[clamp(24px,2.4vw,44px)]! [&_input]:tracking-[0.4em]"
        />
        <PasswordField label={t.newPassword} required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} error={passwordError} hint={t.passwordRule} showLabel={t.show} hideLabel={t.hide} />
        <PasswordField label={t.confirmPassword} required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={confirmError} showLabel={t.show} hideLabel={t.hide} />
      </FormGrid>
      {problem && (
        <div className="border-b border-line p-[clamp(12px,1.2vw,22px)]">
          <ProblemBox problem={problem}>
            {policy.length > 0 && (
              <ul className="t-mono-xs mt-1.5 list-inside list-disc text-accent normal-case tracking-normal">
                {policy.map((i) => (
                  <li key={i}>{issueText(i)}</li>
                ))}
              </ul>
            )}
            {attempts !== undefined && <p className="t-mono-xs mt-1.5 text-accent">{fmt(t.attemptsLeft, { n: attempts })}</p>}
          </ProblemBox>
        </div>
      )}
      <SubmitRow label={copy.submit} busy={activateState.isLoading || resetState.isLoading} />
      <AuthLinks>
        <button type="button" className="link-line disabled:opacity-40" disabled={resendLeft > 0 || requestState.isLoading} onClick={() => send()}>
          {resendLeft > 0 ? fmt(t.resendIn, { s: resendLeft }) : t.resendCode}
        </button>
        <button type="button" className="link-line" onClick={() => (setSent(null), setProblem(null), setCode(""))}>
          {t.changePhone}
        </button>
      </AuthLinks>
    </form>
  );
}
