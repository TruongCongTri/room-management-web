import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearedCookies,
  COOKIE,
  needsRefresh,
  refreshOnce,
  REFRESH_LEEWAY_S,
  REFRESH_REUSE_MS,
  resetRefreshState,
  tokenCookies,
  tokenExpiry,
  type RefreshResult,
  type TokenPair,
} from "@/lib/server/session";

const jwt = (payload: object) => `h.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.s`;

const pair = (over: Partial<TokenPair> = {}): TokenPair =>
  ({
    tokenType: "Bearer",
    accessToken: "AT",
    accessTokenExpiresIn: 900,
    refreshToken: "RT2",
    refreshTokenExpiresAt: new Date(Date.UTC(2026, 10, 3)).toISOString(),
    sessionId: "s1",
    user: { id: "u1", fullName: "A", phoneMasked: "090****001", roles: ["LANDLORD"], buildingIds: [] },
    ...over,
  }) as TokenPair;

describe("session cookies", () => {
  it("should keep both tokens httpOnly under /api and only a marker cookie on pages", () => {
    const now = Date.UTC(2026, 9, 27);
    const cookies = tokenCookies(pair(), now);
    const byName = Object.fromEntries(cookies.map((c) => [c.name, c]));
    expect(byName[COOKIE.access]).toMatchObject({ value: "AT", options: { httpOnly: true, path: "/api", maxAge: 900, sameSite: "lax" } });
    expect(byName[COOKIE.refresh]).toMatchObject({ value: "RT2", options: { httpOnly: true, path: "/api", sameSite: "strict" } });
    expect(byName[COOKIE.refresh].options.maxAge).toBe(7 * 24 * 3600);
    // the page-visible cookie carries no token
    expect(byName[COOKIE.session]).toMatchObject({ value: "1", options: { path: "/", httpOnly: true } });
  });

  it("should expire every session cookie on sign-out", () => {
    const cleared = clearedCookies();
    expect(cleared.map((c) => c.name).sort()).toEqual([COOKIE.access, COOKIE.refresh, COOKIE.session].sort());
    expect(cleared.every((c) => c.value === "" && c.options.maxAge === 0)).toBe(true);
  });
});

describe("access token expiry", () => {
  it("should read exp from the JWT payload", () => {
    expect(tokenExpiry(jwt({ exp: 1_800_000_000 }))).toBe(1_800_000_000_000);
    expect(tokenExpiry("not-a-jwt")).toBeNull();
    expect(tokenExpiry(undefined)).toBeNull();
    expect(tokenExpiry(`h.${Buffer.from("{bad json").toString("base64url")}.s`)).toBeNull();
  });

  it("should refresh when the token is missing, unreadable or inside the leeway", () => {
    const now = 1_000_000_000_000;
    const at = (secondsLeft: number) => jwt({ exp: Math.floor(now / 1000) + secondsLeft });
    expect(needsRefresh(undefined, now)).toBe(true);
    expect(needsRefresh("garbage", now)).toBe(true);
    expect(needsRefresh(at(REFRESH_LEEWAY_S), now)).toBe(true);
    expect(needsRefresh(at(REFRESH_LEEWAY_S + 1), now)).toBe(false);
    expect(needsRefresh(at(600), now)).toBe(false);
  });
});

describe("refreshOnce (rotation without reuse)", () => {
  beforeEach(() => resetRefreshState());

  it("should exchange a refresh token once for any number of concurrent requests", async () => {
    let release!: (r: RefreshResult) => void;
    const call = vi.fn(() => new Promise<RefreshResult>((r) => (release = r)));
    const all = Promise.all([refreshOnce("RT1", null, call), refreshOnce("RT1", null, call), refreshOnce("RT1", null, call)]);
    release({ ok: true, pair: pair() });
    const results = await all;
    expect(call).toHaveBeenCalledTimes(1);
    expect(results.every((r) => r.ok && r.pair.refreshToken === "RT2")).toBe(true);
  });

  it("should hand the same result to a late request carrying the old token within the reuse window", async () => {
    const call = vi.fn(async (): Promise<RefreshResult> => ({ ok: true, pair: pair() }));
    const now = Date.now();
    await refreshOnce("RT1", null, call, now);
    const late = await refreshOnce("RT1", null, call, now + REFRESH_REUSE_MS - 1);
    expect(call).toHaveBeenCalledTimes(1);
    expect(late.ok).toBe(true);
  });

  it("should call the API again once the reuse window has passed", async () => {
    const call = vi.fn(async (): Promise<RefreshResult> => ({ ok: true, pair: pair() }));
    const now = Date.now();
    await refreshOnce("RT1", null, call, now);
    await refreshOnce("RT1", null, call, now + REFRESH_REUSE_MS + 60_000);
    expect(call).toHaveBeenCalledTimes(2);
  });

  it("should keep separate sessions apart and pass the visitor's address on", async () => {
    const call = vi.fn(async (): Promise<RefreshResult> => ({ ok: false, status: 401, body: {} }));
    await refreshOnce("RT-A", "203.0.113.7", call);
    await refreshOnce("RT-B", null, call);
    expect(call).toHaveBeenCalledTimes(2);
    expect(call).toHaveBeenNthCalledWith(1, "RT-A", "203.0.113.7");
  });

  it("should not cache a network failure (the next request tries again)", async () => {
    const call = vi.fn().mockRejectedValueOnce(new Error("ECONNREFUSED")).mockResolvedValueOnce({ ok: true, pair: pair() });
    await expect(refreshOnce("RT1", null, call)).rejects.toThrow("ECONNREFUSED");
    await expect(refreshOnce("RT1", null, call)).resolves.toMatchObject({ ok: true });
    expect(call).toHaveBeenCalledTimes(2);
  });
});
