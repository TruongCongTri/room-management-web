import { defaultLocale, hasLocale, type Locale } from "../../i18n/config";

/** The `?locale=` a request asks for (route handlers can't read the page's root params). Defaults to vi. */
export function localeOf(request: Request): Locale {
  const value = new URL(request.url).searchParams.get("locale");
  return hasLocale(value) ? value : defaultLocale;
}

/** "/site" → "/site?locale=vi": every resource is fetched in one locale. */
export const withLocale = (path: string, locale: Locale) => `${path}${path.includes("?") ? "&" : "?"}locale=${locale}`;
