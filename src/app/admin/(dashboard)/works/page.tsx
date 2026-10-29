import type { Prisma, WorkStatus } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { DeleteWorkButton } from "@/components/admin/DeleteWorkButton";
import { PageHeader, StageBadge, StatusBadge } from "@/components/admin/ui";
import { hrefFor, Pagination } from "@/components/ui/Pagination";
import { requireAdmin } from "@/lib/auth/admin";
import { contentTypeLabel } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Works" };

const TABS: { key: string; label: string; status?: WorkStatus }[] = [
  { key: "", label: "All (not archived)" },
  { key: "draft", label: "Drafts", status: "DRAFT" },
  { key: "scheduled", label: "Scheduled", status: "SCHEDULED" },
  { key: "published", label: "Published", status: "PUBLISHED" },
  { key: "archived", label: "Archived", status: "ARCHIVED" },
];
const PAGE_SIZE = 25;

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminWorksPage({ searchParams }: Props) {
  await requireAdmin();
  const raw = await searchParams;
  const tabKey = typeof raw.status === "string" ? raw.status : "";
  const tab = TABS.find((t) => t.key === tabKey) ?? TABS[0];
  const q = typeof raw.q === "string" ? raw.q.trim().slice(0, 100) : "";
  const page = Math.max(1, Number.parseInt(typeof raw.page === "string" ? raw.page : "1", 10) || 1);
  const isDeleted = raw.deleted === "1";

  const where: Prisma.WorkWhereInput = {
    ...(tab.status ? { status: tab.status } : { status: { not: "ARCHIVED" } }),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { body: { contains: q, mode: "insensitive" } },
            { slug: { contains: q.toLowerCase() } },
          ],
        }
      : {}),
  };
  const [total, works] = await Promise.all([
    db.work.count({ where }),
    db.work.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        title: true,
        body: true,
        slug: true,
        status: true,
        reviewStatus: true,
        contentType: true,
        textStatus: true,
        updatedAt: true,
        isDemo: true,
        featured: true,
      },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Works"
        description="Every work in the archive. Only published works are visible to readers."
        actions={
          <>
            <Link href="/admin/import" className="btn btn-quiet">
              Import
            </Link>
            <Link href="/admin/works/new" className="btn btn-primary">
              New work
            </Link>
          </>
        }
      />

      {isDeleted && (
        <p role="status" className="mb-6 border-l-2 border-[#3d6b4a] bg-[#3d6b4a]/5 px-4 py-3 font-sans text-sm text-[#2f5539]">
          The work has been permanently deleted from the archive.
        </p>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <nav aria-label="Filter by status">
          <ul className="flex flex-wrap gap-1">
            {TABS.map((t) => (
              <li key={t.key}>
                <Link
                  href={hrefFor("/admin/works", { status: t.key || undefined, q: q || undefined }, 1)}
                  aria-current={t.key === tab.key ? "page" : undefined}
                  className={`inline-flex min-h-10 items-center px-3 font-sans text-sm no-underline ${
                    t.key === tab.key ? "border-b-2 border-accent text-ink" : "text-muted hover:text-ink"
                  }`}
                >
                  {t.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <form method="get" action="/admin/works" className="flex gap-2" role="search">
          {tab.key && <input type="hidden" name="status" value={tab.key} />}
          <label htmlFor="admin-q" className="sr-only">
            Search works
          </label>
          <input id="admin-q" name="q" type="search" defaultValue={q} placeholder="Search title or text" className="input h-10 min-h-10 w-56 text-sm" />
          <button type="submit" className="btn btn-quiet min-h-10 py-0">
            Search
          </button>
        </form>
      </div>

      {works.length === 0 ? (
        <p className="border-y hairline py-12 text-center font-sans text-sm text-muted">No works match.</p>
      ) : (
        <div className="overflow-x-auto border hairline bg-surface">
          <table className="w-full min-w-[720px] font-sans text-sm">
            <caption className="sr-only">Works, most recently changed first</caption>
            <thead className="border-b hairline text-left text-xs text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Work</th>
                <th scope="col" className="px-4 py-3 font-medium">Form</th>
                <th scope="col" className="px-4 py-3 font-medium">Stage</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
                <th scope="col" className="px-4 py-3 font-medium">Last changed</th>
                <th scope="col" className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {works.map((work) => (
                <tr key={work.id} className="align-top hover:bg-paper">
                  <td className="max-w-md px-4 py-3">
                    <Link href={`/admin/works/${work.id}`} className="font-medium text-ink underline decoration-line underline-offset-4 hover:text-accent">
                      {work.title ?? (work.body.split("\n")[0]?.slice(0, 80) || `Untitled (${work.slug})`)}
                    </Link>
                    <div className="mt-1 font-mono text-xs text-muted">/works/{work.slug}</div>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted">
                      {work.textStatus === "EXCERPT_ONLY" && <span className="text-accent font-medium">Excerpt</span>}
                      {work.textStatus === "METADATA_ONLY" && <span className="text-muted">Metadata only</span>}
                      {work.featured && <span>★ Featured</span>}
                      {work.isDemo && <span>Demo text</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">{contentTypeLabel(work.contentType)}</td>
                  <td className="px-4 py-3"><StageBadge work={work} /></td>
                  <td className="px-4 py-3"><StatusBadge status={work.status} /></td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDateTime(work.updatedAt)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/works/${work.id}`} className="btn btn-quiet h-8 min-h-8 px-2.5 text-xs">
                        Edit
                      </Link>
                      <DeleteWorkButton
                        workId={work.id}
                        workTitle={work.title ?? (work.body.split("\n")[0]?.slice(0, 40) || work.slug)}
                        variant="table-action"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination
        basePath="/admin/works"
        params={{ status: tab.key || undefined, q: q || undefined }}
        page={page}
        pageCount={Math.max(1, Math.ceil(total / PAGE_SIZE))}
      />
    </>
  );
}
