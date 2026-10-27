import type { NextRequest } from "next/server";
import { issueSession } from "@/lib/server/auth-routes";

/** First password from the invitation OTP; signs the new account in. */
export const POST = (request: NextRequest) => issueSession(request, "/auth/activate");
