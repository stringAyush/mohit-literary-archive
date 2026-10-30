/**
 * Seeds the database using the real catalog files under content/:
 *  - content/author-profile.json
 *  - content/collections.json
 *  - content/works.json
 *
 * Idempotent, safe to run repeatedly, and never seeds fabricated demo quotations.
 */
import { PrismaClient } from "@prisma/client";
import { importAuthoritativeCatalog } from "../scripts/import-authoritative-catalog";

const db = new PrismaClient();

async function main() {
  console.log("Seeding database with Mohit Yenugwar's authoritative catalog...");
  await importAuthoritativeCatalog(db);
  console.log("✓ Authoritative seed complete.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
