import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  getArchiveFilterOptions,
  getArchivePage,
  getPublicCollectionBySlug,
  getPublicCollections,
  quickSearch,
} from "@/lib/works/queries";
import { approveWork, createWork, publishWork, type Actor } from "@/lib/works/service";
import type { WorkInput } from "@/lib/validation/work";
import { createAdmin, createAuthor, hasDatabase, resetDatabase } from "../support/db";
import { approval, workInput } from "../support/factories";

describe.skipIf(!hasDatabase)("archive, search and collections", () => {
  let admin: Actor;
  let collectionId: string;
  let hiddenCollectionId: string;
  let tagId: string;

  async function published(input: Partial<WorkInput>, at: string, extra: { authorId?: string; isDemo?: boolean } = {}) {
    const work = await createWork(workInput(input), admin, extra);
    await approveWork(work.id, approval, admin);
    return publishWork(work.id, admin, new Date(at));
  }

  beforeEach(async () => {
    await resetDatabase();
    await createAuthor();
    admin = await createAdmin();
    collectionId = (await db.collection.create({ data: { slug: "night-notes", name: "Night Notes", isPublished: true } })).id;
    hiddenCollectionId = (await db.collection.create({ data: { slug: "unfinished", name: "Unfinished", isPublished: false } })).id;
    tagId = (await db.tag.create({ data: { slug: "rain", name: "Rain" } })).id;

    await published({ title: "Monsoon Inventory", body: "One umbrella, borrowed.\nThree streets.", contentType: "POEM", collectionIds: [collectionId], tagIds: [tagId] }, "2026-01-01T00:00:00Z");
    await published({ body: "Silence is full of everything we did not say.", contentType: "APHORISM", collectionIds: [collectionId, hiddenCollectionId] }, "2026-02-01T00:00:00Z");
    await published({ body: "शब्द कम थे, ख़ामोशी ज़्यादा", contentType: "SHORT_PIECE", language: "hi" }, "2026-03-01T00:00:00Z");
    // A draft that must never be found:
    await createWork(workInput({ title: "Secret umbrella draft", body: "umbrella umbrella", collectionIds: [collectionId] }), admin);
  });

  afterEach(() => {
    process.env.SHOW_DEMO_CONTENT = "false";
  });

  it("lists only published works, newest first by default", async () => {
    const page = await getArchivePage({});
    expect(page.total).toBe(3);
    expect(page.items.map((w) => w.contentType)).toEqual(["SHORT_PIECE", "APHORISM", "POEM"]);
    const oldest = await getArchivePage({ sort: "oldest" });
    expect(oldest.items[0].title).toBe("Monsoon Inventory");
  });

  it("searches titles and text, including partial words, never drafts", async () => {
    expect((await getArchivePage({ q: "umbrella" })).items.map((w) => w.title)).toEqual(["Monsoon Inventory"]);
    expect((await getArchivePage({ q: "umbr" })).total).toBe(1);
    expect((await getArchivePage({ q: "monsoon" })).total).toBe(1);
    expect((await getArchivePage({ q: "silence everything" })).total).toBe(1);
    expect((await getArchivePage({ q: "nothing-matches-this" })).total).toBe(0);
    expect((await getArchivePage({ q: "'); DROP TABLE \"Work\"; --" })).total).toBe(0);
  });

  it("filters by type, language, collection and theme together", async () => {
    expect((await getArchivePage({ type: "POEM" })).total).toBe(1);
    expect((await getArchivePage({ language: "hi" })).items[0].contentType).toBe("SHORT_PIECE");
    expect((await getArchivePage({ collection: "night-notes" })).total).toBe(2);
    expect((await getArchivePage({ collection: "unfinished" })).total).toBe(0); // unpublished collection
    expect((await getArchivePage({ theme: "rain" })).total).toBe(1);
    expect((await getArchivePage({ collection: "night-notes", type: "APHORISM" })).total).toBe(1);
  });

  it("paginates with correct totals", async () => {
    const first = await getArchivePage({ pageSize: 2, page: 1 });
    const second = await getArchivePage({ pageSize: 2, page: 2 });
    expect([first.total, first.pageCount, first.items.length, second.items.length]).toEqual([3, 2, 2, 1]);
    expect(new Set([...first.items, ...second.items].map((w) => w.id)).size).toBe(3);
    expect((await getArchivePage({ pageSize: 2, page: 9 })).items).toEqual([]);
  });

  it("offers only filters that lead to published work", async () => {
    const options = await getArchiveFilterOptions();
    expect(options.collections.map((c) => c.slug)).toEqual(["night-notes"]);
    expect(options.themes.map((t) => t.slug)).toEqual(["rain"]);
    expect(options.languages.sort()).toEqual(["en", "hi"]);
    expect(options.types.map((t) => t.value).sort()).toEqual(["APHORISM", "POEM", "SHORT_PIECE"]);
  });

  it("counts collection members from published records only", async () => {
    const collections = await getPublicCollections();
    expect(collections).toEqual([expect.objectContaining({ slug: "night-notes", workCount: 2 })]);
    const detail = await getPublicCollectionBySlug("night-notes");
    expect(detail?.total).toBe(2);
    expect(await getPublicCollectionBySlug("unfinished")).toBeNull();
  });

  it("hides empty collections", async () => {
    await db.collection.create({ data: { slug: "empty", name: "Empty", isPublished: true } });
    expect((await getPublicCollections()).map((c) => c.slug)).not.toContain("empty");
    expect(await getPublicCollectionBySlug("empty")).toBeNull();
  });

  it("keeps demonstration content out unless explicitly enabled", async () => {
    const demoAuthor = await createAuthor({ isDemo: true, slug: "demo" });
    await published({ body: "demo umbrella text" }, "2026-04-01T00:00:00Z", { authorId: demoAuthor.id, isDemo: true });
    expect((await getArchivePage({ q: "demo" })).total).toBe(0);
    process.env.SHOW_DEMO_CONTENT = "true";
    expect((await getArchivePage({ q: "demo" })).total).toBe(1);
  });

  it("powers the header search with works and collections", async () => {
    const results = await quickSearch("night");
    expect(results.collections.map((c) => c.slug)).toEqual(["night-notes"]);
    const works = await quickSearch("umbrella");
    expect(works.works.map((w) => w.slug)).toEqual(["monsoon-inventory"]);
  });
});
