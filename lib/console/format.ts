import type { Locale } from "../../i18n/config";
export { vnd } from "../format";

/**
 * Values as the API sends them (doc 05 §6.1): money = integer VND, dates "YYYY-MM-DD" on the Vietnam calendar,
 * timestamps ISO-8601 UTC shown in Vietnam time, billing months as the 1st of the month.
 */
const TZ = "Asia/Ho_Chi_Minh";
const tag = (l: Locale) => (l === "vi" ? "vi-VN" : "en-GB");

/** "2026-10-27" → "27/10/2026" (vi) or "27 Oct 2026" (en). */
export function date(value: string | null | undefined, l: Locale): string {
  if (!value) return "—";
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return value;
  return new Intl.DateTimeFormat(tag(l), { day: "2-digit", month: l === "vi" ? "2-digit" : "short", year: "numeric", timeZone: "UTC" }).format(Date.UTC(y, m - 1, d));
}

/** ISO timestamp → "27/10/2026 14:05" in Vietnam time. */
export function dateTime(value: string | null | undefined, l: Locale): string {
  if (!value) return "—";
  const t = Date.parse(value);
  if (Number.isNaN(t)) return value;
  return new Intl.DateTimeFormat(tag(l), { day: "2-digit", month: l === "vi" ? "2-digit" : "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ }).format(t);
}

/** "2026-10-01" (or "2026-10") → "10/2026" (vi) or "Oct 2026" (en). */
export function month(value: string | null | undefined, l: Locale): string {
  if (!value) return "—";
  const [y, m] = value.split("-").map(Number);
  if (!y || !m) return value;
  if (l === "vi") return `${String(m).padStart(2, "0")}/${y}`;
  return new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric", timeZone: "UTC" }).format(Date.UTC(y, m - 1, 1));
}

/** Today on the Vietnam calendar, "YYYY-MM-DD". */
export function todayVn(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  return parts; // en-CA formats as YYYY-MM-DD
}

/** This month on the Vietnam calendar as the API's billing month "YYYY-MM-01". */
export const thisMonthVn = (now = new Date()) => `${todayVn(now).slice(0, 7)}-01`;

/** "YYYY-MM-01" shifted by n months. */
export function addMonths(monthValue: string, n: number): string {
  const [y, m] = monthValue.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

/** 1234.5 → "1.234,5" (vi) / "1,234.5" (en) — meter indexes, areas. */
export const num = (n: number | null | undefined, l: Locale, digits = 2) =>
  n === null || n === undefined ? "—" : new Intl.NumberFormat(tag(l), { maximumFractionDigits: digits }).format(n);

/** Signed money for ledgers: +1.000.000₫ / −500.000₫. */
export function signedVnd(n: number): string {
  const abs = `${String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}₫`;
  return n > 0 ? `+${abs}` : n < 0 ? `−${abs}` : abs;
}

/** "+84901000002" / "0901000002" → "0901 000 002" for display of what the user typed. */
export function phoneDisplay(p: string): string {
  const digits = p.replace(/\D/g, "");
  const local = digits.startsWith("84") ? `0${digits.slice(2)}` : digits;
  return local.replace(/^(\d{4})(\d{3})(\d+)$/, "$1 $2 $3");
}
