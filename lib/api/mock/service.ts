/**
 * Mock backend behaviour: read resources and accept form posts, with the same status codes and
 * bodies a real API would return, in the requested locale. Used by the route handlers in app/api
 * and by lib/api/server.ts.
 */
import type { Locale } from "../../../i18n/config";
import { getMessages } from "../../../i18n/messages";
import type { ApiError, ContactRequest, ContactResponse, SubscribeRequest, SubscribeResponse } from "../types";
import { validateContact, validateSubscribe } from "../validation";
import { database, type Database } from "./db";

export type ResourceName = keyof Database;

/** A copy, so callers can never mutate the "database". */
export function readResource<N extends ResourceName>(name: N, locale: Locale): Database[N] {
  return structuredClone(database(locale)[name]);
}

type Result<T> = { status: number; body: T | ApiError };

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
const id = () => Math.random().toString(36).slice(2, 10);

export async function createContactMessage(input: unknown, locale: Locale): Promise<Result<ContactResponse>> {
  await pause(600); // feel like a network round trip
  const words = getMessages(locale).ui.validation;
  const body = (input ?? {}) as Partial<ContactRequest>;
  const codes = validateContact(body);
  if (Object.keys(codes).length) {
    const fields = Object.fromEntries(Object.entries(codes).map(([k, code]) => [k, words[code]]));
    return { status: 422, body: { message: words.form, fields } };
  }
  return { status: 201, body: { id: `msg_${id()}`, receivedAt: new Date().toISOString() } };
}

export async function createSubscription(input: unknown, locale: Locale): Promise<Result<SubscribeResponse>> {
  await pause(500);
  const code = validateSubscribe((input ?? {}) as Partial<SubscribeRequest>).email;
  if (code) {
    const message = getMessages(locale).ui.validation[code];
    return { status: 422, body: { message, fields: { email: message } } };
  }
  return { status: 201, body: { id: `sub_${id()}` } };
}
