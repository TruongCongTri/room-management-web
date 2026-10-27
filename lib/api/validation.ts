import type { ContactRequest, SubscribeRequest } from "./types";

// shared by the form (instant feedback) and the mock API (authoritative check)
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PHONE = /^\+?[\d\s().-]{8,}$/;

/** Error codes, not messages: each side words them in the visitor's language (`ui.validation`). */
export type FieldError = "required" | "format" | "email";
export type FieldErrors = Partial<Record<keyof ContactRequest, FieldError>>;

export function validateContact(v: Partial<ContactRequest>): FieldErrors {
  const e: FieldErrors = {};
  if (!v.firstName?.trim()) e.firstName = "required";
  if (!v.email?.trim()) e.email = "required";
  else if (!EMAIL.test(v.email.trim())) e.email = "format";
  if (v.phone?.trim() && !PHONE.test(v.phone.trim())) e.phone = "format";
  if (!v.message?.trim()) e.message = "required";
  return e;
}

export function validateSubscribe(v: Partial<SubscribeRequest>): Partial<Record<keyof SubscribeRequest, FieldError>> {
  return v.email && EMAIL.test(v.email.trim()) ? {} : { email: "email" };
}
