import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArchiveFilters } from "@/components/archive/ArchiveFilters";
import { EmptyState } from "@/components/ui/EmptyState";
import { hrefFor, Pagination } from "@/components/ui/Pagination";
import { WorkGrid } from "@/components/works/WorkPreview";
import { CONTENT_TYPES, contentTypeParam, contentTypePlural, languageLabel } from "@/lib/constants";
import {
  archiveParamsToQuery,
  hasActiveFilters,
  parseArchiveParams,
  type ArchiveParams,
  type RawSearchParams,
} from "@/lib/works/archive-params";
import { getArchiveFilterOptions, getArchivePage } from "@/lib/works/queries";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<RawSearchParams> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = parseArchiveParams(await searchParams);
  const filtered = hasActiveFilters(params) || params.page > 1 || params.sort !== "newest";
  return {
    title: params.q ? `Search: ${params.q}` : "The Archive",
    description: "A growing collection of published writing — quotes, poems, aphorisms and reflections.",
    alternates: { canonical: "/works" },
    // Filtered and searched views are useful to readers but not to search engines.
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function ArchivePage({ searchParams }: Props) {
  const params = parseArchiveParams(await searchParams);
  const options = await getArchiveFilterOptions();
  const query = archiveParamsToQuery(params);
  const resultsKey = JSON.stringify(query);

  return (
    <div className="page-container pb-16 pt-12 lg:pb-24 lg:pt-20">
      <header className="max-w-3xl">
        <p className="eyebrow">Published writing</p>
        <h1 className="mt-4 font-display text-[clamp(2.5rem,5vw,4rem)] leading-[1.05] tracking-[-0.015em]">
          The Archive
        </h1>
        <p className="mt-5 font-editorial text-[1.5rem] leading-snug text-ink/80">
          A growing collection of published writing.
        </p>
      </header>

      <div className="mt-10 lg:mt-14">
        <ArchiveFilters
          key={resultsKey}
          values={{
            q: params.q,
            type: params.type ? contentTypeParam(params.type) : "",
            collection: params.collection ?? "",
            theme: params.theme ?? "",
            lang: params.language ?? "",
            sort: params.sort,
          }}
          types={CONTENT_TYPES.filter((t) => options.types.some((o) => o.value === t.value)).map((t) => ({
            value: contentTypeParam(t.value),
            label: t.plural,
          }))}
          collections={options.collections.map((c) => ({ value: c.slug, label: c.name }))}
          themes={options.themes.map((t) => ({ value: t.slug, label: t.name }))}
          languages={options.languages.map((code) => ({ value: code, label: languageLabel(code) }))}
        />
      </div>

      <Suspense key={resultsKey} fallback={<ResultsSkeleton />}>
        <ArchiveResults params={params} />
      </Suspense>
    </div>
  );
}

async function ArchiveResults({ params }: { params: ArchiveParams }) {
  const result = await getArchivePage({
    q: params.q,
    type: params.type,
    collection: params.collection,
    theme: params.theme,
    language: params.language,
    sort: params.sort,
    page: params.page,
  });
  const query = archiveParamsToQuery(params);
  const filtered = hasActiveFilters(params);

  const description = [
    params.type ? contentTypePlural(params.type) : null,
    params.language ? `in ${languageLabel(params.language)}` : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section aria-labelledby="results-heading" className="mt-10">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="results-heading" className="font-sans text-sm text-muted" aria-live="polite">
          {result.total === 0
            ? "No results"
            : `${result.total} ${result.total === 1 ? "piece" : "pieces"}${description ? ` · ${description}` : ""}${
                params.q ? ` matching “${params.q}”` : ""
              }`}
        </h2>
        {filtered && (
          <Link href="/works" className="text-link font-sans text-sm">
            Clear all filters
          </Link>
        )}
      </div>

      {result.total === 0 ? (
        <EmptyState
          title="No writing found. Try a different word."
          message={filtered ? "Try fewer filters, or search for a single word." : "Nothing has been published yet."}
          action={filtered ? { label: "Show everything", href: "/works" } : undefined}
        />
      ) : result.items.length === 0 ? (
        <EmptyState
          title="This page is past the end of the results."
          action={{ label: "Go to the first page", href: hrefFor("/works", query, 1) }}
        />
      ) : (
        <>
          <WorkGrid works={result.items} headingLevel={3} />
          <Pagination basePath="/works" params={query} page={result.page} pageCount={result.pageCount} />
        </>
      )}
    </section>
  );
}

function ResultsSkeleton() {
  return (
    <div className="mt-10" role="status" aria-live="polite">
      <p className="mb-6 font-sans text-sm text-muted">Loading writing…</p>
      <div className="grid gap-x-12 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border-t hairline pb-10 pt-6" aria-hidden="true">
            <div className="h-3 w-24 bg-surface-2" />
            <div className="mt-5 h-5 w-4/5 bg-surface-2" />
            <div className="mt-3 h-5 w-3/5 bg-surface-2" />
            <div className="mt-3 h-5 w-2/3 bg-surface-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
