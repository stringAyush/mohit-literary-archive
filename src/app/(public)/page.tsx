import Link from "next/link";
import { CollectionGrid } from "@/components/collections/CollectionPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { WorkGrid } from "@/components/works/WorkPreview";
import { WorkText } from "@/components/works/WorkText";
import { CONTENT_TYPES, contentTypeLabel, contentTypeParam, SITE_NAME } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { makeExcerpt } from "@/lib/works/excerpt";
import {
  getContentTypeCounts,
  getFeaturedWork,
  getPrimaryAuthor,
  getPublicCollections,
  getRecentWorks,
  profileLinks,
} from "@/lib/works/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featured, author, collections, counts] = await Promise.all([
    getFeaturedWork(),
    getPrimaryAuthor(),
    getPublicCollections(),
    getContentTypeCounts(),
  ]);
  const recent = await getRecentWorks(6, featured?.work.id);
  const hasWorks = Boolean(featured);
  const featuredExcerpt = featured ? makeExcerpt(featured.work.body, 16, 900) : null;
  const introApproved = Boolean(author?.profileApprovedAt && author.shortIntro);
  const links = profileLinks(author?.links);

  return (
    <>
      {/* ─── Hero ─────────────────────────────────────────────── */}
      <section aria-labelledby="hero-heading" className="border-b hairline">
        <div className="page-container grid gap-12 py-14 lg:grid-cols-[1.45fr_1fr] lg:gap-20 lg:py-24">
          <div>
            <p className="eyebrow">A personal literary archive</p>
            <h1
              id="hero-heading"
              className="mt-6 max-w-[14ch] font-display text-[clamp(2.75rem,6.2vw,5.25rem)] leading-[1.02] tracking-[-0.02em] text-balance"
            >
              Some things are better left in words.
            </h1>
            <p className="mt-7 max-w-[34ch] font-editorial text-[1.5rem] leading-snug text-ink/80 sm:text-[1.75rem]">
              An evolving collection of thoughts, poems, fragments, and observations.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/works" className="btn btn-primary">
                Enter the archive
              </Link>
              <Link href="/about" className="btn btn-secondary">
                About the writer
              </Link>
            </div>
          </div>

          {/* A table of contents, like the opening pages of a book. */}
          <aside aria-labelledby="contents-heading" className="self-end lg:border-l lg:hairline lg:pl-12">
            <h2 id="contents-heading" className="eyebrow">
              Contents
            </h2>
            {counts.length > 0 ? (
              <ol className="mt-5">
                {CONTENT_TYPES.filter((t) => counts.some((c) => c.contentType === t.value)).map((type, index) => {
                  const count = counts.find((c) => c.contentType === type.value)?.count ?? 0;
                  return (
                    <li key={type.value} className="border-t hairline last:border-b">
                      <Link
                        href={`/works?type=${contentTypeParam(type.value)}`}
                        className="group flex min-h-14 items-baseline gap-4 py-3 no-underline"
                      >
                        <span className="w-6 font-sans text-xs tabular-nums text-muted">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="font-display text-[1.375rem] transition-colors group-hover:text-accent">
                          {type.plural}
                        </span>
                        <span
                          className="mx-1 flex-1 translate-y-[-0.3em] border-b border-dotted border-ink/25"
                          aria-hidden="true"
                        />
                        <span className="font-sans text-sm tabular-nums text-muted">{count}</span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="mt-5 border-t hairline pt-5 font-editorial text-xl italic text-muted">
                The first pages are being prepared.
              </p>
            )}
          </aside>
        </div>
      </section>

      {!hasWorks && (
        <section className="page-container section-space">
          <EmptyState
            title="The archive is being prepared."
            message="Writing will appear here as soon as the first piece is published."
            action={{ label: "About the writer", href: "/about" }}
          />
        </section>
      )}

      {/* ─── Featured work ────────────────────────────────────── */}
      {featured && featuredExcerpt && (
        <section aria-labelledby="featured-heading" className="bg-surface">
          <div className="page-container section-space">
            <div className="reading-column">
              <p id="featured-heading" className="eyebrow flex items-center gap-4">
                <span className="h-px w-10 bg-accent" aria-hidden="true" />
                A piece to sit with
              </p>
              {featured.work.title && (
                <h2 className="mt-8 font-display text-[2rem] leading-tight sm:text-[2.5rem]">{featured.work.title}</h2>
              )}
              <figure className="mt-8">
                <blockquote>
                  <WorkText body={featuredExcerpt.text} language={featured.work.language} size="feature" lineated={featured.work.contentType !== "REFLECTION"} />
                </blockquote>
                <figcaption className="mt-8 flex flex-wrap items-baseline gap-x-4 gap-y-2 font-sans text-sm text-muted">
                  <span className="font-editorial text-xl italic text-ink">— {featured.work.author.displayName}</span>
                  <span>{contentTypeLabel(featured.work.contentType)}</span>
                  {featured.work.firstPublishedAt && <span>{formatDate(featured.work.firstPublishedAt)}</span>}
                  {featured.work.isDemo && <span className="border hairline px-1.5">Demonstration text</span>}
                </figcaption>
              </figure>
              <Link href={`/works/${featured.work.slug}`} className="text-link mt-10 inline-block font-sans text-sm">
                {featuredExcerpt.truncated ? "This is the opening — continue reading the full piece" : "Open this piece on its own page"}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ─── Recent works ─────────────────────────────────────── */}
      {recent.length > 0 && (
        <section aria-labelledby="recent-heading" className="page-container section-space">
          <SectionHeading
            id="recent-heading"
            title="Recently written"
            link={{ label: "See the whole archive", href: "/works" }}
          />
          <WorkGrid works={recent} />
        </section>
      )}

      {/* ─── Collections ──────────────────────────────────────── */}
      {collections.length > 0 && (
        <section aria-labelledby="collections-heading" className="border-t hairline bg-surface-2/50">
          <div className="page-container section-space">
            <SectionHeading
              id="collections-heading"
              title="Explore by feeling"
              link={{ label: "All collections", href: "/collections" }}
            />
            <CollectionGrid collections={collections.slice(0, 6)} />
          </div>
        </section>
      )}

      {/* ─── Author note ──────────────────────────────────────── */}
      <section aria-labelledby="author-heading" className="page-container section-space">
        <div className="grid gap-8 lg:grid-cols-[1fr_2fr] lg:gap-20">
          <h2 id="author-heading" className="font-display text-[2rem] leading-tight sm:text-[2.5rem]">
            Behind the words
          </h2>
          <div className="max-w-[640px]">
            {introApproved ? (
              <p className="font-editorial text-[1.5rem] leading-[1.55] text-ink/90 whitespace-pre-line">
                {author!.shortIntro}
              </p>
            ) : (
              <p className="font-editorial text-[1.5rem] leading-[1.55] text-ink/90">
                The writing gathered here is by {author?.displayName ?? SITE_NAME}.
              </p>
            )}
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 font-sans text-sm">
              <Link href="/about" className="text-link">
                More about the writer
              </Link>
              {links.map((link) => (
                <a key={link.url} href={link.url} className="text-link" rel="noopener noreferrer" target="_blank">
                  {link.label}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
