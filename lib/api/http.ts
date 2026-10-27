/** Shared HTTP cache policy for read endpoints: browsers keep a minute, CDNs five, then revalidate in the background. */
export const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
};
