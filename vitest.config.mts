import path from "node:path";
import { defineConfig } from "vitest/config";

// Unit tests need nothing else. Integration tests need TEST_DATABASE_URL pointing at a
// throwaway PostgreSQL database whose name contains "test" — it is wiped on every run.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // Next.js-only guard module; harmless to replace in tests.
      "server-only": path.resolve(__dirname, "tests/support/empty.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    globalSetup: ["tests/support/global-setup.ts"],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? "postgresql://invalid:invalid@localhost:1/none",
      SESSION_SECRET: "test-secret-test-secret-test-secret-0123456789",
      SITE_URL: "http://localhost:3000",
      SHOW_DEMO_CONTENT: "false",
    },
  },
});
