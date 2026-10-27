import { CACHE_HEADERS } from "@/lib/api/http";
import { localeOf } from "@/lib/api/locale";
import { getRooms } from "@/lib/api/server";

/** GET rooms in ?locale=, from the same server cache the pages read (content merged with the Public Listing API). */
export async function GET(request: Request) {
  return Response.json(await getRooms(localeOf(request)), { headers: CACHE_HEADERS });
}
