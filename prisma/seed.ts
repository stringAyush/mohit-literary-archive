/**
 * Seeds the database using the real catalog files under content/:
 *  - content/author-profile.json
 *  - content/collections.json
 *  - content/works.json
 *
 * Idempotent, safe to run repeatedly, and never seeds fabricated demo quotations.
 */
import { PrismaClient } from "@prisma/client";
import { importCatalog } from "../scripts/import-catalog";

const db = new PrismaClient();

async function main() {
  console.log("Seeding database with Mohit Kaushik Yenugwar's research catalog...");
  const summary = await importCatalog({ db, log: true });
  console.log(`✓ Seed complete: ${summary.candidates} candidate works processed.`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
