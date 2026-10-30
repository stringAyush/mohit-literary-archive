import type { ContentType } from "@prisma/client";
import { contentTypeFromParam, contentTypeParam, LANGUAGE_CODES } from "@/lib/constants";
import type { ArchiveSort } from "./queries";
import { SLUG_PATTERN } from "./slug";

export type RawSearchParams = Record<string, string | string[] | undefined>;

export type ArchiveParams = {
  q: string;
  type: ContentType | null;
  collection: string | null;
  language: string | null;
  sort: ArchiveSort;
  page: number;
};

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/** Reads the archive's URL query, ignoring anything invalid rather than failing. */
export function parseArchiveParams(raw: RawSearchParams): ArchiveParams {
  const q = first(raw.q).trim().slice(0, 100);
  const collection = first(raw.collection).trim();
  const language = first(raw.lang).trim();
  const page = Number.parseInt(first(raw.page), 10);
  return {
    q,
    type: contentTypeFromParam(first(raw.type)),
    collection: SLUG_PATTERN.test(collection) ? collection : null,
    language: (LANGUAGE_CODES as readonly string[]).includes(language) ? language : null,
    sort: first(raw.sort) === "oldest" ? "oldest" : "newest",
    page: Number.isFinite(page) && page > 0 ? Math.min(page, 10_000) : 1,
  };
}

/** The same parameters as URL query values (empty ones left out). */
export function archiveParamsToQuery(params: ArchiveParams): Record<string, string | undefined> {
  return {
    q: params.q || undefined,
    type: params.type ? contentTypeParam(params.type) : undefined,
    collection: params.collection ?? undefined,
    lang: params.language ?? undefined,
    sort: params.sort === "oldest" ? "oldest" : undefined,
    page: params.page > 1 ? String(params.page) : undefined,
  };
}

export function hasActiveFilters(params: ArchiveParams): boolean {
  return Boolean(params.q || params.type || params.collection || params.language);
}
