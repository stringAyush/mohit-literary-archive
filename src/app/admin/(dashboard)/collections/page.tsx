import type { Metadata } from "next";
import Link from "next/link";
import { CollectionForm } from "@/components/admin/SiteForms";
import { PageHeader, Panel } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { publicWorkWhere } from "@/lib/works/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Collections" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminCollectionsPage({ searchParams }: Props) {
  await requireAdmin();
  const deleted = (await searchParams).deleted === "1";
  const collections = await db.collection.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { works: true } },
    },
  });
  const publicCounts = await Promise.all(
    collections.map((c) => db.workCollection.count({ where: { collectionId: c.id, work: publicWorkWhere() } })),
  );

  return (
    <>
      <PageHeader title="Collections" description="Group works by feeling or theme. Add works to a collection from each work's editor." />
      {deleted && (
        <p role="status" className="mb-6 border-l-2 border-[#3d6b4a] bg-[#3d6b4a]/5 px-4 py-3 font-sans text-sm text-[#2f5539]">
          Collection deleted. Its works were kept.
        </p>
      )}
      <div className="grid gap-10 xl:grid-cols-[1fr_420px]">
        <div>
          {collections.length === 0 ? (
            <p className="border-y hairline py-10 text-center font-sans text-sm text-muted">No collections yet.</p>
          ) : (
            <ul className="divide-y divide-line border hairline bg-surface">
              {collections.map((c, i) => {
                const live = c.isPublished && publicCounts[i] > 0;
                return (
                  <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-4 font-sans text-sm">
                    <div>
                      <Link href={`/admin/collections/${c.id}`} className="font-medium underline decoration-line underline-offset-4 hover:text-accent">
                        {c.name}
                      </Link>
                      <p className="mt-1 text-xs text-muted">
                        {c._count.works} works · {publicCounts[i]} published ·{" "}
                        {live ? "visible to readers" : c.isPublished ? "public once it has published work" : "hidden"}
                      </p>
                    </div>
                    {live && (
                      <Link href={`/collections/${c.slug}`} className="text-xs text-accent underline">
                        View ↗
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <Panel title="New collection" id="new-collection">
          <CollectionForm collection={null} />
        </Panel>
      </div>
    </>
  );
}
