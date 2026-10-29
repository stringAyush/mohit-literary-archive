"use client";

import { usePathname, useRouter } from "next/navigation";
import { useRef, useTransition } from "react";
import { SearchIcon } from "@/components/ui/icons";

type Option = { value: string; label: string };

type Props = {
  values: { q: string; type: string; collection: string; theme: string; lang: string; sort: string };
  types: Option[];
  collections: Option[];
  themes: Option[];
  languages: Option[];
};

/**
 * A plain GET form: it works without JavaScript, and the URL always describes the
 * current results (so they can be bookmarked and shared). With JavaScript, choosing
 * a filter updates the results immediately.
 */
export function ArchiveFilters({ values, types, collections, themes, languages }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  function navigate(form: HTMLFormElement) {
    const data = new FormData(form);
    const params = new URLSearchParams();
    for (const [key, value] of data.entries()) {
      const text = String(value).trim();
      if (text && !(key === "sort" && text === "newest")) params.set(key, text);
    }
    const query = params.toString();
    startTransition(() => router.push(query ? `${pathname}?${query}` : pathname, { scroll: false }));
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate(event.currentTarget);
  }

  function onSelectChange() {
    if (formRef.current) navigate(formRef.current);
  }

  function clearSearch() {
    if (!formRef.current) return;
    const input = formRef.current.elements.namedItem("q") as HTMLInputElement | null;
    if (input) input.value = "";
    navigate(formRef.current);
  }

  const select = (name: string, label: string, options: Option[], value: string, allLabel: string) => (
    <div className="min-w-0">
      <label htmlFor={`filter-${name}`} className="eyebrow mb-2 block text-[0.6875rem]">
        {label}
      </label>
      <select
        id={`filter-${name}`}
        name={name}
        defaultValue={value}
        onChange={onSelectChange}
        className="input text-sm"
      >
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <form
      ref={formRef}
      role="search"
      action={pathname}
      method="get"
      onSubmit={onSubmit}
      aria-busy={isPending}
      className="border-y hairline py-6"
    >
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <label htmlFor="archive-q" className="sr-only">
            Search words, titles, and collections
          </label>
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
          <input
            id="archive-q"
            name="q"
            type="search"
            defaultValue={values.q}
            maxLength={100}
            placeholder="Search words, titles, and collections..."
            className="input h-12 pl-10 font-editorial text-xl [&::-webkit-search-cancel-button]:hidden"
          />
          {values.q && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-1 top-1/2 inline-flex h-11 -translate-y-1/2 items-center px-3 font-sans text-xs uppercase tracking-[0.12em] text-muted hover:text-accent"
            >
              Clear
            </button>
          )}
        </div>
        <button type="submit" className="btn btn-primary h-12">
          Search
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {select("type", "Form", types, values.type, "All forms")}
        {select("collection", "Collection", collections, values.collection, "All collections")}
        {select("theme", "Theme", themes, values.theme, "All themes")}
        {select("lang", "Language", languages, values.lang, "All languages")}
        <div className="min-w-0">
          <label htmlFor="filter-sort" className="eyebrow mb-2 block text-[0.6875rem]">
            Order
          </label>
          <select
            id="filter-sort"
            name="sort"
            defaultValue={values.sort || "newest"}
            onChange={onSelectChange}
            className="input text-sm"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
      </div>

      <p role="status" aria-live="polite" className="mt-3 min-h-5 font-sans text-xs text-muted">
        {isPending ? "Updating results…" : ""}
      </p>
    </form>
  );
}
