"use server";

import { getArchivePage, type ArchiveFilters, type WorkListItem } from "@/lib/works/queries";

export type FetchMoreWorksResult = {
  items: WorkListItem[];
  page: number;
  pageCount: number;
  total: number;
  hasMore: boolean;
};

export async function fetchMoreWorksAction(
  filters: ArchiveFilters
): Promise<FetchMoreWorksResult> {
  const result = await getArchivePage(filters);
  return {
    items: result.items,
    page: result.page,
    pageCount: result.pageCount,
    total: result.total,
    hasMore: result.page < result.pageCount,
  };
}
