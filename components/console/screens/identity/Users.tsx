"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { fmt } from "@/i18n/config";
import { useC } from "@/i18n/ConsoleI18nProvider";
import { useLocale } from "@/i18n/I18nProvider";
import { useCreateUserMutation, useUsersQuery, type User } from "@/lib/console/endpoints/identity";
import { dateTime } from "@/lib/console/format";
import { useIdempotencyKey } from "@/lib/console/idempotency";
import type { ApiProblem } from "@/lib/console/problem";
import { useQueryState } from "@/lib/console/useQueryState";
import { isPhone, normalizePhone } from "@/lib/console/validation";
import { useMe } from "../../MeContext";
import { Btn } from "../../kit/Button";
import { Dialog } from "../../kit/Dialog";
import { Badge, Empty, ProblemBox } from "../../kit/Feedback";
import { CheckField, FilterSelect, FormGrid, TextField } from "../../kit/Field";
import { Actions, PageHead, Toolbar } from "../../kit/Layout";
import { Pager, RowLink, Table } from "../../kit/Table";
import { useToast } from "../../kit/Toast";

export const STAFF_ROLES = ["LANDLORD", "PROPERTY_MANAGER", "ACCOUNTANT", "GUARD"] as const;


export function userStatusTone(s: string) {
  return s === "ACTIVE" ? ("ok" as const) : s === "DISABLED" ? ("muted" as const) : ("accent" as const);
}

