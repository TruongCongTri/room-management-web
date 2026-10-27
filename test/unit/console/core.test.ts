import { describe, expect, it } from "vitest";
import en from "@/i18n/console/en.json";
import { activeHref, navFor } from "@/components/console/nav";
import { safeNext } from "@/components/console/auth/SignIn";
import { pickBuilding } from "@/components/console/Shell";
import type { Me } from "@/lib/console/endpoints/identity";
import { can, isStaff, parsePermission } from "@/lib/console/permissions";
import { detailIssues, detailValue, parseRetryAfter, toProblem } from "@/lib/console/problem";
import { isOtp, isPhone, normalizePhone, passwordIssues } from "@/lib/console/validation";

/** Permissions as the API seeds them per role (rental-permissions.ts). */
const PERMS = {
  LANDLORD: ["*:*:global"],
  PROPERTY_MANAGER: ["rooms:manage:department", "assets:manage:department", "tenants:manage:department", "contracts:manage:department", "deposits:read:department", "meters:manage:department", "invoices:read:department", "settlements:execute:department", "settlements:read:department", "compliance:manage:department", "audit:read:department"],
  ACCOUNTANT: ["rooms:read:department", "assets:read:department", "tenants:read:department", "contracts:read:department", "meters:read:department", "meters:approve:department", "invoices:manage:department", "payments:manage:department", "deposits:settle:department", "deposits:read:department", "settlements:execute:department", "settlements:read:department", "tax:export:department", "compliance:read:department", "audit:read:department"],
  GUARD: ["rooms:read:department", "meters:upload:department", "meters:create:department", "meters:read:department", "audit:read:own"],
  TENANT: ["tenants:read:own", "rooms:read:own", "assets:read:own", "contracts:read:own", "invoices:read:own", "payments:read:own", "meters:read:own", "settlements:read:own", "compliance:read:own", "audit:read:own"],
} as const;

const me = (role: keyof typeof PERMS, over: Partial<Me> = {}): Me => ({
  id: "u",
  fullName: "U",
  phoneMasked: "090****001",
  status: "ACTIVE",
  roles: [role],
  activeBuildingId: "b1",
  buildings: [{ id: "b1", name: "A" }],
  permissions: [...PERMS[role]],
  residence: null,
  ...over,
});

describe("permissions", () => {
  it("should read resource:action:scope and refuse malformed entries", () => {
    expect(parsePermission("rooms:read:department")).toEqual({ resource: "rooms", action: "read", scope: "department" });
    expect(parsePermission("rooms:read")).toBeNull();
    expect(parsePermission("rooms:read:planet")).toBeNull();
    expect(can(["rooms:read"], "rooms", "read")).toBe(false);
  });

  it("should treat manage and * as every action, and compare scopes", () => {
    expect(can(PERMS.LANDLORD, "users", "manage", "global")).toBe(true);
    expect(can(PERMS.PROPERTY_MANAGER, "contracts", "update")).toBe(true);
    expect(can(PERMS.PROPERTY_MANAGER, "users", "manage", "global")).toBe(false);
    expect(can(PERMS.ACCOUNTANT, "contracts", "update")).toBe(false);
    expect(can(PERMS.ACCOUNTANT, "meters", "approve")).toBe(true);
    // a tenant's own scope never passes a building-wide check
    expect(can(PERMS.TENANT, "rooms", "read")).toBe(false);
    expect(can(PERMS.TENANT, "rooms", "read", "own")).toBe(true);
    expect(can(undefined, "rooms", "read")).toBe(false);
  });

  it("should tell staff from residents", () => {
    expect(isStaff(["GUARD"])).toBe(true);
    expect(isStaff(["TENANT"])).toBe(false);
    expect(isStaff(["TENANT", "ACCOUNTANT"])).toBe(true);
  });
});

describe("navigation per role", () => {
  const hrefs = (role: keyof typeof PERMS) => navFor(me(role), en.nav).flatMap((g) => g.items.map((i) => i.href));

  it("should give the landlord everything, including accounts and tax", () => {
    expect(hrefs("LANDLORD")).toEqual(expect.arrayContaining(["/app/users", "/app/tax", "/app/buildings", "/app/meters/round", "/app/audit"]));
  });

  it("should keep accounts, buildings and tax away from the manager", () => {
    const h = hrefs("PROPERTY_MANAGER");
    expect(h).toEqual(expect.arrayContaining(["/app/rooms", "/app/contracts", "/app/meters/round", "/app/documents"]));
    expect(h).not.toContain("/app/users");
    expect(h).not.toContain("/app/tax");
    expect(h).not.toContain("/app/buildings");
  });

  it("should give the accountant money and tax but not the meter round", () => {
    const h = hrefs("ACCOUNTANT");
    expect(h).toEqual(expect.arrayContaining(["/app/billing", "/app/tax", "/app/e-invoices", "/app/meters"]));
    expect(h).not.toContain("/app/meters/round");
  });

  it("should give the guard the round, the rooms and the readings only", () => {
    expect(hrefs("GUARD").sort()).toEqual(["/app", "/app/account", "/app/audit", "/app/meters", "/app/meters/round", "/app/rooms", "/app/room-types"].sort());
  });

  it("should give a resident their own pages only", () => {
    const h = hrefs("TENANT");
    expect(h).toEqual(expect.arrayContaining(["/app", "/app/my/invoices", "/app/my/room", "/app/my/documents", "/app/account"]));
    expect(h.some((x) => !x.startsWith("/app/my") && x !== "/app" && x !== "/app/account")).toBe(false);
  });

  it("should mark the most specific item active", () => {
    const groups = navFor(me("LANDLORD"), en.nav);
    expect(activeHref("/app/meters/round", groups)).toBe("/app/meters/round");
    expect(activeHref("/app/meters/abc-123", groups)).toBe("/app/meters");
    expect(activeHref("/app", groups)).toBe("/app");
    expect(activeHref("/app/contracts/x/y", groups)).toBe("/app/contracts");
    expect(activeHref("/app/nowhere", groups)).toBeNull();
  });
});

