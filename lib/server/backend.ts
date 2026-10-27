import "server-only";

/**
 * Where the Next server reaches the Rental Management API (`/api/v1`). Server side only: the browser talks to
 * this app's `/api/bff/*` and `/api/auth/*`, which forward here.
 *
 * BACKEND_API_URL, e.g. https://api.rentalcore.vn/api/v1 (no trailing slash).
 * The API must trust this server as a proxy (its TRUST_PROXY) so the per-IP limits see the visitor's address,
 * which is forwarded in X-Forwarded-For.
 */
const base = (process.env.BACKEND_API_URL ?? "").replace(/\/+$/, "");

export const backend = {
  configured: () => Boolean(base),
  base,
  /** "/auth/me" → "https://api…/api/v1/auth/me" */
  url: (path: string) => `${base}${path.startsWith("/") ? path : `/${path}`}`,
  /** Generous for the billing run (the API allows it 120 s); other calls answer in well under a second. */
  timeoutMs: Number(process.env.BACKEND_TIMEOUT_MS ?? 130_000),
};
