import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/api/server";

/**
 * Webhook for the real backend: POST { "tag": "rooms" } with header `x-revalidate-secret`
 * to drop the server cache for a resource as soon as it changes, instead of waiting for cacheLife.
 */
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || request.headers.get("x-revalidate-secret") !== secret) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { tag } = (await request.json().catch(() => ({}))) as { tag?: string };
  if (!tag || !(CACHE_TAGS as readonly string[]).includes(tag)) {
    return Response.json({ message: `Unknown tag. Use one of: ${CACHE_TAGS.join(", ")}` }, { status: 400 });
  }
  revalidateTag(tag, { expire: 0 });
  return Response.json({ revalidated: tag });
}
