import Link from "next/link";
import { ArrowRight, BookOpen, Feather, Sparkles, Quote } from "lucide-react";
import { CollectionGrid } from "@/components/collections/CollectionPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
      <section aria-labelledby="hero-heading" className="border-b hairline bg-linear-to-b from-paper via-surface/40 to-paper">
        <div className="page-container grid gap-12 py-14 lg:grid-cols-[1.45fr_1fr] lg:gap-16 lg:py-24">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="accent" className="gap-1.5 px-3 py-1">
                <Feather className="h-3 w-3" />
                <span>Personal literary archive</span>
              </Badge>
            </div>
            <h1
              id="hero-heading"
              className="mt-6 max-w-[14ch] font-display text-[clamp(2.75rem,6.2vw,5.25rem)] leading-[1.02] tracking-[-0.02em] text-balance text-ink"
            >
              Some things are better left in words.
            </h1>
            <p className="mt-7 max-w-[34ch] font-editorial text-[1.5rem] leading-snug text-ink/80 sm:text-[1.75rem]">
              An evolving collection of thoughts, poems, fragments, and observations.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3.5">
              <Link
                href="/works"
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 font-sans text-sm font-semibold text-white shadow-xs transition-all hover:bg-accent-hover hover:shadow-md"
              >
                <span>Enter the archive</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 rounded-xl border border-line/80 bg-surface/80 px-5 py-3 font-sans text-sm font-medium text-ink shadow-xs backdrop-blur-xs transition-all hover:border-ink/50 hover:bg-surface"
              >
                About the writer
              </Link>
            </div>
          </div>

          {/* Table of contents card */}
          <aside aria-labelledby="contents-heading" className="self-end">
            <Card className="border border-line/80 bg-surface/95 p-6 shadow-sm">
              <div className="flex items-center justify-between border-b hairline pb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-accent" />
                  <h2 id="contents-heading" className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                    Contents
                  </h2>
                </div>
                <Badge variant="secondary">Index</Badge>
              </div>

              {counts.length > 0 ? (
                <ol className="divide-y divide-line/60">
                  {CONTENT_TYPES.filter((t) => counts.some((c) => c.contentType === t.value)).map((type, index) => {
                    const count = counts.find((c) => c.contentType === type.value)?.count ?? 0;
                    return (
                      <li key={type.value}>
                        <Link
                          href={`/works?type=${contentTypeParam(type.value)}`}
                          className="group flex min-h-12 items-center justify-between py-2.5 transition-colors no-underline hover:text-accent"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-5 font-sans text-xs font-medium tabular-nums text-muted">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <span className="font-display text-[1.25rem] text-ink transition-colors group-hover:text-accent">
                              {type.plural}
                            </span>
                          </div>
                          <Badge variant="outline" className="tabular-nums transition-colors group-hover:border-accent/40 group-hover:text-accent">
                            {count}
                          </Badge>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className="mt-4 font-editorial text-lg italic text-muted">
                  The first pages are being prepared.
                </p>
              )}
            </Card>
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
        <section aria-labelledby="featured-heading" className="page-container section-space">
          <Card className="relative overflow-hidden border border-line/80 bg-surface/90 p-8 shadow-sm transition-all sm:p-12 hover:shadow-md">
            <div className="reading-column">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Badge variant="accent" className="gap-1.5 px-3 py-1">
                    <Sparkles className="h-3 w-3" />
                    <span>Featured Piece</span>
                  </Badge>
                  <span className="font-sans text-xs text-muted">A piece to sit with</span>
                </div>
                <Quote className="h-6 w-6 text-accent/30" />
              </div>

              {featured.work.title && (
                <h2 className="mt-8 font-display text-[2rem] leading-tight sm:text-[2.5rem] text-ink">
                  {featured.work.title}
                </h2>
              )}

              <figure className="mt-6">
                <blockquote className="rounded-xl border-l-2 border-accent/60 pl-6 my-6">
                  <WorkText
                    body={featuredExcerpt.text}
                    language={featured.work.language}
                    size="feature"
                    lineated={featured.work.contentType !== "REFLECTION"}
                  />
                </blockquote>
                <figcaption className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 font-sans text-sm text-muted">
                  <span className="font-editorial text-xl italic text-ink">— {featured.work.author.displayName}</span>
                  <Badge variant="secondary">{contentTypeLabel(featured.work.contentType)}</Badge>
                  {featured.work.firstPublishedAt && (
                    <span className="text-xs tabular-nums">{formatDate(featured.work.firstPublishedAt)}</span>
                  )}
                  {featured.work.isDemo && <Badge variant="outline">Demo text</Badge>}
                </figcaption>
              </figure>

              <div className="mt-8 border-t hairline pt-6">
                <Link
                  href={`/works/${featured.work.slug}`}
                  className="inline-flex items-center gap-2 font-sans text-sm font-semibold text-accent transition-transform hover:translate-x-1"
                >
                  <span>
                    {featuredExcerpt.truncated ? "Continue reading the full piece" : "Open this piece on its own page"}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </Card>
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
        <section aria-labelledby="collections-heading" className="border-t hairline bg-surface-2/40">
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
        <Card className="border border-line/80 bg-surface/90 p-8 sm:p-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_2fr] lg:gap-16">
            <div>
              <Badge variant="muted" className="mb-3">Author Note</Badge>
              <h2 id="author-heading" className="font-display text-[2rem] leading-tight sm:text-[2.25rem]">
                Behind the words
              </h2>
            </div>
            <div className="max-w-[640px]">
              {introApproved ? (
                <p className="font-editorial text-[1.4rem] leading-[1.6] text-ink/90 whitespace-pre-line">
                  {author!.shortIntro}
                </p>
              ) : (
                <p className="font-editorial text-[1.4rem] leading-[1.6] text-ink/90">
                  The writing gathered here is by {author?.displayName ?? SITE_NAME}.
                </p>
              )}
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 font-sans text-sm">
                <Link
                  href="/about"
                  className="inline-flex items-center gap-1.5 font-medium text-accent hover:underline"
                >
                  <span>More about the writer</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                {links.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    className="rounded-md border border-line/80 bg-paper px-3 py-1 font-sans text-xs font-medium text-muted transition-colors hover:border-ink/40 hover:text-ink"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {link.label}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </section>
    </>
  );
}
