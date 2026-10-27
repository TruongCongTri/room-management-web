/**
 * Every failed call, whatever went wrong (API error envelope, proxy error, network, timeout), as one shape the
 * screens handle: switch on `code` (stable), show `message` (already in the visitor's language), map
 * `fields` onto form inputs, quote `traceId` to support, count down `retryAfter` seconds.
 */
export type ApiProblem = {
  status: number;
  code: string;
  message: string;
  details?: unknown;
  detail?: string;
  traceId?: string;
  /** Seconds, from Retry-After (429 rate limits, 423 account lock). */
  retryAfter?: number;
  /** Field name → message, from `error.details[]` items that name a field. */
  fields: Record<string, string>;
  /** No answer at all (offline, proxy unreachable). */
  offline?: boolean;
};

type Envelope = { error?: { code?: unknown; message?: unknown; status?: unknown; details?: unknown; detail?: unknown }; meta?: { traceId?: unknown } };

/** Items of `error.details` as objects (the API sends an array of { field, issue, message, … } or one object). */
export function detailItems(details: unknown): Record<string, unknown>[] {
  if (Array.isArray(details)) return details.filter((d): d is Record<string, unknown> => Boolean(d) && typeof d === "object");
  return details && typeof details === "object" ? [details as Record<string, unknown>] : [];
}

/** First value of `key` in the details (e.g. tenantId, previousIndex, fingerprint, outstanding). */
export function detailValue<T = unknown>(problem: Pick<ApiProblem, "details"> | null | undefined, key: string): T | undefined {
  for (const item of detailItems(problem?.details)) if (key in item) return item[key] as T;
  return undefined;
}

/** All `issue` values of the details (e.g. password policy rules). */
export const detailIssues = (problem: Pick<ApiProblem, "details"> | null | undefined): string[] =>
  detailItems(problem?.details)
    .map((d) => d.issue)
    .filter((i): i is string => typeof i === "string");

function fieldsOf(details: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  for (const d of detailItems(details)) {
    if (typeof d.field !== "string" || !d.field) continue;
    const text = typeof d.message === "string" ? d.message : typeof d.issue === "string" ? d.issue : "";
    // keep the first message per field; nested fields ("occupants.0.tenantId") also answer to their root
    if (!(d.field in out)) out[d.field] = text;
  }
  return out;
}

export function parseRetryAfter(value: string | null | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  if (Number.isFinite(n)) return Math.max(0, Math.ceil(n));
  const at = Date.parse(value);
  return Number.isNaN(at) ? undefined : Math.max(0, Math.ceil((at - Date.now()) / 1000));
}

/** HTTP status + body (+ Retry-After) → ApiProblem. A body without the envelope still gives a usable problem. */
export function toProblem(status: number | string, body: unknown, retryAfterHeader?: string | null): ApiProblem {
  if (typeof status !== "number") {
    return { status: 0, code: status === "TIMEOUT_ERROR" ? "REQ_TIMEOUT" : "NETWORK_ERROR", message: "", fields: {}, offline: status === "FETCH_ERROR" };
  }
  const env = (body && typeof body === "object" ? body : {}) as Envelope;
  const e = env.error ?? {};
  return {
    status,
    code: typeof e.code === "string" ? e.code : `HTTP_${status}`,
    message: typeof e.message === "string" ? e.message : "",
    details: e.details,
    detail: typeof e.detail === "string" ? e.detail : undefined,
    traceId: typeof env.meta?.traceId === "string" ? env.meta.traceId : undefined,
    retryAfter: parseRetryAfter(retryAfterHeader),
    fields: fieldsOf(e.details),
  };
}

/** Codes after which the session is over on this device: sign in again. */
export const SESSION_ENDED = new Set(["AUTH_SESSION_REVOKED", "AUTH_REFRESH_TOKEN_REUSED", "AUTH_TOKEN_INVALID", "AUTH_UNAUTHORIZED", "AUTH_TOKEN_EXPIRED", "AUTH_ACCOUNT_DISABLED"]);

export const isProblem = (e: unknown): e is ApiProblem => Boolean(e) && typeof e === "object" && "code" in (e as object) && "fields" in (e as object);
