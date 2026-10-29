import { PrismaClient } from "@prisma/client";

/**
 * Safely removes only demonstration and obsolete pre-seed records:
 * - Works marked isDemo = true
 * - Collections ending in -demo
 * - Obsolete pre-seed empty rows (slug: yourquote-cw1dv7, yourquote-cw2sxy)
 * - Scratch row (slug: lol)
 * - Demo author profile (slug: sample-writer-demo)
 *
 * Never deletes legitimate user or real catalog records.
 */
async function main() {
  const db = new PrismaClient();
  try {
    await db.$transaction(async (tx) => {
      // 1. Delete scratch / obsolete pre-seed works
      const obsoleteSlugs = ["lol", "yourquote-cw1dv7", "yourquote-cw2sxy"];
      const deletedObsolete = await tx.work.deleteMany({
        where: { slug: { in: obsoleteSlugs } },
      });
      console.log(`Deleted ${deletedObsolete.count} obsolete pre-seed / scratch works.`);

      // 2. Delete demo works
      const deletedDemoWorks = await tx.work.deleteMany({
        where: { isDemo: true },
      });
      console.log(`Deleted ${deletedDemoWorks.count} demo works.`);

      // 3. Delete demo author
      const deletedDemoAuthors = await tx.authorProfile.deleteMany({
        where: { slug: "sample-writer-demo", isDemo: true },
      });
      console.log(`Deleted ${deletedDemoAuthors.count} demo author profiles.`);

      // 4. Delete demo collections
      const deletedDemoCollections = await tx.collection.deleteMany({
        where: { slug: { endsWith: "-demo" } },
      });
      console.log(`Deleted ${deletedDemoCollections.count} demo collections.`);
    });
    console.log("✓ Targeted demo cleanup completed safely.");
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error("Cleanup error:", err);
  process.exitCode = 1;
});
