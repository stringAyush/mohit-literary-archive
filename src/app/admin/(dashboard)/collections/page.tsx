import type { Metadata } from "next";
import { CollectionForm } from "@/components/admin/SiteForms";
import { CollectionsBatchList } from "@/components/admin/CollectionsBatchList";
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
          <CollectionsBatchList
            collections={collections.map((c, i) => ({
              id: c.id,
              name: c.name,
              slug: c.slug,
              isPublished: c.isPublished,
              workCount: c._count.works,
              publicCount: publicCounts[i],
            }))}
          />
        </div>
        <Panel title="New collection" id="new-collection">
          <CollectionForm collection={null} />
        </Panel>
      </div>
    </>
  );
}
