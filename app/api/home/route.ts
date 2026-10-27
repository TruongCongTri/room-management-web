import { CACHE_HEADERS } from "@/lib/api/http";
import { localeOf } from "@/lib/api/locale";
import { getHome } from "@/lib/api/server";

/** GET home in ?locale=, from the same server cache the pages read. */
export async function GET(request: Request) {
  return Response.json(await getHome(localeOf(request)), { headers: CACHE_HEADERS });
}
