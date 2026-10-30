"use client";

import { usePathname, useRouter } from "next/navigation";
import { useRef, useTransition } from "react";
import { Search, X, SlidersHorizontal, Globe } from "lucide-react";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Option = { value: string; label: string; hindiLabel?: string };

type Props = {
  values: { q: string; type: string; collection: string; lang: string; sort: string };
  types: Option[];
  collections: Option[];
  languages: Option[];
};

export function ArchiveFilters({ values, types, collections, languages }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  const isHindi = values.lang === "hi";

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

  function setLanguageTab(langCode: string) {
    if (!formRef.current) return;
    const langSelect = formRef.current.elements.namedItem("lang") as HTMLSelectElement | null;
    if (langSelect) {
      langSelect.value = langCode;
    }
    navigate(formRef.current);
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
    values.type && {
      key: "type",
      label: `${isHindi ? "विधा" : "Category"}: ${
        (isHindi ? types.find((t) => t.value === values.type)?.hindiLabel : null) ??
        types.find((t) => t.value === values.type)?.label ??
        values.type
      }`,
    },
    values.collection && {
      key: "collection",
      label: `Collection: ${collections.find((c) => c.value === values.collection)?.label ?? values.collection}`,
    },
    values.lang && {
      key: "lang",
      label: `Language: ${languages.find((l) => l.value === values.lang)?.label ?? values.lang}`,
    },
    values.sort && values.sort !== "newest" && { key: "sort", label: "Order: Oldest first" },
  ].filter(Boolean) as { key: string; label: string }[];

  const languageTabs = [
    { code: "", label: "All Languages", hindiLabel: "सभी भाषाएँ" },
    { code: "hi", label: "हिंदी (Hindi)", hindiLabel: "हिंदी" },
    { code: "en", label: "English", hindiLabel: "English" },
    { code: "hi-Latn", label: "Hinglish / Mixed", hindiLabel: "Hinglish / मिश्रित" },
  ];

  return (
    <form
      ref={formRef}
      role="search"
      action={pathname}
      method="get"
      onSubmit={onSubmit}
      aria-busy={isPending}
      className="rounded-2xl border border-ink/10 bg-surface/75 p-5 shadow-[0_8px_30px_rgb(20,19,18,0.04)] backdrop-blur-md ring-1 ring-white/60 sm:p-6"
    >
      {/* ─── Language Section Tabs ─── */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b hairline pb-4">
        <div className="flex items-center gap-1.5 font-sans text-xs font-semibold uppercase tracking-wider text-muted">
          <Globe className="h-3.5 w-3.5 text-ink" />
          <span>Language Section:</span>
        </div>
        <div className="inline-flex rounded-xl bg-ink/5 p-1">
          {languageTabs.map((tab) => {
            const isActive = values.lang === tab.code;
            return (
              <button
                key={tab.code}
                type="button"
                onClick={() => setLanguageTab(tab.code)}
                className={`rounded-lg px-3 py-1.5 font-sans text-xs font-medium transition-all ${
                  isActive
                    ? "bg-accent text-white font-medium shadow-xs"
                    : "text-muted hover:text-ink"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Search Bar ─── */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Input
            id="archive-q"
            name="q"
            type="search"
            defaultValue={values.q}
            maxLength={100}
            placeholder={
              isHindi
                ? "शीर्षक, शब्द, पंक्तियाँ या संग्रह खोजें..."
                : "Search words, titles, thoughts, or collections..."
            }
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
          {isHindi ? "खोजें" : "Search"}
        </Button>
      </div>

      {/* ─── Filter Controls (Theme filter completely removed) ─── */}
      <div className="mt-5 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        {/* Literary Category / Form */}
        <Select
          id="filter-type"
          name="type"
          label={isHindi ? "साहित्यिक विधा" : "Category"}
          defaultValue={values.type}
          onChange={onSelectChange}
        >
          <option value="">{isHindi ? "सभी विधाएँ" : "All categories"}</option>
          {types.map((option) => (
            <option key={option.value} value={option.value}>
              {isHindi && option.hindiLabel ? option.hindiLabel : option.label}
            </option>
          ))}
        </Select>

        {/* Collection */}
        <Select
          id="filter-collection"
          name="collection"
          label={isHindi ? "संग्रह" : "Collection"}
          defaultValue={values.collection}
          onChange={onSelectChange}
        >
          <option value="">{isHindi ? "सभी संग्रह" : "All collections"}</option>
          {collections.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        {/* Language dropdown */}
        <Select
          id="filter-lang"
          name="lang"
          label={isHindi ? "भाषा" : "Language"}
          defaultValue={values.lang}
          onChange={onSelectChange}
        >
          <option value="">{isHindi ? "सभी भाषाएँ" : "All languages"}</option>
          {languages.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        {/* Sort Order */}
        <Select
          id="filter-sort"
          name="sort"
          label={isHindi ? "क्रम" : "Order"}
          defaultValue={values.sort || "newest"}
          onChange={onSelectChange}
        >
          <option value="newest">{isHindi ? "नवीनतम पहले" : "Newest first"}</option>
          <option value="oldest">{isHindi ? "पुरातन पहले" : "Oldest first"}</option>
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
              <Badge variant="secondary" className="cursor-pointer gap-1.5 transition-transform group-hover:scale-[1.02] hover:border-ink/40">
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
