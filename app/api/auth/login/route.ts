import type { NextRequest } from "next/server";
import { issueSession } from "@/lib/server/auth-routes";

/** Sign-in: tokens → httpOnly cookies; a finance role gets the 202 MFA challenge instead. */
export const POST = (request: NextRequest) => issueSession(request, "/auth/login");
