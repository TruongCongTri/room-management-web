import { NextRequest } from "next/server";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

let issueSession: typeof import("@/lib/server/auth-routes").issueSession;
let endSession: typeof import("@/lib/server/auth-routes").endSession;
let deviceName: typeof import("@/lib/server/auth-routes").deviceName;
beforeAll(async () => {
  vi.stubEnv("BACKEND_API_URL", "http://api.test/api/v1");
  ({ issueSession, endSession, deviceName } = await import("@/lib/server/auth-routes"));
});
afterEach(() => vi.unstubAllGlobals());

const pair = {
  tokenType: "Bearer",
  accessToken: "AT-secret",
  accessTokenExpiresIn: 900,
  refreshToken: "RT-secret",
  refreshTokenExpiresAt: "2099-01-01T00:00:00.000Z",
  sessionId: "s1",
  user: { id: "u1", fullName: "Chủ nhà", phoneMasked: "090****001", roles: ["LANDLORD"], buildingIds: ["b1"] },
};

const post = (path: string, body: unknown, headers: Record<string, string> = {}, cookies = "") =>
  new NextRequest(`http://web.test${path}`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json", "x-rm-csrf": "1", origin: "http://web.test", "user-agent": "Mozilla/5.0 (Windows NT 10.0) Chrome/130.0 Safari/537", ...(cookies ? { cookie: cookies } : {}), ...headers },
  });

function stubApi(status: number, body: unknown, headers: Record<string, string> = {}) {
  const fetch = vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } }));
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

describe("issueSession (sign-in)", () => {
  it("should move the tokens into httpOnly cookies and return only who signed in", async () => {
    const fetch = stubApi(200, { data: pair, meta: { traceId: "t" } });
    const res = await issueSession(post("/api/auth/login", { phone: "0901000001", password: "pw" }), "/auth/login");
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).not.toContain("AT-secret");
    expect(text).not.toContain("RT-secret");
    expect(JSON.parse(text).data).toMatchObject({ sessionId: "s1", user: { id: "u1" }, accessTokenExpiresIn: 900 });
    expect(res.cookies.get("rm_at")?.value).toBe("AT-secret");
    expect(res.cookies.get("rm_rt")?.value).toBe("RT-secret");
    expect(res.cookies.get("rm_sess")?.value).toBe("1");
    // a new browser gets a device id, sent to the API with a readable device name
    const sent = JSON.parse((fetch.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(sent).toMatchObject({ phone: "0901000001", password: "pw", deviceName: "Chrome · Windows" });
    expect(sent.deviceId).toBe(res.cookies.get("rm_dev")?.value);
  });

  it("should reuse the browser's device id instead of minting a new one", async () => {
    const fetch = stubApi(200, { data: pair, meta: {} });
    const res = await issueSession(post("/api/auth/login", { phone: "x", password: "y" }, {}, "rm_dev=dev-123"), "/auth/login");
    expect(JSON.parse((fetch.mock.calls[0] as unknown as [string, RequestInit])[1].body as string).deviceId).toBe("dev-123");
    expect(res.cookies.get("rm_dev")).toBeUndefined();
  });

  it("should pass the 202 MFA challenge through without setting a session", async () => {
    stubApi(202, { data: { mfaRequired: true, challengeId: "c1", otpSentTo: "090****003", expiresInSeconds: 300 }, meta: {} });
    const res = await issueSession(post("/api/auth/login", { phone: "x", password: "y" }), "/auth/login");
    expect(res.status).toBe(202);
    expect((await res.json()).data.challengeId).toBe("c1");
    expect(res.cookies.get("rm_at")).toBeUndefined();
  });

  it("should pass errors and Retry-After through (account lock)", async () => {
    stubApi(423, { error: { code: "AUTH_ACCOUNT_LOCKED", message: "locked" }, meta: {} }, { "retry-after": "900" });
    const res = await issueSession(post("/api/auth/login", { phone: "x", password: "y" }), "/auth/login");
    expect(res.status).toBe(423);
    expect(res.headers.get("retry-after")).toBe("900");
    expect((await res.json()).error.code).toBe("AUTH_ACCOUNT_LOCKED");
  });

  it("should refuse a cross-site post before calling the API", async () => {
    const fetch = stubApi(200, { data: pair, meta: {} });
    const res = await issueSession(post("/api/auth/login", { phone: "x", password: "y" }, { origin: "http://evil.test" }), "/auth/login");
    expect(res.status).toBe(403);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("should answer 400 for a body that is not JSON", async () => {
    stubApi(200, {});
    const bad = new NextRequest("http://web.test/api/auth/login", { method: "POST", body: "{nope", headers: { "x-rm-csrf": "1" } });
    const res = await issueSession(bad, "/auth/login");
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("REQ_MALFORMED_PAYLOAD");
  });

  it("should not add a device name to the MFA step", async () => {
    const fetch = stubApi(200, { data: pair, meta: {} });
    await issueSession(post("/api/auth/login/mfa", { challengeId: "c1", code: "123456" }), "/auth/login/mfa");
    const sent = JSON.parse((fetch.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(sent.deviceName).toBeUndefined();
    expect(sent.deviceId).toBeDefined();
  });
});

describe("endSession (sign-out)", () => {
  it("should clear the cookies even when the API is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("fetch failed"))));
    const res = await endSession(post("/api/auth/logout", {}, {}, "rm_at=a; rm_rt=b; rm_sess=1"), "/auth/logout");
    expect(res.status).toBe(204);
    expect(res.cookies.get("rm_sess")?.value).toBe("");
    expect(res.cookies.get("rm_rt")?.value).toBe("");
  });
});

describe("deviceName", () => {
  it("should name common browsers and systems", () => {
    expect(deviceName("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit Version/17.0 Mobile Safari/604.1")).toBe("Safari · iOS");
    expect(deviceName("Mozilla/5.0 (Linux; Android 14) Chrome/130.0 Mobile Safari/537.36")).toBe("Chrome · Android");
    expect(deviceName("Mozilla/5.0 (Windows NT 10.0) Chrome/130.0 Safari/537.36 Edg/130.0")).toBe("Edge · Windows");
    expect(deviceName(null)).toBe("Browser");
  });
});
