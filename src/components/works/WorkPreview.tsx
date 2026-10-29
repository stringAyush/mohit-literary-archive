import Link from "next/link";
import { contentTypeLabel } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { WorkListItem } from "@/lib/works/queries";

/** An editorial text block for lists: type and date, optional title, the opening lines. */
export function WorkPreview({ work, headingLevel = 3 }: { work: WorkListItem; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const label = work.title ?? work.excerpt.text.split("\n")[0];
  const lang = work.language === "other" ? undefined : work.language;

  return (
    <article className="group relative flex h-full flex-col border-t hairline pt-6 pb-10">
      <p className="eyebrow flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-accent">{contentTypeLabel(work.contentType)}</span>
        {work.textStatus === "EXCERPT_ONLY" && (
          <span className="border hairline px-1.5 py-0.5 tracking-[0.08em] text-accent">
            Excerpt / Fragment
          </span>
        )}
        {work.textStatus === "METADATA_ONLY" && (
          <span className="border hairline px-1.5 py-0.5 tracking-[0.08em] text-muted">
            Catalog lead
          </span>
        )}
        {work.firstPublishedAt && (
          <time dateTime={work.firstPublishedAt.toISOString()} className="tracking-[0.08em] normal-case">
            {formatDate(work.firstPublishedAt)}
          </time>
        )}
        {work.isDemo && <span className="border hairline px-1.5 py-0.5 tracking-[0.08em]">Demo text</span>}
      </p>

      <Heading className={work.title ? "mt-3 font-display text-[1.5rem] leading-tight text-ink group-hover:text-accent" : "sr-only"}>
        {label}
      </Heading>

      {/* The whole block is one link; other links inside sit above it. */}
      <Link href={`/works/${work.slug}`} className="absolute inset-0 z-0">
        <span className="sr-only">Read {work.title ? `“${work.title}”` : "this piece"}</span>
      </Link>

      <p
        lang={lang}
        className="literary-text mt-3 text-[1.3125rem] leading-[1.55] text-ink/90 transition-colors group-hover:text-ink"
      >
        {work.excerpt.text}
        {work.excerpt.truncated && <span aria-hidden="true"> …</span>}
      </p>

      <div className="mt-auto flex flex-wrap items-baseline gap-x-4 gap-y-1 pt-5 font-sans text-[0.8125rem] text-muted">
        <span>{work.authorName}</span>
        {work.collections[0] && (
          <Link
            href={`/collections/${work.collections[0].slug}`}
            className="relative z-10 underline decoration-line underline-offset-4 hover:text-accent"
          >
            {work.collections[0].name}
          </Link>
        )}
        <span className="ml-auto text-accent" aria-hidden="true">
          {work.excerpt.truncated ? "Continue reading →" : "Read →"}
        </span>
        {work.excerpt.truncated && <span className="sr-only">Preview shows the opening only. Open the work to read it in full.</span>}
      </div>
    </article>
  );
}

export function WorkGrid({ works, headingLevel = 3 }: { works: WorkListItem[]; headingLevel?: 2 | 3 }) {
  return (
    <ul className="grid gap-x-12 md:grid-cols-2">
      {works.map((work) => (
        <li key={work.id}>
          <WorkPreview work={work} headingLevel={headingLevel} />
        </li>
      ))}
    </ul>
  );
}
