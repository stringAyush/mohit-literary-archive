import { Prisma, type PermissionStatus, type ReviewStatus, type WorkStatus } from "@prisma/client";
import { db } from "@/lib/db";
import type { ApproveInput, ReviewChangeInput, WorkInput } from "@/lib/validation/work";
import { contentHash, normaliseLineEndings } from "./hash";
import { unmetRequirements } from "./publishing-rules";
import { ensureUniqueSlug, suggestSlug } from "./slug";

// All changes to works go through these functions, so the rules live in one place:
// every change is validated, wrapped in a transaction, versioned and recorded as an event.

export type Actor = { id: string } | null; // null = the system (the scheduler, seed or import scripts)

export type WorkflowErrorCode = "NOT_FOUND" | "CONFLICT" | "BLOCKED" | "INVALID";

export class WorkflowError extends Error {
  constructor(
    public code: WorkflowErrorCode,
    message: string,
    public fieldErrors: Record<string, string> = {},
    public reasons: string[] = [],
  ) {
    super(message);
    this.name = "WorkflowError";
  }
}

const SYSTEM_SCHEDULER = "system:scheduler";

const workWithSource = { sourceReference: true } satisfies Prisma.WorkInclude;

async function loadWork(tx: Prisma.TransactionClient, id: string) {
  const work = await tx.work.findUnique({ where: { id }, include: workWithSource });
  if (!work) throw new WorkflowError("NOT_FOUND", "This work no longer exists.");
  return work;
}

/** A slug is taken if a work uses it now, or it redirects to a different work. */
async function slugTaken(tx: Prisma.TransactionClient, slug: string, exceptWorkId?: string) {
  const [work, redirect] = await Promise.all([
    tx.work.findUnique({ where: { slug }, select: { id: true } }),
    tx.slugRedirect.findUnique({ where: { slug }, select: { workId: true } }),
  ]);
  if (work && work.id !== exceptWorkId) return true;
  if (redirect && redirect.workId !== exceptWorkId) return true;
  return false;
}

function sourceData(source: NonNullable<WorkInput["source"]>) {
  return {
    platform: source.platform,
    url: source.url,
    originalTitle: source.originalTitle,
    originalPublishedAt: source.originalPublishedAt,
    retrievalMethod: source.retrievalMethod,
    notes: source.notes,
  };
}

function event(
  workId: string,
  actor: Actor,
  type: Prisma.PublicationEventCreateManyInput["type"],
  extra: Partial<Prisma.PublicationEventCreateManyInput> = {},
): Prisma.PublicationEventCreateManyInput {
  return {
    workId,
    type,
    actorId: actor?.id ?? null,
    actorLabel: actor ? null : "system",
    ...extra,
  };
}

// ─── Create ───────────────────────────────────────────────────────────────

export type CreateWorkOptions = {
  authorId?: string;
  isDemo?: boolean;
  reviewStatus?: ReviewStatus;
  permissionStatus?: PermissionStatus;
  permissionNote?: string | null;
  imported?: boolean;
  importNote?: string;
};

export async function createWork(input: WorkInput, actor: Actor, options: CreateWorkOptions = {}) {
  const body = normaliseLineEndings(input.body);

  return db.$transaction(async (tx) => {
    const authorId =
      options.authorId ??
      (await tx.authorProfile.findFirst({ where: { isPrimary: true }, select: { id: true } }))?.id;
    if (!authorId) {
      throw new WorkflowError("INVALID", "Create the writer's profile before adding works (run the seed script).");
    }

    let slug: string;
    if (input.slug) {
      if (await slugTaken(tx, input.slug)) {
        throw new WorkflowError("INVALID", "That web address is already used.", {
          slug: "Another work already uses this web address",
        });
      }
      slug = input.slug;
    } else {
      slug = await ensureUniqueSlug(suggestSlug(input.title, body), (candidate) => slugTaken(tx, candidate),
        input.contentType.toLowerCase().replace(/_/g, "-"));
    }

    const hash = contentHash(input.title, body);
    const now = new Date();

    const work = await tx.work.create({
      data: {
        slug,
        title: input.title,
        body,
        contentType: input.contentType,
        language: input.language,
        featured: input.featured,
        composedOn: input.composedOn,
        originalPublishedAt: input.originalPublishedAt ?? input.source?.originalPublishedAt ?? null,
        authorId,
        isDemo: options.isDemo ?? false,
        reviewStatus: options.reviewStatus ?? "NEEDS_VERIFICATION",
        permissionStatus: options.permissionStatus ?? "UNKNOWN",
        permissionNote: options.permissionNote ?? null,
        importedAt: options.imported ? now : null,
        createdById: actor?.id ?? null,
        updatedById: actor?.id ?? null,
        contentHash: hash,
        currentVersion: 1,
        sourceReference: input.source ? { create: sourceData(input.source) } : undefined,
        collections: {
          create: input.collectionIds.map((collectionId, position) => ({ collectionId, position })),
        },
        tags: { create: input.tagIds.map((tagId) => ({ tagId })) },
        versions: {
          create: {
            version: 1,
            title: input.title,
            body,
            contentType: input.contentType,
            language: input.language,
            slug,
            contentHash: hash,
            changeReason: options.imported ? "Imported" : "First draft",
            createdById: actor?.id ?? null,
          },
        },
      },
    });

    await tx.publicationEvent.create({
      data: event(work.id, actor, options.imported ? "IMPORTED" : "CREATED", {
        toStatus: "DRAFT",
        version: 1,
        note: options.importNote ?? null,
      }),
    });

    return work;
  });
}

