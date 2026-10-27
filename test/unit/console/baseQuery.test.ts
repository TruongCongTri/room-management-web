import { afterEach, describe, expect, it, vi } from "vitest";
import { bffBaseQuery, filenameOf, queryString } from "@/lib/console/baseQuery";
import { sessionEnded } from "@/lib/console/slice";

afterEach(() => vi.unstubAllGlobals());

const api = (state: { locale?: "vi" | "en"; buildingId?: string | null } = {}) => {
  const dispatch = vi.fn();
  return {
    dispatch,
    api: { getState: () => ({ console: { locale: state.locale ?? "vi", buildingId: state.buildingId === undefined ? "b1" : state.buildingId, sessionEnded: false } }), dispatch, signal: new AbortController().signal } as never,
  };
};

const json = (status: number, body: unknown, headers: Record<string, string> = {}) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });

function stub(...responses: (Response | Error)[]) {
  const fetch = vi.fn(async () => {
    const r = responses.shift()!;
    if (r instanceof Error) throw r;
    return r;
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}
const call = (fetch: ReturnType<typeof vi.fn>, i = 0) => fetch.mock.calls[i] as unknown as [string, RequestInit & { headers: Headers }];

describe("queryString / filenameOf", () => {
  it("should drop empty filters and encode the rest", () => {
    expect(queryString({ status: "ACTIVE", q: "P.1 01", page: 2, empty: "", none: null, undef: undefined, flag: false })).toBe("?status=ACTIVE&q=P.1+01&page=2&flag=false");
    expect(queryString({})).toBe("");
  });

  it("should read file names from Content-Disposition", () => {
    expect(filenameOf('attachment; filename="01-BDS-2026-Q3.xlsx"')).toBe("01-BDS-2026-Q3.xlsx");
    expect(filenameOf("attachment; filename*=UTF-8''c%C6%B0%20tr%C3%BA.xlsx")).toBe("cư trú.xlsx");
    expect(filenameOf(null)).toBeNull();
  });
});

describe("bffBaseQuery", () => {
  it("should call the BFF with the language and the building, and return the envelope", async () => {
    const fetch = stub(json(200, { data: [1], meta: {} }));
    const { api: a } = api({ locale: "en" });
    const out = await bffBaseQuery({ url: "/properties/rooms", params: { page: 1 } }, a, {});
    expect(out).toEqual({ data: { data: [1], meta: {} } });
    const [url, init] = call(fetch);
    expect(url).toBe("/api/bff/properties/rooms?page=1");
    expect(init.headers.get("accept-language")).toBe("en-US");
    expect(init.headers.get("x-building-id")).toBe("b1");
    expect(init.headers.get("x-rm-csrf")).toBeNull();
    expect(init.credentials).toBe("same-origin");
  });

  it("should leave the building out of account-wide routes and call /api/auth routes directly", async () => {
    const fetch = stub(json(200, { data: {}, meta: {} }), json(200, { data: {}, meta: {} }), json(200, { data: {}, meta: {} }));
    const { api: a } = api();
    await bffBaseQuery("/auth/me", a, {});
    await bffBaseQuery("/users", a, {});
    await bffBaseQuery({ url: "/api/auth/login", method: "POST", body: {} }, a, {});
    expect(call(fetch, 0)[1].headers.get("x-building-id")).toBeNull();
    expect(call(fetch, 1)[1].headers.get("x-building-id")).toBeNull();
    expect(call(fetch, 2)[0]).toBe("/api/auth/login");
  });

  it("should mark actions for CSRF and send their idempotency key and JSON body", async () => {
    const fetch = stub(json(201, { data: { id: "c" }, meta: {} }));
    const { api: a } = api();
    await bffBaseQuery({ url: "/contracts", method: "POST", body: { roomId: "r" }, idempotencyKey: "k-9" }, a, {});
    const [, init] = call(fetch);
    expect(init.method).toBe("POST");
    expect(init.headers.get("x-rm-csrf")).toBe("1");
    expect(init.headers.get("idempotency-key")).toBe("k-9");
    expect(init.headers.get("content-type")).toBe("application/json");
    expect(init.body).toBe('{"roomId":"r"}');
  });

  it("should retry reads on 5xx and network errors, but never resend an action", async () => {
    vi.useFakeTimers();
    const fetch = stub(json(503, {}), new TypeError("fetch failed"), json(200, { data: "ok", meta: {} }));
    const { api: a } = api();
    const read = bffBaseQuery("/properties/rooms", a, {});
    await vi.runAllTimersAsync();
    expect(await read).toEqual({ data: { data: "ok", meta: {} } });
    expect(fetch).toHaveBeenCalledTimes(3);

    const post = stub(json(503, { error: { code: "SYS_SERVICE_UNAVAILABLE" } }));
    const action = await bffBaseQuery({ url: "/billing/runs", method: "POST", body: {} }, a, {});
    expect(post).toHaveBeenCalledTimes(1);
    expect(action).toMatchObject({ error: { status: 503, code: "SYS_SERVICE_UNAVAILABLE" } });
    vi.useRealTimers();
  });

  it("should return problems with Retry-After and end the session on a revoked token", async () => {
    stub(json(429, { error: { code: "AUTH_OTP_RATE_LIMITED", message: "wait" }, meta: { traceId: "t" } }, { "retry-after": "60" }));
    const { api: a, dispatch } = api();
    expect(await bffBaseQuery({ url: "/auth/otp/request", method: "POST", body: {} }, a, {})).toMatchObject({ error: { status: 429, retryAfter: 60, traceId: "t" } });
    expect(dispatch).not.toHaveBeenCalled();

    stub(json(401, { error: { code: "AUTH_SESSION_REVOKED" } }));
    await bffBaseQuery("/auth/me", a, {});
    expect(dispatch).toHaveBeenCalledWith(sessionEnded());
  });

  it("should not end the session on a wrong password (401 at sign-in)", async () => {
    stub(json(401, { error: { code: "AUTH_CREDENTIALS_INVALID" } }));
    const { api: a, dispatch } = api();
    await bffBaseQuery({ url: "/api/auth/login", method: "POST", body: {} }, a, {});
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("should answer null for 204", async () => {
    stub(new Response(null, { status: 204 }));
    const { api: a } = api();
    expect(await bffBaseQuery({ url: "/auth/sessions/s1", method: "DELETE" }, a, {})).toEqual({ data: null });
  });
});
