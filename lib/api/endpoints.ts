/**
 * Resource paths, relative to the API base URL. The mock route handlers in `app/api` live at the
 * same paths, so pointing the base URL at a real backend is the only change needed.
 */
export const paths = {
  site: "/site",
  home: "/home",
  rooms: "/rooms",
  about: "/about",
  contact: "/contact",
  contactMessages: "/contact/messages",
  subscriptions: "/subscriptions",
} as const;

/**
 * Base URLs.
 * - Browser: `NEXT_PUBLIC_API_BASE_URL`, defaults to this app's mock API at `/api`.
 * - Server:  `API_BASE_URL` (absolute). When unset, the server reads the mock data in-process,
 *   which also works during `next build`, when no server is listening yet.
 */
export const clientBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";
export const serverBaseUrl = process.env.API_BASE_URL ?? "";
