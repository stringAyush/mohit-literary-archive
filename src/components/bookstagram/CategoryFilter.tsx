"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BOOKSTAGRAM_CATEGORIES } from "@/lib/bookstagram/types";

type Props = {
  categories: { name: string; count: number }[];
  totalCount: number;
};

export function CategoryFilter({ categories, totalCount }: Props) {
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") || "";

  const categoryMap = new Map(categories.map((c) => [c.name, c.count]));

  return (
    <nav aria-label="Filter photographs by category" className="overflow-x-auto pb-2">
      <ul className="flex items-center gap-2 min-w-max">
        <li>
          <Link
            href="/bookstagram"
            className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-sans text-xs font-medium transition-all no-underline ${
              !activeCategory
                ? "bg-accent text-white shadow-xs"
                : "border border-line bg-surface text-ink hover:border-ink/40"
            }`}
          >
            <span>All frames</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] tabular-nums ${
                !activeCategory ? "bg-white/20 text-white" : "bg-paper text-muted"
              }`}
            >
              {totalCount}
            </span>
          </Link>
        </li>

        {BOOKSTAGRAM_CATEGORIES.map((cat) => {
          const count = categoryMap.get(cat);
          if (count === undefined || count === 0) return null;
          const isActive = activeCategory === cat;

          return (
            <li key={cat}>
              <Link
                href={`/bookstagram?category=${encodeURIComponent(cat)}`}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-sans text-xs font-medium transition-all no-underline ${
                  isActive
                    ? "bg-accent text-white shadow-xs"
                    : "border border-line bg-surface text-ink hover:border-ink/40"
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] tabular-nums ${
                    isActive ? "bg-white/20 text-white" : "bg-paper text-muted"
                  }`}
                >
                  {count}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
