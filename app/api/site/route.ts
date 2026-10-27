import { CACHE_HEADERS } from "@/lib/api/http";
import { localeOf } from "@/lib/api/locale";
import { getSite } from "@/lib/api/server";

/** GET site in ?locale=, from the same server cache the pages read. */
export async function GET(request: Request) {
  return Response.json(await getSite(localeOf(request)), { headers: CACHE_HEADERS });
}
