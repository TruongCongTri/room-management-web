import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests: the real app (this site + its BFF) against a real API with fakes for ZaloPay / ZNS /
 * Twilio / e-invoices — the API repo's `test/fe-stack` (port 5001, its own database). Start both first:
 *
 *   (API repo)  node -r ts-node/register/transpile-only test/fe-stack/fe-stack.ts prepare --reset && … start
 *   (this repo) NEXT_DIST_DIR=.next-e2e BACKEND_API_URL=http://127.0.0.1:5001/api/v1 npx next dev -p 3100
 *   E2E_BASE_URL=http://localhost:3100 npm run test:e2e
 *
 * One worker: the tests share one API and one database, and several of them depend on the order of records.
 */
export default defineConfig({
  testDir: "e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    locale: "en-GB",
    timezoneId: "Asia/Ho_Chi_Minh",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } }],
});
