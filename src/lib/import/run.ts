import { db } from "@/lib/db";
import { contentHash } from "@/lib/works/hash";
import { createWork, type Actor } from "@/lib/works/service";
import { slugify } from "@/lib/works/slug";
import type { ImportRow } from "./schema";

export type ImportOutcome = {
  created: { index: number; id: string; slug: string }[];
  skipped: { index: number; reason: string }[];
};

/**
 * Creates one draft work per row. Imported works always start in review — never
 * published — and carry their source reference so they can be verified.
 */
export async function importRows(rows: { index: number; row: ImportRow }[], actor: Actor): Promise<ImportOutcome> {
  const outcome: ImportOutcome = { created: [], skipped: [] };
  const collections = await db.collection.findMany({ select: { id: true, slug: true } });

  for (const { index, row } of rows) {
    if (row.sourceUrl) {
      const existing = await db.sourceReference.findFirst({ where: { url: row.sourceUrl }, select: { id: true } });
      if (existing) {
        outcome.skipped.push({ index, reason: "A work with this source URL already exists" });
        continue;
      }
    }
    if (row.text.trim()) {
      const duplicate = await db.work.findFirst({
        where: { contentHash: contentHash(row.title ?? null, row.text) },
        select: { id: true },
      });
      if (duplicate) {
        outcome.skipped.push({ index, reason: "The same text already exists in the archive" });
        continue;
      }
    }

    const unknownCollections = row.collections.filter((slug) => !collections.some((c) => c.slug === slug));
    if (unknownCollections.length) {
      outcome.skipped.push({ index, reason: `Unknown collection(s): ${unknownCollections.join(", ")}` });
      continue;
    }

    const tagIds: string[] = [];
    for (const name of row.themes) {
      const slug = slugify(name);
      if (!slug) continue;
      const tag = await db.tag.upsert({ where: { slug }, update: {}, create: { slug, name } });
      tagIds.push(tag.id);
    }

    const work = await createWork(
      {
        title: row.title ?? null,
        slug: null,
        body: row.text,
        contentType: row.contentType,
        language: row.language,
        featured: false,
        composedOn: row.composedOn ? new Date(`${row.composedOn}T00:00:00.000Z`) : null,
        originalPublishedAt: row.originalPublishedAt ? new Date(`${row.originalPublishedAt}T00:00:00.000Z`) : null,
        collectionIds: collections.filter((c) => row.collections.includes(c.slug)).map((c) => c.id),
        tagIds,
        source: {
          platform: row.sourcePlatform,
          url: row.sourceUrl ?? null,
          originalTitle: row.title ?? null,
          originalPublishedAt: row.originalPublishedAt ? new Date(`${row.originalPublishedAt}T00:00:00.000Z`) : null,
          retrievalMethod: "Import file",
          notes: row.notes ?? null,
        },
        changeReason: null,
      },
      actor,
      {
        imported: true,
        reviewStatus: row.reviewStatus,
        permissionStatus: row.permissionStatus,
        permissionNote: row.permissionNote ?? null,
        importNote: `Imported from file (row ${index})`,
      },
    );
    outcome.created.push({ index, id: work.id, slug: work.slug });
  }

  return outcome;
}
