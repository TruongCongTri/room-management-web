import { beforeAll, describe, expect, it, vi } from "vitest";
import type { ForwardDeps, Incoming } from "@/lib/server/forward";
import type { RefreshResult } from "@/lib/server/session";

// the backend URL is read when lib/server/backend.ts loads
let forward: typeof import("@/lib/server/forward").forward;
let csrfRejected: typeof import("@/lib/server/forward").csrfRejected;
let SESSION_ROUTES: RegExp;
beforeAll(async () => {
  vi.stubEnv("BACKEND_API_URL", "http://api.test/api/v1/");
  ({ forward, csrfRejected, SESSION_ROUTES } = await import("@/lib/server/forward"));
});

const NOW = 1_800_000_000_000;
const jwt = (secondsLeft: number) => `h.${Buffer.from(JSON.stringify({ exp: Math.floor(NOW / 1000) + secondsLeft })).toString("base64url")}.s`;
const FRESH = jwt(600);
const EXPIRING = jwt(5);

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });

const req = (over: Partial<Incoming> = {}): Incoming => ({
  method: "GET",
  path: "/properties/rooms",
  search: "?page=2",
  headers: new Headers({ "accept-language": "vi-VN", "x-building-id": "b1", cookie: "rm_at=secret", host: "web.test", "x-forwarded-for": "203.0.113.9" }),
  body: null,
  accessToken: FRESH,
  refreshToken: "RT1",
  ...over,
});

const newPair = { accessToken: "AT2", refreshToken: "RT2", accessTokenExpiresIn: 900, refreshTokenExpiresAt: new Date(NOW + 7 * 864e5).toISOString() };

function deps(responses: (Response | Error)[], refresh: RefreshResult | Error = { ok: true, pair: newPair as never }) {
  const fetch = vi.fn(async () => {
    const r = responses.shift();
    if (!r) throw new Error("no more responses");
    if (r instanceof Error) throw r;
    return r;
  });
  const doRefresh = vi.fn(async () => {
    if (refresh instanceof Error) throw refresh;
    return refresh;
  });
  return { d: { fetch, refresh: doRefresh, now: () => NOW } as unknown as ForwardDeps, fetch, doRefresh };
}

const sentHeaders = (fetch: ReturnType<typeof vi.fn>, call = 0) => (fetch.mock.calls[call] as unknown as [string, RequestInit])[1].headers as Headers;

describe("csrfRejected", () => {
  it("should let reads through and require the site's header and origin on mutations", () => {
    const h = (o: Record<string, string>) => new Headers(o);
    expect(csrfRejected("GET", h({}), "http://web.test")).toBe(false);
    expect(csrfRejected("POST", h({}), "http://web.test")).toBe(true);
    expect(csrfRejected("POST", h({ "x-rm-csrf": "1" }), "http://web.test")).toBe(false);
    expect(csrfRejected("PATCH", h({ "x-rm-csrf": "1", origin: "http://evil.test" }), "http://web.test")).toBe(true);
    expect(csrfRejected("DELETE", h({ "x-rm-csrf": "1", origin: "http://web.test" }), "http://web.test")).toBe(false);
    expect(csrfRejected("POST", h({ "x-rm-csrf": "true" }), "http://web.test")).toBe(true);
  });

  it("should reserve the session routes for /api/auth", () => {
    for (const p of ["/auth/login", "/auth/login/mfa", "/auth/refresh", "/auth/activate", "/auth/logout", "/auth/logout-all"]) expect(SESSION_ROUTES.test(p)).toBe(true);
    for (const p of ["/auth/me", "/auth/sessions", "/auth/otp/request", "/auth/password/reset", "/auth/password/change"]) expect(SESSION_ROUTES.test(p)).toBe(false);
  });
});

