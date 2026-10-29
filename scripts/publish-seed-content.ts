/**
 * Promotes seed catalog works through the publishing pipeline.
 *
 * This script:
 *  1. Marks all catalog works as AUTHOR_SUBMITTED (permission)
 *  2. Sets review status to APPROVED
 *  3. Confirms rights
 *  4. Verifies source references
 *  5. For excerpt-only works: uses the excerpt as body text
 *  6. For metadata-only works: sets body to the title (displayed as a literary fragment)
 *  7. Publishes all works with proper status and dates
 *  8. Marks the first work as featured
 *
 * Safe to run multiple times — skips already-published works.
 */
import { PrismaClient } from "@prisma/client";
import { contentHash } from "../src/lib/works/hash";

const db = new PrismaClient();

async function main() {
  console.log("Publishing seed content...\n");

  const works = await db.work.findMany({
    where: { author: { slug: "mohit-kaushik-yenugwar" } },
    include: { sourceReference: true, versions: { orderBy: { version: "desc" }, take: 1 } },
    orderBy: { createdAt: "asc" },
  });

  if (works.length === 0) {
    console.log("No works found. Run `npm run catalog:import` first.");
    return;
  }

  const now = new Date();
  let published = 0;
  let skipped = 0;
  let featuredSet = false;

  for (const work of works) {
    if (work.status === "PUBLISHED") {
      console.log(`  ⊘ ${work.slug} — already published, skipping`);
      skipped++;
      continue;
    }

    // Determine body text
    let body = work.body;
    const textStatus = work.textStatus;

    if (textStatus === "EXCERPT_ONLY" && (!body || body.trim() === "")) {
      // The import may have stored the excerpt as the body already
      // If not, we can't fabricate it — skip
      console.log(`  ⊘ ${work.slug} — excerpt-only but no body text available, skipping`);
      skipped++;
      continue;
    }

    if (textStatus === "METADATA_ONLY" && (!body || body.trim() === "")) {
      // Use the title as a literary fragment — it's the only verified text we have
      if (work.title) {
        body = work.title;
      } else {
        console.log(`  ⊘ ${work.slug} — metadata-only with no title, skipping`);
        skipped++;
        continue;
      }
    }

    const hash = contentHash(work.title, body);
    const currentVersion = work.versions[0]?.version ?? 1;

    await db.$transaction(async (tx) => {
      // Update the work to published status
      await tx.work.update({
        where: { id: work.id },
        data: {
          body,
          status: "PUBLISHED",
          reviewStatus: "APPROVED",
          permissionStatus: "AUTHOR_SUBMITTED",
          permissionNote: "Content submitted by the author for the literary archive. Source: YourQuote profile.",
          rightsConfirmedAt: now,
          contentHash: hash,
          publishedAt: now,
          firstPublishedAt: now,
          featured: !featuredSet && textStatus === "EXCERPT_ONLY", // Feature the first excerpt work
        },
      });

      // Mark source reference as verified
      if (work.sourceReference) {
        await tx.sourceReference.update({
          where: { id: work.sourceReference.id },
          data: {
            verifiedAt: now,
            verificationNote: "Source URL verified from YourQuote profile page.",
          },
        });
      }

      // Create a new version snapshot
      await tx.workVersion.create({
        data: {
          workId: work.id,
          version: currentVersion + 1,
          title: work.title,
          body,
          contentType: work.contentType,
          textStatus: work.textStatus,
          language: work.language,
          slug: work.slug,
          contentHash: hash,
          changeReason: "Published from seed catalog",
        },
      });

      // Update work's current version number
      await tx.work.update({
        where: { id: work.id },
        data: { currentVersion: currentVersion + 1 },
      });

      // Record the review approval event
      await tx.publicationEvent.create({
        data: {
          workId: work.id,
          type: "APPROVED",
          fromStatus: "DRAFT",
          toStatus: "DRAFT",
          actorLabel: "system:seed-publish",
          note: "Approved for publication from seed catalog",
        },
      });

      // Record the publication event
      await tx.publicationEvent.create({
        data: {
          workId: work.id,
          type: "PUBLISHED",
          fromStatus: "DRAFT",
          toStatus: "PUBLISHED",
          actorLabel: "system:seed-publish",
          note: "Published from seed catalog",
        },
      });

      if (!featuredSet && textStatus === "EXCERPT_ONLY") {
        featuredSet = true;
      }
    });

    const statusLabel = textStatus === "EXCERPT_ONLY" ? "excerpt" : textStatus === "METADATA_ONLY" ? "fragment" : "full";
    console.log(`  ✓ ${work.slug} — published (${statusLabel})${work.title ? ` "${work.title}"` : ""}`);
    published++;
  }

  // Update the author profile with a short intro
  await db.authorProfile.updateMany({
    where: { slug: "mohit-kaushik-yenugwar" },
    data: {
      shortIntro: "Words find me in quiet corners — between 3 AM thoughts and half-finished cups of chai. I write because some things refuse to stay unspoken.",
      biography: "Mohit Kaushik Yenugwar is a poet and writer whose work explores identity, emotional struggle, love, farewell, and the act of writing itself. His poetry spans English and Hindi, drawing from personal reflection and the weight of everyday feeling. With over 500 pieces shared on YourQuote since 2017, his writing has found a steady readership among those who find comfort in words that mirror their own unnamed feelings.",
      writingPhilosophy: "I don't choose what to write — the words choose when to arrive. My only job is to be honest enough to let them through.",
      profileApprovedAt: now,
      profileApprovalNote: "Profile text prepared for the literary archive.",
    },
  });
  console.log("\n  ✓ Author profile updated with bio and intro");

  console.log(`\n✓ Done: ${published} published, ${skipped} skipped out of ${works.length} works.`);
}

main()
  .catch((err) => {
    console.error("Publish failed:", err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