describe("building choice", () => {
  const m = me("LANDLORD", { activeBuildingId: "b1", buildings: [{ id: "b1", name: "A" }, { id: "b2", name: "B" }] });
  it("should prefer the browser's last building when the account still has it", () => {
    expect(pickBuilding(m, "b2")).toBe("b2");
    expect(pickBuilding(m, "gone")).toBe("b1");
    expect(pickBuilding(m, null)).toBe("b1");
    expect(pickBuilding({ ...m, activeBuildingId: null }, null)).toBe("b1");
    expect(pickBuilding({ ...m, buildings: [] }, null)).toBeNull();
  });
});

describe("sign-in redirect", () => {
  it("should only follow console paths of the same locale", () => {
    expect(safeNext("/vi/app/contracts?status=ACTIVE", "vi")).toBe("/vi/app/contracts?status=ACTIVE");
    expect(safeNext("https://evil.test/vi/app", "vi")).toBe("/vi/app");
    expect(safeNext("//evil.test/vi/app", "vi")).toBe("/vi/app");
    expect(safeNext("/en/app", "vi")).toBe("/vi/app");
    expect(safeNext("/vi/contact-us", "vi")).toBe("/vi/app");
    expect(safeNext(null, "en")).toBe("/en/app");
  });
});

describe("problems", () => {
  it("should read the API's error envelope, fields and trace id", () => {
    const p = toProblem(
      409,
      { error: { code: "RES_ALREADY_EXISTS", message: "Đã tồn tại", status: 409, details: [{ field: "roomNumber", issue: "DUPLICATE", message: "Số phòng đã có" }, { field: "roomNumber", message: "second" }, { tenantId: "t1" }] }, meta: { traceId: "tr-1" } },
      "5",
    );
    expect(p).toMatchObject({ status: 409, code: "RES_ALREADY_EXISTS", message: "Đã tồn tại", traceId: "tr-1", retryAfter: 5, fields: { roomNumber: "Số phòng đã có" } });
    expect(detailValue(p, "tenantId")).toBe("t1");
    expect(detailValue(p, "missing")).toBeUndefined();
  });

  it("should accept a single details object and list password issues", () => {
    const p = toProblem(422, { error: { code: "AUTH_PASSWORD_POLICY_VIOLATION", details: [{ field: "newPassword", issue: "TOO_SHORT" }, { field: "newPassword", issue: "COMMON_PASSWORD" }] } });
    expect(detailIssues(p)).toEqual(["TOO_SHORT", "COMMON_PASSWORD"]);
    expect(detailValue(toProblem(409, { error: { code: "X", details: { allowed: ["SUBMITTED"] } } }), "allowed")).toEqual(["SUBMITTED"]);
  });

  it("should survive bodies without the envelope and network failures", () => {
    expect(toProblem(502, "<html>bad gateway</html>")).toMatchObject({ code: "HTTP_502", message: "", fields: {} });
    expect(toProblem("FETCH_ERROR", null)).toMatchObject({ status: 0, code: "NETWORK_ERROR", offline: true });
    expect(toProblem("TIMEOUT_ERROR", null)).toMatchObject({ code: "REQ_TIMEOUT" });
  });

  it("should read Retry-After as seconds or as a date", () => {
    expect(parseRetryAfter("120")).toBe(120);
    expect(parseRetryAfter(null)).toBeUndefined();
    expect(parseRetryAfter("soon")).toBeUndefined();
    const inAMinute = new Date(Date.now() + 60_000).toUTCString();
    expect(parseRetryAfter(inAMinute)).toBeGreaterThanOrEqual(58);
  });
});

describe("input rules", () => {
  it("should accept Vietnamese mobile numbers the way the API does", () => {
    for (const ok of ["0901000002", "+84901000002", "0901 000 002", "0521234567", "0387654321"]) expect(isPhone(ok)).toBe(true);
    for (const bad of ["0123456789", "12345", "05|1234567", "+1 555 0100", "090100000"]) expect(isPhone(bad)).toBe(false);
    expect(normalizePhone("+84 (901) 000-002")).toBe("+84901000002");
  });

  it("should check a new password like the API (length, phone, repeat)", () => {
    expect(passwordIssues("short", "short")).toEqual(["TOO_SHORT"]);
    expect(passwordIssues("a long enough phrase", "a long enough phrase")).toEqual([]);
    expect(passwordIssues("mật khẩu ≥ 10 ký tự", "mật khẩu ≥ 10 ký tự")).toEqual([]);
    expect(passwordIssues("my 000002 secret", "my 000002 secret", "0901000002")).toEqual(["CONTAINS_PHONE_NUMBER"]);
    expect(passwordIssues("a long enough phrase", "a long enough phrasE")).toEqual(["MISMATCH"]);
    expect(passwordIssues("x".repeat(129), "x".repeat(129))).toEqual(["TOO_LONG"]);
  });

  it("should take 6-digit codes only", () => {
    expect(isOtp("123456")).toBe(true);
    expect(isOtp(" 123456 ")).toBe(true);
    expect(isOtp("12345")).toBe(false);
    expect(isOtp("12345a")).toBe(false);
  });
});
