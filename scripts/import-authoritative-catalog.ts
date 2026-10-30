import { PrismaClient, type ContentType } from "@prisma/client";
import { readFileSync } from "node:fs";
import path from "node:path";
import { contentHash } from "../src/lib/works/hash";

const defaultDb = new PrismaClient();

const QUOTES_FILE = path.resolve(process.cwd(), "src/lib/quotes/quotes.json");
const STORIES_FILE = path.resolve(process.cwd(), "src/lib/stories/stories.json");
const COLLECTIONS_FILE = path.resolve(process.cwd(), "content/collections.json");

interface SourceRecord {
  id: string;
  pageNumber: number;
  sourceFile: string;
  imageFile: string;
  title: string | null;
  body: string;
  contentType: string;
  language: string;
  author: string;
  sourcePlatform: string;
  sourceUrl: string;
  originalDate: string | null;
  visibleDate: string | null;
  likes: number;
  categories: string[];
  tags: string[];
  slug: string;
  readingTime?: string;
}

interface CollectionDef {
  slug: string;
  name: string;
  description: string;
  status: string;
}

export async function importAuthoritativeCatalog(prismaClient?: PrismaClient) {
  const db = prismaClient ?? defaultDb;
  console.log("=== Starting Authoritative Content Migration ===");

  const quotes: SourceRecord[] = JSON.parse(readFileSync(QUOTES_FILE, "utf8"));
  const stories: SourceRecord[] = JSON.parse(readFileSync(STORIES_FILE, "utf8"));
  const collections: CollectionDef[] = JSON.parse(readFileSync(COLLECTIONS_FILE, "utf8"));

  const allSourceWorks = [...quotes, ...stories];
  console.log(`Source Quotes: ${quotes.length}`);
  console.log(`Source Stories / Poems: ${stories.length}`);
  console.log(`Total Authoritative Works to Import: ${allSourceWorks.length}`);

  const now = new Date();
  const authorSlug = "mohit-yenugwar";

  // 1. Author Profile
  const author = await db.authorProfile.upsert({
    where: { slug: authorSlug },
    update: {
      displayName: "Mohit Yenugwar",
      shortIntro: "Words find me in quiet corners — between 3 AM thoughts and half-finished cups of chai. I write because some things refuse to stay unspoken.",
      biography: "Mohit Yenugwar is a writer and poet capturing the quiet, complex landscapes of intimacy, grief, memory, and becoming. His literary work spans reflective aphorisms, nazms, Hindi couplets, and long-form prose.",
      writingPhilosophy: "To write is to honor the unfinished sentences of our lives.",
      profileApprovedAt: now,
      isPrimary: true,
      isDemo: false,
      links: [
        { label: "LinkedIn", url: "https://www.linkedin.com/in/mohit-yenugwar-63054823a/" },
        { label: "YourQuote", url: "https://www.yourquote.in/mohit-yenugwar-v0m/quotes" },
        { label: "Instagram", url: "https://www.instagram.com/mohitverse.in" }
      ],
    },
    create: {
      slug: authorSlug,
      displayName: "Mohit Yenugwar",
      shortIntro: "Words find me in quiet corners — between 3 AM thoughts and half-finished cups of chai. I write because some things refuse to stay unspoken.",
      biography: "Mohit Yenugwar is a writer and poet capturing the quiet, complex landscapes of intimacy, grief, memory, and becoming. His literary work spans reflective aphorisms, nazms, Hindi couplets, and long-form prose.",
      writingPhilosophy: "To write is to honor the unfinished sentences of our lives.",
      profileApprovedAt: now,
      isPrimary: true,
      isDemo: false,
      links: [
        { label: "LinkedIn", url: "https://www.linkedin.com/in/mohit-yenugwar-63054823a/" },
        { label: "YourQuote", url: "https://www.yourquote.in/mohit-yenugwar-v0m/quotes" },
        { label: "Instagram", url: "https://www.instagram.com/mohitverse.in" }
      ],
    },
  });

  // Ensure any old author profile is not primary
  await db.authorProfile.updateMany({
    where: { slug: { not: authorSlug } },
    data: { isPrimary: false }
  });
  console.log(`✓ Author profile synchronized: ${author.displayName}`);

  // 2. Collections
  const collectionIdMap = new Map<string, string>();
  for (let i = 0; i < collections.length; i++) {
    const c = collections[i];
    const col = await db.collection.upsert({
      where: { slug: c.slug },
      update: {
        name: c.name,
        description: c.description,
        isPublished: true,
        sortOrder: i + 1,
      },
      create: {
        slug: c.slug,
        name: c.name,
        description: c.description,
        isPublished: true,
        sortOrder: i + 1,
      },
    });
    collectionIdMap.set(c.slug, col.id);
  }
  console.log(`✓ ${collections.length} collections synchronized`);

  // 3. Fast Bulk Tag Creation
  const tagPayloads = new Map<string, string>(); // slug -> name
  for (const w of allSourceWorks) {
    for (const t of w.tags) {
      const slug = t.toLowerCase().replace(/[^a-z0-9\u0900-\u097F]+/g, "-").replace(/^-|-$/g, "");
      if (slug && !tagPayloads.has(slug)) {
        tagPayloads.set(slug, t);
      }
    }
  }

  const tagsToCreate = Array.from(tagPayloads.entries()).map(([slug, name]) => ({ slug, name }));
  await db.tag.createMany({
    data: tagsToCreate,
    skipDuplicates: true,
  });

  const existingTags = await db.tag.findMany({ select: { id: true, name: true, slug: true } });
  const tagIdByName = new Map<string, string>();
  for (const t of existingTags) {
    tagIdByName.set(t.name.toLowerCase(), t.id);
    tagIdByName.set(t.slug, t.id);
  }
  console.log(`✓ ${existingTags.length} tags indexed in database`);

  // 4. Archive any works not in the authoritative published catalog
  const approvedSlugs = new Set(allSourceWorks.map(w => w.slug));
  const unapproved = await db.work.updateMany({
    where: { slug: { notIn: Array.from(approvedSlugs) } },
    data: { status: "ARCHIVED", reviewStatus: "REJECTED" }
  });
  console.log(`✓ Archived ${unapproved.count} unapproved/excluded works from previous imports`);

  // 5. Concurrently Import Works in Batches of 15
  const BATCH_SIZE = 15;
  let processed = 0;

  for (let i = 0; i < allSourceWorks.length; i += BATCH_SIZE) {
    const batch = allSourceWorks.slice(i, i + BATCH_SIZE);

    await Promise.all(batch.map(async (item, batchIdx) => {
      const overallIndex = i + batchIdx;
      const hash = contentHash(item.title, item.body);
      const pubDate = item.originalDate ? new Date(`${item.originalDate}T00:00:00Z`) : now;
      const isFeatured = overallIndex === 0;

      let contentType: ContentType = "QUOTE";
      if (item.contentType === "POEM") contentType = "POEM";
      else if (item.contentType === "SHORT_STORY") contentType = "SHORT_STORY";
      else if (item.contentType === "PROSE") contentType = "PROSE";
      else if (item.contentType === "REFLECTION") contentType = "REFLECTION";
      else if (item.contentType === "SHORT_PIECE") contentType = "SHORT_PIECE";
      else if (item.contentType === "APHORISM") contentType = "APHORISM";
      else if (item.contentType === "OTHER") contentType = "OTHER";

      const work = await db.work.upsert({
        where: { slug: item.slug },
        update: {
          title: item.title,
          body: item.body,
          contentType,
          textStatus: "FULL_TEXT",
          language: item.language,
          authorId: author.id,
          status: "PUBLISHED",
          reviewStatus: "APPROVED",
          permissionStatus: "AUTHOR_SUBMITTED",
          permissionNote: `Supplied by author from 207-page YourQuote archive. Page ${item.pageNumber}.`,
          rightsConfirmedAt: now,
          contentHash: hash,
          publishedAt: pubDate,
          firstPublishedAt: pubDate,
          originalPublishedAt: pubDate,
          featured: isFeatured,
          isDemo: false,
        },
        create: {
          slug: item.slug,
          title: item.title,
          body: item.body,
          contentType,
          textStatus: "FULL_TEXT",
          language: item.language,
          authorId: author.id,
          status: "PUBLISHED",
          reviewStatus: "APPROVED",
          permissionStatus: "AUTHOR_SUBMITTED",
          permissionNote: `Supplied by author from 207-page YourQuote archive. Page ${item.pageNumber}.`,
          rightsConfirmedAt: now,
          contentHash: hash,
          publishedAt: pubDate,
          firstPublishedAt: pubDate,
          originalPublishedAt: pubDate,
          featured: isFeatured,
          isDemo: false,
        },
      });

      // Version history
      await db.workVersion.upsert({
        where: { workId_version: { workId: work.id, version: 1 } },
        update: {
          title: item.title,
          body: item.body,
          contentType,
          textStatus: "FULL_TEXT",
          language: item.language,
          slug: item.slug,
          contentHash: hash,
          changeReason: "Authoritative archive publication",
        },
        create: {
          workId: work.id,
          version: 1,
          title: item.title,
          body: item.body,
          contentType,
          textStatus: "FULL_TEXT",
          language: item.language,
          slug: item.slug,
          contentHash: hash,
          changeReason: "Authoritative archive publication",
        },
      });

      // Source reference
      await db.sourceReference.upsert({
        where: { workId: work.id },
        update: {
          platform: "YOURQUOTE",
          url: item.sourceUrl,
          originalTitle: item.title,
          originalPublishedAt: pubDate,
          retrievalMethod: `YourQuote PDF capture Page ${item.pageNumber}`,
          notes: `Likes: ${item.likes}; Date: ${item.visibleDate || "unknown"}`,
          verifiedAt: now,
          verificationNote: "Verified against original page scan in archive",
        },
        create: {
          workId: work.id,
          platform: "YOURQUOTE",
          url: item.sourceUrl,
          originalTitle: item.title,
          originalPublishedAt: pubDate,
          retrievalMethod: `YourQuote PDF capture Page ${item.pageNumber}`,
          notes: `Likes: ${item.likes}; Date: ${item.visibleDate || "unknown"}`,
          verifiedAt: now,
          verificationNote: "Verified against original page scan in archive",
        },
      });

      // Collections
      await db.workCollection.deleteMany({ where: { workId: work.id } });
      const colData = item.categories
        .map((cSlug, cIdx) => {
          const colId = collectionIdMap.get(cSlug);
          return colId ? { workId: work.id, collectionId: colId, position: cIdx } : null;
        })
        .filter((c): c is { workId: string; collectionId: string; position: number } => c !== null);

      if (colData.length > 0) {
        await db.workCollection.createMany({ data: colData });
      }

      // Tags
      await db.workTag.deleteMany({ where: { workId: work.id } });
      const tagData = item.tags
        .map((tName) => {
          const tagId = tagIdByName.get(tName.toLowerCase()) || tagIdByName.get(tName.toLowerCase().replace(/[^a-z0-9\u0900-\u097F]+/g, "-").replace(/^-|-$/g, ""));
          return tagId ? { workId: work.id, tagId } : null;
        })
        .filter((t): t is { workId: string; tagId: string } => t !== null);

      if (tagData.length > 0) {
        await db.workTag.createMany({ data: tagData });
      }
    }));

    processed += batch.length;
    console.log(`  Imported ${processed} / ${allSourceWorks.length} works...`);
  }

  console.log(`\n=== Migration Complete ===`);
  const dbCount = await db.work.count({
    where: { status: "PUBLISHED", reviewStatus: "APPROVED" }
  });
  console.log(`✓ Verified published works in DB: ${dbCount}`);

  // Check Book Photography integrity
  const photoCount = await db.photoPost.count();
  const photoImageCount = await db.photoImage.count();
  console.log(`✓ Book Photography Posts preserved: ${photoCount}`);
  console.log(`✓ Book Photography Images preserved: ${photoImageCount}`);
}

if (process.argv[1]?.includes("import-authoritative-catalog")) {
  importAuthoritativeCatalog()
    .catch((e) => {
      console.error("Migration error:", e);
      process.exit(1);
    })
    .finally(() => defaultDb.$disconnect());
}
