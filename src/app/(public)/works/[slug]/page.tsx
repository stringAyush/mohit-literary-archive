import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { cache } from "react";
import { FadeIn } from "@/components/ui/MotionWrapper";
import { WorkGrid } from "@/components/works/WorkPreview";
import { ShareControls } from "@/components/works/ShareControls";
import { WorkText } from "@/components/works/WorkText";
import {
  contentTypeLabel,
  contentTypeParam,
  contentTypePlural,
  languageLabel,
  SITE_NAME,
  sourcePlatformLabel,
} from "@/lib/constants";
import { formatCalendarDate, formatDate, yearOf } from "@/lib/format";
import { absolutePublicUrl } from "@/lib/site";
import { oneLineSummary } from "@/lib/works/excerpt";
import { getPublicWorkBySlug, getRelatedWorks, resolveSlugRedirect } from "@/lib/works/queries";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

const loadWork = cache(async (slug: string) => getPublicWorkBySlug(slug));

function displayTitle(work: { title: string | null; body: string }) {
  return work.title ?? oneLineSummary(work.body.split("\n")[0] ?? work.body, 70);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const work = await loadWork(slug);
  if (!work) return { title: "Not found", robots: { index: false } };

  const title = displayTitle(work);
  const description = oneLineSummary(work.body);
  const path = `/works/${work.slug}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    authors: [{ name: work.author.displayName }],
    openGraph: {
      type: "article",
      title: `${title} — ${work.author.displayName}`,
      description,
      url: path,
      publishedTime: work.firstPublishedAt?.toISOString(),
      modifiedTime: work.updatedAt.toISOString(),
      authors: [work.author.displayName],
    },
    twitter: { card: "summary", title, description },
    robots: work.isDemo ? { index: false, follow: false } : undefined,
  };
}

export default async function WorkPage({ params }: Props) {
  const { slug } = await params;
  const work = await loadWork(slug);
  if (!work) {
    const newSlug = await resolveSlugRedirect(slug);
    if (newSlug) permanentRedirect(`/works/${newSlug}`);
    notFound();
  }

  const related = await getRelatedWorks(work);
  const url = absolutePublicUrl(`/works/${work.slug}`);
  const title = displayTitle(work);
  const authorName = work.author.displayName;
  const source = work.sourceReference;
  const latestVersion = work.versions[0];
  const copyrightYear = yearOf(work.originalPublishedAt) ?? yearOf(work.composedOn) ?? yearOf(work.firstPublishedAt);
  const copyText = `${work.title ? `${work.title}\n\n` : ""}${work.body}\n\n— ${authorName}\n${url}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: title,
    genre: contentTypeLabel(work.contentType),
    inLanguage: work.language === "other" ? undefined : work.language,
    author: { "@type": "Person", name: authorName },
    datePublished: work.firstPublishedAt?.toISOString(),
    dateModified: work.updatedAt.toISOString(),
    url,
    isPartOf: work.collections.map((c) => ({ "@type": "Collection", name: c.collection.name })),
  };

  const details: { label: string; value: React.ReactNode }[] = [];
  if (work.composedOn) details.push({ label: "Written", value: formatCalendarDate(work.composedOn) });
  if (source && (work.originalPublishedAt || source.url)) {
    details.push({
      label: `First appeared on ${sourcePlatformLabel(source.platform)}`,
      value: (
        <>
          {work.originalPublishedAt ? formatCalendarDate(work.originalPublishedAt) : "Date not recorded"}
          {source.url && (
            <>
              {" · "}
              <a href={source.url} className="text-link" rel="noopener noreferrer nofollow" target="_blank">
                View original<span className="sr-only"> (opens in a new tab)</span>
              </a>
            </>
          )}
        </>
      ),
    });
  } else if (work.originalPublishedAt) {
    details.push({ label: "First published", value: formatCalendarDate(work.originalPublishedAt) });
  }
  if (work.firstPublishedAt) details.push({ label: "Published in this archive", value: formatDate(work.firstPublishedAt) });
  if (latestVersion && latestVersion.version > 1) {
    details.push({ label: "Last revised", value: formatDate(latestVersion.createdAt) });
  }
  const textStatusLabel =
    work.textStatus === "EXCERPT_ONLY"
      ? "Excerpt / Literary fragment"
      : work.textStatus === "METADATA_ONLY"
      ? "Catalog lead / Metadata only"
      : "Complete verified text";
  details.push({ label: "Text status", value: textStatusLabel });
  details.push({ label: "Language", value: languageLabel(work.language) });

  return (
    <article className="pb-16 lg:pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <div className="page-container pt-8 lg:pt-12">
        <nav aria-label="Breadcrumb" className="font-sans text-[0.8125rem] text-muted">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <li>
              <Link href="/works" className="hover:text-ink hover:underline decoration-accent decoration-2">
                The Archive
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href={`/works?type=${contentTypeParam(work.contentType)}`} className="hover:text-ink hover:underline decoration-accent decoration-2">
                {contentTypePlural(work.contentType)}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="max-w-[24ch] truncate text-ink font-medium sm:max-w-[40ch]">
              {title}
            </li>
          </ol>
        </nav>
      </div>

      <FadeIn>
        <div className="page-container">
          <div className="reading-column pt-12 lg:pt-20">
          {work.isDemo && (
            <p className="mb-8 border-l-2 border-accent bg-surface/80 backdrop-blur-xs px-4 py-3 font-sans text-sm text-ink">
              Demonstration content: sample text written while developing this website. It is not a work by{" "}
              {SITE_NAME}, and it is never shown on the live site.
            </p>
          )}

          {work.textStatus === "EXCERPT_ONLY" && (
            <div className="mb-8 border-l-2 border-accent bg-surface/80 backdrop-blur-xs px-5 py-4 font-sans text-sm text-ink">
              <p className="font-semibold uppercase tracking-wider text-xs text-ink">Excerpt / Literary Fragment</p>
              <p className="mt-1 text-xs text-muted leading-relaxed">
                This entry preserves a verified excerpt from the original publication. It is not the complete poem.
              </p>
            </div>
          )}

          {work.textStatus === "METADATA_ONLY" && (
            <div className="mb-8 border-l-2 border-muted bg-surface/80 backdrop-blur-xs px-5 py-4 font-sans text-sm text-ink">
              <p className="font-semibold uppercase tracking-wider text-xs text-muted">Catalog Entry / Discovery Record</p>
              <p className="mt-1 text-xs text-muted leading-relaxed">
                This record represents an identified candidate title. The complete text has not yet been submitted or verified for publication.
              </p>
            </div>
          )}

          {work.contentType === "QUOTE" || work.contentType === "APHORISM" ? (
            /* ─── Dedicated Quote Experience ─── */
            <div className="space-y-8">
              <div className="relative rounded-2xl border border-ink/10 bg-surface/75 p-8 sm:p-12 shadow-[0_12px_36px_-8px_rgba(20,19,18,0.06)] backdrop-blur-md ring-1 ring-white/60 transition-shadow hover:shadow-[0_16px_48px_-8px_rgba(20,19,18,0.09)]">
                <div className="flex items-center justify-between gap-4 border-b hairline pb-4">
                  <span className="eyebrow text-ink font-semibold rounded-xs bg-ink/5 px-2 py-0.5">{contentTypeLabel(work.contentType)}</span>
                  {work.originalPublishedAt && (
                    <span className="font-sans text-xs text-muted tabular-nums">
                      {formatCalendarDate(work.originalPublishedAt)}
                    </span>
                  )}
                </div>

                {work.title && (
                  <h1 className="mt-6 font-display text-[1.75rem] sm:text-[2.25rem] leading-tight text-ink font-normal">
                    {work.title}
                  </h1>
                )}

                <div className={work.title ? "mt-6" : "mt-8"}>
                  <WorkText body={work.body} language={work.language} size="quote" lineated={true} />
                </div>

                <div className="mt-8 flex items-center justify-between border-t hairline pt-6">
                  <p className="font-editorial text-[1.4rem] italic text-ink sm:text-[1.6rem]">
                    — {authorName}
                  </p>
                </div>

                <div className="mt-6 border-t hairline pt-6">
                  <ShareControls
                    url={url}
                    copyText={copyText}
                    shareTitle={`${title} — ${authorName}`}
                    artworkHref={`/works/${work.slug}/artwork`}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* ─── Dedicated Story / Poem / Reflection Experience ─── */
            <div>
              <div className="flex flex-wrap items-center gap-2.5 font-sans text-xs text-muted mb-4">
                <span className="eyebrow text-ink font-semibold rounded-xs bg-ink/5 px-2 py-0.5">{contentTypeLabel(work.contentType)}</span>
                <span>•</span>
                <span>{Math.max(1, Math.ceil((work.body.trim().split(/\s+/).length || 1) / 180))} min read</span>
                <span>•</span>
                <span>{work.body.trim().split(/\s+/).length} words</span>
                <span>•</span>
                <span>{languageLabel(work.language)}</span>
              </div>

              {work.title ? (
                <h1 className="mt-4 font-display text-[clamp(2.25rem,4.5vw,3.25rem)] leading-[1.12] tracking-[-0.015em] text-ink font-normal">
                  {work.title}
                </h1>
              ) : (
                <div className="mt-4 border-b hairline pb-3">
                  <h1 className="sr-only">{title}</h1>
                  <p className="font-editorial text-xl italic text-muted">Archival Piece</p>
                </div>
              )}

              {work.body.trim() ? (
                <div className="mt-10">
                  <WorkText
                    body={work.body}
                    language={work.language}
                    size={
                      work.contentType === "SHORT_STORY" ||
                      work.contentType === "PROSE" ||
                      work.contentType === "REFLECTION"
                        ? "story"
                        : "reading"
                    }
                    lineated={
                      work.contentType !== "SHORT_STORY" &&
                      work.contentType !== "PROSE" &&
                      work.contentType !== "REFLECTION"
                    }
                  />
                </div>
              ) : (
                <div className="mt-8 border-y hairline py-10 text-center font-editorial text-xl italic text-muted">
                  Complete text unavailable in this archive. Pending author submission or lawful publication verification.
                </div>
              )}

              <p className="mt-12 font-editorial text-[1.5rem] italic text-ink">— {authorName}</p>

              <div className="mt-8 border-t hairline pt-6">
                <ShareControls
                  url={url}
                  copyText={copyText}
                  shareTitle={`${title} — ${authorName}`}
                  artworkHref={`/works/${work.slug}/artwork`}
                />
              </div>
            </div>
          )}

          {work.textStatus === "EXCERPT_ONLY" && (
            <div className="mt-8 border border-dashed hairline bg-surface-2/40 p-5 font-sans text-xs text-muted leading-relaxed">
              <p className="font-medium text-ink">The complete poem is not published here.</p>
              <p className="mt-1.5">
                In accordance with our publication and copyright policy, only verified excerpts are presented where full permission or author-supplied text is pending.
                {source?.url && (
                  <>
                    {" "}You may consult the original post at{" "}
                    <a href={source.url} target="_blank" rel="noopener noreferrer nofollow" className="text-link underline">
                      {sourcePlatformLabel(source.platform)}
                    </a>.
                  </>
                )}
              </p>
            </div>
          )}

          <dl className="mt-10 grid gap-x-8 gap-y-4 border-t hairline pt-6 font-sans text-sm sm:grid-cols-2">
            {details.map((detail) => (
              <div key={detail.label}>
                <dt className="eyebrow text-[0.6875rem]">{detail.label}</dt>
                <dd className="mt-1 text-ink">{detail.value}</dd>
              </div>
            ))}
          </dl>

          {(work.collections.length > 0 || work.tags.length > 0) && (
            <div className="mt-8 space-y-4 border-t hairline pt-6 font-sans text-sm">
              {work.collections.length > 0 && (
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
                  <span className="eyebrow text-[0.6875rem]">In</span>
                  {work.collections.map(({ collection }) => (
                    <Link key={collection.id} href={`/collections/${collection.slug}`} className="text-link">
                      {collection.name}
                    </Link>
                  ))}
                </div>
              )}
              {work.tags.length > 0 && (
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-2">
                  <span className="eyebrow mr-1 text-[0.6875rem]">Tags</span>
                  {work.tags.map(({ tag }) => (
                    <Link
                      key={tag.id}
                      href={`/works?q=${encodeURIComponent(tag.name)}`}
                      className="inline-flex min-h-8 items-center rounded-md border border-line bg-surface/60 px-2.5 text-xs text-ink no-underline transition-all hover:bg-accent hover:border-accent hover:text-ink font-medium"
                    >
                      {tag.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          <footer className="mt-6 space-y-3 font-sans text-xs leading-relaxed text-muted">
            <p>
              © {copyrightYear ?? new Date().getFullYear()} {authorName}. All rights reserved. Short quotations with
              clear attribution and a link to this page are welcome; any other use needs permission — see{" "}
              <Link href="/copyright" className="underline hover:text-ink">
                Copyright &amp; Permissions
              </Link>
              .
            </p>
            {work.contentHash && (
              <details className="group">
                <summary className="inline-flex min-h-8 items-center underline decoration-dotted underline-offset-4 hover:text-accent">About this text</summary>
                <div className="mt-2 border-l hairline pl-4">
                  <p>
                    Text fingerprint (SHA-256), version {work.currentVersion}:{" "}
                    <code className="break-all font-mono text-[0.6875rem] text-ink">{work.contentHash}</code>
                  </p>
                  <p className="mt-2">
                    The fingerprint identifies this exact wording, so copies can be compared with it. It does not by
                    itself prove who wrote the text or when, and it is not a copyright registration.
                  </p>
                </div>
              </details>
            )}
          </footer>
        </div>
      </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <section aria-labelledby="related-heading" className="page-container mt-20 lg:mt-28">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <h2 id="related-heading" className="font-display text-[1.875rem] leading-tight sm:text-[2.25rem]">
                {related.length > 0 ? "More to read" : "Keep reading"}
              </h2>
              <div className="flex gap-6 font-sans text-sm">
                <Link href="/works" className="text-link">
                  Back to the archive
                </Link>
                <Link href="/collections" className="text-link">
                  Collections
                </Link>
              </div>
            </div>
            {related.length > 0 && <WorkGrid works={related} />}
        </section>
      </FadeIn>
    </article>
  );
}
