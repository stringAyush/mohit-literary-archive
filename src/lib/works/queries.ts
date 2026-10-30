import { Prisma, type ContentType, type TextStatus } from "@prisma/client";
import { ARCHIVE_PAGE_SIZE } from "@/lib/constants";
import { db } from "@/lib/db";
import { showDemoContent } from "@/lib/demo";
import { makeExcerpt, type Excerpt } from "./excerpt";
import { toPrefixTsQuery } from "./search-query";

// Every public page reads works through this file. Each query starts from
// publicWorkWhere(), so drafts, scheduled, archived or unapproved works can never
// leak onto the public site.

export function publicWorkWhere(now = new Date()): Prisma.WorkWhereInput {
  const includeDemo = showDemoContent();
  return {
    status: "PUBLISHED",
    reviewStatus: "APPROVED",
    publishedAt: { lte: now },
    ...(includeDemo ? {} : { isDemo: false, author: { isDemo: false } }),
  };
}

const listInclude = {
  author: { select: { displayName: true, slug: true } },
  collections: {
    where: { collection: { isPublished: true } },
    include: { collection: { select: { slug: true, name: true } } },
    orderBy: { position: "asc" },
  },
} satisfies Prisma.WorkInclude;

type WorkWithListInclude = Prisma.WorkGetPayload<{ include: typeof listInclude }>;

export type WorkListItem = {
  id: string;
  slug: string;
  title: string | null;
  excerpt: Excerpt;
  contentType: ContentType;
  textStatus: TextStatus;
  language: string;
  firstPublishedAt: Date | null;
  authorName: string;
  isDemo: boolean;
  collections: { slug: string; name: string }[];
};

function toListItem(work: WorkWithListInclude): WorkListItem {
  return {
    id: work.id,
    slug: work.slug,
    title: work.title,
    excerpt: makeExcerpt(work.body),
    contentType: work.contentType,
    textStatus: work.textStatus,
    language: work.language,
    firstPublishedAt: work.firstPublishedAt,
    authorName: work.author.displayName,
    isDemo: work.isDemo,
    collections: work.collections.map((c) => c.collection),
  };
}

const newestFirst: Prisma.WorkOrderByWithRelationInput[] = [{ firstPublishedAt: "desc" }, { id: "desc" }];

// ─── Home page ────────────────────────────────────────────────────────────

export async function getFeaturedWork() {
  const where = publicWorkWhere();
  const include = { author: { select: { displayName: true } } } satisfies Prisma.WorkInclude;
  const featured = await db.work.findFirst({ where: { ...where, featured: true }, orderBy: newestFirst, include });
  if (featured) return { work: featured, isFallback: false };
  const latest = await db.work.findFirst({ where, orderBy: newestFirst, include });
  return latest ? { work: latest, isFallback: true } : null;
}

export async function getRecentWorks(limit = 6, excludeId?: string): Promise<WorkListItem[]> {
  const works = await db.work.findMany({
    where: { ...publicWorkWhere(), ...(excludeId ? { id: { not: excludeId } } : {}) },
    orderBy: newestFirst,
    take: limit,
    include: listInclude,
  });
  return works.map(toListItem);
}

/** Featured works first, then the most recent, for "Selected works". */
export async function getSelectedWorks(limit = 3): Promise<WorkListItem[]> {
  const where = publicWorkWhere();
  const featured = await db.work.findMany({ where: { ...where, featured: true }, orderBy: newestFirst, take: limit, include: listInclude });
  if (featured.length >= limit) return featured.map(toListItem);
  const more = await db.work.findMany({
    where: { ...where, id: { notIn: featured.map((w) => w.id) } },
    orderBy: newestFirst,
    take: limit - featured.length,
    include: listInclude,
  });
  return [...featured, ...more].map(toListItem);
}

export async function getContentTypeCounts(): Promise<{ contentType: ContentType; count: number }[]> {
  const groups = await db.work.groupBy({
    by: ["contentType"],
    where: publicWorkWhere(),
    _count: { _all: true },
  });
  return groups.map((g) => ({ contentType: g.contentType, count: g._count._all }));
}

// ─── Archive (search, filters, pagination) ───────────────────────────────

export type ArchiveSort = "newest" | "oldest";

export type ArchiveFilters = {
  q?: string | null;
  type?: ContentType | null;
  collection?: string | null;
  language?: string | null;
  sort?: ArchiveSort;
  page?: number;
  pageSize?: number;
};

export type ArchivePage = {
  items: WorkListItem[];
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
};

