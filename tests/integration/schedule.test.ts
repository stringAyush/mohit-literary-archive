import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { getPublicWorkBySlug } from "@/lib/works/queries";
import { approveWork, createWork, publishDueWorks, scheduleWork, WorkflowError } from "@/lib/works/service";
import { createAdmin, createAuthor, hasDatabase, resetDatabase } from "../support/db";
import { approval, workInput } from "../support/factories";

describe.skipIf(!hasDatabase)("scheduled publication", () => {
  let admin: { id: string };

  beforeEach(async () => {
    await resetDatabase();
    await createAuthor();
    admin = await createAdmin();
  });

  async function approvedWork(title: string) {
    const work = await createWork(workInput({ title }), admin);
    await approveWork(work.id, approval, admin);
    return work;
  }

  it("cannot schedule a work that is not approved", async () => {
    const work = await createWork(workInput(), admin);
    const error = await scheduleWork(work.id, new Date(Date.now() + 3_600_000), admin).catch((e) => e);
    expect((error as WorkflowError).code).toBe("BLOCKED");
  });

  it("rejects times in the past", async () => {
    const work = await approvedWork("Past");
    const error = await scheduleWork(work.id, new Date(Date.now() - 1000), admin).catch((e) => e);
    expect((error as WorkflowError).fieldErrors.scheduledFor).toBeTruthy();
  });

  it("publishes due works only, and only once", async () => {
    const now = new Date("2030-05-01T12:00:00Z");
    const due = await approvedWork("Due");
    const later = await approvedWork("Later");
    await scheduleWork(due.id, new Date("2030-05-01T11:30:00Z"), admin, new Date("2030-05-01T09:00:00Z"));
    await scheduleWork(later.id, new Date("2030-05-02T08:00:00Z"), admin, new Date("2030-05-01T09:00:00Z"));

    // Scheduled works stay private until the scheduler runs.
    expect(await getPublicWorkBySlug("due")).toBeNull();

    const result = await publishDueWorks(now);
    expect(result).toEqual({ published: ["due"], blocked: [] });
    expect(await publishDueWorks(now)).toEqual({ published: [], blocked: [] });

    const [dueAfter, laterAfter] = await Promise.all([
      db.work.findUniqueOrThrow({ where: { id: due.id } }),
      db.work.findUniqueOrThrow({ where: { id: later.id } }),
    ]);
    expect(dueAfter.status).toBe("PUBLISHED");
    expect(dueAfter.firstPublishedAt?.toISOString()).toBe(now.toISOString());
    expect(laterAfter.status).toBe("SCHEDULED");

    const event = await db.publicationEvent.findFirstOrThrow({ where: { workId: due.id, type: "PUBLISHED" } });
    expect(event.actorLabel).toBe("system:scheduler");
  });

  it("re-checks the rules at publication time", async () => {
    const work = await approvedWork("Withdrawn");
    await scheduleWork(work.id, new Date("2030-01-01T10:00:00Z"), admin, new Date("2029-12-31T10:00:00Z"));
    // Permission withdrawn after scheduling (simulated directly in the database).
    await db.work.update({ where: { id: work.id }, data: { permissionStatus: "DENIED" } });

    const result = await publishDueWorks(new Date("2030-01-01T10:05:00Z"));
    expect(result.published).toEqual([]);
    expect(result.blocked[0].slug).toBe("withdrawn");
    expect((await db.work.findUniqueOrThrow({ where: { id: work.id } })).status).toBe("DRAFT");
  });
});
