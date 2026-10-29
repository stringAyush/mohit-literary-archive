import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Panel, StageBadge, StatusBadge } from "@/components/admin/ui";
import { WorkEditor } from "@/components/admin/WorkEditor";
import { ApproveForm, ReviewStatusForm, ScheduleForm, WorkflowButton } from "@/components/admin/WorkflowForms";
import { getEditorOptions, getWorkForEditor, toEditorWork } from "@/lib/admin/editor-data";
import { requireAdmin } from "@/lib/auth/admin";
import { PERMISSION_STATUS_LABELS, REVIEW_STATUS_LABELS, sourcePlatformLabel } from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/format";
import { publishingRequirements } from "@/lib/works/publishing-rules";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit work" };

const DONE_MESSAGES: Record<string, string> = {
  created: "Draft saved. Complete the rights & review panel before publishing.",
  saved: "Saved. A new version is recorded whenever the text, title, form, language or address changes.",
  approved: "Approved. Authorship, permission and source are recorded with your name and today's date.",
  published: "Published. The work is now live at its permanent address.",
  scheduled: "Scheduled. The scheduler will publish it at the chosen time.",
  "schedule-cancelled": "Schedule cancelled. The work is a draft again.",
  unpublished: "Unpublished. It is no longer public; its history and first publication date are kept.",
  archived: "Moved to the archive. Nothing was deleted, and it can be restored at any time.",
  restored: "Restored from the archive as a draft.",
  "review-changed": "Review status updated. Any approval was withdrawn and, if the work was public, it was taken offline.",
};

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditWorkPage({ params, searchParams }: Props) {
  await requireAdmin();
  const { id } = await params;
  const done = (await searchParams).done;
  const doneMessage = typeof done === "string" ? DONE_MESSAGES[done] : undefined;
  const [work, options] = await Promise.all([getWorkForEditor(id), getEditorOptions()]);
  if (!work) notFound();

  const requirements = publishingRequirements(work);
  const ready = requirements.every((r) => r.met);
  const label = work.title ?? (work.body.split("\n")[0]?.slice(0, 70) || `Untitled — /works/${work.slug}`);
  const source = work.sourceReference;

  return (
    <>
      <PageHeader
        title={label}
        back={{ label: "Works", href: "/admin/works" }}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <StageBadge work={work} />
            <StatusBadge status={work.status} />
            {work.textStatus === "EXCERPT_ONLY" && <span className="border hairline px-2 text-xs text-accent">Excerpt</span>}
            {work.textStatus === "METADATA_ONLY" && <span className="border hairline px-2 text-xs text-muted">Metadata only</span>}
            <span>Version {work.currentVersion}</span>
            {work.isDemo && <span className="border hairline px-2 text-xs">Demonstration content</span>}
          </span>
        }
        actions={
          <>
            <Link href={`/admin/works/${work.id}/preview`} className="btn btn-quiet">
              Preview
            </Link>
            <Link href={`/admin/works/${work.id}/history`} className="btn btn-quiet">
              History
            </Link>
            {work.status === "PUBLISHED" && (
              <Link href={`/works/${work.slug}`} className="btn btn-secondary">
                View live ↗
              </Link>
            )}
          </>
        }
      />

      {doneMessage && (
        <p role="status" className="mb-6 border-l-2 border-[#3d6b4a] bg-[#3d6b4a]/5 px-4 py-3 font-sans text-sm text-[#2f5539]">
          {doneMessage}
        </p>
      )}

      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <WorkEditor key={work.updatedAt.toISOString()} work={toEditorWork(work)} collections={options.collections} tags={options.tags} />
        </div>

        <div className="space-y-6">
          <Panel title="Publication" id="publication-panel">
            <ul className="mb-5 space-y-2 font-sans text-sm" aria-label="Publishing requirements">
              {requirements.map((r) => (
                <li key={r.key} className="flex gap-2">
                  <span aria-hidden="true" className={r.met ? "text-[#2f5539]" : "text-[#8f2f22]"}>
                    {r.met ? "✓" : "✗"}
                  </span>
                  <span className={r.met ? "text-muted" : "text-ink"}>
                    <span className="sr-only">{r.met ? "Done: " : "Missing: "}</span>
                    {r.label}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mb-5 space-y-1 font-sans text-xs text-muted">
              {work.firstPublishedAt && (
                <div>
                  <dt className="inline">First published here: </dt>
                  <dd className="inline text-ink">{formatDateTime(work.firstPublishedAt)}</dd>
                </div>
              )}
              {work.status === "SCHEDULED" && work.scheduledFor && (
                <div>
                  <dt className="inline">Scheduled for: </dt>
                  <dd className="inline text-ink">{formatDateTime(work.scheduledFor)}</dd>
                </div>
              )}
              <div>
                <dt className="inline">Created: </dt>
                <dd className="inline">
                  {formatDateTime(work.createdAt)}
                  {work.createdBy ? ` by ${work.createdBy.name}` : ""}
                </dd>
              </div>
              {work.importedAt && (
                <div>
                  <dt className="inline">Imported: </dt>
                  <dd className="inline">{formatDateTime(work.importedAt)}</dd>
                </div>
              )}
            </dl>

            <div className="space-y-4">
              {work.status === "DRAFT" && (
                <>
                  <WorkflowButton workId={work.id} kind="publish" label="Publish now" variant="primary" disabled={!ready} />
                  <ScheduleForm workId={work.id} disabled={!ready} />
                </>
              )}
              {work.status === "SCHEDULED" && (
                <>
                  <WorkflowButton workId={work.id} kind="publish" label="Publish now instead" variant="primary" disabled={!ready} />
                  <WorkflowButton workId={work.id} kind="cancelSchedule" label="Cancel schedule" />
                </>
              )}
              {work.status === "PUBLISHED" && (
                <WorkflowButton workId={work.id} kind="unpublish" label="Unpublish" withNote="Reason (optional)" />
              )}
              {work.status === "ARCHIVED" ? (
                <WorkflowButton workId={work.id} kind="restore" label="Restore from archive" />
              ) : (
                <WorkflowButton workId={work.id} kind="archive" label="Move to archive" variant="danger" />
              )}
            </div>
            {!ready && work.status !== "ARCHIVED" && (
              <p className="mt-4 font-sans text-xs text-muted">Publishing becomes available once every requirement is met.</p>
            )}
          </Panel>

          <Panel title="Rights & review" id="review-panel">
            <dl className="mb-5 space-y-2 font-sans text-sm">
              <div>
                <dt className="text-xs text-muted">Review status</dt>
                <dd>{REVIEW_STATUS_LABELS[work.reviewStatus]}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Permission</dt>
                <dd>{PERMISSION_STATUS_LABELS[work.permissionStatus]}</dd>
              </div>
              {work.permissionNote && (
                <div>
                  <dt className="text-xs text-muted">Evidence</dt>
                  <dd className="whitespace-pre-line">{work.permissionNote}</dd>
                </div>
              )}
              {work.rightsConfirmedAt && (
                <div>
                  <dt className="text-xs text-muted">Confirmed</dt>
                  <dd>
                    {formatDate(work.rightsConfirmedAt)}
                    {work.rightsConfirmedBy ? ` by ${work.rightsConfirmedBy.name}` : ""}
                  </dd>
                </div>
              )}
              {source && (
                <div>
                  <dt className="text-xs text-muted">Source</dt>
                  <dd>
                    {sourcePlatformLabel(source.platform)}
                    {source.url && (
                      <>
                        {" · "}
                        <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-link break-all">
                          open original
                        </a>
                      </>
                    )}
                    <span className="block text-xs text-muted">
                      {source.verifiedAt
                        ? `Verified ${formatDate(source.verifiedAt)}${source.verifiedBy ? ` by ${source.verifiedBy.name}` : ""}`
                        : "Not verified yet"}
                    </span>
                  </dd>
                </div>
              )}
              {work.reviewNote && (
                <div>
                  <dt className="text-xs text-muted">Review note</dt>
                  <dd className="whitespace-pre-line">{work.reviewNote}</dd>
                </div>
              )}
            </dl>

            {work.isDemo || work.author.isDemo ? (
              <p className="font-sans text-xs text-muted">
                Demonstration content can be published only for local development and is hidden on the live site.
              </p>
            ) : null}

            {work.reviewStatus !== "APPROVED" && work.status !== "ARCHIVED" && (
              <details className="mt-2 border-t hairline pt-4" open={work.reviewStatus !== "REJECTED"}>
                <summary className="min-h-9 font-sans text-sm font-semibold">Approve</summary>
                <div className="mt-4">
                  <ApproveForm
                    workId={work.id}
                    hasSource={Boolean(source)}
                    current={{ permissionStatus: work.permissionStatus, permissionNote: work.permissionNote ?? "" }}
                  />
                </div>
              </details>
            )}

            <details className="mt-4 border-t hairline pt-4">
              <summary className="min-h-9 font-sans text-sm font-semibold">
                {work.reviewStatus === "APPROVED" ? "Withdraw approval" : "Change review status"}
              </summary>
              <div className="mt-4">
                <ReviewStatusForm workId={work.id} current={work.reviewStatus} />
              </div>
            </details>
          </Panel>
        </div>
      </div>
    </>
  );
}