/** Builds the SQL WHERE clause for the archive. Every value is sent as a parameter. */
function archiveConditions(filters: ArchiveFilters, now: Date): Prisma.Sql {
  const conditions: Prisma.Sql[] = [
    Prisma.sql`w."status" = 'PUBLISHED'`,
    Prisma.sql`w."reviewStatus" = 'APPROVED'`,
    Prisma.sql`w."publishedAt" <= ${now}`,
  ];
  if (!showDemoContent()) {
    conditions.push(Prisma.sql`w."isDemo" = false AND a."isDemo" = false`);
  }
  const tsQuery = filters.q ? toPrefixTsQuery(filters.q) : null;
  if (tsQuery) {
    conditions.push(Prisma.sql`w."searchVector" @@ to_tsquery('simple', ${tsQuery})`);
  }
  if (filters.type) {
    conditions.push(Prisma.sql`w."contentType" = ${filters.type}::"ContentType"`);
  }
  if (filters.language) {
    conditions.push(Prisma.sql`w."language" = ${filters.language}`);
  }
  if (filters.collection) {
    conditions.push(Prisma.sql`EXISTS (
      SELECT 1 FROM "WorkCollection" wc
      JOIN "Collection" c ON c."id" = wc."collectionId"
      WHERE wc."workId" = w."id" AND c."slug" = ${filters.collection} AND c."isPublished" = true
    )`);
  }

  return Prisma.join(conditions, " AND ");
}

