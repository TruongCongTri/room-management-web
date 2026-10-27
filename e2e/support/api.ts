import { request, type APIRequestContext } from "@playwright/test";
import { withOtpCooldown } from "./fixtures";
import { randomUUID } from "node:crypto";
import { ACCOUNTS, API, BUILDING_A, PASSWORD, type Role } from "./env";

/**
 * Direct API calls for test setup and assertions (records the scenario needs, values to compare the screen
 * with) — never what the test is about, which goes through the UI.
 */
export type Api = {
  get: <T = any>(path: string) => Promise<T>;
  post: <T = any>(path: string, body?: unknown, opts?: { idempotent?: boolean }) => Promise<T>;
  patch: <T = any>(path: string, body: unknown) => Promise<T>;
  raw: APIRequestContext;
  token: string;
};

const tokens = new Map<string, string>();

async function login(ctx: APIRequestContext, phone: string, password: string): Promise<string> {
  const res = await withOtpCooldown(() => ctx.post(`${API}/auth/login`, { data: { phone, password } }));
  const body = await res.json();
  if (res.status() === 202) {
    const mfa = await ctx.post(`${API}/auth/login/mfa`, { data: { challengeId: body.data.challengeId, code: body.data.debugCode } });
    return (await mfa.json()).data.accessToken;
  }
  if (res.status() !== 200) throw new Error(`login ${phone}: ${res.status()} ${JSON.stringify(body)}`);
  return body.data.accessToken;
}

export async function apiAs(who: Role | { phone: string; password?: string }, buildingId = BUILDING_A): Promise<Api> {
  const ctx = await request.newContext();
  const phone = typeof who === "string" ? ACCOUNTS[who] : who.phone;
  const password = typeof who === "string" ? PASSWORD : (who.password ?? PASSWORD);
  const key = `${phone}:${password}`;
  const token = tokens.get(key) ?? (await login(ctx, phone, password));
  tokens.set(key, token);
  const headers = (extra: Record<string, string> = {}) => ({ authorization: `Bearer ${token}`, "x-building-id": buildingId, "accept-language": "en", ...extra });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const unwrap = async (res: Awaited<ReturnType<APIRequestContext["get"]>>, what: string): Promise<any> => {
    if (res.status() === 204) return null;
    const body = (await res.json().catch(() => null)) as { data?: unknown } | null;
    if (!res.ok()) throw new Error(`${what}: ${res.status()} ${JSON.stringify(body)}`);
    return body?.data;
  };
  return {
    raw: ctx,
    token,
    get: async (path) => unwrap(await ctx.get(`${API}${path}`, { headers: headers() }), `GET ${path}`),
    post: async (path, body, opts) =>
      unwrap(await ctx.post(`${API}${path}`, { headers: headers(opts?.idempotent === false ? {} : { "idempotency-key": randomUUID() }), data: body ?? {} }), `POST ${path}`),
    patch: async (path, body) => unwrap(await ctx.patch(`${API}${path}`, { headers: headers(), data: body }), `PATCH ${path}`),
  };
}

/** A random Vietnamese mobile number that the seed doesn't use (prefix 097). */
export const randomPhone = () => `097${String(Math.floor(Math.random() * 1e7)).padStart(7, "0")}`;

/** OTP for activation / reset, echoed by the test API (AUTH_OTP_DEBUG_ECHO). */
export async function otpFor(phone: string, purpose: "ACTIVATE_ACCOUNT" | "RESET_PASSWORD"): Promise<string> {
  const ctx = await request.newContext();
  const res = await ctx.post(`${API}/auth/otp/request`, { data: { phone, purpose } });
  const body = await res.json();
  if (!body.data?.debugCode) throw new Error(`no debug code: ${res.status()} ${JSON.stringify(body)}`);
  return body.data.debugCode;
}

/** A new staff account in building A, already activated (through the API), for tests that sign out or lock it. */
export async function newStaff(role: "PROPERTY_MANAGER" | "ACCOUNTANT" | "GUARD", fullName = `E2E ${role}`): Promise<{ phone: string; password: string; id: string }> {
  const landlord = await apiAs("landlord");
  const phone = randomPhone();
  const user = await landlord.post("/users", { phone, fullName, roles: [role], buildingIds: [BUILDING_A] });
  const password = `e2e ${role.toLowerCase()} phrase ${Math.floor(Math.random() * 1e6)}`;
  const ctx = await request.newContext();
  const code = await otpFor(phone, "ACTIVATE_ACCOUNT");
  const res = await ctx.post(`${API}/auth/activate`, { data: { phone, code, newPassword: password } });
  if (!res.ok()) throw new Error(`activate ${phone}: ${res.status()} ${await res.text()}`);
  return { phone, password, id: user.id };
}
