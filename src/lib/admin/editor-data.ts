import { db } from "@/lib/db";
import { toDateInputValue } from "@/lib/format";
import type { EditorWork } from "@/components/admin/WorkEditor";

export async function getEditorOptions() {
  const [collections, tags] = await Promise.all([
    db.collection.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
    db.tag.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return { collections, tags };
}

export async function getWorkForEditor(id: string) {
  return db.work.findUnique({
    where: { id },
    include: {
      sourceReference: { include: { verifiedBy: { select: { name: true } } } },
      collections: { select: { collectionId: true } },
      tags: { select: { tagId: true } },
      author: { select: { displayName: true, isDemo: true } },
      rightsConfirmedBy: { select: { name: true } },
      createdBy: { select: { name: true } },
    },
  });
}

export type WorkForEditor = NonNullable<Awaited<ReturnType<typeof getWorkForEditor>>>;

/** Plain values the client-side editor can receive. */
export function toEditorWork(work: WorkForEditor): EditorWork {
  return {
    id: work.id,
    title: work.title ?? "",
    slug: work.slug,
    body: work.body,
    contentType: work.contentType,
    language: work.language,
    featured: work.featured,
    composedOn: toDateInputValue(work.composedOn),
    originalPublishedAt: toDateInputValue(work.originalPublishedAt),
    collectionIds: work.collections.map((c) => c.collectionId),
    tagIds: work.tags.map((t) => t.tagId),
    updatedAt: work.updatedAt.toISOString(),
    isPublic: work.status === "PUBLISHED",
    everPublished: work.firstPublishedAt !== null,
    source: work.sourceReference
      ? {
          platform: work.sourceReference.platform,
          url: work.sourceReference.url ?? "",
          originalTitle: work.sourceReference.originalTitle ?? "",
          retrievalMethod: work.sourceReference.retrievalMethod ?? "",
          notes: work.sourceReference.notes ?? "",
        }
      : null,
  };
}