// ─── Update ───────────────────────────────────────────────────────────────

export async function updateWork(
  id: string,
  input: WorkInput,
  actor: Actor,
  expectedUpdatedAt?: Date,
) {
  const body = normaliseLineEndings(input.body);

  return db.$transaction(async (tx) => {
    const existing = await loadWork(tx, id);

    if (expectedUpdatedAt && existing.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
      throw new WorkflowError(
        "CONFLICT",
        "This work was changed somewhere else after you opened it. Reload the page to see the latest version, then make your change again.",
      );
    }

    // Slug changes: a published address must keep working, so the old slug becomes a redirect.
    const newSlug = input.slug ?? existing.slug;
    if (newSlug !== existing.slug) {
      if (await slugTaken(tx, newSlug, id)) {
        throw new WorkflowError("INVALID", "That web address is already used.", {
          slug: "Another work already uses this web address",
        });
      }
      await tx.slugRedirect.deleteMany({ where: { slug: newSlug, workId: id } });
      if (existing.firstPublishedAt) {
        await tx.slugRedirect.create({ data: { slug: existing.slug, workId: id } });
      }
    }

    const contentChanged =
      existing.title !== input.title ||
      existing.body !== body ||
      existing.contentType !== input.contentType ||
      existing.language !== input.language ||
      existing.slug !== newSlug;

    const nextVersion = contentChanged ? existing.currentVersion + 1 : existing.currentVersion;
    const hash = contentHash(input.title, body);

    // The updatedAt condition makes the save fail if someone else saved in the meantime.
    const updated = await tx.work.updateMany({
      where: { id, updatedAt: existing.updatedAt },
      data: {
        slug: newSlug,
        title: input.title,
        body,
        contentType: input.contentType,
        language: input.language,
        featured: input.featured,
        composedOn: input.composedOn,
        originalPublishedAt: input.originalPublishedAt ?? input.source?.originalPublishedAt ?? null,
        updatedById: actor?.id ?? null,
        currentVersion: nextVersion,
        contentHash: hash,
      },
    });
    if (updated.count === 0) {
      throw new WorkflowError("CONFLICT", "This work was changed somewhere else. Reload the page and try again.");
    }

    // Collections: keep existing positions, add new ones at the end, remove unticked ones.
    const currentCollections = await tx.workCollection.findMany({ where: { workId: id } });
    await tx.workCollection.deleteMany({
      where: { workId: id, collectionId: { notIn: input.collectionIds } },
    });
    const toAdd = input.collectionIds.filter((cid) => !currentCollections.some((c) => c.collectionId === cid));
    for (const collectionId of toAdd) {
      const last = await tx.workCollection.aggregate({ where: { collectionId }, _max: { position: true } });
      await tx.workCollection.create({
        data: { workId: id, collectionId, position: (last._max.position ?? -1) + 1 },
      });
    }

    // Themes
    await tx.workTag.deleteMany({ where: { workId: id, tagId: { notIn: input.tagIds } } });
    const currentTags = await tx.workTag.findMany({ where: { workId: id }, select: { tagId: true } });
    const newTags = input.tagIds.filter((tid) => !currentTags.some((t) => t.tagId === tid));
    if (newTags.length) {
      await tx.workTag.createMany({ data: newTags.map((tagId) => ({ workId: id, tagId })) });
    }

    // Source reference: changing where it came from means it must be verified again.
    if (input.source) {
      const data = sourceData(input.source);
      if (existing.sourceReference) {
        const sourceMoved =
          existing.sourceReference.platform !== data.platform || existing.sourceReference.url !== data.url;
        await tx.sourceReference.update({
          where: { workId: id },
          data: sourceMoved ? { ...data, verifiedAt: null, verifiedById: null } : data,
        });
      } else {
        await tx.sourceReference.create({ data: { ...data, workId: id } });
      }
    } else if (existing.sourceReference) {
      await tx.sourceReference.delete({ where: { workId: id } });
    }

    if (contentChanged) {
      await tx.workVersion.create({
        data: {
          workId: id,
          version: nextVersion,
          title: input.title,
          body,
          contentType: input.contentType,
          language: input.language,
          slug: newSlug,
          contentHash: hash,
          changeReason: input.changeReason,
          createdById: actor?.id ?? null,
        },
      });
    }

    await tx.publicationEvent.create({
      data: event(id, actor, "UPDATED", {
        fromStatus: existing.status,
        toStatus: existing.status,
        version: nextVersion,
        note: contentChanged ? input.changeReason : "Details updated (text unchanged)",
      }),
    });

    return tx.work.findUniqueOrThrow({ where: { id } });
  });
}

