import { createApi } from "@reduxjs/toolkit/query/react";
import type { components } from "../api/generated/schema";
import { bffBaseQuery, type Envelope, type Pagination } from "./baseQuery";

/**
 * The console's API slice. Each module injects its endpoints (lib/console/endpoints/*); DTO types come from
 * the API's OpenAPI document (lib/api/generated/schema.d.ts, `npm run api:types`).
 */
export type Schemas = components["schemas"];
export type Dto<K extends keyof Schemas> = Schemas[K];

export type Page<T> = { items: T[]; pagination: Pagination };

export const TAGS = [
  "Me",
  "Sessions",
  "Users",
  "Buildings",
  "RoomTypes",
  "Rooms",
  "Vacancies",
  "Assets",
  "RoomAssets",
  "Tenants",
  "Contracts",
  "ServiceCatalog",
  "Readings",
  "MeterCycle",
  "BillingRuns",
  "Invoices",
  "Settlements",
  "Documents",
  "Residency",
  "Pccc",
  "Tax",
  "EInvoices",
  "Audit",
  "Mine",
] as const;

export const consoleApi = createApi({
  reducerPath: "consoleApi",
  baseQuery: bffBaseQuery,
  tagTypes: TAGS,
  // live data: refetch when the tab comes back or the network returns; drop unused entries after a minute
  refetchOnFocus: true,
  refetchOnReconnect: true,
  keepUnusedDataFor: 60,
  endpoints: () => ({}),
});

/** `{ data, meta }` → data */
export const one = <T>(env: unknown): T => (env as Envelope<T>).data;
/** Paged list `{ data: T[], meta: { pagination } }` → { items, pagination } */
export const page = <T>(env: unknown): Page<T> => {
  const e = env as Envelope<T[]>;
  return { items: e.data, pagination: e.meta.pagination! };
};
