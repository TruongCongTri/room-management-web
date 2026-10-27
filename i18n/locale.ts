import { notFound } from "next/navigation";
import { locale as localeParam } from "next/root-params";
import { hasLocale, type Locale } from "./config";

/**
 * The current request's locale, from the `[locale]` root segment, for Server Components.
 * Anything that isn't a supported locale is a 404. (Route Handlers can't read root params:
 * they take the locale from the `?locale=` query instead, see lib/api/locale.ts.)
 */
export async function getLocale(): Promise<Locale> {
  const value = await localeParam();
  if (!hasLocale(value)) notFound();
  return value;
}
