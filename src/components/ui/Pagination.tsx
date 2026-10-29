import Link from "next/link";

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
  const linkClass =
    "inline-flex h-11 min-w-11 items-center justify-center px-3 font-sans text-sm no-underline transition-colors hover:text-accent";

  return (
    <nav aria-label="Pagination" className="mt-12 flex items-center justify-between border-t hairline pt-6">
      {page > 1 ? (
        <Link href={hrefFor(basePath, params, page - 1)} rel="prev" className={`${linkClass} -ml-3`}>
          ← Newer
        </Link>
      ) : (
        <span />
      )}
      <ol className="hidden items-center sm:flex">
        {visiblePages(page, pageCount).map((p, i) =>
          p === "gap" ? (
            <li key={`gap-${i}`} className="px-2 text-muted" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={p}>
              {p === page ? (
                <span aria-current="page" className={`${linkClass} border-b border-accent text-ink`}>
                  {p}
                </span>
              ) : (
                <Link href={hrefFor(basePath, params, p)} className={`${linkClass} text-muted`} aria-label={`Page ${p}`}>
                  {p}
                </Link>
              )}
            </li>
          ),
        )}
      </ol>
      <span className="font-sans text-sm text-muted sm:hidden">
        Page {page} of {pageCount}
      </span>
      {page < pageCount ? (
        <Link href={hrefFor(basePath, params, page + 1)} rel="next" className={`${linkClass} -mr-3`}>
          Older →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