/** Puts the text of an earlier version back, as a new version. The web address is not changed. */
export async function restoreVersion(id: string, version: number, actor: Actor) {
  return db.$transaction(async (tx) => {
    const existing = await loadWork(tx, id);
    const snapshot = await tx.workVersion.findUnique({ where: { workId_version: { workId: id, version } } });
    if (!snapshot) throw new WorkflowError("NOT_FOUND", "That version does not exist.");

    const nextVersion = existing.currentVersion + 1;
    const hash = contentHash(snapshot.title, snapshot.body);
    await tx.work.update({
      where: { id },
      data: {
        title: snapshot.title,
        body: snapshot.body,
        contentType: snapshot.contentType,
        language: snapshot.language,
        currentVersion: nextVersion,
        contentHash: hash,
        updatedById: actor?.id ?? null,
      },
    });
    await tx.workVersion.create({
      data: {
        workId: id,
        version: nextVersion,
        title: snapshot.title,
        body: snapshot.body,
        contentType: snapshot.contentType,
        language: snapshot.language,
        slug: existing.slug,
        contentHash: hash,
        changeReason: `Restored text from version ${version}`,
        createdById: actor?.id ?? null,
      },
    });
    await tx.publicationEvent.create({
      data: event(id, actor, "VERSION_RESTORED", {
        fromStatus: existing.status,
        toStatus: existing.status,
        version: nextVersion,
        note: `Restored text from version ${version}`,
      }),
    });
  });
}

// ─── Review ───────────────────────────────────────────────────────────────

export async function approveWork(id: string, input: ApproveInput, actor: Actor) {
  if (!actor) throw new WorkflowError("INVALID", "Only an administrator can approve a work.");

  return db.$transaction(async (tx) => {
    const work = await loadWork(tx, id);
    if (work.status === "ARCHIVED") {
      throw new WorkflowError("INVALID", "Restore this work from the archive before approving it.");
    }
    if (work.sourceReference && !input.sourceVerified) {
      throw new WorkflowError("INVALID", "Verify the source first.", {
        sourceVerified: "Confirm that you checked the source and that the text matches it",
      });
    }

    const now = new Date();
    await tx.work.update({
      where: { id },
      data: {
        reviewStatus: "APPROVED",
        permissionStatus: input.permissionStatus,
        permissionNote: input.permissionNote,
        rightsConfirmedAt: now,
        rightsConfirmedById: actor.id,
        reviewNote: input.verificationNote || null,
        updatedById: actor.id,
      },
    });
    if (work.sourceReference) {
      await tx.sourceReference.update({
        where: { workId: id },
        data: { verifiedAt: now, verifiedById: actor.id, verificationNote: input.verificationNote || null },
      });
    }
    await tx.publicationEvent.create({
      data: event(id, actor, "APPROVED", {
        fromStatus: work.status,
        toStatus: work.status,
        note: `Permission: ${input.permissionStatus}. ${input.permissionNote}`,
      }),
    });
  });
}

/**
 * Moves a work back into review (or rejects it). A work that is not approved
 * must not be public, so a published or scheduled work is taken offline first.
 */
