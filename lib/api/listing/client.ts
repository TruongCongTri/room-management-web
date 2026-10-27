import "server-only";
import type {
  BuildingListing,
  ErrorEnvelope,
  PublicAssetDto,
  PublicBuildingDto,
  PublicBuildingSummaryDto,
  PublicFloorDto,
  PublicRoomDetailDto,
  PublicRoomListItemDto,
  PublicRoomTypeDto,
  PublicVacancyDto,
  RoomSearchQuery,
  SuccessEnvelope,
} from "./types";

/**
 * Server-side client for the Public Listing API (`/public/*`). No token, no X-Building-ID.
 * Only the Next server calls it: the browser reads the merged result from this app's /api/rooms,
 * so the backend needs no CORS entry and its per-IP limits see one caller behind a cache.
 *
 * Configure with LISTING_API_BASE_URL (e.g. https://api.rentalcore.vn/api/v1) and LISTING_BUILDING_SLUG.
 * Calls are made in the page's language (Accept-Language: vi-VN or en-US).
 */
export const listingConfig = {
  baseUrl: (process.env.LISTING_API_BASE_URL ?? "").replace(/\/+$/, ""),
  slug: process.env.LISTING_BUILDING_SLUG ?? "",
};
export const listingEnabled = () => Boolean(listingConfig.baseUrl && listingConfig.slug);

/** A failed call, carrying the API's stable `errorCode` (e.g. RES_NOT_FOUND, RES_FEATURE_DISABLED). */
export class ListingApiError extends Error {
  constructor(
    readonly status: number,
    readonly errorCode: string,
    message: string,
    readonly traceId?: string,
    readonly path?: string,
  ) {
    super(`${errorCode} (${status}): ${message}${traceId ? ` [trace ${traceId}]` : ""}`);
    this.name = "ListingApiError";
  }
}

type Page<T> = { data: T; pagination?: SuccessEnvelope<T>["meta"]["pagination"] };

// Last body per URL, so a 304 for `If-None-Match` can be answered without the payload.
const etags = new Map<string, { etag: string; page: Page<unknown> }>();

const TIMEOUT_MS = 8_000;

type Query = Record<string, string | number | undefined>;

async function request<T>(language: string, path: string, query?: Query): Promise<Page<T>> {
  const url = new URL(listingConfig.baseUrl + path);
  for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined) url.searchParams.set(k, String(v));
  const key = `${language} ${url}`;

  for (let attempt = 0; ; attempt++) {
    const seen = etags.get(key);
    let res: Response;
    try {
      res = await fetch(url, {
        headers: {
          accept: "application/json",
          "accept-language": language,
          ...(seen ? { "if-none-match": seen.etag } : {}),
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (e) {
      if (attempt < 1) continue; // one retry on network errors and timeouts
      throw new ListingApiError(0, "NETWORK_ERROR", e instanceof Error ? e.message : String(e), undefined, path);
    }

    if (res.status === 304 && seen) return seen.page as Page<T>;
    if (res.ok) {
      const body = (await res.json()) as SuccessEnvelope<T>;
      const page: Page<T> = { data: body.data, pagination: body.meta?.pagination };
      const etag = res.headers.get("etag");
      if (etag) etags.set(key, { etag, page });
      return page;
    }
    if (res.status >= 500 && attempt < 1) continue; // one retry on server errors

    const err = (await res.json().catch(() => null)) as Partial<ErrorEnvelope> | null;
    throw new ListingApiError(res.status, err?.errorCode ?? `HTTP_${res.status}`, err?.message ?? res.statusText, err?.traceId, path);
  }
}

const building = (slug: string) => `/public/buildings/${encodeURIComponent(slug)}`;

/** One function per Public Listing endpoint, answering in `language` (e.g. "vi-VN"). */
export const listingApi = (language: string) => {
  const get = async <T>(path: string, query?: Query) => (await request<T>(language, path, query)).data;
  return {
    buildings: () => get<PublicBuildingSummaryDto[]>("/public/buildings"),
    building: (slug: string) => get<PublicBuildingDto>(building(slug)),
    roomTypes: (slug: string) => get<PublicRoomTypeDto[]>(`${building(slug)}/room-types`),
    floors: (slug: string) => get<PublicFloorDto[]>(`${building(slug)}/floors`),
    rooms: (slug: string, q: RoomSearchQuery = {}) => request<PublicRoomListItemDto[]>(language, `${building(slug)}/rooms`, q),
    room: (slug: string, roomNumber: string) => get<PublicRoomDetailDto>(`${building(slug)}/rooms/${encodeURIComponent(roomNumber)}`),
    vacancies: (slug: string) => get<PublicVacancyDto[]>(`${building(slug)}/vacancies`),
    assets: (slug: string, category?: PublicAssetDto["category"]) => get<PublicAssetDto[]>(`${building(slug)}/assets`, { category }),
  };
};

const PAGE_LIMIT = 50; // the API's maximum

/** Every published room of a building: the first page tells how many more to fetch (in parallel). */
export async function allRooms(api: ReturnType<typeof listingApi>, slug: string): Promise<PublicRoomListItemDto[]> {
  const first = await api.rooms(slug, { page: 1, limit: PAGE_LIMIT, sortBy: "roomNumber", sortOrder: "ASC" });
  const pages = first.pagination?.totalPages ?? 1;
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, pages - 1) }, (_, i) =>
      api.rooms(slug, { page: i + 2, limit: PAGE_LIMIT, sortBy: "roomNumber", sortOrder: "ASC" }),
    ),
  );
  return [first, ...rest].flatMap((p) => p.data);
}

/** Building profile, all rooms and the equipment catalogue: what the rooms pages are built from. */
export async function fetchBuildingListing(language: string, slug = listingConfig.slug): Promise<BuildingListing> {
  const api = listingApi(language);
  const [b, rooms, assets] = await Promise.all([api.building(slug), allRooms(api, slug), api.assets(slug)]);
  return { building: b, rooms, assets };
}
