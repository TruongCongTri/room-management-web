import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, type CookieWrite } from "./session";
import type { Incoming, Outgoing } from "./forward";

/** Outgoing (status, headers, body, cookies) → NextResponse. */
export function toResponse(out: Outgoing): NextResponse {
  const res = new NextResponse(out.body, { status: out.status, headers: out.headers });
  for (const c of out.cookies) res.cookies.set(c.name, c.value, c.options);
  return res;
}

export function setCookies(res: NextResponse, cookies: CookieWrite[]) {
  for (const c of cookies) res.cookies.set(c.name, c.value, c.options);
  return res;
}

/** NextRequest → the forwarder's input for an API path. */
export async function incoming(request: NextRequest, path: string): Promise<Incoming> {
  const hasBody = !["GET", "HEAD"].includes(request.method);
  return {
    method: request.method,
    path,
    search: request.nextUrl.search,
    headers: request.headers,
    body: hasBody ? await request.arrayBuffer() : null,
    accessToken: request.cookies.get(COOKIE.access)?.value,
    refreshToken: request.cookies.get(COOKIE.refresh)?.value,
  };
}