export async function getArchivePage(filters: ArchiveFilters): Promise<ArchivePage> {
  const now = new Date();
  const pageSize = filters.pageSize ?? ARCHIVE_PAGE_SIZE;
  const page = Math.max(1, Math.floor(filters.page ?? 1));
  const where = archiveConditions(filters, now);
  const order =
    filters.sort === "oldest"
      ? Prisma.sql`w."firstPublishedAt" ASC, w."id" ASC`
      : Prisma.sql`w."firstPublishedAt" DESC, w."id" DESC`;

  const [countRows, idRows] = await Promise.all([
    db.$queryRaw<{ total: bigint }[]>`
      SELECT COUNT(*) AS total
      FROM "Work" w JOIN "AuthorProfile" a ON a."id" = w."authorId"
      WHERE ${where}`,
    db.$queryRaw<{ id: string }[]>`
      SELECT w."id"
      FROM "Work" w JOIN "AuthorProfile" a ON a."id" = w."authorId"
      WHERE ${where}
      ORDER BY ${order}
      LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
  ]);

  const total = Number(countRows[0]?.total ?? 0);
  const ids = idRows.map((row) => row.id);
  const works = ids.length
    ? await db.work.findMany({ where: { id: { in: ids } }, include: listInclude })
    : [];
  const byId = new Map(works.map((w) => [w.id, w]));
  const items = ids.flatMap((id) => {
    const work = byId.get(id);
    return work ? [toListItem(work)] : [];
  });

  return { items, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

export type ArchiveFilterOptions = {
  types: { value: ContentType; count: number }[];
  collections: { slug: string; name: string }[];
  languages: string[];
};

/** Only offers filters that lead somewhere: types, collections and languages with public works. */
export async function getArchiveFilterOptions(): Promise<ArchiveFilterOptions> {
  const where = publicWorkWhere();
  const [types, collections, languages] = await Promise.all([
    getContentTypeCounts(),
    db.collection.findMany({
      where: { isPublished: true, works: { some: { work: where } } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { slug: true, name: true },
    }),
    db.work.findMany({ where, distinct: ["language"], select: { language: true }, orderBy: { language: "asc" } }),
  ]);
  return {
    types: types.map((t) => ({ value: t.contentType, count: t.count })),
    collections,
    languages: languages.map((l) => l.language),
  };
}

// ─── A single work ────────────────────────────────────────────────────────

export async function getPublicWorkBySlug(slug: string) {
  return db.work.findFirst({
    where: { ...publicWorkWhere(), slug },
    include: {
      author: true,
      sourceReference: true,
      collections: {
        where: { collection: { isPublished: true } },
        include: { collection: true },
        orderBy: { position: "asc" },
      },
      tags: { include: { tag: true }, orderBy: { tag: { name: "asc" } } },
      versions: { orderBy: { version: "desc" }, take: 1, select: { version: true, createdAt: true } },
    },
  });
}

export type PublicWork = NonNullable<Awaited<ReturnType<typeof getPublicWorkBySlug>>>;

/** When a slug was changed, the old address points to the work's new one. */
export async function resolveSlugRedirect(slug: string): Promise<string | null> {
  const redirect = await db.slugRedirect.findUnique({
    where: { slug },
    include: { work: { select: { slug: true, id: true } } },
  });
  if (!redirect) return null;
  const isPublic = await db.work.count({ where: { ...publicWorkWhere(), id: redirect.work.id } });
  return isPublic ? redirect.work.slug : null;
}

export async function getRelatedWorks(work: PublicWork, limit = 3): Promise<WorkListItem[]> {
  const collectionIds = work.collections.map((c) => c.collectionId);
  const tagIds = work.tags.map((t) => t.tagId);
  const where = publicWorkWhere();

  let related: WorkWithListInclude[] = [];
  if (collectionIds.length || tagIds.length) {
    related = await db.work.findMany({
      where: {
        ...where,
        id: { not: work.id },
        OR: [
          ...(collectionIds.length ? [{ collections: { some: { collectionId: { in: collectionIds } } } }] : []),
          ...(tagIds.length ? [{ tags: { some: { tagId: { in: tagIds } } } }] : []),
        ],
      },
      orderBy: newestFirst,
      take: limit,
      include: listInclude,
    });
  }
  if (related.length < limit) {
    const more = await db.work.findMany({
      where: { ...where, id: { notIn: [work.id, ...related.map((r) => r.id)] } },
      orderBy: newestFirst,
      take: limit - related.length,
      include: listInclude,
    });
    related = [...related, ...more];
  }
  return related.map(toListItem);
}

// ─── Collections and themes ───────────────────────────────────────────────

export type PublicCollection = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  workCount: number;
};

/** Published collections that contain at least one public work, with real counts. */
export async function getPublicCollections(): Promise<PublicCollection[]> {
  const where = publicWorkWhere();
  const collections = await db.collection.findMany({
    where: { isPublished: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { works: { where: { work: where } } } } },
  });
  return collections
    .map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      description: c.description,
      workCount: c._count.works,
    }))
    .filter((c) => c.workCount > 0);
}

export async function getPublicCollectionBySlug(slug: string, page = 1, pageSize = ARCHIVE_PAGE_SIZE) {
  const where = publicWorkWhere();
  const collection = await db.collection.findFirst({ where: { slug, isPublished: true } });
  if (!collection) return null;

  const workWhere: Prisma.WorkWhereInput = { ...where, collections: { some: { collectionId: collection.id } } };
  const total = await db.work.count({ where: workWhere });
  if (total === 0) return null; // empty collections are not shown publicly

  const safePage = Math.max(1, Math.floor(page));
  const memberships = await db.workCollection.findMany({
    where: { collectionId: collection.id, work: where },
    orderBy: [{ position: "asc" }, { addedAt: "asc" }],
    skip: (safePage - 1) * pageSize,
    take: pageSize,
    include: { work: { include: listInclude } },
  });

  return {
    collection,
    items: memberships.map((m) => toListItem(m.work)),
    total,
    page: safePage,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

// ─── Writer ───────────────────────────────────────────────────────────────

export async function getPrimaryAuthor() {
  return db.authorProfile.findFirst({ where: { isPrimary: true } });
}

export type ProfileLink = { label: string; url: string };

export function profileLinks(value: unknown): ProfileLink[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is ProfileLink =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as ProfileLink).label === "string" &&
      typeof (item as ProfileLink).url === "string" &&
      /^https?:\/\//.test((item as ProfileLink).url),
  );
}

// ─── Quick search (header search box) ─────────────────────────────────────

export type QuickSearchResult = {
  works: { slug: string; title: string | null; excerpt: string; contentType: ContentType }[];
  collections: { slug: string; name: string }[];
};

export async function quickSearch(q: string, limit = 6): Promise<QuickSearchResult> {
  const tsQuery = toPrefixTsQuery(q);
  if (!tsQuery) return { works: [], collections: [] };

  const page = await getArchivePage({ q, page: 1, pageSize: limit });
  const publicCollections = await getPublicCollections();
  const needle = q.trim().toLowerCase();
  const collections = publicCollections
    .filter((c) => c.name.toLowerCase().includes(needle) || (c.description ?? "").toLowerCase().includes(needle))
    .slice(0, 4)
    .map((c) => ({ slug: c.slug, name: c.name }));

  return {
    works: page.items.map((w) => ({
      slug: w.slug,
      title: w.title,
      excerpt: w.excerpt.text.split("\n").slice(0, 2).join(" / "),
      contentType: w.contentType,
    })),
    collections,
  };
}

// ─── Sitemap ──────────────────────────────────────────────────────────────

export async function getSitemapEntries() {
  const [works, collections] = await Promise.all([
    db.work.findMany({
      where: publicWorkWhere(),
      select: { slug: true, updatedAt: true },
      orderBy: { firstPublishedAt: "desc" },
    }),
    getPublicCollections(),
  ]);
  const collectionDates = await db.collection.findMany({
    where: { id: { in: collections.map((c) => c.id) } },
    select: { slug: true, updatedAt: true },
  });
  return { works, collections: collectionDates };
}
