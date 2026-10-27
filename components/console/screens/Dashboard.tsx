"use client";

import { fmt } from "@/i18n/config";
import { useC } from "@/i18n/ConsoleI18nProvider";
import { isStaff } from "@/lib/console/permissions";
import LocaleLink from "../../LocaleLink";
import { useMe } from "../MeContext";
import { Empty } from "../kit/Feedback";
import { PageHead, Section } from "../kit/Layout";
import { navFor } from "../nav";
import { StaffOverview, TenantOverview } from "./overview";

/**
 * Home of the console. Staff: the building's figures (rooms, readings, billing, compliance — what the
 * account may see) and shortcuts; a resident: their room, what is owed and their papers.
 */
export default function Dashboard() {
  const c = useC();
  const me = useMe();
  const staff = isStaff(me.roles);
  const t = c.dashboard;
  const shortcuts = navFor(me, c.nav)
    .flatMap((g) => g.items)
    .filter((i) => i.href !== "/app" && i.href !== "/app/account");

  return (
    <>
      <PageHead kicker={staff ? t.kickerStaff : t.kickerTenant} title={fmt(t.hello, { name: me.fullName })}>
        {staff ? t.introStaff : me.residence ? fmt(t.introTenant, { room: me.residence.roomNumber ?? "—" }) : t.noResidence}
      </PageHead>
      {staff ? <StaffOverview /> : me.residence ? <TenantOverview /> : <Empty title={t.noResidenceTitle} body={t.noResidence} />}
      <Section title={t.shortcuts}>
        <ul className="ruled sm:grid-cols-2 lg:grid-cols-4">
          {shortcuts.map((s, i) => (
            <li key={s.href} className="bg-paper transition-colors hover:bg-paper-2">
              <LocaleLink href={s.href} className="group flex h-full items-end justify-between gap-4 px-[clamp(14px,1.4vw,26px)] py-[clamp(14px,1.4vw,26px)]">
                <span>
                  <span className="t-mono-xs block text-ink/40">[{String(i + 1).padStart(2, "0")}]</span>
                  <span className="t-h3 mt-3 block">{s.label}</span>
                </span>
                <span aria-hidden="true" className="text-ink/40 transition-transform group-hover:translate-x-1 group-hover:text-accent">
                  →
                </span>
              </LocaleLink>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
