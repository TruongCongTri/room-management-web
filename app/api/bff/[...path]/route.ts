import type { NextRequest } from "next/server";
import { csrfRejected, forward, problem, SESSION_ROUTES } from "@/lib/server/forward";
import { incoming, toResponse } from "@/lib/server/respond";

/**
 * /api/bff/<api path> → the API's /api/v1/<api path>, with the session's access token (refreshed when needed),
 * the visitor's language, building and idempotency key. Sign-in and sign-out have their own routes (/api/auth/*).
 */
async function handle(request: NextRequest, ctx: RouteContext<"/api/bff/[...path]">) {
  const { path: segments } = await ctx.params;
  const path = `/${segments.map(encodeURIComponent).join("/")}`;
  if (SESSION_ROUTES.test(path)) return toResponse(problem(404, "RES_NOT_FOUND", "Use /api/auth for sign-in and sign-out", path));
  if (csrfRejected(request.method, request.headers, request.nextUrl.origin)) {
    return toResponse(problem(403, "AUTH_FORBIDDEN_RESOURCE", "Request refused: it did not come from this site", path, { detail: "CSRF" }));
  }
  return toResponse(await forward(await incoming(request, path)));
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
