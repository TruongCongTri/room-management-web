// @vitest-environment jsdom
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SignIn from "@/components/console/auth/SignIn";
import { jsonResponse, nav, renderConsole } from "../render";

vi.mock("@/components/home/Building", () => ({ default: () => null }));

const fill = (label: RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const submit = () => fireEvent.click(screen.getByRole("button", { name: /^sign in/i }));

beforeEach(() => {
  nav.replace.mockReset();
  nav.search = new URLSearchParams();
});
afterEach(() => vi.unstubAllGlobals());

describe("SignIn", () => {
  it("should check the fields in the browser before calling the API", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    renderConsole(<SignIn />);
    submit();
    expect(await screen.findAllByText("Required")).toHaveLength(2);
    fill(/phone number/i, "12345");
    expect(screen.getByText("Not a Vietnamese mobile number")).toBeTruthy();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("should sign in and continue to the page that asked for it", async () => {
    nav.search = new URLSearchParams("next=/en/app/contracts?status=ACTIVE");
    const fetch = vi.fn(async () => jsonResponse(200, { data: { user: { id: "u" }, sessionId: "s" }, meta: {} }));
    vi.stubGlobal("fetch", fetch);
    renderConsole(<SignIn />);
    fill(/phone number/i, "0901 000 002");
    fill(/^password/i, "RentalDev@2026");
    submit();
    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith("/en/app/contracts?status=ACTIVE"));
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit & { headers: Headers }];
    expect(url).toBe("/api/auth/login");
    expect(JSON.parse(init.body as string)).toEqual({ phone: "0901000002", password: "RentalDev@2026" });
  });

  it("should ask finance roles for the code, then sign in with it", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(202, { data: { mfaRequired: true, challengeId: "c-1", otpSentTo: "090****003", expiresInSeconds: 300 }, meta: {} }))
      .mockResolvedValueOnce(jsonResponse(400, { error: { code: "AUTH_OTP_INVALID", message: "Wrong code", details: [{ attemptsRemaining: 4 }] }, meta: {} }))
      .mockResolvedValueOnce(jsonResponse(200, { data: { user: { id: "u" } }, meta: {} }));
    vi.stubGlobal("fetch", fetch);
    renderConsole(<SignIn />);
    fill(/phone number/i, "0901000003");
    fill(/^password/i, "RentalDev@2026");
    submit();
    expect(await screen.findByText(/sent a 6-digit code to 090\*\*\*\*003/i)).toBeTruthy();

    fill(/^code/i, "111111");
    fireEvent.click(screen.getByRole("button", { name: /confirm/i }));
    expect(await screen.findByText("Wrong code")).toBeTruthy();
    expect(screen.getByText("4 attempts left")).toBeTruthy();

    fill(/^code/i, "123456");
    fireEvent.click(screen.getByRole("button", { name: /confirm/i }));
    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith("/en/app"));
    expect(JSON.parse((fetch.mock.calls[2] as unknown as [string, RequestInit])[1].body as string)).toEqual({ challengeId: "c-1", code: "123456" });
  });

  it("should show a locked account with its countdown", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(423, { error: { code: "AUTH_ACCOUNT_LOCKED", message: "Account locked" }, meta: { traceId: "tr-9" } }, { "retry-after": "900" })));
    renderConsole(<SignIn />);
    fill(/phone number/i, "0901000002");
    fill(/^password/i, "wrong-password");
    submit();
    expect(await screen.findByText("Account locked")).toBeTruthy();
    expect(screen.getByText(/try again in (900|899) s/i)).toBeTruthy();
    expect(screen.getByText(/AUTH_ACCOUNT_LOCKED · trace tr-9/)).toBeTruthy();
  });
});