export async function changeReview(id: string, input: ReviewChangeInput, actor: Actor) {
  return db.$transaction(async (tx) => {
    const work = await loadWork(tx, id);
    const goesOffline = work.status === "PUBLISHED" || work.status === "SCHEDULED";
    const nextStatus: WorkStatus = goesOffline ? "DRAFT" : work.status;

    await tx.work.update({
      where: { id },
      data: {
        reviewStatus: input.reviewStatus,
        permissionStatus: input.permissionStatus ?? (input.reviewStatus === "PERMISSION_PENDING" ? "REQUESTED" : work.permissionStatus),
        reviewNote: input.note || work.reviewNote,
        rightsConfirmedAt: null,
        rightsConfirmedById: null,
        status: nextStatus,
        scheduledFor: null,
        featured: input.reviewStatus === "REJECTED" ? false : work.featured,
        updatedById: actor?.id ?? null,
      },
    });

    const events: Prisma.PublicationEventCreateManyInput[] = [];
    if (work.status === "PUBLISHED") {
      events.push(event(id, actor, "UNPUBLISHED", { fromStatus: "PUBLISHED", toStatus: "DRAFT", note: "Taken offline for review" }));
    } else if (work.status === "SCHEDULED") {
      events.push(event(id, actor, "SCHEDULE_CANCELLED", { fromStatus: "SCHEDULED", toStatus: "DRAFT", note: "Schedule cancelled for review" }));
    }
    events.push(
      event(id, actor, input.reviewStatus === "REJECTED" ? "REJECTED" : "REVIEW_CHANGED", {
        fromStatus: nextStatus,
        toStatus: nextStatus,
        note: `${work.reviewStatus} → ${input.reviewStatus}${input.note ? `: ${input.note}` : ""}`,
      }),
    );
    await tx.publicationEvent.createMany({ data: events });
  });
}

// ─── Publication ──────────────────────────────────────────────────────────

function assertPublishable(work: Awaited<ReturnType<typeof loadWork>>) {
  const unmet = unmetRequirements(work);
  if (unmet.length > 0) {
    throw new WorkflowError(
      "BLOCKED",
      "This work cannot be published yet.",
      {},
      unmet.map((r) => r.label),
    );
  }
}

export async function publishWork(id: string, actor: Actor, now = new Date()) {
  return db.$transaction(async (tx) => {
    const work = await loadWork(tx, id);
    if (work.status === "PUBLISHED") return work;
    assertPublishable(work);

    const result = await tx.work.updateMany({
      where: { id, status: work.status },
      data: {
        status: "PUBLISHED",
        publishedAt: now,
        firstPublishedAt: work.firstPublishedAt ?? now, // never overwritten once set
        scheduledFor: null,
        archivedAt: null,
        updatedById: actor?.id ?? null,
      },
    });
    if (result.count === 0) throw new WorkflowError("CONFLICT", "This work changed while publishing. Try again.");

    await tx.publicationEvent.create({
      data: event(id, actor, "PUBLISHED", {
        fromStatus: work.status,
        toStatus: "PUBLISHED",
        version: work.currentVersion,
        note: work.firstPublishedAt ? "Published again" : "First publication on this website",
      }),
    });
    return tx.work.findUniqueOrThrow({ where: { id } });
  });
}

export const MIN_SCHEDULE_LEAD_MS = 60_000;

export async function scheduleWork(id: string, scheduledFor: Date, actor: Actor, now = new Date()) {
  if (scheduledFor.getTime() < now.getTime() + MIN_SCHEDULE_LEAD_MS) {
    throw new WorkflowError("INVALID", "Choose a time at least a minute in the future.", {
      scheduledFor: "Choose a time at least a minute in the future",
    });
  }
  if (scheduledFor.getTime() > now.getTime() + 1000 * 60 * 60 * 24 * 366 * 2) {
    throw new WorkflowError("INVALID", "Choose a time within the next two years.", {
      scheduledFor: "Choose a time within the next two years",
    });
  }

  return db.$transaction(async (tx) => {
    const work = await loadWork(tx, id);
    if (work.status === "PUBLISHED") {
      throw new WorkflowError("INVALID", "This work is already published.");
    }
    assertPublishable(work);

    await tx.work.update({
      where: { id },
      data: { status: "SCHEDULED", scheduledFor, updatedById: actor?.id ?? null },
    });
    await tx.publicationEvent.create({
      data: event(id, actor, "SCHEDULED", {
        fromStatus: work.status,
        toStatus: "SCHEDULED",
        note: `Scheduled for ${scheduledFor.toISOString()}`,
      }),
    });
  });
}

export async function cancelSchedule(id: string, actor: Actor) {
  return db.$transaction(async (tx) => {
    const work = await loadWork(tx, id);
    if (work.status !== "SCHEDULED") return;
    await tx.work.update({
      where: { id },
      data: { status: "DRAFT", scheduledFor: null, updatedById: actor?.id ?? null },
    });
    await tx.publicationEvent.create({
      data: event(id, actor, "SCHEDULE_CANCELLED", { fromStatus: "SCHEDULED", toStatus: "DRAFT" }),
    });
  });
}

