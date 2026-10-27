import "server-only";
import { randomUUID } from "node:crypto";
import { backend } from "./backend";
import { clearedCookies, needsRefresh, refreshOnce, tokenCookies, type CookieWrite, type RefreshCall, type RefreshResult } from "./session";

/**
 * Backend-for-frontend forwarding: one browser request → one API request (plus at most one token refresh).
 * Kept free of Next types so it can be tested with plain objects; the route handlers adapt it.
 */

export type Incoming = {
  method: string;
  /** API path after /api/v1, e.g. "/properties/rooms" */
  path: string;
  /** "?page=2" or "" */
  search: string;
  headers: Headers;
  body: ArrayBuffer | null;
  accessToken?: string;
  refreshToken?: string;
};

export type Outgoing = { status: number; headers: Headers; body: BodyInit | null; cookies: CookieWrite[] };

export type ForwardDeps = { fetch: typeof fetch; refresh: RefreshCall; now: () => number };

/** Request headers the browser may pass on to the API. Everything else (cookies, host…) stays here. */
const PASS_REQUEST = ["accept", "accept-language", "content-type", "idempotency-key", "x-building-id", "if-none-match", "if-match", "x-request-id"];
/** Response headers handed back to the browser. */
const PASS_RESPONSE = ["content-type", "content-disposition", "retry-after", "etag", "cache-control", "x-request-id", "x-trace-id", "location", "last-modified"];

/** Routes that issue or end sessions: only /api/auth/* may call them, never the generic forwarder. */
export const SESSION_ROUTES = /^\/auth\/(login|login\/mfa|refresh|activate|logout|logout-all)\/?$/;

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);
export const CSRF_HEADER = "x-rm-csrf";

/** An error in the API's own envelope, so the browser handles every failure the same way. */
export function problem(status: number, code: string, message: string, path: string, extra: Record<string, unknown> = {}): Outgoing {
  const body = JSON.stringify({
    error: { code, message, status, ...extra },
    meta: { traceId: randomUUID(), timestamp: new Date().toISOString(), path: `/api/v1${path}` },
  });
  return { status, headers: new Headers({ "content-type": "application/json; charset=utf-8" }), body, cookies: [] };
}

/**
 * Mutations must come from this site's own pages: same Origin (when the browser sends one) and the custom
 * header that only our fetch code sets (a cross-site form or image can't). Session cookies are SameSite too.
 */
export function csrfRejected(method: string, headers: Headers, selfOrigin: string): boolean {
  if (!MUTATING.has(method)) return false;
  if (headers.get(CSRF_HEADER) !== "1") return true;
  const origin = headers.get("origin");
  return Boolean(origin && origin !== selfOrigin);
}

/** The visitor's address chain for the API's per-IP limits (the API trusts this server as its proxy). */
export function forwardedFor(headers: Headers): string | null {
  return headers.get("x-forwarded-for") ?? headers.get("x-real-ip");
}

function upstreamHeaders(incoming: Headers, accessToken: string | undefined): Headers {
  const h = new Headers();
  for (const name of PASS_REQUEST) {
    const v = incoming.get(name);
    if (v) h.set(name, v);
  }
  if (!h.has("accept")) h.set("accept", "application/json");
  if (accessToken) h.set("authorization", `Bearer ${accessToken}`);
  const xff = forwardedFor(incoming);
  if (xff) h.set("x-forwarded-for", xff);
  return h;
}

async function errorCode(res: Response): Promise<string | undefined> {
  if (!(res.headers.get("content-type") ?? "").includes("json")) return undefined;
  const body = await res
    .clone()
    .json()
    .catch(() => null);
  return body?.error?.code;
}

const SIGN_OUT_CODES = new Set(["AUTH_SESSION_REVOKED", "AUTH_REFRESH_TOKEN_REUSED", "AUTH_TOKEN_INVALID", "AUTH_UNAUTHORIZED", "AUTH_ACCOUNT_DISABLED"]);

/** Forward one request. Refreshes the access token first when it is about to expire, or once after a 401 AUTH_TOKEN_EXPIRED. */
export async function forward(req: Incoming, deps: ForwardDeps = { fetch, refresh: (rt, xff) => refreshOnce(rt, xff), now: Date.now }): Promise<Outgoing> {
  if (!backend.configured()) return problem(503, "SYS_SERVICE_UNAVAILABLE", "BACKEND_API_URL is not configured", req.path);

  const cookies: CookieWrite[] = [];
  let access = req.accessToken;
  let refreshed = false;
  const xff = forwardedFor(req.headers);

  const refresh = async (): Promise<Outgoing | null> => {
    if (!req.refreshToken || refreshed) return null;
    refreshed = true;
    let result: RefreshResult;
    try {
      result = await deps.refresh(req.refreshToken, xff);
    } catch {
      return problem(503, "SYS_SERVICE_UNAVAILABLE", "The service is unreachable. Try again in a moment.", req.path);
    }
    if (result.ok) {
      access = result.pair.accessToken;
      cookies.push(...tokenCookies(result.pair, deps.now()));
      return null;
    }
    // refresh refused: the session is over on this device
    const out: Outgoing = {
      status: result.status,
      headers: new Headers({ "content-type": "application/json; charset=utf-8" }),
      body: JSON.stringify(result.body),
      cookies: clearedCookies(),
    };
    return result.status >= 500 ? { ...out, cookies: [] } : out;
  };

  if (req.refreshToken && needsRefresh(access, deps.now())) {
    const failed = await refresh();
    if (failed) return failed;
  }

  const send = () =>
    deps.fetch(backend.url(req.path) + req.search, {
      method: req.method,
      headers: upstreamHeaders(req.headers, access),
      body: req.body && req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
      redirect: "manual",
      signal: AbortSignal.timeout(backend.timeoutMs),
    });

  let res: Response;
  try {
    res = await send();
    if (res.status === 401 && (await errorCode(res)) === "AUTH_TOKEN_EXPIRED" && req.refreshToken && !refreshed) {
      const failed = await refresh();
      if (failed) return failed;
      res = await send();
    }
  } catch (e) {
    const timedOut = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
    return timedOut
      ? problem(504, "REQ_TIMEOUT", "The service took too long to answer.", req.path)
      : problem(503, "SYS_SERVICE_UNAVAILABLE", "The service is unreachable. Try again in a moment.", req.path);
  }

  if (res.status === 401 && SIGN_OUT_CODES.has((await errorCode(res)) ?? "")) cookies.push(...clearedCookies());

  const headers = new Headers();
  for (const name of PASS_RESPONSE) {
    const v = res.headers.get(name);
    if (v) headers.set(name, v);
  }
  if (!headers.has("cache-control")) headers.set("cache-control", "no-store");
  const empty = res.status === 204 || res.status === 304 || req.method === "HEAD";
  return { status: res.status, headers, body: empty ? null : res.body, cookies };
}
