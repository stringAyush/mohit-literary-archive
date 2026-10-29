import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { getArchivePage, getPublicWorkBySlug, getSitemapEntries, resolveSlugRedirect } from "@/lib/works/queries";
import {
  approveWork,
  archiveWork,
  changeReview,
  createWork,
  deleteWork,
  publishWork,
  restoreWork,
  unpublishWork,
  updateWork,
  WorkflowError,
} from "@/lib/works/service";
import { createAdmin, createAuthor, hasDatabase, resetDatabase } from "../support/db";
import { approval, workInput } from "../support/factories";

describe.skipIf(!hasDatabase)("publishing workflow", () => {
  let admin: { id: string };

  beforeEach(async () => {
    await resetDatabase();
    await createAuthor();
    admin = await createAdmin();
  });

  async function isPublic(slug: string) {
    const [work, archive, sitemap] = await Promise.all([
      getPublicWorkBySlug(slug),
      getArchivePage({ page: 1 }),
      getSitemapEntries(),
    ]);
    return {
      page: Boolean(work),
      archive: archive.items.some((w) => w.slug === slug),
      sitemap: sitemap.works.some((w) => w.slug === slug),
    };
  }

  it("keeps new drafts private everywhere", async () => {
    const work = await createWork(workInput({ title: "Private draft" }), admin);
    expect(work.status).toBe("DRAFT");
    expect(await isPublic(work.slug)).toEqual({ page: false, archive: false, sitemap: false });
  });

  it("refuses to publish until review and permission are complete", async () => {
    const work = await createWork(workInput(), admin);
    const error = await publishWork(work.id, admin).catch((e) => e);
    expect(error).toBeInstanceOf(WorkflowError);
    expect((error as WorkflowError).code).toBe("BLOCKED");
    expect((error as WorkflowError).reasons.length).toBeGreaterThanOrEqual(3);
    expect((await db.work.findUniqueOrThrow({ where: { id: work.id } })).status).toBe("DRAFT");
  });

  it("requires the source to be verified before approval of an imported work", async () => {
    const work = await createWork(
      workInput({ source: { platform: "YOURQUOTE", url: "https://example.com/q/1", originalTitle: null, originalPublishedAt: null, retrievalMethod: null, notes: null } }),
      admin,
    );
    const error = await approveWork(work.id, { ...approval, sourceVerified: false }, admin).catch((e) => e);
    expect((error as WorkflowError).fieldErrors.sourceVerified).toBeTruthy();

    await approveWork(work.id, approval, admin);
    const source = await db.sourceReference.findUniqueOrThrow({ where: { workId: work.id } });
    expect(source.verifiedAt).not.toBeNull();
    expect(source.verifiedById).toBe(admin.id);
  });

  it("publishes an approved work at its permanent address and records the event", async () => {
    const work = await createWork(workInput({ title: "Rain Ledger" }), admin);
    await approveWork(work.id, approval, admin);
    const published = await publishWork(work.id, admin);

    expect(published.status).toBe("PUBLISHED");
    expect(published.firstPublishedAt).not.toBeNull();
    expect(await isPublic("rain-ledger")).toEqual({ page: true, archive: true, sitemap: true });

    const events = await db.publicationEvent.findMany({ where: { workId: work.id }, orderBy: { occurredAt: "asc" } });
    expect(events.map((e) => e.type)).toEqual(["CREATED", "APPROVED", "PUBLISHED"]);
    expect(events.at(-1)?.actorId).toBe(admin.id);
  });

  it("never overwrites the first publication date", async () => {
    const work = await createWork(workInput(), admin);
    await approveWork(work.id, approval, admin);
    const first = await publishWork(work.id, admin, new Date("2026-01-01T10:00:00Z"));
    await unpublishWork(work.id, admin);
    expect(await isPublic(work.slug)).toEqual({ page: false, archive: false, sitemap: false });

    const again = await publishWork(work.id, admin, new Date("2026-02-01T10:00:00Z"));
    expect(again.firstPublishedAt?.toISOString()).toBe(first.firstPublishedAt?.toISOString());
    expect(again.publishedAt?.toISOString()).toBe("2026-02-01T10:00:00.000Z");
  });

  it("versions every text change and keeps the work public while editing", async () => {
    const work = await createWork(workInput({ title: "Draft title" }), admin);
    await approveWork(work.id, approval, admin);
    const published = await publishWork(work.id, admin);

    await updateWork(work.id, workInput({ title: "Draft title", slug: work.slug, body: "A corrected line.", changeReason: "Typo" }), admin);
    const versions = await db.workVersion.findMany({ where: { workId: work.id }, orderBy: { version: "asc" } });
    expect(versions.map((v) => v.version)).toEqual([1, 2]);
    expect(versions[1].changeReason).toBe("Typo");
    expect(versions[0].body).toBe(workInput().body);

    const after = await db.work.findUniqueOrThrow({ where: { id: work.id } });
    expect(after.status).toBe("PUBLISHED");
    expect(after.currentVersion).toBe(2);
    expect(after.firstPublishedAt?.toISOString()).toBe(published.firstPublishedAt?.toISOString());
    expect(after.createdAt.toISOString()).toBe(work.createdAt.toISOString());
  });

  it("does not create a version when only details change", async () => {
    const work = await createWork(workInput(), admin);
    await updateWork(work.id, workInput({ slug: work.slug, featured: true }), admin);
    expect(await db.workVersion.count({ where: { workId: work.id } })).toBe(1);
  });

  it("rejects a save made from an out-of-date copy", async () => {
    const work = await createWork(workInput(), admin);
    await updateWork(work.id, workInput({ slug: work.slug, body: "first edit" }), admin, work.updatedAt);
    const error = await updateWork(work.id, workInput({ slug: work.slug, body: "stale edit" }), admin, work.updatedAt).catch((e) => e);
    expect((error as WorkflowError).code).toBe("CONFLICT");
    expect((await db.work.findUniqueOrThrow({ where: { id: work.id } })).body).toBe("first edit");
  });

  it("keeps old addresses working after a published work's slug changes", async () => {
    const work = await createWork(workInput({ title: "Old Name" }), admin);
    await approveWork(work.id, approval, admin);
    await publishWork(work.id, admin);
    await updateWork(work.id, workInput({ title: "New Name", slug: "new-name" }), admin);

    expect(await getPublicWorkBySlug("old-name")).toBeNull();
    expect(await resolveSlugRedirect("old-name")).toBe("new-name");
    // The old address cannot be given to another work.
    const clash = await createWork(workInput({ slug: "old-name" }), admin).catch((e) => e);
    expect((clash as WorkflowError).fieldErrors.slug).toBeTruthy();
  });

  it("enforces unique slugs and numbers generated ones", async () => {
    const a = await createWork(workInput({ title: "Same" }), admin);
    const b = await createWork(workInput({ title: "Same" }), admin);
    expect([a.slug, b.slug]).toEqual(["same", "same-2"]);
    const error = await createWork(workInput({ slug: "same" }), admin).catch((e) => e);
    expect((error as WorkflowError).code).toBe("INVALID");
  });

  it("takes a work offline when its approval is withdrawn", async () => {
    const work = await createWork(workInput(), admin);
    await approveWork(work.id, approval, admin);
    await publishWork(work.id, admin);
    await changeReview(work.id, { reviewStatus: "PERMISSION_PENDING", note: "Writer asked to check" }, admin);

    const after = await db.work.findUniqueOrThrow({ where: { id: work.id } });
    expect(after.status).toBe("DRAFT");
    expect(after.rightsConfirmedAt).toBeNull();
    expect(await isPublic(work.slug)).toEqual({ page: false, archive: false, sitemap: false });
  });

  it("archives and restores without losing anything", async () => {
    const work = await createWork(workInput(), admin);
    await archiveWork(work.id, admin);
    expect((await db.work.findUniqueOrThrow({ where: { id: work.id } })).status).toBe("ARCHIVED");
    await expect(publishWork(work.id, admin)).rejects.toThrow();
    await restoreWork(work.id, admin);
    const restored = await db.work.findUniqueOrThrow({ where: { id: work.id } });
    expect(restored.status).toBe("DRAFT");
    expect(await db.workVersion.count({ where: { workId: work.id } })).toBe(1);
  });

  it("deletes a work and cascades all its versions and events", async () => {
    const work = await createWork(workInput({ title: "Temporary piece to delete" }), admin);
    expect(await db.work.count({ where: { id: work.id } })).toBe(1);
    expect(await db.workVersion.count({ where: { workId: work.id } })).toBe(1);
    expect(await db.publicationEvent.count({ where: { workId: work.id } })).toBe(1);

    await deleteWork(work.id);

    expect(await db.work.findUnique({ where: { id: work.id } })).toBeNull();
    expect(await db.workVersion.count({ where: { workId: work.id } })).toBe(0);
    expect(await db.publicationEvent.count({ where: { workId: work.id } })).toBe(0);
  });
});
