import { apiAs, newStaff, otpFor, randomPhone } from "./support/api";
import { ACCOUNTS, PASSWORD } from "./support/env";
import { expect, linkLabels, open, problem, requestCode, signIn, test } from "./support/fixtures";

/**
 * Module 0 — identity, through the browser: sign-in (password, OTP for finance roles, lock), the console per
 * role, activation and reset by OTP, devices and password change, and staff accounts managed by the landlord.
 */

test.describe("sign-in", () => {
  test("should send a visitor without a session to sign in, then back to the page they asked for", async ({ page }) => {
    await open(page, "/en/app/account");
    await expect(page).toHaveURL(/\/en\/sign-in\?next=%2Fen%2Fapp%2Faccount/);
    await page.getByLabel(/phone number/i).fill(ACCOUNTS.manager);
    await page.getByLabel(/^password/i).fill(PASSWORD);
    await page.getByRole("button", { name: /^sign in/i }).click();
    await expect(page).toHaveURL(/\/en\/app\/account$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Quản lý A \(dev\)/i);
  });

  test("should refuse a wrong password with the API's message, without signing in", async ({ page }) => {
    await open(page, "/en/sign-in");
    await page.getByLabel(/phone number/i).fill(ACCOUNTS.guard);
    await page.getByLabel(/^password/i).fill("not-the-password");
    await page.getByRole("button", { name: /^sign in/i }).click();
    await expect(problem(page)).toContainText(/incorrect/i);
    await expect(problem(page)).toContainText("AUTH_CREDENTIALS_INVALID");
    await expect(page).toHaveURL(/\/en\/sign-in/);
  });

  test("should confirm the landlord's sign-in with the code sent by SMS", async ({ page }) => {
    await open(page, "/en/sign-in");
    await page.getByLabel(/phone number/i).fill(ACCOUNTS.landlord);
    await page.getByLabel(/^password/i).fill(PASSWORD);
    await page.getByRole("button", { name: /^sign in/i }).click();
    await expect(page.getByRole("heading", { name: /enter the code/i })).toBeVisible();
    // the test API echoes the code; the page shows it in test environments only
    const code = (await page.getByText(/test environment: the code is/i).textContent())!.match(/\d{6}/)![0];
    await page.getByLabel(/^code/i).fill(code === "000000" ? "111111" : "000000");
    await page.getByRole("button", { name: /confirm/i }).click();
    await expect(problem(page)).toContainText("AUTH_OTP_INVALID");
    await expect(page.getByText(/attempts left/i)).toBeVisible();
    await page.getByLabel(/^code/i).fill(code);
    await page.getByRole("button", { name: /confirm/i }).click();
    await expect(page).toHaveURL(/\/en\/app$/);
    await expect(page.getByRole("link", { name: "Accounts" }).first()).toBeVisible();
  });

  test("should lock an account after five wrong passwords and count down", async ({ page }) => {
    // a fresh, activated staff account so the lock doesn't affect other tests
    const { phone, password } = await newStaff("GUARD", "Lock Test");

    await open(page, "/en/sign-in");
    await page.getByLabel(/phone number/i).fill(phone);
    for (let i = 0; i < 5; i++) {
      await page.getByLabel(/^password/i).fill(`wrong password ${i}`);
      await page.getByRole("button", { name: /^sign in/i }).click();
      await expect(problem(page)).toBeVisible();
    }
    await page.getByLabel(/^password/i).fill(password);
    await page.getByRole("button", { name: /^sign in/i }).click();
    await expect(problem(page)).toContainText("AUTH_ACCOUNT_LOCKED");
    await expect(page.getByText(/try again in \d+ s/i)).toBeVisible();
  });

  test("should refuse a sign-in posted from another site (CSRF)", async ({ request }) => {
    const res = await request.post("/api/auth/login", { headers: { origin: "https://evil.example" }, data: { phone: ACCOUNTS.manager, password: PASSWORD } });
    expect(res.status()).toBe(403);
    const forged = await request.post("/api/bff/auth/password/change", { headers: { "x-rm-csrf": "1", origin: "https://evil.example" }, data: {} });
    expect(forged.status()).toBe(403);
  });

  test("should keep the tokens out of the browser's reach", async ({ page }) => {
    await signIn(page.request, ACCOUNTS.manager);
    const cookies = await page.context().cookies();
    const at = cookies.find((c) => c.name === "rm_at")!;
    const rt = cookies.find((c) => c.name === "rm_rt")!;
    expect(at.httpOnly && rt.httpOnly).toBe(true);
    expect(at.path).toBe("/api");
    expect(rt.sameSite).toBe("Strict");
    await open(page, "/en/app");
    expect(await page.evaluate(() => document.cookie)).not.toContain("rm_");
  });
});

