import { execSync } from "node:child_process";

/**
 * Applies all migrations to the test database before integration tests run.
 * It never drops anything; each test file empties the tables it uses (see support/db.ts).
 */
export default function setup() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    console.warn("\n  TEST_DATABASE_URL is not set — integration tests will be skipped.\n");
    return;
  }
  const dbName = new URL(url).pathname.slice(1);
  if (!/test/i.test(dbName)) {
    throw new Error(`Refusing to use "${dbName}" for tests: the test database name must contain "test".`);
  }
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url, PRISMA_HIDE_UPDATE_MESSAGE: "1" },
  });
}
