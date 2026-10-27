"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { fmt } from "@/i18n/config";
import { useC } from "@/i18n/ConsoleI18nProvider";
import { useLocale } from "@/i18n/I18nProvider";
import { useUpdateUserMutation, useUserQuery, type User } from "@/lib/console/endpoints/identity";
import { dateTime } from "@/lib/console/format";
import type { ApiProblem } from "@/lib/console/problem";
import { useMe } from "../../MeContext";
import { Btn } from "../../kit/Button";
import { Badge, Loading, Note, ProblemBox } from "../../kit/Feedback";
import { CheckField, FormGrid, TextField } from "../../kit/Field";
import { Actions, Facts, PageHead, Section } from "../../kit/Layout";
import { useToast } from "../../kit/Toast";
import { STAFF_ROLES, userStatusTone } from "./Users";

/**
 * One account (landlord). Staff: name, roles, buildings and enable / disable, saved with the record's
 * `version` (409 RES_CONCURRENCY_CONFLICT = someone else changed it: reload). Tenant accounts are created by
 * move-in and only their status can change here.
 */
export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const c = useC();
  const t = c.users;
  const locale = useLocale();
  const user = useUserQuery(id);

  if (user.error) {
    return (
      <>
        <PageHead back={{ href: "/app/users", label: t.title }} title={t.title} />
        <div className="p-4">
          <ProblemBox problem={user.error as ApiProblem} />
        </div>
      </>
    );
  }
  if (!user.data) return <Loading />;
  const u = user.data;
  const tenantOnly = u.roles.every((r) => r === "TENANT");

  return (
    <>
      <PageHead back={{ href: "/app/users", label: t.title }} kicker={t.kicker} title={u.fullName} actions={<Badge tone={userStatusTone(u.status)}>{c.enums.userStatus[u.status]}</Badge>} />
      <Section title={t.account}>
        <Facts
          items={[
            { label: t.phone, value: <span className="t-mono">{u.phoneMasked}</span> },
            { label: t.roles, value: u.roles.map((r) => c.enums.role[r as keyof typeof c.enums.role] ?? r).join(", ") },
            { label: t.lastLogin, value: dateTime(u.lastLoginAt, locale) },
            { label: t.createdAt, value: dateTime(u.createdAt, locale) },
          ]}
        />
      </Section>
      {tenantOnly ? <TenantAccount user={u} /> : <StaffForm user={u} />}
    </>
  );
}

function TenantAccount({ user }: { user: User }) {
  const c = useC();
  const t = c.users;
  const toast = useToast();
  const [update, state] = useUpdateUserMutation();
  const [problem, setProblem] = useState<ApiProblem | null>(null);
  const disabled = user.status === "DISABLED";
  const toggle = async () => {
    setProblem(null);
    try {
      await update({ id: user.id, body: { status: disabled ? "ACTIVE" : "DISABLED", version: user.version } }).unwrap();
      toast(disabled ? t.enabled : t.disabled);
    } catch (err) {
      setProblem(err as ApiProblem);
    }
  };
  return (
    <Section title={t.access}>
      <Note>{t.tenantNote}</Note>
      {problem && (
        <div className="border-b border-line p-4">
          <ProblemBox problem={problem} />
        </div>
      )}
      <Actions>
        {user.status !== "PENDING_ACTIVATION" && (
          <Btn variant={disabled ? "solid" : "danger"} busy={state.isLoading} onClick={toggle}>
            {disabled ? t.enable : t.disable}
          </Btn>
        )}
      </Actions>
    </Section>
  );
}

function StaffForm({ user }: { user: User }) {
  const c = useC();
  const t = c.users;
  const me = useMe();
  const toast = useToast();
  const [update, state] = useUpdateUserMutation();
  const [fullName, setFullName] = useState(user.fullName);
  const [roles, setRoles] = useState<string[]>(user.roles.filter((r) => r !== "TENANT"));
  const [buildings, setBuildings] = useState<string[]>(user.buildingIds);
  const [problem, setProblem] = useState<ApiProblem | null>(null);

  // a fresh copy from the API (after save or reload) resets the form
  useEffect(() => {
    setFullName(user.fullName);
    setRoles(user.roles.filter((r) => r !== "TENANT"));
    setBuildings(user.buildingIds);
  }, [user]);

  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const self = user.id === me.id;
  const otherBuildings = user.buildingIds.filter((id) => !me.buildings.some((b) => b.id === id));

  const save = async (body: Parameters<typeof update>[0]["body"], done: string) => {
    setProblem(null);
    try {
      await update({ id: user.id, body: { ...body, version: user.version } }).unwrap();
      toast(done);
    } catch (err) {
      setProblem(err as ApiProblem);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !roles.length || !buildings.length) return;
    save({ fullName: fullName.trim(), roles: roles as never, buildingIds: buildings }, fmt(t.saved, { name: fullName.trim() }));
  };

  return (
    <>
      <Section title={t.edit}>
        <form noValidate onSubmit={submit}>
          <FormGrid cols={1}>
            <TextField label={t.name} required value={fullName} onChange={(e) => setFullName(e.target.value)} error={!fullName.trim() ? c.validation.required : problem?.fields.fullName} />
          </FormGrid>
          <p className="t-mono-xs border-b border-line bg-paper-2 px-[clamp(14px,1.4vw,26px)] py-2 text-ink/60">{t.roles}</p>
          <FormGrid cols={2}>
            {STAFF_ROLES.map((r) => (
              <CheckField key={r} label={c.enums.role[r]} hint={t.roleHints[r]} checked={roles.includes(r)} disabled={self && r === "LANDLORD"} onChange={() => setRoles(toggle(roles, r))} />
            ))}
          </FormGrid>
          <p className="t-mono-xs border-b border-line bg-paper-2 px-[clamp(14px,1.4vw,26px)] py-2 text-ink/60">{t.buildings}</p>
          <FormGrid cols={2}>
            {me.buildings.map((b) => (
              <CheckField key={b.id} label={b.name ?? b.id.slice(0, 8)} checked={buildings.includes(b.id)} onChange={() => setBuildings(toggle(buildings, b.id))} />
            ))}
          </FormGrid>
          {otherBuildings.length > 0 && <Note>{fmt(t.otherBuildings, { n: otherBuildings.length })}</Note>}
          {problem && (
            <div className="border-b border-line p-4">
              <ProblemBox problem={problem}>
                {problem.code === "RES_CONCURRENCY_CONFLICT" && <p className="t-mono-xs mt-1.5 text-accent">{c.common.reloadHint}</p>}
              </ProblemBox>
            </div>
          )}
          <Actions>
            <Btn type="submit" variant="solid" busy={state.isLoading} disabled={!roles.length || !buildings.length}>
              {c.common.save}
            </Btn>
          </Actions>
        </form>
      </Section>
      {!self && (
        <Section title={t.access}>
          <Note>{user.status === "DISABLED" ? t.disabledNote : t.disableNote}</Note>
          <Actions>
            {user.status === "DISABLED" ? (
              <Btn variant="solid" busy={state.isLoading} onClick={() => save({ status: "ACTIVE" }, t.enabled)}>
                {t.enable}
              </Btn>
            ) : (
              <Btn variant="danger" busy={state.isLoading} onClick={() => save({ status: "DISABLED" }, t.disabled)}>
                {t.disable}
              </Btn>
            )}
          </Actions>
        </Section>
      )}
    </>
  );
}