test.describe("console per role", () => {
  test("should show the manager their work and refuse the landlord's screens", async ({ as }) => {
    const page = await as("manager");
    await open(page, "/en/app");
    const nav = page.getByRole("navigation", { name: "Console" });
    await expect(nav.getByRole("link", { name: "Contracts" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Meter round" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Accounts" })).toHaveCount(0);
    await expect(nav.getByRole("link", { name: "Rental tax" })).toHaveCount(0);
    // the building comes from the account; every call is made for it
    await expect(page.getByRole("banner")).toContainText("Tòa nhà Sunrise (dev)");
    await open(page, "/en/app/users");
    await expect(problem(page)).toContainText("AUTH_FORBIDDEN_RESOURCE");
  });

  test("should give the guard the meter round and the rooms only", async ({ as }) => {
    const page = await as("guard");
    await open(page, "/en/app");
    const nav = page.getByRole("navigation", { name: "Console" });
    await expect(nav.getByRole("link", { name: "Meter round" })).toBeVisible();
    expect(await linkLabels(nav)).toEqual(["Dashboard", "Rooms", "Room types", "Meter round", "Meter readings", "Audit log", "My account"]);
  });

  test("should give a resident their home, not the building", async ({ as }) => {
    const page = await as("tenant");
    await open(page, "/en/app");
    const nav = page.getByRole("navigation", { name: "Console" });
    await expect(nav.getByRole("link", { name: "Bills & payment" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Rooms" })).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/hello/i);
  });

  test("should switch the console between Vietnamese and English on the same page", async ({ as }) => {
    const page = await as("manager");
    await open(page, "/vi/app/account");
    await expect(page.getByRole("heading", { name: "Thiết bị đang đăng nhập" })).toBeVisible();
    await page.getByRole("banner").getByRole("link", { name: "EN" }).click();
    await expect(page).toHaveURL(/\/en\/app\/account$/);
    await expect(page.getByRole("heading", { name: "Devices signed in" })).toBeVisible();
  });
});

test.describe("staff accounts (landlord)", () => {
  test("should invite a staff member, who activates by code and works with their role", async ({ as, browser }) => {
    const page = await as("landlord");
    const phone = randomPhone();
    await open(page, "/en/app/users");
    await page.getByRole("button", { name: /new staff account/i }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: /create and invite/i }).click();
    await expect(dialog.getByText("Pick at least one role")).toBeVisible();
    await dialog.getByLabel(/full name/i).fill("Bảo vệ Mới");
    await dialog.getByLabel(/^phone/i).fill(phone);
    await dialog.getByLabel("Guard").check();
    await dialog.getByRole("button", { name: /create and invite/i }).click();
    await expect(page).toHaveURL(/\/en\/app\/users\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Bảo vệ Mới");
    await expect(page.getByText("Not activated").first()).toBeVisible();

    // the new guard activates the account from the invitation
    const guardCtx = await browser.newContext();
    const guard = await guardCtx.newPage();
    await open(guard, "/en/activate");
    await guard.getByLabel(/phone number/i).fill(phone);
    const code = await requestCode(guard);
    await guard.getByLabel(/^code/i).fill(code);
    await guard.getByLabel(/^new password/i).fill("short");
    await guard.getByLabel(/repeat the new password/i).fill("short");
    await guard.getByRole("button", { name: /activate and sign in/i }).click();
    await expect(guard.getByText("At least 10 characters", { exact: true })).toBeVisible();
    await guard.getByLabel(/^new password/i).fill("night shift round 2026");
    await guard.getByLabel(/repeat the new password/i).fill("night shift round 2026");
    await guard.getByRole("button", { name: /activate and sign in/i }).click();
    await expect(guard).toHaveURL(/\/en\/app$/);
    await expect(guard.getByRole("navigation", { name: "Console" }).getByRole("link", { name: "Meter round" })).toBeVisible();

    // the landlord sees the account active, then disables it: the guard is signed out
    await page.reload();
    await expect(page.getByText("Active").first()).toBeVisible();
    await page.getByRole("button", { name: /disable the account/i }).click();
    await expect(page.getByText(/account disabled/i)).toBeVisible();
    await open(guard, "/en/app/account");
    await expect(guard).toHaveURL(/\/en\/sign-in/);
    await page.getByRole("button", { name: /enable the account/i }).click();
    await expect(page.getByText("Account enabled")).toBeVisible();
    await guardCtx.close();
  });

  test("should change a staff member's roles, guarding against stale edits", async ({ as }) => {
    const landlord = await apiAs("landlord");
    const me = await landlord.get("/auth/me");
    const user = await landlord.post("/users", { phone: randomPhone(), fullName: "Kế toán Phụ", roles: ["ACCOUNTANT"], buildingIds: [me.activeBuildingId] });
    const page = await as("landlord");
    await open(page, `/en/app/users/${user.id}`);
    await page.getByLabel("Property manager").check();
    // someone else saves first: the form's version is now stale
    await landlord.patch(`/users/${user.id}`, { fullName: "Kế toán Phụ (đổi tên)", version: user.version });
    await page.getByRole("button", { name: /^save$/i }).click();
    await expect(problem(page)).toContainText("RES_CONCURRENCY_CONFLICT");
    await page.reload();
    await expect(page.getByLabel(/full name/i)).toHaveValue("Kế toán Phụ (đổi tên)");
    await page.getByLabel("Property manager").check();
    await page.getByRole("button", { name: /^save$/i }).click();
    await expect(page.getByText(/was saved/i)).toBeVisible();
    expect((await landlord.get(`/users/${user.id}`)).roles.sort()).toEqual(["ACCOUNTANT", "PROPERTY_MANAGER"]);
  });

  test("should filter accounts by role in the URL", async ({ as }) => {
    const page = await as("landlord");
    await open(page, "/en/app/users");
    await page.getByLabel("Role").selectOption("TENANT");
    await expect(page).toHaveURL(/role=TENANT/);
    await expect(page.getByRole("cell", { name: "Khách thuê A (dev)" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Quản lý A (dev)" })).toHaveCount(0);
  });
});

test.describe("own account", () => {
  test("should reset a forgotten password by code, change it, and sign out other devices", async ({ page, browser }) => {
    const landlord = await apiAs("landlord");
    const me = await landlord.get("/auth/me");
    const phone = randomPhone();
    await landlord.post("/users", { phone, fullName: "Quản lý Ca Đêm", roles: ["PROPERTY_MANAGER"], buildingIds: [me.activeBuildingId] });
    const code = await otpFor(phone, "ACTIVATE_ACCOUNT");
    await page.request.post("/api/auth/activate", { headers: { "x-rm-csrf": "1" }, data: { phone, code, newPassword: "first evening password" } });
    await page.context().clearCookies();

    // forgot password → code → new password → sign in with it
    await open(page, "/en/sign-in");
    await page.getByRole("link", { name: /forgot password/i }).click();
    await page.waitForURL(/forgot-password/);
    await page.waitForLoadState("networkidle");
    await page.getByLabel(/phone number/i).fill(phone);
    const reset = await requestCode(page);
    await page.getByLabel(/^code/i).fill(reset);
    await page.getByLabel(/^new password/i).fill("second evening password");
    await page.getByLabel(/repeat the new password/i).fill("second evening password!");
    await page.getByRole("button", { name: /save the new password/i }).click();
    await expect(page.getByText("The two passwords differ")).toBeVisible();
    await page.getByLabel(/repeat the new password/i).fill("second evening password");
    await page.getByRole("button", { name: /save the new password/i }).click();
    await expect(page.getByRole("heading", { name: /password changed/i })).toBeVisible();
    await page.getByRole("link", { name: /sign in/i }).click();
    await page.waitForURL(/sign-in\?phone=/);
    await page.waitForLoadState("networkidle");
    await expect(page.getByLabel(/phone number/i)).toHaveValue(phone);
    await page.getByLabel(/^password/i).fill("second evening password");
    await page.getByRole("button", { name: /^sign in/i }).click();
    await expect(page).toHaveURL(/\/en\/app$/);

    // a second device signs in; this one sees it and signs it out
    const other = await browser.newContext({ userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit Version/17.0 Mobile Safari/604.1" });
    await signIn(other.request, phone, "second evening password");
    await open(page, "/en/app/account");
    const row = page.getByRole("row", { name: /Safari · iOS/ });
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: /sign out/i }).click();
    await expect(page.getByText(/Safari · iOS was signed out/)).toBeVisible();
    const otherPage = await other.newPage();
    await open(otherPage, "/en/app");
    await expect(otherPage).toHaveURL(/\/en\/sign-in/);

    // password change: the current one must be right; afterwards the new one works
    await page.getByLabel(/current password/i).fill("wrong current password");
    await page.getByLabel(/^new password/i).fill("third evening password");
    await page.getByLabel(/repeat the new password/i).fill("third evening password");
    await page.getByRole("button", { name: /change password/i }).click();
    await expect(problem(page)).toBeVisible();
    await page.getByLabel(/current password/i).fill("second evening password");
    await page.getByRole("button", { name: /change password/i }).click();
    await expect(page.getByText(/password changed/i)).toBeVisible();

    // sign out: back to sign-in, the console is closed again
    await page.getByRole("banner").getByRole("button", { name: /Quản lý Ca Đêm/ }).click();
    await page.getByRole("menuitem", { name: /^sign out$/i }).click();
    await expect(page).toHaveURL(/\/en\/sign-in/);
    await open(page, "/en/app");
    await expect(page).toHaveURL(/\/en\/sign-in\?next=/);
    await other.close();
  });

  test("should send the visitor to sign in when the session is revoked elsewhere", async ({ page }) => {
    const staff = await newStaff("ACCOUNTANT", "Kế toán Tạm");
    await signIn(page.request, staff.phone, staff.password);
    await open(page, "/en/app/account");
    await expect(page.getByRole("row", { name: /this device/i })).toBeVisible();
    // the same account signs out every device from another browser
    const api = await apiAs(staff);
    await api.post("/auth/logout-all", undefined, { idempotent: false });
    await page.getByRole("navigation", { name: "Console" }).getByRole("link", { name: "Dashboard" }).click();
    await open(page, "/en/app/account");
    await expect(page).toHaveURL(/\/en\/sign-in/);
  });
});
