import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/ui";
import { EVENT_LABELS } from "@/lib/admin/labels";
import { requireAdmin } from "@/lib/auth/admin";
import { WORK_STATUS_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "History" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HistoryPage({ params, searchParams }: Props) {
  await requireAdmin();
  const { id } = await params;
  const restored = (await searchParams).restored;
  const work = await db.work.findUnique({
    where: { id },
    include: {
      versions: { orderBy: { version: "desc" }, include: { createdBy: { select: { name: true } } } },
      events: { orderBy: { occurredAt: "desc" }, include: { actor: { select: { name: true } } } },
    },
  });
  if (!work) notFound();

  return (
    <>
      <PageHeader
        title="History"
        back={{ label: "Back to the work", href: `/admin/works/${work.id}` }}
        description={`${work.title ?? work.slug} · ${work.versions.length} versions · ${work.events.length} events. History is only ever added to, never rewritten.`}
      />
      {restored && (
        <p role="status" className="mb-6 border-l-2 border-[#3d6b4a] bg-[#3d6b4a]/5 px-4 py-3 font-sans text-sm text-[#2f5539]">
          The text of version {String(restored)} was restored as a new version.
        </p>
      )}

      <div className="grid gap-10 xl:grid-cols-2">
        <section aria-labelledby="versions-heading">
          <h2 id="versions-heading" className="mb-3 font-sans text-sm font-semibold">
            Versions of the text
          </h2>
          <ol className="divide-y divide-line border hairline bg-surface">
            {work.versions.map((version) => (
              <li key={version.id} className="p-4 font-sans text-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <Link href={`/admin/works/${work.id}/versions/${version.version}`} className="text-link font-medium">
                    Version {version.version}
                    {version.version === work.currentVersion && " (current)"}
                  </Link>
                  <span className="text-muted">{formatDateTime(version.createdAt)}</span>
                </div>
                <p className="mt-1 text-muted">
                  {version.createdBy?.name ?? "System"}
                  {version.changeReason ? ` — ${version.changeReason}` : ""}
                </p>
                <p className="mt-1 break-all font-mono text-[0.6875rem] text-muted">sha256 {version.contentHash}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="events-heading">
          <h2 id="events-heading" className="mb-3 font-sans text-sm font-semibold">
            Publication events
          </h2>
          <ol className="divide-y divide-line border hairline bg-surface">
            {work.events.map((event) => (
              <li key={event.id} className="p-4 font-sans text-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">{EVENT_LABELS[event.type]}</span>
                  <time dateTime={event.occurredAt.toISOString()} className="text-muted">
                    {formatDateTime(event.occurredAt)}
                  </time>
                </div>
                <p className="mt-1 text-muted">
                  {event.actor?.name ?? event.actorLabel ?? "System"}
                  {event.fromStatus && event.toStatus && event.fromStatus !== event.toStatus
                    ? ` · ${WORK_STATUS_LABELS[event.fromStatus]} → ${WORK_STATUS_LABELS[event.toStatus]}`
                    : ""}
                  {event.version ? ` · version ${event.version}` : ""}
                </p>
                {event.note && <p className="mt-1 whitespace-pre-line text-ink">{event.note}</p>}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </>
  );
}
