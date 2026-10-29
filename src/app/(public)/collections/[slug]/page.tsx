import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Pagination } from "@/components/ui/Pagination";
import { WorkGrid } from "@/components/works/WorkPreview";
import { oneLineSummary } from "@/lib/works/excerpt";
import { getPublicCollectionBySlug } from "@/lib/works/queries";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function pageNumber(value: string | string[] | undefined): number {
  const n = Number.parseInt(Array.isArray(value) ? value[0] : (value ?? "1"), 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 10_000) : 1;
}

const load = cache((slug: string, page: number) => getPublicCollectionBySlug(slug, page));

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = pageNumber((await searchParams).page);
  const data = await load(slug, page);
  if (!data) return { title: "Not found", robots: { index: false } };
  const { collection } = data;
  const description = collection.description ?? oneLineSummary(collection.introduction ?? `Writing in ${collection.name}.`);
  return {
    title: collection.name,
    description,
    alternates: { canonical: `/collections/${collection.slug}` },
    openGraph: { title: collection.name, description, url: `/collections/${collection.slug}` },
    robots: page > 1 ? { index: false, follow: true } : undefined,
  };
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const page = pageNumber((await searchParams).page);
  const data = await load(slug, page);
  if (!data) notFound();
  const { collection, items, total, pageCount } = data;

  return (
    <div className="page-container pb-16 pt-8 lg:pb-24 lg:pt-12">
      <nav aria-label="Breadcrumb" className="font-sans text-[0.8125rem] text-muted">
        <ol className="flex flex-wrap gap-x-2">
          <li>
            <Link href="/collections" className="hover:text-accent">
              Collections
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-ink">
            {collection.name}
          </li>
        </ol>
      </nav>

      <header className="mt-12 grid gap-8 border-b hairline pb-12 lg:mt-16 lg:grid-cols-[1fr_1.3fr] lg:gap-20">
        <div>
          <p className="eyebrow">
            Collection · {total} {total === 1 ? "piece" : "pieces"}
          </p>
          <h1 className="mt-4 font-display text-[clamp(2.5rem,5vw,4rem)] leading-[1.05] tracking-[-0.015em]">
            {collection.name}
          </h1>
        </div>
        {(collection.introduction || collection.description) && (
          <p className="self-end whitespace-pre-line font-editorial text-[1.5rem] leading-[1.5] text-ink/85">
            {collection.introduction ?? collection.description}
          </p>
        )}
      </header>

      <div className="mt-6">
        {items.length > 0 ? (
          <>
            <WorkGrid works={items} headingLevel={2} />
            <Pagination basePath={`/collections/${collection.slug}`} params={{}} page={page} pageCount={pageCount} />
          </>
        ) : (
          <p className="py-16 text-center font-sans text-sm text-muted">
            This page is past the end of the collection.{" "}
            <Link href={`/collections/${collection.slug}`} className="text-link">
              Go to the first page
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
