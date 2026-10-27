import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { languageTag, type Locale } from "../../i18n/config";
import { paths, serverBaseUrl } from "./endpoints";
import { toRoomsData, type RoomsContent } from "./listing/adapter";
import { fetchBuildingListing, listingEnabled } from "./listing/client";
import { withLocale } from "./locale";
import { mockListing } from "./mock/listing";
import { readResource, type ResourceName } from "./mock/service";
import type { AboutData, ContactData, HomeData, RoomsData, SiteData } from "./types";

/**
 * Server-side reads, cached with `use cache` (Next's data cache) on top of whatever HTTP caching
 * the API does. Each takes the locale, so every language has its own cache entry. Pages call these, then seed the client store with the result, so the first paint
 * has data and the browser doesn't repeat the request.
 *
 * With API_BASE_URL set they fetch the real API; without it they read the mock data in-process.
 * Rooms also merge in the Public Listing API when LISTING_API_BASE_URL + LISTING_BUILDING_SLUG are set.
 */

export const CACHE_TAGS = ["site", "home", "rooms", "about", "contact"] as const;

async function load<T>(name: ResourceName, path: string, locale: Locale): Promise<T> {
  if (!serverBaseUrl) return readResource(name, locale) as T;
  const res = await fetch(`${serverBaseUrl}${withLocale(path, locale)}`, {
    headers: { accept: "application/json", "accept-language": languageTag[locale] },
  });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

/** Brand, navigation, footer: changes rarely. */
export async function getSite(locale: Locale) {
  "use cache";
  cacheLife("hours");
  cacheTag("site");
  return load<SiteData>("site", paths.site, locale);
}

export async function getHome(locale: Locale) {
  "use cache";
  cacheLife("hours");
  cacheTag("home");
  return load<HomeData>("home", paths.home, locale);
}

/**
 * Prices and room availability: refreshed every minute (the listing API's own max-age is 60 s).
 * Content (copy, photos, floor plan) comes from the site's content source; room types, rooms,
 * availability and equipment from the Public Listing API, or from a mock of it when not configured.
 */
export async function getRooms(locale: Locale): Promise<RoomsData> {
  "use cache";
  cacheLife("minutes");
  cacheTag("rooms");
  const content = await load<RoomsContent>("rooms", paths.rooms, locale);
  const listing = listingEnabled() ? await fetchBuildingListing(languageTag[locale]) : mockListing(content);
  return toRoomsData(listing, content);
}

export async function getAbout(locale: Locale) {
  "use cache";
  cacheLife("days");
  cacheTag("about");
  return load<AboutData>("about", paths.about, locale);
}

export async function getContact(locale: Locale) {
  "use cache";
  cacheLife("days");
  cacheTag("contact");
  return load<ContactData>("contact", paths.contact, locale);
}
