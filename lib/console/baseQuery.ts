import type { BaseQueryFn } from "@reduxjs/toolkit/query";
import { languageTag } from "../../i18n/config";
import { SESSION_ENDED, toProblem, type ApiProblem } from "./problem";
import { sessionEnded, type ConsoleState } from "./slice";

/**
 * RTK Query base query for the console: every call goes to this app's /api/bff (which adds the session's token),
 * with the visitor's language, the chosen building (X-Building-ID) and, for actions marked ⚑ in the API docs,
 * the action's Idempotency-Key. Answers come back as the API's envelope `{ data, meta }`; failures as ApiProblem.
 */
export type Request = {
  url: string;
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  params?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
  /** One key per user action, reused when the same action is retried. */
  idempotencyKey?: string;
};

export type Envelope<T> = { data: T; meta: { traceId: string; timestamp: string; durationMs?: number; pagination?: Pagination } };
export type Pagination = { page: number; limit: number; totalItems: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean };

export const BFF_BASE = "/api/bff";

/** Routes outside a building: no X-Building-ID (doc 05 §6.1). */
const UNSCOPED = /^\/(api\/auth|auth|users|public)(\/|$)/;

export function queryString(params: Request["params"]): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params ?? {})) if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
  const s = q.toString();
  return s ? `?${s}` : "";
}

/** `attachment; filename="01-BDS-2026-Q3.xlsx"` → the file name. */
export function filenameOf(disposition: string | null): string | null {
  if (!disposition) return null;
  const star = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(disposition);
  if (star) return decodeURIComponent(star[1].trim().replace(/^"|"$/g, ""));
  const plain = /filename="?([^";]+)"?/i.exec(disposition);
  return plain ? plain[1] : null;
}

const RETRIES = 2;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const bffBaseQuery: BaseQueryFn<Request | string, unknown, ApiProblem> = async (arg, api) => {
  const req: Request = typeof arg === "string" ? { url: arg } : arg;
  const method = req.method ?? "GET";
  const state = (api.getState() as { console: ConsoleState }).console;

  const headers = new Headers({ accept: "application/json", "accept-language": languageTag[state.locale] });
  if (method !== "GET") headers.set("x-rm-csrf", "1");
  if (req.body !== undefined) headers.set("content-type", "application/json");
  if (req.idempotencyKey) headers.set("idempotency-key", req.idempotencyKey);
  if (state.buildingId && !UNSCOPED.test(req.url)) headers.set("x-building-id", state.buildingId);

  // "/api/auth/login" etc. are this app's own session routes; everything else is an API path behind the BFF
  const url = `${req.url.startsWith("/api/") ? "" : BFF_BASE}${req.url}${queryString(req.params)}`;
  for (let attempt = 0; ; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, {
        method,
        headers,
        body: req.body === undefined ? undefined : JSON.stringify(req.body),
        credentials: "same-origin",
        signal: api.signal,
      });
    } catch (e) {
      if (api.signal.aborted) return { error: toProblem("ABORTED", null) };
      // reads retry network failures; an action is not resent here (the screen offers "try again" with the same key)
      if (method === "GET" && attempt < RETRIES) {
        await sleep(400 * 2 ** attempt);
        continue;
      }
      return { error: toProblem(e instanceof DOMException && e.name === "TimeoutError" ? "TIMEOUT_ERROR" : "FETCH_ERROR", null) };
    }

    if (res.ok) {
      if (res.status === 204) return { data: null };
      return { data: await res.json() };
    }

    if (method === "GET" && res.status >= 500 && res.status !== 501 && attempt < RETRIES) {
      await sleep(400 * 2 ** attempt);
      continue;
    }
    const body = await res.json().catch(() => null);
    const problem = toProblem(res.status, body, res.headers.get("retry-after"));
    if (res.status === 401 && SESSION_ENDED.has(problem.code)) api.dispatch(sessionEnded());
    return { error: problem };
  }
};
