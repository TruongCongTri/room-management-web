import type { ConsoleDictionary } from "@/i18n/ConsoleI18nProvider";
import type { Me } from "@/lib/console/endpoints/identity";
import { can, hasRole, isStaff } from "@/lib/console/permissions";

/**
 * The console's navigation, built from the account's permissions (`me.permissions`), so each role sees its
 * own work: landlord everything, manager rooms / people / meters, accountant money and tax, guard the meter
 * round, a tenant their own room, contract, bills and papers.
 */
export type NavItem = { href: string; label: string; exact?: boolean };
export type NavGroup = { title: string; items: NavItem[] };

export function navFor(me: Me, t: ConsoleDictionary["nav"]): NavGroup[] {
  const p = me.permissions;
  const keep = (items: (NavItem | false)[]) => items.filter((i): i is NavItem => Boolean(i));

  if (!isStaff(me.roles)) {
    return [
      {
        title: t.groups.home,
        items: keep([
          { href: "/app", label: t.home, exact: true },
          { href: "/app/my/invoices", label: t.myInvoices },
          { href: "/app/my/room", label: t.myRoom },
          { href: "/app/my/contract", label: t.myContract },
          { href: "/app/my/readings", label: t.myReadings },
          { href: "/app/my/settlement", label: t.mySettlement },
          { href: "/app/my/documents", label: t.myDocuments },
          { href: "/app/my/profile", label: t.myProfile },
        ]),
      },
      { title: t.groups.account, items: [{ href: "/app/account", label: t.account }] },
    ];
  }

  const groups: NavGroup[] = [
    { title: t.groups.overview, items: [{ href: "/app", label: t.dashboard, exact: true }] },
    {
      title: t.groups.property,
      items: keep([
        can(p, "buildings", "read") && { href: "/app/buildings", label: t.buildings },
        can(p, "rooms", "read") && { href: "/app/rooms", label: t.rooms },
        can(p, "rooms", "read") && { href: "/app/room-types", label: t.roomTypes },
        can(p, "assets", "read") && { href: "/app/equipment", label: t.equipment },
        can(p, "contracts", "read") && { href: "/app/services", label: t.services },
      ]),
    },
    {
      title: t.groups.people,
      items: keep([can(p, "tenants", "read") && { href: "/app/tenants", label: t.tenants }, can(p, "contracts", "read") && { href: "/app/contracts", label: t.contracts }]),
    },
    {
      title: t.groups.operations,
      items: keep([
        can(p, "meters", "create") && { href: "/app/meters/round", label: t.meterRound },
        can(p, "meters", "read") && { href: "/app/meters", label: t.meters },
        can(p, "invoices", "read") && { href: "/app/billing", label: t.billing },
        can(p, "settlements", "read") && { href: "/app/checkout", label: t.checkout },
      ]),
    },
    {
      title: t.groups.compliance,
      items: keep([
        can(p, "compliance", "read") && { href: "/app/documents", label: t.documents },
        can(p, "compliance", "read") && { href: "/app/residency", label: t.residency },
        can(p, "compliance", "read") && { href: "/app/fire-safety", label: t.fireSafety },
        can(p, "tax", "export") && { href: "/app/tax", label: t.tax },
        can(p, "invoices", "read") && !hasRole(me.roles, "GUARD") && { href: "/app/e-invoices", label: t.eInvoices },
      ]),
    },
    {
      title: t.groups.admin,
      items: keep([can(p, "users", "manage", "global") && { href: "/app/users", label: t.users }, can(p, "audit", "read", "own") && { href: "/app/audit", label: t.audit }, { href: "/app/account", label: t.account }]),
    },
  ];
  return groups.filter((g) => g.items.length);
}

const matches = (pathname: string, item: NavItem) =>
  item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

/** The item for the current page: the longest matching href ("/app/meters/round" over "/app/meters"). */
export function activeHref(pathname: string, groups: NavGroup[]): string | null {
  let best: string | null = null;
  for (const g of groups) for (const i of g.items) if (matches(pathname, i) && (!best || i.href.length > best.length)) best = i.href;
  return best;
}
