/**
 * The API's own input rules, checked in the browser first so most mistakes never leave the page.
 * The API stays authoritative (it also rejects common passwords).
 */

/** Vietnamese mobile numbers, as the API accepts them (+84… or 0…, current prefixes). */
export const VN_PHONE = /^(?:\+84|0)(?:3[2-9]|5[25689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/;

/** "0901 000 002" / "+84 901-000-002" → "0901000002" / "+84901000002" */
export const normalizePhone = (value: string) => value.replace(/[\s.()-]/g, "");

export const isPhone = (value: string) => VN_PHONE.test(normalizePhone(value));

export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 128;

export type PasswordIssue = "TOO_SHORT" | "TOO_LONG" | "CONTAINS_PHONE_NUMBER" | "MISMATCH";

/** Length (code points, after NFKC like the API), no last 6 digits of the phone, and both entries equal. */
export function passwordIssues(password: string, confirm: string, phone?: string): PasswordIssue[] {
  const p = password.normalize("NFKC");
  const length = [...p].length;
  const issues: PasswordIssue[] = [];
  if (length < PASSWORD_MIN) issues.push("TOO_SHORT");
  if (length > PASSWORD_MAX) issues.push("TOO_LONG");
  const tail = phone ? normalizePhone(phone).replace(/\D/g, "").slice(-6) : "";
  if (tail.length === 6 && p.replace(/\D/g, "").includes(tail)) issues.push("CONTAINS_PHONE_NUMBER");
  if (confirm !== password) issues.push("MISMATCH");
  return issues;
}

/** One-time codes are 6 digits. */
export const isOtp = (code: string) => /^\d{6}$/.test(code.trim());