/** Staff & tenant accounts (landlord): list with role / status / building filters, create a staff account. */
export default function Users() {
  const c = useC();
  const t = c.users;
  const me = useMe();
  const locale = useLocale();
  const q = useQueryState();
  const [creating, setCreating] = useState(false);
  const list = useUsersQuery({ role: q.get("role") || undefined, status: q.get("status") || undefined, buildingId: q.get("building") || undefined, page: Number(q.get("page")) || 1 });
  const buildingName = (id: string) => me.buildings.find((b) => b.id === id)?.name ?? id.slice(0, 8);

  return (
    <>
      <PageHead
        kicker={t.kicker}
        title={t.title}
        actions={
          <Btn variant="accent" arrow onClick={() => setCreating(true)}>
            {t.create}
          </Btn>
        }
      >
        {t.intro}
      </PageHead>
      <Toolbar cols={3}>
        <FilterSelect label={t.role} value={q.get("role")} onChange={(e) => q.set({ role: e.target.value })}>
          <option value="">{c.common.all}</option>
          {[...STAFF_ROLES, "TENANT"].map((r) => (
            <option key={r} value={r}>
              {c.enums.role[r as keyof typeof c.enums.role]}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect label={t.status} value={q.get("status")} onChange={(e) => q.set({ status: e.target.value })}>
          <option value="">{c.common.all}</option>
          {(["PENDING_ACTIVATION", "ACTIVE", "DISABLED"] as const).map((s) => (
            <option key={s} value={s}>
              {c.enums.userStatus[s]}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect label={t.building} value={q.get("building")} onChange={(e) => q.set({ building: e.target.value })}>
          <option value="">{c.common.all}</option>
          {me.buildings.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name ?? b.id.slice(0, 8)}
            </option>
          ))}
        </FilterSelect>
      </Toolbar>
      {list.error && (
        <div className="border-b border-line p-4">
          <ProblemBox problem={list.error as ApiProblem} />
        </div>
      )}
      <Table<User>
        caption={t.title}
        rows={list.data?.items}
        loading={list.isFetching}
        rowKey={(u) => u.id}
        href={(u) => `/app/users/${u.id}`}
        empty={<Empty title={t.empty} />}
        columns={[
          { key: "name", head: t.name, cell: (u) => <RowLink href={`/app/users/${u.id}`}>{u.fullName}</RowLink> },
          { key: "phone", head: t.phone, cell: (u) => <span className="t-mono">{u.phoneMasked}</span> },
          {
            key: "roles",
            head: t.roles,
            cell: (u) => (
              <span className="flex flex-wrap gap-1">
                {u.roles.map((r) => (
                  <Badge key={r} tone={r === "TENANT" ? "muted" : "ok"}>
                    {c.enums.role[r as keyof typeof c.enums.role] ?? r}
                  </Badge>
                ))}
              </span>
            ),
          },
          { key: "buildings", head: t.buildings, cell: (u) => u.buildingIds.map(buildingName).join(", ") || "—", hideBelow: "lg" },
          { key: "status", head: t.status, cell: (u) => <Badge tone={userStatusTone(u.status)}>{c.enums.userStatus[u.status]}</Badge> },
          { key: "login", head: t.lastLogin, cell: (u) => dateTime(u.lastLoginAt, locale), hideBelow: "md" },
        ]}
      />
      <Pager pagination={list.data?.pagination} onPage={(p) => q.set({ page: p })} />
      <CreateUser open={creating} onClose={() => setCreating(false)} />
    </>
  );
}

function CreateUser({ open, onClose }: { open: boolean; onClose: () => void }) {
  const c = useC();
  const t = c.users;
  const me = useMe();
  const toast = useToast();
  const router = useRouter();
  const locale = useLocale();
  const idem = useIdempotencyKey();
  const [create, state] = useCreateUserMutation();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [buildings, setBuildings] = useState<string[]>(me.buildings.length === 1 ? [me.buildings[0].id] : []);
  const [touched, setTouched] = useState(false);
  const [problem, setProblem] = useState<ApiProblem | null>(null);

  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const errors = {
    fullName: !fullName.trim() ? c.validation.required : problem?.fields.fullName,
    phone: !phone.trim() ? c.validation.required : !isPhone(phone) ? c.validation.phone : problem?.fields.phone,
    roles: !roles.length ? t.pickRole : problem?.fields.roles,
    buildings: !buildings.length ? t.pickBuilding : problem?.fields.buildingIds,
  };
  const edit = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    idem.reset(); // a changed form is a new action
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setProblem(null);
    if (!fullName.trim() || !isPhone(phone) || !roles.length || !buildings.length) return;
    try {
      const user = await create({
        body: { fullName: fullName.trim(), phone: normalizePhone(phone), roles: roles as never, buildingIds: buildings },
        idempotencyKey: idem.key(),
      }).unwrap();
      idem.reset();
      toast(fmt(t.created, { name: user.fullName }));
      onClose();
      router.push(`/${locale}/app/users/${user.id}`);
    } catch (err) {
      setProblem(err as ApiProblem);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} kicker={t.kicker} title={t.create}>
      <form noValidate onSubmit={submit}>
        <p className="t-body border-b border-line px-[clamp(14px,1.4vw,26px)] py-3">{t.createIntro}</p>
        <FormGrid cols={2}>
          <TextField label={t.name} required value={fullName} onChange={(e) => edit(setFullName)(e.target.value)} error={touched ? errors.fullName : null} />
          <TextField label={t.phone} required type="tel" inputMode="tel" value={phone} onChange={(e) => edit(setPhone)(e.target.value)} error={touched ? errors.phone : null} />
        </FormGrid>
        <p className="t-mono-xs border-b border-line bg-paper-2 px-[clamp(14px,1.4vw,26px)] py-2 text-ink/60">
          {t.roles} {touched && errors.roles && <span className="ml-2 normal-case tracking-normal text-accent">{errors.roles}</span>}
        </p>
        <FormGrid cols={2}>
          {STAFF_ROLES.map((r) => (
            <CheckField key={r} label={c.enums.role[r]} hint={t.roleHints[r]} checked={roles.includes(r)} onChange={() => edit(setRoles)(toggle(roles, r))} />
          ))}
        </FormGrid>
        <p className="t-mono-xs border-b border-line bg-paper-2 px-[clamp(14px,1.4vw,26px)] py-2 text-ink/60">
          {t.buildings} {touched && errors.buildings && <span className="ml-2 normal-case tracking-normal text-accent">{errors.buildings}</span>}
        </p>
        <FormGrid cols={2}>
          {me.buildings.map((b) => (
            <CheckField key={b.id} label={b.name ?? b.id.slice(0, 8)} checked={buildings.includes(b.id)} onChange={() => edit(setBuildings)(toggle(buildings, b.id))} />
          ))}
        </FormGrid>
        {problem && (
          <div className="border-b border-line p-[clamp(12px,1.2vw,22px)]">
            <ProblemBox problem={problem} />
          </div>
        )}
        <Actions>
          <Btn onClick={onClose}>{c.common.cancel}</Btn>
          <Btn type="submit" variant="accent" busy={state.isLoading}>
            {t.createSubmit}
          </Btn>
        </Actions>
      </form>
    </Dialog>
  );
}
