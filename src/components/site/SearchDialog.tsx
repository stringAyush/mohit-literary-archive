"use client";

import type { ContentType } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { CloseIcon, SearchIcon } from "@/components/ui/icons";
import { contentTypeLabel } from "@/lib/constants";
import { useModalDialog } from "./useModalDialog";

type Results = {
  works: { slug: string; title: string | null; excerpt: string; contentType: ContentType }[];
  collections: { slug: string; name: string }[];
};

type Status = "idle" | "loading" | "done" | "error";

export function SearchDialog() {
  const router = useRouter();
  const { ref, isOpen, open, close } = useModalDialog();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [results, setResults] = useState<Results>({ works: [], collections: [] });
  const statusId = useId();

  // Keyboard shortcut: "/" opens search (unless the reader is typing in a field).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const typing = target.closest("input, textarea, select, [contenteditable='true']");
      if (event.key === "/" && !typing && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        open();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  // Search as the reader types, waiting briefly so we don't send a request per keystroke.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setStatus("idle");
      setResults({ works: [], collections: [] });
      return;
    }
    const controller = new AbortController();
    setStatus("loading");
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        if (!response.ok) throw new Error(`Search failed: ${response.status}`);
        setResults((await response.json()) as Results);
        setStatus("done");
      } catch (error) {
        if ((error as Error).name !== "AbortError") setStatus("error");
      }
    }, 220);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const q = query.trim();
    close();
    router.push(q ? `/works?q=${encodeURIComponent(q)}` : "/works");
  }

  function clear() {
    setQuery("");
    inputRef.current?.focus();
  }

  const hasResults = results.works.length > 0 || results.collections.length > 0;
  const statusText =
    status === "loading"
      ? "Searching…"
      : status === "error"
        ? "Search is temporarily unavailable."
        : status === "done" && !hasResults
          ? "No writing found. Try a different word."
          : status === "done"
            ? `${results.works.length + results.collections.length} results`
            : "";

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="inline-flex h-11 w-11 items-center justify-center text-ink transition-colors hover:text-accent"
        aria-label="Search the archive"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-keyshortcuts="/"
      >
        <SearchIcon className="h-[1.375rem] w-[1.375rem]" />
      </button>

      <dialog
        ref={ref}
        aria-label="Search the archive"
        className="mx-auto mt-[8vh] mb-auto max-h-[84vh] w-[min(44rem,calc(100vw-2rem))] max-w-none overflow-hidden rounded-xs border hairline bg-surface p-0 text-ink shadow-[0_24px_60px_-30px_rgb(36_34_31/0.45)]"
      >
        <form onSubmit={submit} role="search" className="flex items-center gap-2 border-b hairline px-4 sm:px-6">
          <SearchIcon className="h-5 w-5 shrink-0 text-muted" />
          <label htmlFor="site-search" className="sr-only">
            Search words, titles, and collections
          </label>
          <input
            ref={inputRef}
            id="site-search"
            type="search"
            name="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search words, titles, and collections..."
            autoComplete="off"
            maxLength={100}
            aria-describedby={statusId}
            className="h-16 min-w-0 flex-1 bg-transparent font-editorial text-xl text-ink placeholder:text-muted focus:outline-none sm:text-2xl [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={clear}
              className="inline-flex h-11 shrink-0 items-center px-2 font-sans text-xs uppercase tracking-[0.12em] text-muted hover:text-accent"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={close}
            className="-mr-2 inline-flex h-11 w-11 shrink-0 items-center justify-center text-muted hover:text-accent"
            aria-label="Close search"
          >
            <CloseIcon />
          </button>
        </form>

        <div className="max-h-[calc(84vh-4rem)] overflow-y-auto px-4 py-5 sm:px-6">
          <p id={statusId} role="status" aria-live="polite" className="font-sans text-sm text-muted">
            {status === "idle" ? "Type at least two letters. Press Enter to see everything in the archive." : statusText}
          </p>

          {status === "done" && hasResults && (
            <div className="mt-4 space-y-6">
              {results.works.length > 0 && (
                <section aria-label="Writing">
                  <h2 className="eyebrow mb-2">Writing</h2>
                  <ul className="divide-y divide-line border-y hairline">
                    {results.works.map((work) => (
                      <li key={work.slug}>
                        <Link
                          href={`/works/${work.slug}`}
                          onClick={close}
                          className="block py-3 no-underline transition-colors hover:text-accent"
                        >
                          <span className="eyebrow mr-3 text-[0.6875rem]">{contentTypeLabel(work.contentType)}</span>
                          <span className="font-editorial text-xl">{work.title ?? work.excerpt}</span>
                          {work.title && (
                            <span className="mt-0.5 block truncate font-editorial text-base italic text-muted">
                              {work.excerpt}
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {results.collections.length > 0 && (
                <section aria-label="Collections">
                  <h2 className="eyebrow mb-2">Collections</h2>
                  <ul className="divide-y divide-line border-y hairline">
                    {results.collections.map((collection) => (
                      <li key={collection.slug}>
                        <Link
                          href={`/collections/${collection.slug}`}
                          onClick={close}
                          className="block py-3 font-display text-lg no-underline hover:text-accent"
                        >
                          {collection.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              <Link
                href={`/works?q=${encodeURIComponent(query.trim())}`}
                onClick={close}
                className="text-link inline-block font-sans text-sm"
              >
                See all results in the archive
              </Link>
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}
