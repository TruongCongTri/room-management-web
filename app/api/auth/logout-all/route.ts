import type { NextRequest } from "next/server";
import { endSession } from "@/lib/server/auth-routes";

/** Ends every session of the account, this one included. */
export const POST = (request: NextRequest) => endSession(request, "/auth/logout-all");
