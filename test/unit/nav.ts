import { vi } from "vitest";

/** next/navigation spies shared by the component tests (mocked in setup.ts). */
export const nav = {
  push: vi.fn(),
  replace: vi.fn(),
  search: new URLSearchParams(),
  pathname: "/en/app",
  params: {} as Record<string, string>,
};
