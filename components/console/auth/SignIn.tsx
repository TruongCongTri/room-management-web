"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useDispatch } from "react-redux";
import { fmt } from "@/i18n/config";
import { useC } from "@/i18n/ConsoleI18nProvider";
import { useLocale } from "@/i18n/I18nProvider";
import { consoleApi } from "@/lib/console/api";
import { useLoginMutation, useVerifyMfaMutation, type MfaChallenge } from "@/lib/console/endpoints/identity";
import { detailValue, type ApiProblem } from "@/lib/console/problem";
import { isOtp, isPhone, normalizePhone } from "@/lib/console/validation";
import LocaleLink from "../../LocaleLink";
import { Note, ProblemBox, useCountdown } from "../kit/Feedback";
import { FormGrid, PasswordField, TextField } from "../kit/Field";
import { AuthHead, AuthLinks, SubmitRow } from "./AuthFrame";

/** Only console paths of this locale may follow sign-in (no open redirect). */
export function safeNext(next: string | null, locale: string): string {
  if (!next || next.startsWith("//") || !next.startsWith(`/${locale}/app`)) return `/${locale}/app`;
  return next;
}

/**
 * Sign-in (doc 05 §6.2): phone + password → signed in, or for landlord / accountant a code sent by SMS / Zalo
 * (202) confirmed in a second step. A locked account (423) and rate limits (429) count down from Retry-After.
 */
export default function SignIn() {
  const c = useC();
  const t = c.auth;
  const locale = useLocale();
  const router = useRouter();
  const search = useSearchParams();
  const dispatch = useDispatch();
  const [phone, setPhone] = useState(search.get("phone") ?? "");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [touched, setTouched] = useState(false);
  const [challenge, setChallenge] = useState<MfaChallenge | null>(null);
  const [problem, setProblem] = useState<ApiProblem | null>(null);
  const [login, loginState] = useLoginMutation();
  const [verify, verifyState] = useVerifyMfaMutation();
  const codeLeft = useCountdown(challenge?.expiresInSeconds, challenge?.challengeId);

  const finish = () => {
    // the next screen reads /auth/me afresh for this account
    dispatch(consoleApi.util.resetApiState());
    router.replace(safeNext(search.get("next"), locale));
  };

  const phoneError = touched && (!phone.trim() ? c.validation.required : !isPhone(phone) ? c.validation.phone : null);
  const passwordError = touched && !password ? c.validation.required : null;

  const submitCredentials = async (e?: FormEvent) => {
    e?.preventDefault();
    setTouched(true);
    setProblem(null);
    if (!phone.trim() || !isPhone(phone) || !password) return;
    try {
      const result = await login({ phone: normalizePhone(phone), password }).unwrap();
      if (result.kind === "session") return finish();
      setChallenge(result.challenge);
      setCode("");
    } catch (err) {
      setProblem(err as ApiProblem);
    }
  };

  const submitCode = async (e: FormEvent) => {
    e.preventDefault();
    setProblem(null);
    if (!challenge || !isOtp(code)) {
      setProblem({ status: 400, code: "AUTH_OTP_INVALID", message: c.validation.otp, fields: {} });
      return;
    }
    try {
      await verify({ challengeId: challenge.challengeId, code: code.trim() }).unwrap();
      finish();
    } catch (err) {
      const p = err as ApiProblem;
      // a burned or expired challenge can't be retried: back to the password step for a new code
      if (p.code === "AUTH_OTP_TOO_MANY_ATTEMPTS" || p.code === "AUTH_OTP_EXPIRED") setChallenge(null);
      setProblem(p);
    }
  };

  if (challenge) {
    const attempts = detailValue<number>(problem, "attemptsRemaining");
    return (
      <form noValidate onSubmit={submitCode} className="flex flex-1 flex-col">
        <AuthHead step={t.stepCode} title={t.codeTitle} body={fmt(t.codeBody, { to: challenge.otpSentTo })} />
        {challenge.debugCode && <Note tone="accent">{fmt(t.debugCode, { code: challenge.debugCode })}</Note>}
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
            hint={codeLeft > 0 ? fmt(t.codeExpires, { s: codeLeft }) : t.codeExpired}
            className="[&_input]:font-mono [&_input]:text-[clamp(24px,2.4vw,44px)]! [&_input]:tracking-[0.4em]"
          />
        </FormGrid>
        {problem && (
          <div className="border-b border-line p-[clamp(12px,1.2vw,22px)]">
            <ProblemBox problem={problem}>{attempts !== undefined && <p className="t-mono-xs mt-1.5 text-accent">{fmt(t.attemptsLeft, { n: attempts })}</p>}</ProblemBox>
          </div>
        )}
        <SubmitRow label={t.confirm} busy={verifyState.isLoading} />
        <AuthLinks>
          <button type="button" className="link-line" disabled={loginState.isLoading} onClick={() => submitCredentials()}>
            {t.resendCode}
          </button>
          <button type="button" className="link-line" onClick={() => (setChallenge(null), setProblem(null))}>
            {t.useAnotherAccount}
          </button>
        </AuthLinks>
      </form>
    );
  }

  return (
    <form noValidate onSubmit={submitCredentials} className="flex flex-1 flex-col">
      <AuthHead step={t.stepSignIn} title={t.signInTitle} body={t.signInBody} />
      {search.get("expired") && <Note tone="accent">{t.sessionExpired}</Note>}
      <FormGrid cols={1}>
        <TextField label={t.phone} required type="tel" autoComplete="username" inputMode="tel" placeholder="0901 234 567" value={phone} onChange={(e) => setPhone(e.target.value)} error={phoneError || null} />
        <PasswordField label={t.password} required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={passwordError} showLabel={t.show} hideLabel={t.hide} />
      </FormGrid>
      {problem && (
        <div className="border-b border-line p-[clamp(12px,1.2vw,22px)]">
          <ProblemBox problem={problem} />
        </div>
      )}
      <SubmitRow label={t.signIn} busy={loginState.isLoading} />
      <AuthLinks>
        <LocaleLink href={`/forgot-password${phone ? `?phone=${encodeURIComponent(normalizePhone(phone))}` : ""}`} className="link-line">
          {t.forgot}
        </LocaleLink>
        <LocaleLink href="/activate" className="link-line">
          {t.activateLink}
        </LocaleLink>
      </AuthLinks>
    </form>
  );
}
