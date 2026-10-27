import { CACHE_HEADERS } from "@/lib/api/http";
import { localeOf } from "@/lib/api/locale";
import { getContact } from "@/lib/api/server";

/** GET contact in ?locale=, from the same server cache the pages read. */
export async function GET(request: Request) {
  return Response.json(await getContact(localeOf(request)), { headers: CACHE_HEADERS });
}
