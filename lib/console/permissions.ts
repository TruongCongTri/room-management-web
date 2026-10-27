/**
 * `me.permissions` ("resource:action:scope", e.g. "contracts:manage:department", "*:*:global") decide what the
 * console shows. The API enforces the same rules; this only hides what would be refused anyway.
 * `manage` covers every action; `*` any resource. Scope: own < department < global.
 */
export type Action = "manage" | "create" | "read" | "update" | "delete" | "execute" | "upload" | "approve" | "settle" | "export";
export type Scope = "own" | "department" | "global";

const RANK: Record<Scope, number> = { own: 0, department: 1, global: 2 };

type Rule = { resource: string; action: string; scope: Scope };

export function parsePermission(p: string): Rule | null {
  const [resource, action, scope] = p.split(":");
  if (!resource || !action || !(scope in RANK)) return null;
  return { resource, action, scope: scope as Scope };
}

/** Does any permission grant `action` on `resource` with at least `scope` (default: the building, "department")? */
export function can(permissions: readonly string[] | undefined, resource: string, action: Action, scope: Scope = "department"): boolean {
  for (const p of permissions ?? []) {
    const r = parsePermission(p);
    if (!r) continue;
    const resourceOk = r.resource === "*" || r.resource === "all" || r.resource === resource;
    const actionOk = r.action === "*" || r.action === "manage" || r.action === action;
    if (resourceOk && actionOk && RANK[r.scope] >= RANK[scope]) return true;
  }
  return false;
}

export const ROLES = ["LANDLORD", "PROPERTY_MANAGER", "ACCOUNTANT", "GUARD", "TENANT"] as const;
export type Role = (typeof ROLES)[number];
export const STAFF_ROLES: readonly Role[] = ["LANDLORD", "PROPERTY_MANAGER", "ACCOUNTANT", "GUARD"];

/** Staff work in the building console; an account with only the tenant role gets the resident pages. */
export const isStaff = (roles: readonly string[] | undefined) => (roles ?? []).some((r) => STAFF_ROLES.includes(r as Role));
export const hasRole = (roles: readonly string[] | undefined, role: Role) => (roles ?? []).includes(role);
