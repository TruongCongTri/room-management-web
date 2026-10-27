# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: identity.spec.ts >> own account >> should reset a forgotten password by code, change it, and sign out other devices
- Location: e2e\identity.spec.ts:204:7

# Error details

```
Error: locator.fill: Error: strict mode violation: getByLabel(/phone number/i) resolved to 2 elements:
    1) <input value="" id="_r_0_" type="tel" required="" inputmode="tel" autocomplete="tel" placeholder="0901 234 567" class="w-full bg-transparent px-[clamp(14px,1.4vw,26px)] pb-3 pt-1 text-[clamp(15px,1.05vw,19px)] font-semibold tracking-[-0.02em] text-ink outline-none placeholder:font-medium placeholder:text-ink/25 disabled:text-ink/45"/> aka getByRole('textbox', { name: 'Phone number *' })
    2) <input value="" type="tel" required="" inputmode="tel" autocomplete="username" id="_R_1eatperqbml9etb_" placeholder="0901 234 567" class="w-full bg-transparent px-[clamp(14px,1.4vw,26px)] pb-3 pt-1 text-[clamp(15px,1.05vw,19px)] font-semibold tracking-[-0.02em] text-ink outline-none placeholder:font-medium placeholder:text-ink/25 disabled:text-ink/45"/> aka locator('[id="_R_1eatperqbml9etb_"]')

Call log:
  - waiting for getByLabel(/phone number/i)

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e3]:
    - link "Atrium" [ref=e4] [cursor=pointer]:
      - /url: /en
    - navigation "Language" [ref=e11]:
      - link "VI" [ref=e13] [cursor=pointer]:
        - /url: /vi/forgot-password
      - generic [ref=e14]:
        - generic [ref=e15]: /
        - generic [ref=e16]: EN
    - link "← Back to the site" [ref=e17] [cursor=pointer]:
      - /url: /en
  - main [ref=e18]:
    - generic [ref=e20]:
      - generic [ref=e21]:
        - paragraph [ref=e22]: "[01] Reset"
        - heading "Reset your password" [level=1] [ref=e23]
        - paragraph [ref=e24]: Enter your phone number and we will send you a code to choose a new password.
      - generic [ref=e26]:
        - generic [ref=e27]: Phone number *
        - textbox "Phone number *" [ref=e30]:
          - /placeholder: 0901 234 567
      - button "Send the code" [ref=e31]:
        - generic [ref=e33]:
          - generic [ref=e34]: Send the code
          - generic [aria-hidden] [ref=e35]: Send the code
      - link "Back to sign in" [ref=e45] [cursor=pointer]:
        - /url: /en/sign-in
  - button "Open Next.js Dev Tools" [ref=e109] [cursor=pointer]
  - alert [ref=e113]: RESET YOUR PASSWORD
```

# Test source

