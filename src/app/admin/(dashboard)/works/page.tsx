import type { Prisma, WorkStatus } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/ui";
import { WorksBatchTable } from "@/components/admin/WorksBatchTable";
import { hrefFor, Pagination } from "@/components/ui/Pagination";
import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";

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

      {raw.deletedMultiple && (
        <p role="status" className="mb-6 border-l-2 border-[#3d6b4a] bg-[#3d6b4a]/5 px-4 py-3 font-sans text-sm text-[#2f5539]">
          {raw.deletedMultiple} selected works have been permanently deleted from the archive.
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
        <WorksBatchTable works={works} />
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
