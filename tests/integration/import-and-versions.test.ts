import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { importRows } from "@/lib/import/run";
import { parseImport } from "@/lib/import/schema";
import { getArchivePage } from "@/lib/works/queries";
import { createWork, restoreVersion, updateWork } from "@/lib/works/service";
import { createAdmin, createAuthor, hasDatabase, resetDatabase } from "../support/db";
import { workInput } from "../support/factories";

describe.skipIf(!hasDatabase)("import and version history", () => {
  let admin: { id: string };

  beforeEach(async () => {
    await resetDatabase();
    await createAuthor();
    admin = await createAdmin();
    await db.collection.create({ data: { slug: "night-notes", name: "Night Notes" } });
  });

  it("imports rows as private drafts in review, with their sources", async () => {
    const parsed = parseImport(
      JSON.stringify([
        { title: "From the writer", text: "a\nb", contentType: "poem", sourcePlatform: "personal_submission", themes: "home; rain", collections: "night-notes", permissionStatus: "author_submitted" },
        { text: "", contentType: "quote", sourcePlatform: "yourquote", sourceUrl: "https://example.com/q/2", reviewStatus: "discovered" },
      ]),
      "json",
    );
    const outcome = await importRows(parsed.rows, admin);
    expect(outcome.created).toHaveLength(2);

    const works = await db.work.findMany({ include: { sourceReference: true, tags: true, collections: true }, orderBy: { createdAt: "asc" } });
    expect(works.every((w) => w.status === "DRAFT" && w.importedAt !== null)).toBe(true);
    expect(works.map((w) => w.reviewStatus)).toEqual(["NEEDS_VERIFICATION", "DISCOVERED"]);
    expect(works[0].tags).toHaveLength(2);
    expect(works[0].collections).toHaveLength(1);
    expect(works[1].sourceReference?.url).toBe("https://example.com/q/2");
    expect((await getArchivePage({})).total).toBe(0);
    expect(await db.publicationEvent.count({ where: { type: "IMPORTED" } })).toBe(2);
  });

  it("skips duplicates and unknown collections", async () => {
    const rows = parseImport(
      JSON.stringify([
        { text: "same text", contentType: "quote", sourcePlatform: "other" },
        { text: "same text", contentType: "quote", sourcePlatform: "other" },
        { text: "other", contentType: "quote", sourcePlatform: "other", collections: "nope" },
      ]),
      "json",
    ).rows;
    const outcome = await importRows(rows, admin);
    expect(outcome.created).toHaveLength(1);
    expect(outcome.skipped.map((s) => s.index)).toEqual([2, 3]);
  });

  it("restores an earlier text as a new version without rewriting history", async () => {
    const work = await createWork(workInput({ body: "original" }), admin);
    await updateWork(work.id, workInput({ slug: work.slug, body: "edited" }), admin);
    await restoreVersion(work.id, 1, admin);

    const after = await db.work.findUniqueOrThrow({ where: { id: work.id } });
    const versions = await db.workVersion.findMany({ where: { workId: work.id }, orderBy: { version: "asc" } });
    expect(after.body).toBe("original");
    expect(versions.map((v) => [v.version, v.body])).toEqual([
      [1, "original"],
      [2, "edited"],
      [3, "original"],
    ]);
    expect(versions[0].contentHash).toBe(versions[2].contentHash);
  });
});
