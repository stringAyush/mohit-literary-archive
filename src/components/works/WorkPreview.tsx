import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { contentTypeLabel } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { WorkListItem } from "@/lib/works/queries";

/** A sleek shadcn-inspired editorial card for literary works. */
export function WorkPreview({ work, headingLevel = 3 }: { work: WorkListItem; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const label = work.title ?? work.excerpt.text.split("\n")[0];
  const lang = work.language === "other" ? undefined : work.language;

  return (
    <Card className="group relative flex h-full flex-col overflow-hidden border border-line/75 bg-surface/80 p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:bg-surface hover:shadow-md">
      {/* Top metadata badges */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="accent">
          {contentTypeLabel(work.contentType)}
        </Badge>
        {work.textStatus === "EXCERPT_ONLY" && (
          <Badge variant="secondary">
            Excerpt
          </Badge>
        )}
        {work.textStatus === "METADATA_ONLY" && (
          <Badge variant="muted">
            Fragment
          </Badge>
        )}
        {work.firstPublishedAt && (
          <time
            dateTime={work.firstPublishedAt.toISOString()}
            className="ml-auto font-sans text-xs tracking-wider text-muted tabular-nums"
          >
            {formatDate(work.firstPublishedAt)}
          </time>
        )}
        {work.isDemo && <Badge variant="outline">Demo</Badge>}
      </div>

      {/* Title */}
      <Heading className={work.title ? "mt-4 font-display text-[1.4rem] leading-snug tracking-tight text-ink transition-colors group-hover:text-accent" : "sr-only"}>
        {label}
      </Heading>

      {/* Main card link overlay */}
      <Link href={`/works/${work.slug}`} className="absolute inset-0 z-0">
        <span className="sr-only">Read {work.title ? `“${work.title}”` : "this piece"}</span>
      </Link>

      {/* Literary preview text */}
      <p
        lang={lang}
        className="literary-text mt-3.5 text-[1.25rem] leading-[1.6] text-ink/90 transition-colors group-hover:text-ink"
      >
        {work.excerpt.text}
        {work.excerpt.truncated && <span aria-hidden="true" className="text-muted"> …</span>}
      </p>

      {/* Footer metadata & read action */}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t hairline pt-4 font-sans text-xs text-muted">
        <div className="flex items-center gap-2">
          <span className="font-medium text-ink/80">{work.authorName}</span>
          {work.collections[0] && (
            <>
              <span className="text-line">•</span>
              <Link
                href={`/collections/${work.collections[0].slug}`}
                className="relative z-10 rounded-md px-1.5 py-0.5 transition-colors hover:bg-ink/5 hover:text-accent"
              >
                {work.collections[0].name}
              </Link>
            </>
          )}
        </div>

        <span className="inline-flex items-center gap-1 font-medium text-accent transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true">
          <span>{work.excerpt.truncated ? "Read more" : "View"}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
        {work.excerpt.truncated && <span className="sr-only">Preview shows the opening only. Open the work to read it in full.</span>}
      </div>
    </Card>
  );
}

export function WorkGrid({ works, headingLevel = 3 }: { works: WorkListItem[]; headingLevel?: 2 | 3 }) {
  return (
    <ul className="grid gap-6 md:grid-cols-2">
      {works.map((work) => (
        <li key={work.id}>
          <WorkPreview work={work} headingLevel={headingLevel} />
        </li>
      ))}
    </ul>
  );
}
