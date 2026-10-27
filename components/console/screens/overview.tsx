"use client";

import { useC } from "@/i18n/ConsoleI18nProvider";
import { useMe } from "../MeContext";
import { Facts, Section } from "../kit/Layout";

/**
 * Dashboard bands. Each module adds the figures it owns (vacancies, renewals due, meter cycle, billing,
 * compliance); a band only shows when the account may read that data.
 */
export function StaffOverview() {
  const c = useC();
  const me = useMe();
  return (
    <Section title={c.dashboard.account}>
      <Facts
        items={[
          { label: c.account.roles, value: me.roles.map((r) => c.enums.role[r as keyof typeof c.enums.role] ?? r).join(", ") },
          { label: c.account.buildings, value: me.buildings.map((b) => b.name ?? b.id.slice(0, 8)).join(", ") || "—" },
          { label: c.account.phone, value: me.phoneMasked },
          { label: c.account.status, value: c.enums.userStatus[me.status] },
        ]}
      />
    </Section>
  );
}

export function TenantOverview() {
  const c = useC();
  const me = useMe();
  const r = me.residence!;
  return (
    <Section title={c.dashboard.residence}>
      <Facts
        items={[
          { label: c.dashboard.room, value: r.roomNumber ?? "—" },
          { label: c.dashboard.occupantRole, value: c.enums.occupantRole[r.occupantRole] },
          { label: c.account.phone, value: me.phoneMasked },
          { label: c.account.status, value: c.enums.userStatus[me.status] },
        ]}
      />
    </Section>
  );
}
