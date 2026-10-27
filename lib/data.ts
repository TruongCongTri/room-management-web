"use client";

/**
 * Data hooks for components. Each reads one API resource through RTK Query: on first render the
 * data comes from the cache the page seeded on the server; after that RTK Query keeps it fresh
 * (focus / reconnect refetch, cache lifetimes per resource in lib/api/apiSlice.ts).
 */
import { useLocale } from "@/i18n/I18nProvider";
import { useGetAboutQuery, useGetContactQuery, useGetHomeQuery, useGetRoomsQuery, useGetSiteQuery } from "./api/apiSlice";
import { createRoomsModel } from "./rooms";

// each reads the resource in the page's locale
export const useSite = () => useGetSiteQuery(useLocale()).data;
export const useHome = () => useGetHomeQuery(useLocale()).data;
export const useAbout = () => useGetAboutQuery(useLocale()).data;
export const useContactInfo = () => useGetContactQuery(useLocale()).data;

/** Rooms data plus derived helpers (tier lookup, availability, fee totals, estimates). */
export function useRooms() {
  const { data } = useGetRoomsQuery(useLocale());
  return data ? createRoomsModel(data) : undefined;
}