export async function unpublishWork(id: string, actor: Actor, note?: string) {
  return db.$transaction(async (tx) => {
    const work = await loadWork(tx, id);
    if (work.status !== "PUBLISHED") return;
    await tx.work.update({
      where: { id },
      data: { status: "DRAFT", updatedById: actor?.id ?? null },
    });
    await tx.publicationEvent.create({
      data: event(id, actor, "UNPUBLISHED", {
        fromStatus: "PUBLISHED",
        toStatus: "DRAFT",
        version: work.currentVersion,
        note: note || null,
      }),
    });
  });
}

export async function archiveWork(id: string, actor: Actor) {
  return db.$transaction(async (tx) => {
    const work = await loadWork(tx, id);
    if (work.status === "ARCHIVED") return;
    await tx.work.update({
      where: { id },
      data: {
        status: "ARCHIVED",
        archivedAt: new Date(),
        scheduledFor: null,
        featured: false,
        updatedById: actor?.id ?? null,
      },
    });
    await tx.publicationEvent.create({
      data: event(id, actor, "ARCHIVED", { fromStatus: work.status, toStatus: "ARCHIVED" }),
    });
  });
}

export async function restoreWork(id: string, actor: Actor) {
  return db.$transaction(async (tx) => {
    const work = await loadWork(tx, id);
    if (work.status !== "ARCHIVED") return;
    await tx.work.update({
      where: { id },
      data: { status: "DRAFT", archivedAt: null, updatedById: actor?.id ?? null },
    });
    await tx.publicationEvent.create({
      data: event(id, actor, "RESTORED", { fromStatus: "ARCHIVED", toStatus: "DRAFT" }),
    });
  });
}

export async function deleteWork(id: string) {
  return db.$transaction(async (tx) => {
    const work = await tx.work.findUnique({
      where: { id },
      select: { id: true, title: true, slug: true },
    });
    if (!work) throw new WorkflowError("NOT_FOUND", "This work no longer exists.");
    await tx.work.delete({ where: { id } });
    return work;
  });
}

// ─── Scheduler ────────────────────────────────────────────────────────────

export type ScheduledRunResult = {
  published: string[];
  blocked: { slug: string; reasons: string[] }[];
};

/**
 * Publishes every scheduled work whose time has come. Safe to run as often as you like
 * and from several places at once: each work is only moved if it is still SCHEDULED.
 * The publishing rules are checked again, in case something changed after scheduling.
 */
export async function publishDueWorks(now = new Date()): Promise<ScheduledRunResult> {
  const due = await db.work.findMany({
    where: { status: "SCHEDULED", scheduledFor: { lte: now } },
    select: { id: true },
    orderBy: { scheduledFor: "asc" },
  });

  const result: ScheduledRunResult = { published: [], blocked: [] };

  for (const { id } of due) {
    await db.$transaction(async (tx) => {
      const work = await loadWork(tx, id);
      if (work.status !== "SCHEDULED") return;
      const unmet = unmetRequirements(work);

      if (unmet.length > 0) {
        await tx.work.updateMany({
          where: { id, status: "SCHEDULED" },
          data: { status: "DRAFT", scheduledFor: null },
        });
        await tx.publicationEvent.create({
          data: event(id, null, "SCHEDULE_BLOCKED", {
            actorLabel: SYSTEM_SCHEDULER,
            fromStatus: "SCHEDULED",
            toStatus: "DRAFT",
            note: `Not published: ${unmet.map((r) => r.label).join("; ")}`,
          }),
        });
        result.blocked.push({ slug: work.slug, reasons: unmet.map((r) => r.label) });
        return;
      }

      const moved = await tx.work.updateMany({
        where: { id, status: "SCHEDULED" },
        data: {
          status: "PUBLISHED",
          publishedAt: now,
          firstPublishedAt: work.firstPublishedAt ?? now,
          scheduledFor: null,
        },
      });
      if (moved.count === 0) return;
      await tx.publicationEvent.create({
        data: event(id, null, "PUBLISHED", {
          actorLabel: SYSTEM_SCHEDULER,
          fromStatus: "SCHEDULED",
          toStatus: "PUBLISHED",
          version: work.currentVersion,
          note: `Published on schedule (was scheduled for ${work.scheduledFor?.toISOString()})`,
        }),
      });
      result.published.push(work.slug);
    });
  }

  return result;
}
