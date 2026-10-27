import type { NextRequest } from "next/server";
import { endSession } from "@/lib/server/auth-routes";

/** Ends this device's session (API + cookies). */
export const POST = (request: NextRequest) => endSession(request, "/auth/logout");
