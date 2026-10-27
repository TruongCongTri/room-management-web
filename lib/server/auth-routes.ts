import "server-only";
import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { backend } from "./backend";
import { csrfRejected, forward, forwardedFor, problem } from "./forward";
import { incoming, setCookies, toResponse } from "./respond";
import { clearedCookies, COOKIE, deviceCookie, tokenCookies, type TokenPair } from "./session";

import type { SessionInfo } from "../api/session";

export const sessionInfo = (pair: TokenPair): SessionInfo => ({
  user: pair.user,
  sessionId: pair.sessionId,
  accessTokenExpiresIn: pair.accessTokenExpiresIn,
  refreshTokenExpiresAt: pair.refreshTokenExpiresAt,
});

/** "Chrome · Windows" from a user agent, for the API's sessions list. */
export function deviceName(userAgent: string | null): string {
  const ua = userAgent ?? "";
  const browser = /Edg\//.test(ua) ? "Edge" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Browser";
  const os = /Windows/.test(ua) ? "Windows" : /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "";
  return os ? `${browser} · ${os}` : browser;
}

/**
 * POST /auth/login, /auth/login/mfa or /auth/activate on the API. A token pair in the answer becomes the
 * session cookies and is replaced by SessionInfo; anything else (202 MFA challenge, errors) passes through.
 */
export async function issueSession(request: NextRequest, apiPath: "/auth/login" | "/auth/login/mfa" | "/auth/activate"): Promise<NextResponse> {
  if (csrfRejected("POST", request.headers, request.nextUrl.origin)) {
    return toResponse(problem(403, "AUTH_FORBIDDEN_RESOURCE", "Request refused: it did not come from this site", apiPath, { detail: "CSRF" }));
  }
  if (!backend.configured()) return toResponse(problem(503, "SYS_SERVICE_UNAVAILABLE", "BACKEND_API_URL is not configured", apiPath));

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return toResponse(problem(400, "REQ_MALFORMED_PAYLOAD", "The request body is not valid JSON", apiPath));
  }
  const knownDevice = request.cookies.get(COOKIE.device)?.value;
  const device = knownDevice ?? randomUUID();
  const payload = { ...body, deviceId: device, ...(apiPath === "/auth/login/mfa" ? {} : { deviceName: deviceName(request.headers.get("user-agent")) }) };

  const xff = forwardedFor(request.headers);
  let res: Response;
  try {
    res = await fetch(backend.url(apiPath), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        ...(request.headers.get("accept-language") ? { "accept-language": request.headers.get("accept-language")! } : {}),
        ...(xff ? { "x-forwarded-for": xff } : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(backend.timeoutMs),
    });
  } catch {
    return toResponse(problem(503, "SYS_SERVICE_UNAVAILABLE", "The service is unreachable. Try again in a moment.", apiPath));
  }

  const json = (await res.json().catch(() => null)) as { data?: TokenPair & { mfaRequired?: boolean }; meta?: unknown } | null;
  const headers = new Headers({ "cache-control": "no-store" });
  const retryAfter = res.headers.get("retry-after");
  if (retryAfter) headers.set("retry-after", retryAfter);

  let out: NextResponse;
  if (res.status === 200 && json?.data?.accessToken) {
    out = NextResponse.json({ data: sessionInfo(json.data), meta: json.meta }, { status: 200, headers });
    setCookies(out, tokenCookies(json.data));
  } else {
    out = NextResponse.json(json, { status: res.status, headers });
  }
  if (!knownDevice) setCookies(out, [deviceCookie(device)]);
  return out;
}

/** POST /auth/logout or /auth/logout-all with the session's token; the cookies go whatever the API says. */
export async function endSession(request: NextRequest, apiPath: "/auth/logout" | "/auth/logout-all"): Promise<NextResponse> {
  if (csrfRejected("POST", request.headers, request.nextUrl.origin)) {
    return toResponse(problem(403, "AUTH_FORBIDDEN_RESOURCE", "Request refused: it did not come from this site", apiPath, { detail: "CSRF" }));
  }
  // signed out here even when the API was unreachable or the session had already ended
  await forward(await incoming(request, apiPath));
  return setCookies(new NextResponse(null, { status: 204, headers: { "cache-control": "no-store" } }), clearedCookies());
}
