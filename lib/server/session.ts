import "server-only";
import type { components } from "../api/generated/schema";
import { backend } from "./backend";

/**
 * The browser never sees a token. The access and refresh tokens live in httpOnly cookies that are only
 * sent to this app's /api routes; pages only see `rm_sess`, a marker that a session exists, which carries no secret.
 *
 * Refresh tokens rotate on every use and the API revokes the session when one is used twice
 * (AUTH_REFRESH_TOKEN_REUSED). A page fires several requests at once, so after the access token expires they
 * would all try to refresh: `refreshOnce` lets the first one call the API and hands its result to the others
 * (and to any request carrying the same old token for a short while after).
 */

export type TokenPair = components["schemas"]["TokenPairDto"];

export const COOKIE = {
  access: "rm_at",
  refresh: "rm_rt",
  session: "rm_sess",
  device: "rm_dev",
} as const;

const secure = process.env.NODE_ENV === "production";
/** Seconds before expiry at which an access token is refreshed before use (clock skew, slow upstream). */
export const REFRESH_LEEWAY_S = 30;

type CookieOptions = { httpOnly: boolean; secure: boolean; sameSite: "lax" | "strict"; path: string; maxAge: number };
export type CookieWrite = { name: string; value: string; options: CookieOptions };

const base = { httpOnly: true, secure, sameSite: "lax" as const };

/** Cookies that store a fresh token pair. */
export function tokenCookies(pair: TokenPair, now = Date.now()): CookieWrite[] {
  const refreshMaxAge = Math.max(0, Math.floor((Date.parse(pair.refreshTokenExpiresAt) - now) / 1000));
  return [
    { name: COOKIE.access, value: pair.accessToken, options: { ...base, path: "/api", maxAge: pair.accessTokenExpiresIn } },
    { name: COOKIE.refresh, value: pair.refreshToken, options: { ...base, sameSite: "strict", path: "/api", maxAge: refreshMaxAge } },
    { name: COOKIE.session, value: "1", options: { ...base, path: "/", maxAge: refreshMaxAge } },
  ];
}

/** Cookies that end the session on this device (the device id stays). */
export function clearedCookies(): CookieWrite[] {
  return [
    { name: COOKIE.access, value: "", options: { ...base, path: "/api", maxAge: 0 } },
    { name: COOKIE.refresh, value: "", options: { ...base, sameSite: "strict", path: "/api", maxAge: 0 } },
    { name: COOKIE.session, value: "", options: { ...base, path: "/", maxAge: 0 } },
  ];
}

/** A stable id for this browser, sent as `deviceId` at sign-in so the sessions list can tell devices apart. */
export function deviceCookie(id: string): CookieWrite {
  return { name: COOKIE.device, value: id, options: { ...base, path: "/api", maxAge: 60 * 60 * 24 * 400 } };
}

/** `exp` of a JWT in ms, without verifying it (the API verifies; this only decides when to refresh). */
export function tokenExpiry(jwt: string | undefined): number | null {
  const payload = jwt?.split(".")[1];
  if (!payload) return null;
  try {
    const json = JSON.parse(Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
    return typeof json.exp === "number" ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

/** True when the access token is missing, unreadable or expires within the leeway. */
export function needsRefresh(accessToken: string | undefined, now = Date.now()): boolean {
  const exp = tokenExpiry(accessToken);
  return exp === null || exp - now <= REFRESH_LEEWAY_S * 1000;
}

/** Outcome of a refresh: the new pair, or the API's error (status + envelope) to hand back to the browser. */
export type RefreshResult = { ok: true; pair: TokenPair } | { ok: false; status: number; body: unknown };

/** How long the result of a refresh is reused for requests that still carry the old refresh token. */
export const REFRESH_REUSE_MS = 30_000;

const inFlight = new Map<string, Promise<RefreshResult>>();
const recent = new Map<string, { at: number; result: RefreshResult }>();

export type RefreshCall = (refreshToken: string, forwardedFor: string | null) => Promise<RefreshResult>;

/** POST /auth/refresh on the API. */
export const callRefresh: RefreshCall = async (refreshToken, forwardedFor) => {
  const res = await fetch(backend.url("/auth/refresh"), {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json", ...(forwardedFor ? { "x-forwarded-for": forwardedFor } : {}) },
    body: JSON.stringify({ refreshToken }),
    signal: AbortSignal.timeout(backend.timeoutMs),
  });
  const body = await res.json().catch(() => null);
  if (res.ok && body?.data?.accessToken) return { ok: true, pair: body.data as TokenPair };
  return { ok: false, status: res.status, body };
};

/** Single-flight refresh keyed by the refresh token being exchanged. */
export async function refreshOnce(refreshToken: string, forwardedFor: string | null, call: RefreshCall = callRefresh, now = Date.now()): Promise<RefreshResult> {
  for (const [key, entry] of recent) if (now - entry.at > REFRESH_REUSE_MS) recent.delete(key);
  const done = recent.get(refreshToken);
  if (done) return done.result;
  const running = inFlight.get(refreshToken);
  if (running) return running;
  const promise = call(refreshToken, forwardedFor)
    .then((result) => {
      recent.set(refreshToken, { at: Date.now(), result });
      return result;
    })
    .finally(() => inFlight.delete(refreshToken));
  inFlight.set(refreshToken, promise);
  return promise;
}

/** Test hook: forget every in-flight and recent refresh. */
export function resetRefreshState() {
  inFlight.clear();
  recent.clear();
}
