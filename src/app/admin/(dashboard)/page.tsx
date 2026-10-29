import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/admin";
import { EVENT_LABELS } from "@/lib/admin/labels";
import { db } from "@/lib/db";
import { isEmailConfigured } from "@/lib/env";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Overview" };


export default async function AdminOverview() {
  await requireAdmin();
  const [byStatus, review, collections, inquiries, upcoming, events, emailDisabled] = await Promise.all([
    db.work.groupBy({ by: ["status"], _count: { _all: true } }),
    db.work.count({
      where: { reviewStatus: { in: ["DISCOVERED", "NEEDS_VERIFICATION", "PERMISSION_PENDING"] }, status: { not: "ARCHIVED" } },
    }),
    db.collection.count(),
    db.contactInquiry.count({ where: { handledAt: null } }),
    db.work.findMany({
      where: { status: "SCHEDULED" },
      orderBy: { scheduledFor: "asc" },
      take: 5,
      select: { id: true, title: true, slug: true, scheduledFor: true },
    }),
    db.publicationEvent.findMany({
      orderBy: { occurredAt: "desc" },
      take: 12,
      include: { work: { select: { id: true, title: true, slug: true } }, actor: { select: { name: true } } },
    }),
    Promise.resolve(!isEmailConfigured()),
  ]);

  const count = (status: string) => byStatus.find((s) => s.status === status)?._count._all ?? 0;
  const total = byStatus.reduce((sum, s) => sum + s._count._all, 0);
  const tiles = [
    { label: "Published", value: count("PUBLISHED"), href: "/admin/works?status=published" },
    { label: "Drafts", value: count("DRAFT"), href: "/admin/works?status=draft" },
    { label: "Scheduled", value: count("SCHEDULED"), href: "/admin/works?status=scheduled" },
    { label: "Awaiting review", value: review, href: "/admin/review" },
    { label: "Archived", value: count("ARCHIVED"), href: "/admin/works?status=archived" },
    { label: "Unread messages", value: inquiries, href: "/admin/inquiries" },
  ];

  return (
    <>
      <PageHeader
        title="Overview"
        description={`${total} works in the archive · ${collections} collections`}
        actions={
          <Link href="/admin/works/new" className="btn btn-primary">
            New work
          </Link>
        }
      />

      <dl className="grid grid-cols-2 border-l border-t hairline sm:grid-cols-3 xl:grid-cols-6">
        {tiles.map((tile) => (
          <div key={tile.label} className="border-b border-r hairline bg-surface">
            <Link href={tile.href} className="block p-5 no-underline hover:bg-surface-2">
              <dt className="font-sans text-xs text-muted">{tile.label}</dt>
              <dd className="mt-2 font-display text-3xl tabular-nums">{tile.value}</dd>
            </Link>
          </div>
        ))}
      </dl>

      {emailDisabled && (
        <p className="mt-6 border-l-2 border-accent bg-surface px-4 py-3 font-sans text-sm">
          Email delivery is not configured, so contact messages are saved here but not emailed. See the README to set it
          up.
        </p>
      )}

      <div className="mt-10 grid gap-10 xl:grid-cols-[1fr_1.4fr]">
        <section aria-labelledby="upcoming-heading">
          <h2 id="upcoming-heading" className="font-sans text-sm font-semibold">
            Scheduled to publish
          </h2>
          {upcoming.length === 0 ? (
            <p className="mt-3 font-sans text-sm text-muted">Nothing is scheduled.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line border-y hairline">
              {upcoming.map((work) => (
                <li key={work.id} className="flex flex-wrap justify-between gap-2 py-3 font-sans text-sm">
                  <Link href={`/admin/works/${work.id}`} className="text-link">
                    {work.title ?? work.slug}
                  </Link>
                  <span className="text-muted">{formatDateTime(work.scheduledFor)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="activity-heading">
          <h2 id="activity-heading" className="font-sans text-sm font-semibold">
            Recent activity
          </h2>
          {events.length === 0 ? (
            <p className="mt-3 font-sans text-sm text-muted">No activity yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line border-y hairline">
              {events.map((event) => (
                <li key={event.id} className="grid gap-1 py-3 font-sans text-sm sm:grid-cols-[1fr_auto]">
                  <span>
                    <span className="font-medium">{EVENT_LABELS[event.type] ?? event.type}</span>{" "}
                    <Link href={`/admin/works/${event.work.id}`} className="text-link">
                      {event.work.title ?? event.work.slug}
                    </Link>
                    <span className="text-muted"> · {event.actor?.name ?? event.actorLabel ?? "system"}</span>
                  </span>
                  <span className="text-muted">{formatDateTime(event.occurredAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
