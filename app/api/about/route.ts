import { CACHE_HEADERS } from "@/lib/api/http";
import { localeOf } from "@/lib/api/locale";
import { getAbout } from "@/lib/api/server";

/** GET about in ?locale=, from the same server cache the pages read. */
export async function GET(request: Request) {
  return Response.json(await getAbout(localeOf(request)), { headers: CACHE_HEADERS });
}
