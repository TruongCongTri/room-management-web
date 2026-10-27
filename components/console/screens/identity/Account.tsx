"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useDispatch } from "react-redux";
import { fmt, localizeHref } from "@/i18n/config";
import { useC } from "@/i18n/ConsoleI18nProvider";
import { useLocale } from "@/i18n/I18nProvider";
import { consoleApi } from "@/lib/console/api";
import { useChangePasswordMutation, useLogoutMutation, useRevokeSessionMutation, useSessionsQuery } from "@/lib/console/endpoints/identity";
import { dateTime } from "@/lib/console/format";
import { detailIssues, type ApiProblem } from "@/lib/console/problem";
import { passwordIssues } from "@/lib/console/validation";
import { useMe } from "../../MeContext";
import { Btn, TextAction } from "../../kit/Button";
import { Badge, ProblemBox } from "../../kit/Feedback";
import { FormGrid, PasswordField } from "../../kit/Field";
import { Actions, Facts, PageHead, Section } from "../../kit/Layout";
import { Table } from "../../kit/Table";
import { useToast } from "../../kit/Toast";

/** My account (doc 05 §6.2): who I am, password change, the devices signed in and signing them out. */
export default function Account() {
  const c = useC();
  const t = c.account;
  const me = useMe();
  const locale = useLocale();
  const router = useRouter();
  const dispatch = useDispatch();
  const toast = useToast();
  const sessions = useSessionsQuery();
  const [revoke, revokeState] = useRevokeSessionMutation();
  const [logout, logoutState] = useLogoutMutation();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState(false);
  const [problem, setProblem] = useState<ApiProblem | null>(null);
  const [change, changeState] = useChangePasswordMutation();
  const local = passwordIssues(next, confirm);
  const issueText = (i: string) => c.passwordIssues[i as keyof typeof c.passwordIssues] ?? i;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setProblem(null);
    if (!current || local.length) return;
    try {
      await change({ currentPassword: current, newPassword: next }).unwrap();
      setCurrent("");
      setNext("");
      setConfirm("");
      setTouched(false);
      toast(t.passwordChanged);
      sessions.refetch();
    } catch (err) {
      setProblem(err as ApiProblem);
    }
  };

  const signOutEverywhere = async () => {
    await logout({ everywhere: true }).unwrap().catch(() => null);
    dispatch(consoleApi.util.resetApiState());
    router.replace(localizeHref(locale, "/sign-in"));
  };

  const policy = problem?.code === "AUTH_PASSWORD_POLICY_VIOLATION" ? detailIssues(problem) : [];

  return (
    <>
      <PageHead kicker={t.kicker} title={me.fullName}>
        {t.intro}
      </PageHead>
      <Section title={t.profile}>
        <Facts
          items={[
            { label: t.phone, value: me.phoneMasked },
            { label: t.roles, value: me.roles.map((r) => c.enums.role[r as keyof typeof c.enums.role] ?? r).join(", ") },
            { label: t.status, value: <Badge tone={me.status === "ACTIVE" ? "ok" : "accent"}>{c.enums.userStatus[me.status]}</Badge> },
            { label: t.buildings, value: me.buildings.map((b) => b.name ?? b.id.slice(0, 8)).join(", ") || "—" },
          ]}
        />
      </Section>

      <Section title={t.password}>
        <form noValidate onSubmit={submit}>
          <FormGrid cols={3}>
            <PasswordField label={t.currentPassword} required autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} error={touched && !current ? c.validation.required : null} showLabel={c.auth.show} hideLabel={c.auth.hide} />
            <PasswordField
              label={t.newPassword}
              required
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              hint={c.auth.passwordRule}
              error={touched && local.some((i) => i !== "MISMATCH") ? issueText(local.find((i) => i !== "MISMATCH")!) : null}
              showLabel={c.auth.show}
              hideLabel={c.auth.hide}
            />
            <PasswordField label={t.confirmPassword} required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={touched && local.includes("MISMATCH") ? issueText("MISMATCH") : null} showLabel={c.auth.show} hideLabel={c.auth.hide} />
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
              </ProblemBox>
            </div>
          )}
          <Actions>
            <Btn type="submit" variant="solid" busy={changeState.isLoading}>
              {t.changePassword}
            </Btn>
          </Actions>
        </form>
      </Section>

      <Section
        title={t.devices}
        actions={
          <TextAction tone="accent" className="text-paper! hover:text-accent!" disabled={logoutState.isLoading} onClick={signOutEverywhere}>
            {c.shell.signOutEverywhere}
          </TextAction>
        }
      >
        {sessions.error && (
          <div className="p-4">
            <ProblemBox problem={sessions.error as ApiProblem} />
          </div>
        )}
        <Table
          caption={t.devices}
          rows={sessions.data}
          loading={sessions.isFetching}
          rowKey={(s) => s.id}
          columns={[
            {
              key: "device",
              head: t.device,
              cell: (s) => (
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{s.deviceName ?? t.unknownDevice}</span>
                  {s.current && <Badge tone="solid">{t.thisDevice}</Badge>}
                </span>
              ),
            },
            { key: "ip", head: t.ip, cell: (s) => <span className="t-mono">{s.ipAddress}</span>, hideBelow: "md" },
            { key: "created", head: t.signedIn, cell: (s) => dateTime(s.createdAt, locale), hideBelow: "lg" },
            { key: "used", head: t.lastUsed, cell: (s) => dateTime(s.lastUsedAt ?? s.createdAt, locale) },
            {
              key: "act",
              head: "",
              align: "right",
              cell: (s) =>
                s.current ? null : (
                  <TextAction
                    tone="accent"
                    disabled={revokeState.isLoading}
                    onClick={async () => {
                      await revoke(s.id).unwrap().catch(() => null);
                      toast(fmt(t.revoked, { device: s.deviceName ?? t.unknownDevice }));
                    }}
                  >
                    {t.revoke}
                  </TextAction>
                ),
            },
          ]}
        />
      </Section>
    </>
  );
}
