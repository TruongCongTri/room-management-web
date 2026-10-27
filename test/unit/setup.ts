import { cleanup } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { afterEach, vi } from "vitest";

// the App Router isn't mounted in unit tests: navigation hooks and <Link> are replaced by spies / plain anchors
vi.mock("next/navigation", async () => {
  const { nav } = await import("./nav");
  return {
    useRouter: () => ({ push: nav.push, replace: nav.replace, back: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
    useSearchParams: () => nav.search,
    usePathname: () => nav.pathname,
    useParams: () => nav.params,
  };
});
vi.mock("next/link", () => ({
  default: ({ href, children, prefetch: _p, ...rest }: { href: string; children: ReactNode; prefetch?: unknown }) => createElement("a", { href, ...rest }, children),
}));

// jsdom has no canvas: the pixel-fill hover effect simply doesn't draw
if (typeof HTMLCanvasElement !== "undefined") HTMLCanvasElement.prototype.getContext = (() => null) as never;
if (typeof window !== "undefined" && !window.matchMedia) window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as never;
if (typeof window !== "undefined" && !("ResizeObserver" in window)) (window as never as { ResizeObserver: unknown }).ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };

// unmount components rendered by a test (jsdom tests opt in with `// @vitest-environment jsdom`)
afterEach(() => {
  if (typeof document !== "undefined") cleanup();
});
