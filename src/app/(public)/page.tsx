import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen, Layers, Quote } from "lucide-react";
import { CollectionGrid } from "@/components/collections/CollectionPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Card } from "@/components/ui/card";
import { WorkGrid } from "@/components/works/WorkPreview";
import { WorkText } from "@/components/works/WorkText";
import { getFeaturedPhotoPosts } from "@/lib/bookstagram/queries";
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
  const [featured, author, collections, counts, featuredPhotos] = await Promise.all([
    getFeaturedWork(),
    getPrimaryAuthor(),
    getPublicCollections(),
    getContentTypeCounts(),
    getFeaturedPhotoPosts(6),
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
        <div className="page-container grid gap-10 sm:gap-12 py-12 sm:py-16 lg:grid-cols-[1.45fr_1fr] lg:gap-16 lg:py-24">
          <div className="flex flex-col justify-center">
            <h1
              id="hero-heading"
              className="max-w-[14ch] font-display text-[clamp(2.75rem,6.2vw,5.25rem)] leading-[1.02] tracking-[-0.02em] text-balance text-ink font-normal"
            >
              Some things are better left in words.
            </h1>
            <p className="mt-7 max-w-[34ch] font-editorial text-[1.5rem] leading-snug text-ink/85 sm:text-[1.75rem]">
              An evolving collection of thoughts, poems, fragments, and observations.
            </p>
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-3.5">
              <Link
                href="/works"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3.5 font-sans text-sm font-semibold text-white shadow-xs transition-all hover:bg-accent-hover hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>Enter the archive</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-line/80 bg-surface/80 px-5 py-3.5 font-sans text-sm font-medium text-ink shadow-xs backdrop-blur-xs transition-all hover:border-ink/50 hover:bg-surface hover:-translate-y-0.5 active:translate-y-0"
              >
                About the writer
              </Link>
            </div>
          </div>

          {/* Table of contents glass card */}
          <aside aria-labelledby="contents-heading" className="w-full self-end">
            <Card className="border border-ink/10 bg-surface/80 p-5 sm:p-6 lg:p-7 shadow-[0_12px_36px_-8px_rgba(20,19,18,0.06)] backdrop-blur-md ring-1 ring-white/60 transition-transform duration-300 hover:shadow-[0_16px_40px_-8px_rgba(20,19,18,0.09)]">
              <div className="flex items-center justify-between border-b hairline pb-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-accent animate-pulse-dot" />
                  <h2 id="contents-heading" className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-ink">
                    Contents
                  </h2>
                </div>
                <span className="eyebrow text-[0.6875rem]">Archive Index</span>
              </div>

              {counts.length > 0 ? (
                <ol className="divide-y divide-line/60">
                  {CONTENT_TYPES.filter((t) => counts.some((c) => c.contentType === t.value)).map((type, index) => {
                    const count = counts.find((c) => c.contentType === type.value)?.count ?? 0;
                    return (
                      <li key={type.value}>
                        <Link
                          href={`/works?type=${contentTypeParam(type.value)}`}
                          className="group flex min-h-12 items-center justify-between py-2.5 transition-colors no-underline hover:text-ink"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-5 font-sans text-xs font-medium tabular-nums text-muted group-hover:text-ink transition-colors">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <span className="font-display text-[1.35rem] text-ink transition-all group-hover:translate-x-1 group-hover:underline decoration-accent decoration-2 underline-offset-4">
                              {type.plural}
                            </span>
                          </div>
                          <span className="inline-flex items-center justify-center rounded-sm bg-ink/5 px-2 py-0.5 font-sans text-xs font-semibold tabular-nums text-ink/80 transition-colors group-hover:bg-accent group-hover:text-white">
                            {count}
                          </span>
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

      {/* ─── Awwwards-style Dynamic Kinetic Marquee ─────────────── */}
      <div className="relative overflow-hidden border-b hairline bg-surface/60 py-3 backdrop-blur-xs select-none">
        <div className="animate-marquee flex items-center gap-8 font-sans text-xs tracking-[0.2em] uppercase text-muted">
          {[1, 2, 3, 4].map((idx) => (
            <div key={idx} className="flex items-center gap-8 shrink-0" aria-hidden={idx > 1 ? "true" : undefined}>
              <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> Poetry &amp; Ghazals</span>
              <span className="text-line">·</span>
              <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> Micro-Fiction &amp; Stories</span>
              <span className="text-line">·</span>
              <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> Reflections &amp; Prose</span>
              <span className="text-line">·</span>
              <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> Book Photography</span>
              <span className="text-line">·</span>
            </div>
          ))}
        </div>
      </div>

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
          <Card className="relative overflow-hidden border border-ink/10 bg-surface/80 p-8 shadow-[0_12px_36px_-8px_rgba(20,19,18,0.06)] backdrop-blur-md ring-1 ring-white/60 transition-all sm:p-12 hover:shadow-[0_16px_48px_-8px_rgba(20,19,18,0.09)]">
            <div className="reading-column">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-accent" />
                  <p className="eyebrow text-ink font-semibold">Featured Piece</p>
                </div>
                <Quote className="h-6 w-6 text-ink/20" />
              </div>

              {featured.work.title && (
                <h2 className="mt-8 font-display text-[2.25rem] leading-tight sm:text-[2.75rem] text-ink font-normal">
                  {featured.work.title}
                </h2>
              )}

              <figure className="mt-6">
                <blockquote className="rounded-xl border-l-2 border-accent pl-6 my-6">
                  <WorkText
                    body={featuredExcerpt.text}
                    language={featured.work.language}
                    lineated={
                      featured.work.contentType !== "REFLECTION" &&
                      featured.work.contentType !== "SHORT_STORY" &&
                      featured.work.contentType !== "PROSE"
                    }
                  />
                </blockquote>
                <figcaption className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 font-sans text-sm text-muted">
                  <span className="font-editorial text-xl italic text-ink">— {featured.work.author.displayName}</span>
                  <span className="eyebrow text-ink font-semibold text-xs rounded-xs bg-ink/5 px-2 py-0.5">{contentTypeLabel(featured.work.contentType)}</span>
                  {featured.work.firstPublishedAt && (
                    <span className="text-xs tabular-nums">{formatDate(featured.work.firstPublishedAt)}</span>
                  )}
                  {featured.work.isDemo && <span className="eyebrow text-muted text-xs">Demo text</span>}
                </figcaption>
              </figure>

              <div className="mt-8 border-t hairline pt-6">
                <Link
                  href={`/works/${featured.work.slug}`}
                  className="inline-flex items-center gap-2 font-sans text-sm font-semibold text-ink transition-transform hover:translate-x-1 hover:underline decoration-accent decoration-2"
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
        <section aria-labelledby="collections-heading" className="border-t hairline bg-surface-2/30">
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

      {/* ─── Book Photography ─────────────────────────────────── */}
      {featuredPhotos.length > 0 && (
        <section aria-labelledby="photography-heading" className="border-t hairline bg-paper">
          <div className="page-container section-space">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow mb-2">Through the reader&apos;s lens</p>
                <h2 id="photography-heading" className="font-display text-[2rem] leading-tight sm:text-[2.5rem] font-normal text-ink">
                  Book Photography
                </h2>
                <p className="mt-2 max-w-xl font-editorial text-xl text-ink/80">
                  Book covers, natural light reading setups, and quiet moments between pages.
                </p>
              </div>
              <Link
                href="/bookstagram"
                className="inline-flex items-center gap-1.5 font-sans text-sm font-semibold text-ink hover:underline decoration-accent decoration-2"
              >
                <span>View all photographs</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* ─── Architectural Clean Masonry Grid ─── */}
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 sm:gap-6 [column-fill:_balance]">
              {featuredPhotos.map((photo, idx) => {
                const img = photo.images[0];
                if (!img) return null;
                const aspectRatio =
                  img.width && img.height ? img.width / img.height : 1.4;

                return (
                  <div key={photo.id} className="mb-6 break-inside-avoid inline-block w-full">
                    <article className="group relative block w-full">
                      {/* Framed Image */}
                      <div className="relative overflow-hidden rounded-2xl bg-paper ring-1 ring-line/70 shadow-xs transition-all duration-300 ease-out group-hover:-translate-y-0.5 group-hover:shadow-xl group-hover:shadow-ink/10 group-hover:ring-ink/20">
                        <Link
                          href={`/bookstagram/${photo.slug}`}
                          className="relative block w-full overflow-hidden"
                          style={{ aspectRatio: `${aspectRatio}` }}
                        >
                          <Image
                            src={img.url}
                            alt={img.altText || photo.title}
                            fill
                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            loading={idx < 3 ? "eager" : "lazy"}
                            priority={idx < 3}
                          />

                          {/* Hover Scrim */}
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                          {/* Top Action */}
                          <div className="absolute top-3 right-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <span className="inline-flex items-center gap-1 rounded-md bg-accent px-2.5 py-1 font-sans text-xs font-semibold text-ink shadow-sm backdrop-blur-xs">
                              <span>View</span>
                              <ArrowUpRight className="h-3 w-3" />
                            </span>
                          </div>

                          {/* Bottom Indicator */}
                          {photo.images.length > 1 && (
                            <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded bg-black/70 px-2 py-0.5 font-sans text-[11px] font-medium text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <Layers className="h-3 w-3" />
                              <span>{photo.images.length} photos</span>
                            </div>
                          )}
                        </Link>
                      </div>

                      {/* Photo Info Below */}
                      <div className="pt-3 pb-1 px-1">
                        <div className="flex flex-wrap items-center gap-2 font-sans text-[11px] font-medium text-muted">
                          {photo.category && (
                            <span className="rounded-xs bg-ink/5 px-1.5 py-0.5 text-[10px] uppercase tracking-wider font-semibold text-ink">
                              {photo.category}
                            </span>
                          )}
                          {photo.bookTitle && (
                            <div className="flex items-center gap-1 truncate font-semibold uppercase tracking-wider text-ink/80">
                              <BookOpen className="h-3 w-3 shrink-0" />
                              <span className="truncate">{photo.bookTitle}</span>
                              {photo.bookAuthor && (
                                <span className="font-normal text-muted normal-case tracking-normal truncate">
                                  · {photo.bookAuthor}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <h3 className="mt-1.5 font-display text-lg font-normal leading-snug text-ink transition-colors hover:underline decoration-accent decoration-2">
                          <Link href={`/bookstagram/${photo.slug}`} className="no-underline">
                            {photo.title}
                          </Link>
                        </h3>

                        <div className="mt-2.5 flex items-center justify-between font-sans text-xs text-muted border-t hairline pt-2">
                          <div className="flex items-center gap-1.5">
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                            <span className="text-[11px] font-medium text-ink">Mohit Yenugwar</span>
                          </div>
                        </div>
                      </div>
                    </article>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─── Author note ──────────────────────────────────────── */}
      <section aria-labelledby="author-heading" className="page-container section-space">
        <Card className="border border-ink/10 bg-surface/80 p-8 sm:p-12 shadow-[0_12px_36px_-8px_rgba(20,19,18,0.06)] backdrop-blur-md ring-1 ring-white/60">
          <div className="grid gap-8 lg:grid-cols-[1fr_2fr] lg:gap-16">
            <div>
              <p className="eyebrow mb-3">Author Note</p>
              <h2 id="author-heading" className="font-display text-[2rem] leading-tight sm:text-[2.5rem] font-normal text-ink">
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
                  className="inline-flex items-center gap-1.5 font-semibold text-ink hover:underline decoration-accent decoration-2"
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
