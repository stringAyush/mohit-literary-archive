"use client";

import React, { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BookOpen, LayoutGrid } from "lucide-react";
import { BookFlipReader } from "./BookFlipReader";
import type { FlipBookPiece } from "@/lib/works/queries";

type Props = {
  initialView: "normal" | "book";
  normalContent: React.ReactNode;
  flipWorks: FlipBookPiece[];
  totalWorks?: number;
};

export function ArchiveViewSection({
  initialView,
  normalContent,
  flipWorks,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [view, setView] = useState<"normal" | "book">(initialView);
  const [, startTransition] = useTransition();

  function switchView(nextView: "normal" | "book") {
    setView(nextView);
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    if (nextView === "book") {
      params.set("view", "book");
    } else {
      params.delete("view");
    }
    const query = params.toString();
    const nextUrl = query ? `${pathname}?${query}` : pathname;
    startTransition(() => {
      router.replace(nextUrl, { scroll: false });
    });
  }

  return (
    <div className="mt-8">
      {/* ─── Publication View Options Switcher ─── */}
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b hairline pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
              Reading Experience
            </span>
            <span className="text-line">/</span>
            <span className="font-editorial text-xs italic text-ink/70">Select presentation mode</span>
          </div>
          <p className="mt-1 font-editorial text-sm text-muted">
            {view === "normal"
              ? "Standard archive directory with category filters, typography previews, and pagination."
              : "Interactive digital book view with realistic page turns, parchment paper, and table of contents."}
          </p>
        </div>

        {/* View Switcher Pills */}
        <div
          role="tablist"
          aria-label="Archive view mode"
          className="inline-flex items-center rounded-2xl border border-line/90 bg-surface/85 p-1.5 shadow-xs backdrop-blur-md ring-1 ring-white/60"
        >
          {/* Option 1: Normal View */}
          <button
            type="button"
            role="tab"
            aria-selected={view === "normal"}
            onClick={() => switchView("normal")}
            className={`group inline-flex items-center gap-2 rounded-xl px-4 py-2 font-sans text-xs font-semibold transition-all ${
              view === "normal"
                ? "bg-ink text-paper shadow-sm"
                : "text-muted hover:text-ink hover:bg-surface/90"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
            <span>Normal View</span>
          </button>

          {/* Option 2: Book Flip View */}
          <button
            type="button"
            role="tab"
            aria-selected={view === "book"}
            onClick={() => switchView("book")}
            className={`group inline-flex items-center gap-2 rounded-xl px-4 py-2 font-sans text-xs font-semibold transition-all ${
              view === "book"
                ? "bg-accent text-white shadow-sm"
                : "text-muted hover:text-ink hover:bg-surface/90"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
            <span>Book Flip View</span>
          </button>
        </div>
      </div>

      {/* ─── Render Selected View ─── */}
      {view === "normal" ? (
        <div className="transition-opacity duration-300">
          {normalContent}
        </div>
      ) : (
        <div className="transition-opacity duration-300">
          {flipWorks.length > 0 ? (
            <BookFlipReader
              works={flipWorks}
              onSwitchToNormalView={() => switchView("normal")}
            />
          ) : (
            <div className="rounded-2xl border border-line/80 bg-surface/60 p-12 text-center">
              <p className="font-display text-2xl text-ink">No works available for this folio</p>
              <p className="mt-2 font-editorial text-muted">
                Try clearing active filters to read all poems and short stories in the book flip reader.
              </p>
              <button
                type="button"
                onClick={() => switchView("normal")}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 font-sans text-xs font-semibold text-white shadow-xs hover:bg-accent-hover"
              >
                Return to Normal View
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