```ts
  118 |   test("should switch the console between Vietnamese and English on the same page", async ({ as }) => {
  119 |     const page = await as("manager");
  120 |     await open(page, "/vi/app/account");
  121 |     await expect(page.getByRole("heading", { name: "Thiết bị đang đăng nhập" })).toBeVisible();
  122 |     await page.getByRole("banner").getByRole("link", { name: "EN" }).click();
  123 |     await expect(page).toHaveURL(/\/en\/app\/account$/);
  124 |     await expect(page.getByRole("heading", { name: "Devices signed in" })).toBeVisible();
  125 |   });
  126 | });
  127 | 
  128 | test.describe("staff accounts (landlord)", () => {
  129 |   test("should invite a staff member, who activates by code and works with their role", async ({ as, browser }) => {
  130 |     const page = await as("landlord");
  131 |     const phone = randomPhone();
  132 |     await open(page, "/en/app/users");
  133 |     await page.getByRole("button", { name: /new staff account/i }).click();
  134 |     const dialog = page.getByRole("dialog");
  135 |     await dialog.getByRole("button", { name: /create and invite/i }).click();
  136 |     await expect(dialog.getByText("Pick at least one role")).toBeVisible();
  137 |     await dialog.getByLabel(/full name/i).fill("Bảo vệ Mới");
  138 |     await dialog.getByLabel(/^phone/i).fill(phone);
  139 |     await dialog.getByLabel("Guard").check();
  140 |     await dialog.getByRole("button", { name: /create and invite/i }).click();
  141 |     await expect(page).toHaveURL(/\/en\/app\/users\/[0-9a-f-]{36}$/);
  142 |     await expect(page.getByRole("heading", { level: 1 })).toHaveText("Bảo vệ Mới");
  143 |     await expect(page.getByText("Not activated").first()).toBeVisible();
  144 | 
  145 |     // the new guard activates the account from the invitation
  146 |     const guardCtx = await browser.newContext();
  147 |     const guard = await guardCtx.newPage();
  148 |     await open(guard, "/en/activate");
  149 |     await guard.getByLabel(/phone number/i).fill(phone);
  150 |     const code = await requestCode(guard);
  151 |     await guard.getByLabel(/^code/i).fill(code);
  152 |     await guard.getByLabel(/^new password/i).fill("short");
  153 |     await guard.getByLabel(/repeat the new password/i).fill("short");
  154 |     await guard.getByRole("button", { name: /activate and sign in/i }).click();
  155 |     await expect(guard.getByText("At least 10 characters", { exact: true })).toBeVisible();
  156 |     await guard.getByLabel(/^new password/i).fill("night shift round 2026");
  157 |     await guard.getByLabel(/repeat the new password/i).fill("night shift round 2026");
  158 |     await guard.getByRole("button", { name: /activate and sign in/i }).click();
  159 |     await expect(guard).toHaveURL(/\/en\/app$/);
  160 |     await expect(guard.getByRole("navigation", { name: "Console" }).getByRole("link", { name: "Meter round" })).toBeVisible();
  161 | 
  162 |     // the landlord sees the account active, then disables it: the guard is signed out
  163 |     await page.reload();
  164 |     await expect(page.getByText("Active").first()).toBeVisible();
  165 |     await page.getByRole("button", { name: /disable the account/i }).click();
  166 |     await expect(page.getByText(/account disabled/i)).toBeVisible();
  167 |     await open(guard, "/en/app/account");
  168 |     await expect(guard).toHaveURL(/\/en\/sign-in/);
  169 |     await page.getByRole("button", { name: /enable the account/i }).click();
  170 |     await expect(page.getByText("Account enabled")).toBeVisible();
  171 |     await guardCtx.close();
  172 |   });
  173 | 
  174 |   test("should change a staff member's roles, guarding against stale edits", async ({ as }) => {
  175 |     const landlord = await apiAs("landlord");
  176 |     const me = await landlord.get("/auth/me");
  177 |     const user = await landlord.post("/users", { phone: randomPhone(), fullName: "Kế toán Phụ", roles: ["ACCOUNTANT"], buildingIds: [me.activeBuildingId] });
  178 |     const page = await as("landlord");
  179 |     await open(page, `/en/app/users/${user.id}`);
  180 |     await page.getByLabel("Property manager").check();
  181 |     // someone else saves first: the form's version is now stale
  182 |     await landlord.patch(`/users/${user.id}`, { fullName: "Kế toán Phụ (đổi tên)", version: user.version });
  183 |     await page.getByRole("button", { name: /^save$/i }).click();
  184 |     await expect(problem(page)).toContainText("RES_CONCURRENCY_CONFLICT");
  185 |     await page.reload();
  186 |     await expect(page.getByLabel(/full name/i)).toHaveValue("Kế toán Phụ (đổi tên)");
  187 |     await page.getByLabel("Property manager").check();
  188 |     await page.getByRole("button", { name: /^save$/i }).click();
  189 |     await expect(page.getByText(/was saved/i)).toBeVisible();
  190 |     expect((await landlord.get(`/users/${user.id}`)).roles.sort()).toEqual(["ACCOUNTANT", "PROPERTY_MANAGER"]);
  191 |   });
  192 | 
  193 |   test("should filter accounts by role in the URL", async ({ as }) => {
  194 |     const page = await as("landlord");
  195 |     await open(page, "/en/app/users");
  196 |     await page.getByLabel("Role").selectOption("TENANT");
  197 |     await expect(page).toHaveURL(/role=TENANT/);
  198 |     await expect(page.getByRole("cell", { name: "Khách thuê A (dev)" })).toBeVisible();
  199 |     await expect(page.getByRole("cell", { name: "Quản lý A (dev)" })).toHaveCount(0);
  200 |   });
  201 | });
  202 | 
  203 | test.describe("own account", () => {
  204 |   test("should reset a forgotten password by code, change it, and sign out other devices", async ({ page, browser }) => {
  205 |     const landlord = await apiAs("landlord");
  206 |     const me = await landlord.get("/auth/me");
  207 |     const phone = randomPhone();
  208 |     await landlord.post("/users", { phone, fullName: "Quản lý Ca Đêm", roles: ["PROPERTY_MANAGER"], buildingIds: [me.activeBuildingId] });
  209 |     const code = await otpFor(phone, "ACTIVATE_ACCOUNT");
  210 |     await page.request.post("/api/auth/activate", { headers: { "x-rm-csrf": "1" }, data: { phone, code, newPassword: "first evening password" } });
  211 |     await page.context().clearCookies();
  212 | 
  213 |     // forgot password → code → new password → sign in with it
  214 |     await open(page, "/en/sign-in");
  215 |     await page.getByRole("link", { name: /forgot password/i }).click();
  216 |     await page.waitForURL(/forgot-password/);
  217 |     await page.waitForLoadState("networkidle");
> 218 |     await page.getByLabel(/phone number/i).fill(phone);
      |                                            ^ Error: locator.fill: Error: strict mode violation: getByLabel(/phone number/i) resolved to 2 elements:
  219 |     const reset = await requestCode(page);
  220 |     await page.getByLabel(/^code/i).fill(reset);
  221 |     await page.getByLabel(/^new password/i).fill("second evening password");
  222 |     await page.getByLabel(/repeat the new password/i).fill("second evening password!");
  223 |     await page.getByRole("button", { name: /save the new password/i }).click();
  224 |     await expect(page.getByText("The two passwords differ")).toBeVisible();
  225 |     await page.getByLabel(/repeat the new password/i).fill("second evening password");
  226 |     await page.getByRole("button", { name: /save the new password/i }).click();
  227 |     await expect(page.getByRole("heading", { name: /password changed/i })).toBeVisible();
  228 |     await page.getByRole("link", { name: /sign in/i }).click();
  229 |     await page.waitForURL(/sign-in\?phone=/);
  230 |     await page.waitForLoadState("networkidle");
  231 |     await expect(page.getByLabel(/phone number/i)).toHaveValue(phone);
  232 |     await page.getByLabel(/^password/i).fill("second evening password");
  233 |     await page.getByRole("button", { name: /^sign in/i }).click();
  234 |     await expect(page).toHaveURL(/\/en\/app$/);
  235 | 
  236 |     // a second device signs in; this one sees it and signs it out
  237 |     const other = await browser.newContext({ userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit Version/17.0 Mobile Safari/604.1" });
  238 |     await signIn(other.request, phone, "second evening password");
  239 |     await open(page, "/en/app/account");
  240 |     const row = page.getByRole("row", { name: /Safari · iOS/ });
  241 |     await expect(row).toBeVisible();
  242 |     await row.getByRole("button", { name: /sign out/i }).click();
  243 |     await expect(page.getByText(/Safari · iOS was signed out/)).toBeVisible();
  244 |     const otherPage = await other.newPage();
  245 |     await open(otherPage, "/en/app");
  246 |     await expect(otherPage).toHaveURL(/\/en\/sign-in/);
  247 | 
  248 |     // password change: the current one must be right; afterwards the new one works
  249 |     await page.getByLabel(/current password/i).fill("wrong current password");
  250 |     await page.getByLabel(/^new password/i).fill("third evening password");
  251 |     await page.getByLabel(/repeat the new password/i).fill("third evening password");
  252 |     await page.getByRole("button", { name: /change password/i }).click();
  253 |     await expect(problem(page)).toBeVisible();
  254 |     await page.getByLabel(/current password/i).fill("second evening password");
  255 |     await page.getByRole("button", { name: /change password/i }).click();
  256 |     await expect(page.getByText(/password changed/i)).toBeVisible();
  257 | 
  258 |     // sign out: back to sign-in, the console is closed again
  259 |     await page.getByRole("banner").getByRole("button", { name: /Quản lý Ca Đêm/ }).click();
  260 |     await page.getByRole("menuitem", { name: /^sign out$/i }).click();
  261 |     await expect(page).toHaveURL(/\/en\/sign-in/);
  262 |     await open(page, "/en/app");
  263 |     await expect(page).toHaveURL(/\/en\/sign-in\?next=/);
  264 |     await other.close();
  265 |   });
  266 | 
  267 |   test("should send the visitor to sign in when the session is revoked elsewhere", async ({ page }) => {
  268 |     const staff = await newStaff("ACCOUNTANT", "Kế toán Tạm");
  269 |     await signIn(page.request, staff.phone, staff.password);
  270 |     await open(page, "/en/app/account");
  271 |     await expect(page.getByRole("row", { name: /this device/i })).toBeVisible();
  272 |     // the same account signs out every device from another browser
  273 |     const api = await apiAs(staff);
  274 |     await api.post("/auth/logout-all", undefined, { idempotent: false });
  275 |     await page.getByRole("navigation", { name: "Console" }).getByRole("link", { name: "Dashboard" }).click();
  276 |     await open(page, "/en/app/account");
  277 |     await expect(page).toHaveURL(/\/en\/sign-in/);
  278 |   });
  279 | });
  280 | 
```