import type { NextConfig } from "next";
import { locales } from "./i18n/config";

const nextConfig: NextConfig = {
  // a second dev / e2e server can build next to `next dev` without sharing its cache (NEXT_DIST_DIR=.next-e2e)
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  experimental: {
    agentFeedback: true,
    // 404 for URLs outside /vi and /en (app/global-not-found.tsx): the root layout sits under [locale]
    globalNotFound: true,
  },
  cacheComponents: true,
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      // checked only after every page and dynamic route: an unknown /vi/... or /en/... path shows
      // that locale's 404 page (app/[locale]/page-not-found) and keeps its URL
      fallback: [{ source: `/:locale(${locales.join("|")})/:path*`, destination: "/:locale/page-not-found" }],
    };
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
