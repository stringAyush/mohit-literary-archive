import { readFile } from "node:fs/promises";
import { PrismaClient, type ContentType, type PermissionStatus, type ReviewStatus, type SourcePlatform, type TextStatus } from "@prisma/client";
import { contentHash } from "../src/lib/works/hash";

export type CatalogWork = {
  id: string;
  slug: string;
  title: string | null;
  content_type: string;
  language: string;
  author: string;
  source_author_display?: string;
  source_platform: string;
  source_url: string | null;
  original_publication_date: string | null;
  source_metadata_status?: string;
  text_status: string;
  excerpt: string | null;
  full_text: string | null;
  categories: string[];
  tags: string[];
  rights_status: string;
  verification_status: string;
  publication_status: string;
  notes?: string;
};

export type CatalogCollection = {
  slug: string;
  name: string;
  description?: string;
  status?: string;
};

export type AuthorProfileData = {
  author: string;
  author_display_name_on_primary_source?: string;
  primary_source: string;
  additional_sources?: { label: string; url: string; status?: string }[];
  profile_snapshot?: {
    displayed_quote_count?: number;
    count_note?: string;
    displayed_followers?: number;
    displayed_following?: number;
    joined_date?: string;
  };
};

const CONTENT_TYPE_MAP: Record<string, ContentType> = {
  quote: "QUOTE",
  poem: "POEM",
  aphorism: "APHORISM",
  reflection: "REFLECTION",
  short_piece: "SHORT_PIECE",
  unknown: "SHORT_PIECE",
};

const PLATFORM_MAP: Record<string, SourcePlatform> = {
  yourquote: "YOURQUOTE",
  linkedin: "LINKEDIN",
  instagram: "INSTAGRAM",
  personal_submission: "PERSONAL_SUBMISSION",
  print: "PRINT",
  other: "OTHER",
};

export function mapTextStatus(status: string, hasFullText: boolean, hasExcerpt: boolean): TextStatus {
  if (status === "excerpt_only") return "EXCERPT_ONLY";
  if (status === "metadata_only") return "METADATA_ONLY";
  if (status === "full_text") return "FULL_TEXT";
  if (hasFullText) return "FULL_TEXT";
  if (hasExcerpt) return "EXCERPT_ONLY";
  return "METADATA_ONLY";
}

export function mapPermissionStatus(rightsStatus: string): PermissionStatus {
  switch (rightsStatus) {
    case "permission_granted":
    case "authorized":
      return "GRANTED";
    case "author_submitted":
      return "AUTHOR_SUBMITTED";
    case "permission_denied":
      return "DENIED";
    case "permission_pending":
      return "REQUESTED";
    default:
      return "UNKNOWN";
  }
}

export function mapReviewStatus(pubStatus: string): ReviewStatus {
  switch (pubStatus) {
    case "published":
      return "APPROVED";
    case "discovered":
      return "DISCOVERED";
    case "rejected":
      return "REJECTED";
    default:
      return "NEEDS_VERIFICATION";
  }
}

