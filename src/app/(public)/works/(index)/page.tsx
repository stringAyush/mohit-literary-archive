import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { RotateCcw } from "lucide-react";
import { ArchiveFilters } from "@/components/archive/ArchiveFilters";
import { EmptyState } from "@/components/ui/EmptyState";
import { FadeIn } from "@/components/ui/MotionWrapper";
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
      <FadeIn>
        <header className="max-w-3xl">
          <p className="eyebrow flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            The Complete Archive
          </p>
          <h1 className="mt-4 font-display text-[clamp(2.5rem,5.5vw,4.5rem)] leading-[1.05] tracking-[-0.015em] text-ink font-normal">
            The Archive
          </h1>
          <p className="mt-4 font-editorial text-[1.4rem] leading-snug text-ink/80">
            A growing collection of poems, reflections, excerpts, and literary observations.
          </p>
        </header>

        <div className="mt-8 lg:mt-12">
          <ArchiveFilters
            key={resultsKey}
            values={{
              q: params.q,
              type: params.type ? contentTypeParam(params.type) : "",
              collection: params.collection ?? "",
              lang: params.language ?? "",
              sort: params.sort,
            }}
            types={CONTENT_TYPES.filter((t) => options.types.some((o) => o.value === t.value)).map((t) => ({
              value: contentTypeParam(t.value),
              label: t.plural,
              hindiLabel: t.hindiPlural,
            }))}
            collections={options.collections.map((c) => ({ value: c.slug, label: c.name }))}
            languages={options.languages.map((code) => ({ value: code, label: languageLabel(code, true) }))}
          />
        </div>
      </FadeIn>

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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="font-sans text-xs font-semibold uppercase tracking-wider text-ink rounded-xs bg-ink/5 px-2 py-0.5 tabular-nums">
            {result.total === 0 ? "0 results" : `${result.total} ${result.total === 1 ? "work" : "works"}`}
          </span>
          {description && <span className="font-sans text-xs text-muted">· {description}</span>}
          {params.q && (
            <span className="font-sans text-xs text-muted">
              matching “<strong className="text-ink">{params.q}</strong>”
            </span>
          )}
        </div>
        {filtered && (
          <Link
            href="/works"
            className="inline-flex items-center gap-1.5 rounded-lg border border-line/70 bg-surface/60 px-3 py-1 font-sans text-xs font-medium text-muted transition-colors hover:border-ink/40 hover:text-ink"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Clear all filters</span>
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
      <div className="mb-6 flex items-center gap-2">
        <div className="h-5 w-24 rounded-full bg-surface-2 animate-pulse" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-line/60 bg-surface/60 p-6" aria-hidden="true">
            <div className="flex gap-2">
              <div className="h-5 w-16 rounded-full bg-surface-2 animate-pulse" />
              <div className="h-5 w-14 rounded-full bg-surface-2 animate-pulse" />
            </div>
            <div className="mt-4 h-6 w-3/4 rounded-md bg-surface-2 animate-pulse" />
            <div className="mt-3 space-y-2">
              <div className="h-4 w-full rounded bg-surface-2 animate-pulse" />
              <div className="h-4 w-5/6 rounded bg-surface-2 animate-pulse" />
              <div className="h-4 w-2/3 rounded bg-surface-2 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
