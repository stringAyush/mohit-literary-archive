import { execSync } from "node:child_process";

const ADMIN = { email: "e2e-admin@example.test", password: "e2e-password-long-enough" };

/** Prepares the test database: migrations, empty tables, seed, and an administrator. */
export default function globalSetup() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error("Set TEST_DATABASE_URL to run end-to-end tests.");
  if (!/test/i.test(new URL(url).pathname)) throw new Error('The test database name must contain "test".');

  const env = { ...process.env, DATABASE_URL: url, PRISMA_HIDE_UPDATE_MESSAGE: "1" };
  execSync("npx prisma migrate deploy", { stdio: "inherit", env });
  execSync("npx tsx tests/support/clean-database.ts", { stdio: "inherit", env });
  execSync("npx prisma db seed", { stdio: "inherit", env });
  execSync("npx tsx scripts/create-admin.ts", {
    stdio: "inherit",
    env: { ...env, ADMIN_EMAIL: ADMIN.email, ADMIN_NAME: "E2E Admin", ADMIN_PASSWORD: ADMIN.password },
  });
}