export async function importCatalog(options?: { db?: PrismaClient; log?: boolean }) {
  const db = options?.db ?? new PrismaClient();
  const shouldLog = options?.log ?? true;
  const root = new URL("../content/", import.meta.url);

  const works = JSON.parse(await readFile(new URL("works.json", root), "utf8")) as CatalogWork[];
  const collections = JSON.parse(await readFile(new URL("collections.json", root), "utf8")) as CatalogCollection[];
  const profile = JSON.parse(await readFile(new URL("author-profile.json", root), "utf8")) as AuthorProfileData;

  // 1. Validation
  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();
  const collectionSlugs = new Set(collections.map((c) => c.slug));

  for (let i = 0; i < works.length; i++) {
    const w = works[i];
    if (!w.id || !w.slug) throw new Error(`Work at index ${i} missing id or slug`);
    if (seenIds.has(w.id)) throw new Error(`Duplicate id in catalog: ${w.id}`);
    if (seenSlugs.has(w.slug)) throw new Error(`Duplicate slug in catalog: ${w.slug}`);
    seenIds.add(w.id);
    seenSlugs.add(w.slug);

    if (w.source_url && !/^https?:\/\//.test(w.source_url)) {
      throw new Error(`Invalid source_url in work ${w.id}: ${w.source_url}`);
    }
    if (!Array.isArray(w.categories) || !Array.isArray(w.tags)) {
      throw new Error(`Categories and tags must be arrays in work ${w.id}`);
    }
    for (const cat of w.categories) {
      if (!collectionSlugs.has(cat)) {
        throw new Error(`Unknown collection "${cat}" referenced by work ${w.id}`);
      }
    }
  }

  const authorSlug = "mohit-kaushik-yenugwar";
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  try {
    await db.$transaction(
      async (tx) => {
        // 2. Author Profile
        const links = [
          { label: "YourQuote", url: profile.primary_source },
          ...(profile.additional_sources ?? []).map((s) => ({ label: s.label, url: s.url })),
        ];

        const author = await tx.authorProfile.upsert({
          where: { slug: authorSlug },
          update: {
            displayName: profile.author,
            isPrimary: true,
            isDemo: false,
            links,
          },
          create: {
            slug: authorSlug,
            displayName: profile.author,
            isPrimary: true,
            isDemo: false,
            links,
          },
        });

        // 3. Collections
        const collectionMap = new Map<string, string>();
        for (let i = 0; i < collections.length; i++) {
          const c = collections[i];
          const row = await tx.collection.upsert({
            where: { slug: c.slug },
            update: {
              name: c.name,
              description: c.description ?? null,
              isPublished: true,
              sortOrder: i + 1,
            },
            create: {
              slug: c.slug,
              name: c.name,
              description: c.description ?? null,
              isPublished: true,
              sortOrder: i + 1,
            },
          });
          collectionMap.set(c.slug, row.id);
        }

        // 4. Works
        for (const record of works) {
          const textStatus = mapTextStatus(record.text_status, Boolean(record.full_text), Boolean(record.excerpt));
          const body = record.full_text ?? record.excerpt ?? "";
          const contentType = CONTENT_TYPE_MAP[record.content_type.toLowerCase()] ?? "SHORT_PIECE";
          const platform = PLATFORM_MAP[record.source_platform.toLowerCase()] ?? "OTHER";
          const permissionStatus = mapPermissionStatus(record.rights_status);
          const reviewStatus = mapReviewStatus(record.publication_status);
          const hash = contentHash(record.title, body);
          const originalPublishedAt = record.original_publication_date
            ? new Date(`${record.original_publication_date}T00:00:00Z`)
            : null;

          const permissionNote = `Catalog record ${record.id} · Rights: ${record.rights_status} · Verification: ${record.verification_status} · Text: ${record.text_status}.`;
          const reviewNote = record.notes ?? null;

          const existing = await tx.work.findUnique({
            where: { slug: record.slug },
            include: { sourceReference: true, versions: { orderBy: { version: "desc" }, take: 1 } },
          });

          if (existing) {
            // Do not degrade an already approved/published work with draft catalog data
            if (existing.status === "PUBLISHED" || existing.reviewStatus === "APPROVED") {
              skipped++;
              continue;
            }

            // Update draft record safely
            await tx.work.update({
              where: { id: existing.id },
              data: {
                title: record.title,
                body,
                contentType,
                textStatus,
                language: record.language,
                originalPublishedAt,
                permissionStatus,
                reviewStatus,
                permissionNote,
                reviewNote,
                contentHash: hash,
                sourceReference: {
                  upsert: {
                    create: {
                      platform,
                      url: record.source_url,
                      originalTitle: record.title,
                      originalPublishedAt,
                      retrievalMethod: "Supplied partial research catalog",
                      notes: `${record.text_status}; ${record.verification_status}`,
                    },
                    update: {
                      platform,
                      url: record.source_url,
                      originalTitle: record.title,
                      originalPublishedAt,
                      notes: `${record.text_status}; ${record.verification_status}`,
                    },
                  },
                },
              },
            });

            // Update collection associations
            await tx.workCollection.deleteMany({ where: { workId: existing.id } });
            await tx.workCollection.createMany({
              data: record.categories.map((slug, idx) => ({
                workId: existing.id,
                collectionId: collectionMap.get(slug)!,
                position: idx,
              })),
            });

            // Update tag associations
            await tx.workTag.deleteMany({ where: { workId: existing.id } });
            for (const name of record.tags) {
              const tagSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
              const tag = await tx.tag.upsert({
                where: { slug: tagSlug },
                update: {},
                create: { name, slug: tagSlug },
              });
              await tx.workTag.create({
                data: { workId: existing.id, tagId: tag.id },
              });
            }

            updated++;
          } else {
            // Create new record
            await tx.work.create({
              data: {
                slug: record.slug,
                title: record.title,
                body,
                contentType,
                textStatus,
                language: record.language,
                authorId: author.id,
                status: "DRAFT",
                reviewStatus,
                permissionStatus,
                permissionNote,
                reviewNote,
                importedAt: new Date(),
                originalPublishedAt,
                contentHash: hash,
                sourceReference: {
                  create: {
                    platform,
                    url: record.source_url,
                    originalTitle: record.title,
                    originalPublishedAt,
                    retrievalMethod: "Supplied partial research catalog",
                    notes: `${record.text_status}; ${record.verification_status}`,
                  },
                },
                collections: {
                  create: record.categories.map((slug, idx) => ({
                    collectionId: collectionMap.get(slug)!,
                    position: idx,
                  })),
                },
                tags: {
                  create: record.tags.map((name) => {
                    const tagSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                    return {
                      tag: {
                        connectOrCreate: {
                          where: { slug: tagSlug },
                          create: { name, slug: tagSlug },
                        },
                      },
                    };
                  }),
                },
                versions: {
                  create: {
                    version: 1,
                    title: record.title,
                    body,
                    contentType,
                    textStatus,
                    language: record.language,
                    slug: record.slug,
                    contentHash: hash,
                    changeReason: "Initial catalog import",
                  },
                },
                events: {
                  create: {
                    type: "IMPORTED",
                    toStatus: "DRAFT",
                    actorLabel: "system:catalog-import",
                    note: `Imported source catalog record ${record.id}`,
                  },
                },
              },
            });
            inserted++;
          }
        }
      },
      { timeout: 120000 },
    );

    const summary = {
      candidates: works.length,
      inserted,
      updated,
      skipped,
      collections: collections.length,
      published: 0,
      fullTextWorks: works.filter((w) => w.full_text).length,
      excerptOnlyWorks: works.filter((w) => w.excerpt && !w.full_text).length,
      metadataOnlyWorks: works.filter((w) => !w.full_text && !w.excerpt).length,
    };

    if (shouldLog) {
      console.log("✓ Catalog import finished:");
      console.log(JSON.stringify(summary, null, 2));
    }
    return summary;
  } finally {
    if (!options?.db) {
      await db.$disconnect();
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  importCatalog().catch((err) => {
    console.error("Import failed:", err);
    process.exitCode = 1;
  });
}
