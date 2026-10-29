import { defineConfig, devices } from "@playwright/test";

// End-to-end test of the publishing path against a production build.
//   1. Set TEST_DATABASE_URL to a throwaway database whose name contains "test".
//   2. npm run build
//   3. npm run test:e2e
const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  globalSetup: "./tests/e2e/global-setup.ts",
  use: { baseURL, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? "",
      SITE_URL: baseURL,
      SESSION_SECRET: "e2e-session-secret-e2e-session-secret-0123",
      CRON_SECRET: "e2e-cron-secret-32-characters-long",
      SHOW_DEMO_CONTENT: "false",
    },
  },
});
