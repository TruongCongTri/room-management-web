import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * Unit tests (test/unit): pure logic of the BFF, the API layer and the console, plus components rendered in
 * jsdom. End-to-end tests against the real API live in e2e/ (Playwright).
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
      // server modules import "server-only", which refuses to load outside a React Server Component bundle
      "server-only": fileURLToPath(new URL("./test/stubs/server-only.ts", import.meta.url)),
    },
  },
  test: {
    include: ["test/unit/**/*.test.{ts,tsx}"],
    environment: "node",
    setupFiles: ["test/unit/setup.ts"],
    restoreMocks: true,
  },
});
