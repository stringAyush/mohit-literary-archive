import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CollectionForm, DeleteCollectionForm } from "@/components/admin/SiteForms";
import { PageHeader, Panel, StageBadge } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit collection" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditCollectionPage({ params, searchParams }: Props) {
  await requireAdmin();
  const { id } = await params;
  const created = (await searchParams).created === "1";
  const collection = await db.collection.findUnique({
    where: { id },
    include: {
      works: {
        orderBy: { position: "asc" },
        include: { work: { select: { id: true, title: true, slug: true, body: true, status: true, reviewStatus: true } } },
      },
    },
  });
  if (!collection) notFound();

  return (
    <>
      <PageHeader title={collection.name} back={{ label: "Collections", href: "/admin/collections" }} />
      {created && (
        <p role="status" className="mb-6 border-l-2 border-[#3d6b4a] bg-[#3d6b4a]/5 px-4 py-3 font-sans text-sm text-[#2f5539]">
          Collection created. Add works to it from each work&apos;s editor.
        </p>
      )}
      <div className="grid gap-10 xl:grid-cols-[1fr_420px]">
        <div className="max-w-2xl">
          <CollectionForm
            key={collection.updatedAt.toISOString()}
            collection={{
              id: collection.id,
              name: collection.name,
              slug: collection.slug,
              description: collection.description ?? "",
              introduction: collection.introduction ?? "",
              isPublished: collection.isPublished,
              sortOrder: collection.sortOrder,
            }}
          />
        </div>
        <div className="space-y-6">
          <Panel title={`Works (${collection.works.length})`} id="collection-works">
            {collection.works.length === 0 ? (
              <p className="font-sans text-sm text-muted">No works yet.</p>
            ) : (
              <ul className="space-y-3 font-sans text-sm">
                {collection.works.map(({ work }) => (
                  <li key={work.id} className="flex items-start justify-between gap-3">
                    <Link href={`/admin/works/${work.id}`} className="underline decoration-line underline-offset-4 hover:text-accent">
                      {work.title ?? (work.body.split("\n")[0]?.slice(0, 60) || work.slug)}
                    </Link>
                    <StageBadge work={work} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Delete" id="delete-collection">
            <DeleteCollectionForm id={collection.id} />
          </Panel>
        </div>
      </div>
    </>
  );
}
