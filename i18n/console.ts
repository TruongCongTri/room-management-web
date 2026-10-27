import "server-only";
import type { Locale } from "./config";
import { getLocale } from "./locale";
import en from "./console/en.json";
import vi from "./console/vi.json";

/**
 * Strings of the signed-in console and the sign-in pages, apart from the site's messages so marketing pages
 * don't carry them. `vi` is checked against `en`: a key missing from either file fails type-checking.
 * API error messages are not here: the API sends them in the visitor's language (Accept-Language).
 */
export type ConsoleMessages = typeof en;

const messages: Record<Locale, ConsoleMessages> = { en, vi: vi satisfies ConsoleMessages };

export const getConsoleMessages = (locale: Locale): ConsoleMessages => messages[locale];

/** `export const generateMetadata = titleFrom((m) => m.nav.users)` for console pages. */
export const titleFrom =
  (pick: (m: ConsoleMessages) => string) =>
  async (): Promise<{ title: string }> => ({ title: pick(getConsoleMessages(await getLocale())) });
