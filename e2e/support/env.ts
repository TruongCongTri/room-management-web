/** Where the e2e API and its fakes run (the API repo's test/fe-stack). */
export const API = process.env.E2E_API_URL ?? "http://127.0.0.1:5001/api/v1";
/** Fakes' control port: POST /pay { appTransId } → the signed ZaloPay callback; GET /stats. */
export const FAKES = process.env.E2E_FAKES_URL ?? "http://127.0.0.1:47203";
export const BUILDING_A = "b1000000-0000-4000-8000-000000000001";
export const PASSWORD = "RentalDev@2026";

/** Dev seed accounts (identity/seeds/dev-accounts.seed.ts). */
export const ACCOUNTS = {
  landlord: "0901000001",
  manager: "0901000002",
  accountant: "0901000003",
  guard: "0901000004",
  tenant: "0901000005",
  landlordB: "0902000001",
} as const;
export type Role = keyof typeof ACCOUNTS;