describe("forward", () => {
  it("should call the API path with the session token, language, building and visitor address only", async () => {
    const { d, fetch } = deps([json(200, { data: [], meta: {} })]);
    const out = await forward(req(), d);
    expect(out.status).toBe(200);
    const [url] = fetch.mock.calls[0] as unknown as [string];
    expect(url).toBe("http://api.test/api/v1/properties/rooms?page=2");
    const h = sentHeaders(fetch);
    expect(h.get("authorization")).toBe(`Bearer ${FRESH}`);
    expect(h.get("accept-language")).toBe("vi-VN");
    expect(h.get("x-building-id")).toBe("b1");
    expect(h.get("x-forwarded-for")).toBe("203.0.113.9");
    // browser cookies and host never reach the API
    expect(h.get("cookie")).toBeNull();
    expect(h.get("host")).toBeNull();
    expect(out.cookies).toEqual([]);
  });

  it("should pass the idempotency key and body of an action", async () => {
    const { d, fetch } = deps([json(201, { data: { id: "x" }, meta: {} })]);
    const body = new TextEncoder().encode('{"a":1}').buffer;
    await forward(req({ method: "POST", body, headers: new Headers({ "content-type": "application/json", "idempotency-key": "k-1" }) }), d);
    const init = (fetch.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect(init.method).toBe("POST");
    expect(init.body).toBe(body);
    expect((init.headers as Headers).get("idempotency-key")).toBe("k-1");
  });

  it("should refresh first when the access token is about to expire, and store the new pair", async () => {
    const { d, fetch, doRefresh } = deps([json(200, { data: {}, meta: {} })]);
    const out = await forward(req({ accessToken: EXPIRING }), d);
    expect(doRefresh).toHaveBeenCalledWith("RT1", "203.0.113.9");
    expect(sentHeaders(fetch).get("authorization")).toBe("Bearer AT2");
    expect(out.cookies.find((c) => c.name === "rm_at")?.value).toBe("AT2");
    expect(out.cookies.find((c) => c.name === "rm_rt")?.value).toBe("RT2");
  });

  it("should refresh once and retry after 401 AUTH_TOKEN_EXPIRED", async () => {
    const { d, fetch, doRefresh } = deps([json(401, { error: { code: "AUTH_TOKEN_EXPIRED" } }), json(200, { data: 1, meta: {} })]);
    const out = await forward(req(), d);
    expect(doRefresh).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(sentHeaders(fetch, 1).get("authorization")).toBe("Bearer AT2");
    expect(out.status).toBe(200);
  });

  it("should not loop: a second 401 after the refresh is returned as is", async () => {
    const { d, fetch, doRefresh } = deps([json(401, { error: { code: "AUTH_TOKEN_EXPIRED" } }), json(401, { error: { code: "AUTH_TOKEN_EXPIRED" } })]);
    const out = await forward(req(), d);
    expect(doRefresh).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(out.status).toBe(401);
  });

  it("should end the session on this device when the refresh is refused", async () => {
    const refused = { ok: false as const, status: 401, body: { error: { code: "AUTH_REFRESH_TOKEN_REUSED" } } };
    const { d, fetch } = deps([], refused);
    const out = await forward(req({ accessToken: undefined }), d);
    expect(fetch).not.toHaveBeenCalled();
    expect(out.status).toBe(401);
    expect(JSON.parse(out.body as string).error.code).toBe("AUTH_REFRESH_TOKEN_REUSED");
    expect(out.cookies.map((c) => [c.name, c.options.maxAge])).toEqual(expect.arrayContaining([["rm_at", 0], ["rm_rt", 0], ["rm_sess", 0]]));
  });

  it("should keep the session when the refresh failed on the server side (5xx) or the network", async () => {
    const down = deps([], { ok: false, status: 503, body: { error: { code: "SYS_SERVICE_UNAVAILABLE" } } });
    const out = await forward(req({ accessToken: EXPIRING }), down.d);
    expect(out.status).toBe(503);
    expect(out.cookies).toEqual([]);
    const net = deps([], new Error("ECONNRESET"));
    const out2 = await forward(req({ accessToken: EXPIRING }), net.d);
    expect(out2.status).toBe(503);
    expect(out2.cookies).toEqual([]);
  });

  it("should clear the cookies when the API says the session is revoked", async () => {
    const { d } = deps([json(401, { error: { code: "AUTH_SESSION_REVOKED" } })]);
    const out = await forward(req(), d);
    expect(out.status).toBe(401);
    expect(out.cookies.some((c) => c.name === "rm_sess" && c.options.maxAge === 0)).toBe(true);
  });

  it("should call without a token for anonymous requests (public pages, OTP)", async () => {
    const { d, fetch, doRefresh } = deps([json(202, { data: {}, meta: {} })]);
    await forward(req({ accessToken: undefined, refreshToken: undefined, method: "POST", path: "/auth/otp/request" }), d);
    expect(doRefresh).not.toHaveBeenCalled();
    expect(sentHeaders(fetch).get("authorization")).toBeNull();
  });

  it("should pass error answers and their Retry-After through unchanged", async () => {
    const { d } = deps([json(429, { error: { code: "AUTH_OTP_RATE_LIMITED" } }, { "retry-after": "42", "set-cookie": "x=1" })]);
    const out = await forward(req(), d);
    expect(out.status).toBe(429);
    expect(out.headers.get("retry-after")).toBe("42");
    expect(out.headers.get("set-cookie")).toBeNull();
    expect(out.headers.get("cache-control")).toBe("no-store");
  });

  it("should answer 503 when the API is unreachable and 504 when it times out", async () => {
    const unreachable = deps([new TypeError("fetch failed")]);
    const a = await forward(req(), unreachable.d);
    expect(a.status).toBe(503);
    expect(JSON.parse(a.body as string)).toMatchObject({ error: { code: "SYS_SERVICE_UNAVAILABLE", status: 503 }, meta: { path: "/api/v1/properties/rooms" } });
    const slow = deps([Object.assign(new Error("timeout"), { name: "TimeoutError" })]);
    const b = await forward(req(), slow.d);
    expect(b.status).toBe(504);
    expect(JSON.parse(b.body as string).error.code).toBe("REQ_TIMEOUT");
  });

  it("should send no body for 204 and keep file downloads' headers", async () => {
    const none = deps([new Response(null, { status: 204 })]);
    expect((await forward(req({ method: "DELETE" }), none.d)).body).toBeNull();
    const file = deps([new Response("xlsx", { status: 200, headers: { "content-type": "application/vnd.openxmlformats", "content-disposition": 'attachment; filename="a.xlsx"' } })]);
    const out = await forward(req(), file.d);
    expect(out.headers.get("content-disposition")).toBe('attachment; filename="a.xlsx"');
  });
});
