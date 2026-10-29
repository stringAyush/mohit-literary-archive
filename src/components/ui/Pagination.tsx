import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  basePath: string;
  params: Record<string, string | undefined>;
  page: number;
  pageCount: number;
};

export function hrefFor(basePath: string, params: Props["params"], page: number) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value && key !== "page") search.set(key, value);
  }
  if (page > 1) search.set("page", String(page));
  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}

/** Page numbers near the current page, with gaps: 1 … 4 5 6 … 12 */
function visiblePages(page: number, pageCount: number): (number | "gap")[] {
  const pages = new Set([1, pageCount, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pageCount));
  const sorted = [...pages].sort((a, b) => a - b);
  const result: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push("gap");
    result.push(p);
  });
  return result;
}

/** Keeps every active filter in the links, so paging never loses a search. */
export function Pagination({ basePath, params, page, pageCount }: Props) {
  if (pageCount <= 1) return null;

  return (
    <nav aria-label="Pagination" className="mt-14 flex items-center justify-between border-t hairline pt-8">
      {page > 1 ? (
        <Link
          href={hrefFor(basePath, params, page - 1)}
          rel="prev"
          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-line/80 bg-surface/80 px-4 font-sans text-xs font-semibold text-ink shadow-xs backdrop-blur-xs transition-all hover:border-ink/40 hover:bg-surface"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Newer</span>
        </Link>
      ) : (
        <div />
      )}

      <ol className="hidden items-center gap-1.5 sm:flex">
        {visiblePages(page, pageCount).map((p, i) =>
          p === "gap" ? (
            <li key={`gap-${i}`} className="px-2 text-sm text-muted" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={p}>
              {p === page ? (
                <span
                  aria-current="page"
                  className="inline-flex h-10 min-w-10 items-center justify-center rounded-xl bg-accent px-3.5 font-sans text-xs font-bold text-white shadow-xs"
                >
                  {p}
                </span>
              ) : (
                <Link
                  href={hrefFor(basePath, params, p)}
                  className="inline-flex h-10 min-w-10 items-center justify-center rounded-xl border border-line/60 bg-surface/60 px-3.5 font-sans text-xs font-medium text-muted transition-all hover:border-line hover:bg-surface hover:text-ink"
                  aria-label={`Page ${p}`}
                >
                  {p}
                </Link>
              )}
            </li>
          )
        )}
      </ol>

      <span className="font-sans text-xs text-muted sm:hidden">
        Page {page} of {pageCount}
      </span>

      {page < pageCount ? (
        <Link
          href={hrefFor(basePath, params, page + 1)}
          rel="next"
          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-line/80 bg-surface/80 px-4 font-sans text-xs font-semibold text-ink shadow-xs backdrop-blur-xs transition-all hover:border-ink/40 hover:bg-surface"
        >
          <span>Older</span>
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <div />
      )}
    </nav>
  );
}
