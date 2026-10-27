import type { NextRequest } from "next/server";
import { issueSession } from "@/lib/server/auth-routes";

/** Second step for landlord / accountant: the OTP of the challenge → session cookies. */
export const POST = (request: NextRequest) => issueSession(request, "/auth/login/mfa");
