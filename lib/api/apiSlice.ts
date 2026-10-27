import { createApi, fetchBaseQuery, retry } from "@reduxjs/toolkit/query/react";
import type { Locale } from "../../i18n/config";
import { clientBaseUrl, paths } from "./endpoints";
import { withLocale } from "./locale";
import type {
  AboutData,
  ApiError,
  ContactData,
  ContactRequest,
  ContactResponse,
  HomeData,
  RoomsData,
  SiteData,
  SubscribeRequest,
  SubscribeResponse,
} from "./types";

// reads retry transient failures (network, 5xx); client errors and mutations fail fast
const rawBaseQuery = fetchBaseQuery({
  baseUrl: clientBaseUrl,
  prepareHeaders: (headers) => {
    headers.set("accept", "application/json");
    return headers;
  },
});
const baseQuery = retry(
  async (args: Parameters<typeof rawBaseQuery>[0], api, extra) => {
    const result = await rawBaseQuery(args, api, extra);
    const status = result.error?.status;
    const isMutation = typeof args === "object" && args.method && args.method !== "GET";
    if (isMutation || (typeof status === "number" && status < 500)) retry.fail(result.error, result.meta);
    return result;
  },
  { maxRetries: 2 },
);

/** An absolute URL on this site, so it isn't joined to NEXT_PUBLIC_API_BASE_URL. */
const sameOrigin = (path: string) => (typeof window === "undefined" ? path : new URL(path, window.location.origin).toString());

/** Seconds a resource stays in the client cache after the last component using it unmounts. */
const KEEP = { site: 3600, home: 1800, rooms: 300, about: 3600, contact: 3600 } as const;

/** Mutations post in the visitor's locale, so validation messages come back in it. */
type Localized<T> = { locale: Locale; body: T };

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: ["Site", "Home", "Rooms", "About", "Contact"],
  // refetch stale data when the tab regains focus or the network comes back (see setupListeners)
  refetchOnFocus: true,
  refetchOnReconnect: true,
  // every read takes the locale as its argument, so each language is its own cache entry
  endpoints: (build) => ({
    getSite: build.query<SiteData, Locale>({ query: (l) => withLocale(paths.site, l), providesTags: ["Site"], keepUnusedDataFor: KEEP.site }),
    getHome: build.query<HomeData, Locale>({ query: (l) => withLocale(paths.home, l), providesTags: ["Home"], keepUnusedDataFor: KEEP.home }),
    // always this app's /api/rooms: the server merges content with the Public Listing API there
    getRooms: build.query<RoomsData, Locale>({
      query: (l) => sameOrigin(withLocale(`/api${paths.rooms}`, l)),
      providesTags: ["Rooms"],
      keepUnusedDataFor: KEEP.rooms,
    }),
    getAbout: build.query<AboutData, Locale>({ query: (l) => withLocale(paths.about, l), providesTags: ["About"], keepUnusedDataFor: KEEP.about }),
    getContact: build.query<ContactData, Locale>({ query: (l) => withLocale(paths.contact, l), providesTags: ["Contact"], keepUnusedDataFor: KEEP.contact }),

    sendContactMessage: build.mutation<ContactResponse, Localized<ContactRequest>>({
      query: ({ locale, body }) => ({ url: withLocale(paths.contactMessages, locale), method: "POST", body }),
      transformErrorResponse: (e) => toApiError(e),
    }),
    subscribe: build.mutation<SubscribeResponse, Localized<SubscribeRequest>>({
      query: ({ locale, body }) => ({ url: withLocale(paths.subscriptions, locale), method: "POST", body }),
      transformErrorResponse: (e) => toApiError(e),
    }),
  }),
});

/**
 * A failed mutation: the API's error body when there is one; otherwise an empty message and whether
 * the server was unreachable, so the form can word it in the visitor's language (`ui.errors`).
 */
export type MutationError = ApiError & { offline?: boolean };

/** Normalise any failure (HTTP error body, network error, timeout) to the MutationError shape. */
function toApiError(e: { status: unknown; data?: unknown }): MutationError {
  const data = e.data as Partial<ApiError> | undefined;
  if (data && typeof data.message === "string") return { message: data.message, fields: data.fields };
  return { message: "", offline: e.status === "FETCH_ERROR" };
}

export const {
  useGetSiteQuery,
  useGetHomeQuery,
  useGetRoomsQuery,
  useGetAboutQuery,
  useGetContactQuery,
  useSendContactMessageMutation,
  useSubscribeMutation,
} = apiSlice;

/** Server data a page hands to the client cache, keyed by query endpoint (all in one locale). */
export type Seed = Partial<{
  getSite: SiteData;
  getHome: HomeData;
  getRooms: RoomsData;
  getAbout: AboutData;
  getContact: ContactData;
}>;
