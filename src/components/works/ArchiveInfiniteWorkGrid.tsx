"use client";

import React, { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { ArrowDown, Loader2 } from "lucide-react";
import { WorkPreview } from "./WorkPreview";
import { StaggerContainer, StaggerItem } from "@/components/ui/MotionWrapper";
import { fetchMoreWorksAction } from "@/app/(public)/works/actions";
import type { ArchiveFilters, WorkListItem } from "@/lib/works/queries";

type Props = {
  initialWorks: WorkListItem[];
  initialPage: number;
  pageCount: number;
  total: number;
  filters: ArchiveFilters;
  headingLevel?: 2 | 3;
};

export function ArchiveInfiniteWorkGrid({
  initialWorks,
  initialPage,
  pageCount,
  total,
  filters,
  headingLevel = 3,
}: Props) {
  const [works, setWorks] = useState<WorkListItem[]>(initialWorks);
  const [page, setPage] = useState<number>(initialPage);
  const [hasMore, setHasMore] = useState<boolean>(initialPage < pageCount);
  const [isPending, startTransition] = useTransition();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [autoLoad, setAutoLoad] = useState(true);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const filtersKey = JSON.stringify(filters);

  // Reset state when server-passed filters/works change (e.g. user typed search or selected category)
  useEffect(() => {
    setWorks(initialWorks);
    setPage(initialPage);
    setHasMore(initialPage < pageCount);
    setIsLoadingMore(false);
  }, [filtersKey, initialWorks, initialPage, pageCount]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);

    try {
      const nextPage = page + 1;
      const res = await fetchMoreWorksAction({ ...filters, page: nextPage });

      startTransition(() => {
        setWorks((prev) => {
          const existingIds = new Set(prev.map((w) => w.id));
          const newUnique = res.items.filter((item) => !existingIds.has(item.id));
          return [...prev, ...newUnique];
        });
        setPage(res.page);
        setHasMore(res.hasMore);
      });
    } catch (err) {
      console.error("Failed to load more works:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [filters, hasMore, isLoadingMore, page]);

  // IntersectionObserver for automatic infinite scroll
  useEffect(() => {
    if (!autoLoad || !hasMore || isLoadingMore) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first && first.isIntersecting) {
          loadMore();
        }
      },
      {
        rootMargin: "350px 0px", // Trigger before user reaches the very bottom
        threshold: 0.1,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [autoLoad, hasMore, isLoadingMore, loadMore]);

  return (
    <div className="space-y-8">
      {/* Works Grid */}
      <StaggerContainer>
        <ul className="grid gap-6 md:grid-cols-2">
          {works.map((work) => (
            <StaggerItem key={work.id}>
              <WorkPreview work={work} headingLevel={headingLevel} />
            </StaggerItem>
          ))}
        </ul>
      </StaggerContainer>

      {/* Loading Skeleton Cards for Incoming Batch */}
      {(isLoadingMore || isPending) && (
        <div className="grid gap-6 md:grid-cols-2 animate-pulse pt-2" aria-live="polite">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="rounded-2xl border border-line/60 bg-surface/60 p-6 space-y-4"
              aria-hidden="true"
            >
              <div className="flex gap-2">
                <div className="h-4 w-16 rounded-full bg-surface-2" />
                <div className="h-4 w-12 rounded-full bg-surface-2" />
              </div>
              <div className="h-6 w-3/4 rounded bg-surface-2" />
              <div className="space-y-2 pt-2">
                <div className="h-4 w-full rounded bg-surface-2" />
                <div className="h-4 w-5/6 rounded bg-surface-2" />
                <div className="h-4 w-2/3 rounded bg-surface-2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sentinel Element for Intersection Observer */}
      <div ref={sentinelRef} className="h-1 w-full" aria-hidden="true" />

      {/* Footer Controls & Status */}
      <div className="mt-8 flex flex-col items-center justify-center gap-4 border-t hairline pt-8 text-center">
        {hasMore ? (
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={loadMore}
              disabled={isLoadingMore}
              className="inline-flex items-center gap-2 rounded-xl bg-ink px-6 py-3 font-sans text-xs font-semibold text-paper shadow-xs transition-all hover:bg-ink/90 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading literary pieces…</span>
                </>
              ) : (
                <>
                  <ArrowDown className="h-4 w-4" />
                  <span>
                    Load more pieces ({works.length} of {total})
                  </span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setAutoLoad((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-xs font-sans text-muted hover:text-ink transition-colors px-3 py-1.5 rounded-lg border border-line/70"
              title="Toggle automatic loading when scrolling"
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  autoLoad ? "bg-accent" : "bg-muted/40"
                }`}
              />
              <span>{autoLoad ? "Infinite scroll active" : "Manual load active"}</span>
            </button>
          </div>
        ) : (
          works.length > 0 && (
            <div className="space-y-1.5 py-4">
              <div className="flex items-center justify-center gap-2 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                <span>All {total} works loaded</span>
                <span className="text-accent">❦</span>
                <span>Complete Catalog</span>
              </div>
              <p className="font-editorial text-xs italic text-muted">
                You have reached the end of the digital literary archive.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
