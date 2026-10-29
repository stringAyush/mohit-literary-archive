"use client";

import { usePathname, useRouter } from "next/navigation";
import { useRef, useTransition } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Option = { value: string; label: string };

type Props = {
  values: { q: string; type: string; collection: string; theme: string; lang: string; sort: string };
  types: Option[];
  collections: Option[];
  themes: Option[];
  languages: Option[];
};

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

  function removeFilter(key: string) {
    if (!formRef.current) return;
    const element = formRef.current.elements.namedItem(key) as HTMLSelectElement | HTMLInputElement | null;
    if (element) {
      element.value = "";
      navigate(formRef.current);
    }
  }

  const activeFilters = [
    values.type && { key: "type", label: `Form: ${types.find((t) => t.value === values.type)?.label ?? values.type}` },
    values.collection && { key: "collection", label: `Collection: ${collections.find((c) => c.value === values.collection)?.label ?? values.collection}` },
    values.theme && { key: "theme", label: `Theme: ${themes.find((t) => t.value === values.theme)?.label ?? values.theme}` },
    values.lang && { key: "lang", label: `Language: ${languages.find((l) => l.value === values.lang)?.label ?? values.lang}` },
    values.sort && values.sort !== "newest" && { key: "sort", label: "Order: Oldest first" },
  ].filter(Boolean) as { key: string; label: string }[];

  return (
    <form
      ref={formRef}
      role="search"
      action={pathname}
      method="get"
      onSubmit={onSubmit}
      aria-busy={isPending}
      className="rounded-2xl border border-line/70 bg-surface/85 p-5 shadow-xs backdrop-blur-md sm:p-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Input
            id="archive-q"
            name="q"
            type="search"
            defaultValue={values.q}
            maxLength={100}
            placeholder="Search words, titles, thoughts, or collections..."
            icon={<Search className="h-4 w-4" />}
            className="h-12 rounded-xl text-base"
          />
          {values.q && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-md px-2 py-1 font-sans text-xs font-medium text-muted transition-colors hover:bg-ink/5 hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
        <Button type="submit" size="lg" className="h-12 rounded-xl px-7 text-sm font-semibold">
          Search
        </Button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
        <Select
          id="filter-type"
          name="type"
          label="Form"
          defaultValue={values.type}
          onChange={onSelectChange}
        >
          <option value="">All forms</option>
          {types.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        <Select
          id="filter-collection"
          name="collection"
          label="Collection"
          defaultValue={values.collection}
          onChange={onSelectChange}
        >
          <option value="">All collections</option>
          {collections.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        <Select
          id="filter-theme"
          name="theme"
          label="Theme"
          defaultValue={values.theme}
          onChange={onSelectChange}
        >
          <option value="">All themes</option>
          {themes.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        <Select
          id="filter-lang"
          name="lang"
          label="Language"
          defaultValue={values.lang}
          onChange={onSelectChange}
        >
          <option value="">All languages</option>
          {languages.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        <Select
          id="filter-sort"
          name="sort"
          label="Order"
          defaultValue={values.sort || "newest"}
          onChange={onSelectChange}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </Select>
      </div>

      {/* Active filter badges */}
      {activeFilters.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t hairline pt-3">
          <span className="flex items-center gap-1 font-sans text-xs font-medium text-muted">
            <SlidersHorizontal className="h-3 w-3" /> Filters:
          </span>
          {activeFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => removeFilter(filter.key)}
              className="group inline-flex items-center"
            >
              <Badge variant="accent" className="cursor-pointer gap-1.5 transition-transform group-hover:scale-[1.02]">
                {filter.label}
                <X className="h-3 w-3 opacity-70 group-hover:opacity-100" />
              </Badge>
            </button>
          ))}
        </div>
      )}

      <p role="status" aria-live="polite" className="mt-2.5 min-h-4 font-sans text-xs text-muted">
        {isPending ? "Updating archive results…" : ""}
      </p>
    </form>
  );
}
