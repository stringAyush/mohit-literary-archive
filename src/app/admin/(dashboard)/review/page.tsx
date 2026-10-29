import type { ReviewStatus } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/admin";
import { contentTypeLabel, PERMISSION_STATUS_LABELS, REVIEW_STATUS_LABELS, sourcePlatformLabel } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatCalendarDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Review queue" };

const STAGES: { status: ReviewStatus; help: string }[] = [
  { status: "DISCOVERED", help: "Found on another platform. The text has not been imported — ask the writer for it." },
  { status: "NEEDS_VERIFICATION", help: "Check that the text is the writer's own and matches its source." },
  { status: "PERMISSION_PENDING", help: "Permission has been requested from the writer and not yet given." },
];

export default async function ReviewQueuePage() {
  await requireAdmin();
  const works = await db.work.findMany({
    where: { reviewStatus: { in: STAGES.map((s) => s.status) }, status: { not: "ARCHIVED" } },
    orderBy: [{ createdAt: "asc" }],
    include: { sourceReference: true },
  });

  return (
    <>
      <PageHeader
        title="Review queue"
        description="Works waiting for authorship, source or permission checks. A work can only be published after it is approved, with evidence of the writer's permission recorded."
      />
      <div className="space-y-12">
        {STAGES.map((stage) => {
          const items = works.filter((w) => w.reviewStatus === stage.status);
          return (
            <section key={stage.status} aria-labelledby={`stage-${stage.status}`}>
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <h2 id={`stage-${stage.status}`} className="font-display text-xl">
                  {REVIEW_STATUS_LABELS[stage.status]} <span className="font-sans text-sm text-muted">({items.length})</span>
                </h2>
                <p className="font-sans text-xs text-muted">{stage.help}</p>
              </div>
              {items.length === 0 ? (
                <p className="border-y hairline py-6 font-sans text-sm text-muted">Nothing here.</p>
              ) : (
                <ul className="divide-y divide-line border hairline bg-surface">
                  {items.map((work) => (
                    <li key={work.id} className="grid gap-2 p-4 font-sans text-sm md:grid-cols-[1fr_auto] md:items-center">
                      <div className="min-w-0">
                        <Link href={`/admin/works/${work.id}`} className="font-medium text-ink underline decoration-line underline-offset-4 hover:text-accent">
                          {work.title ?? (work.body.split("\n")[0]?.slice(0, 80) || `Untitled — ${work.slug}`)}
                        </Link>
                        <p className="mt-1 text-xs text-muted">
                          {contentTypeLabel(work.contentType)} · Permission: {PERMISSION_STATUS_LABELS[work.permissionStatus]}
                          {work.sourceReference && ` · ${sourcePlatformLabel(work.sourceReference.platform)}`}
                          {work.originalPublishedAt && ` · first appeared ${formatCalendarDate(work.originalPublishedAt)}`}
                          {!work.body.trim() && " · no text yet"}
                        </p>
                        {work.sourceReference?.url && (
                          <a href={work.sourceReference.url} target="_blank" rel="noopener noreferrer" className="mt-1 block truncate text-xs text-accent underline">
                            {work.sourceReference.url}
                          </a>
                        )}
                      </div>
                      <Link href={`/admin/works/${work.id}`} className="btn btn-quiet min-h-10 py-0">
                        Review
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
