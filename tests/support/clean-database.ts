// Empties every table in the TEST database (used by the end-to-end setup).
import { resetDatabase } from "./db";
import { db } from "../../src/lib/db";

const url = process.env.DATABASE_URL ?? "";
if (!/test/i.test(new URL(url).pathname)) {
  throw new Error('Refusing to empty a database whose name does not contain "test".');
}
resetDatabase()
  .then(() => console.log("✓ Test database emptied"))
  .finally(() => db.$disconnect());
