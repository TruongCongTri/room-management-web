import { test as base, expect, type APIRequestContext, type BrowserContext, type Page } from "@playwright/test";
import { ACCOUNTS, PASSWORD, type Role } from "./env";

type Cookies = Awaited<ReturnType<BrowserContext["cookies"]>>;

/**
 * One signed-in session per role for the whole run (landlord and accountant confirm sign-in with an OTP; the
 * API limits how often). Refresh tokens rotate on every use and a reused one revokes the session, so after
 * each test the context's current cookies are kept for the next test of that role.
 */
const sessions = new Map<Role, Cookies>();

/** The OTP cooldown (10 s on the e2e API) applies when one phone signs in with a code twice in a row: wait it out. */
export async function withOtpCooldown<R extends { status(): number; headers(): Record<string, string> }>(send: () => Promise<R>): Promise<R> {
  for (let attempt = 0; ; attempt++) {
    const res = await send();
    if (res.status() !== 429 || attempt >= 3) return res;
    await new Promise((r) => setTimeout(r, (Number(res.headers()["retry-after"]) || 10) * 1000 + 500));
  }
}

/** Sign in through this app's /api/auth (a 202 is confirmed with the test environment's echoed code). */
export async function signIn(request: APIRequestContext, phone: string, password = PASSWORD): Promise<void> {
  const headers = { "x-rm-csrf": "1" };
  const res = await withOtpCooldown(() => request.post("/api/auth/login", { headers, data: { phone, password } }));
  if (res.status() === 202) {
    const { data } = await res.json();
    const mfa = await request.post("/api/auth/login/mfa", { headers, data: { challengeId: data.challengeId, code: data.debugCode } });
    expect(mfa.status(), await mfa.text()).toBe(200);
    return;
  }
  expect(res.status(), await res.text()).toBe(200);
}

export const test = base.extend<{ as: (role: Role) => Promise<Page> }>({
  as: async ({ context, page }, use) => {
    let current: Role | null = null;
    await use(async (role) => {
      current = role;
      const saved = sessions.get(role);
      if (saved) await context.addCookies(saved);
      else await signIn(page.request, ACCOUNTS[role]);
      return page;
    });
    if (current) {
      const cookies = (await context.cookies()).filter((c) => c.name.startsWith("rm_"));
      if (cookies.some((c) => c.name === "rm_sess" && c.value === "1")) sessions.set(current, cookies);
      else sessions.delete(current);
    }
  },
});

/** Forget a role's saved session (after a test signed it out or changed its password). */
export const forgetSession = (role: Role) => sessions.delete(role);

/**
 * Click "send the code" on the activation / reset page and return the code the test API echoes. A code sent to the
 * same phone moments earlier puts the button on a short cooldown (429 + countdown): wait it out like a user would.
 */
export async function requestCode(page: Page): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.getByRole("button", { name: /send the code|send a new code/i }).click();
    const echoed = page.getByText(/test environment: the code is/i);
    const limited = page.locator('[data-problem="AUTH_OTP_RATE_LIMITED"]');
    await expect(echoed.or(limited)).toBeVisible();
    if (await echoed.isVisible()) return (await echoed.textContent())!.match(/\d{6}/)![0];
    await expect(page.getByText(/try again in \d+ s/i)).toBeHidden({ timeout: 15_000 });
  }
  throw new Error("no code after the cooldown");
}

/** Open a page and wait until React has hydrated it (typing earlier could be undone by hydration). */
export async function open(page: Page, url: string) {
  await page.goto(url);
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === "1");
}

/** The error box of a screen (the API's message, code and trace id). */
export const problem = (page: Page) => page.locator("[data-problem]");

/** Labels of links whose text rolls on hover (the label is rendered twice for the animation). */
export const linkLabels = (scope: ReturnType<Page["getByRole"]>) =>
  scope.getByRole("link").evaluateAll((els) => els.map((e) => (e.querySelector(".roll-a")?.textContent ?? e.textContent ?? "").trim()));
export { expect };
