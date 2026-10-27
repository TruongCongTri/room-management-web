import "server-only";
import type { Locale, Messages } from "./config";
import en from "./messages/en.json";
import vi from "./messages/vi.json";

/**
 * Both locale files, server side only: pages, metadata, the mock API and its route handlers read
 * them here. Client components get just the `ui` part, through I18nProvider.
 * `vi` is checked against `en`, so a key missing from either file fails type-checking.
 */
const messages: Record<Locale, Messages> = { en, vi: vi satisfies Messages };

export const getMessages = (locale: Locale): Messages => messages[locale];
