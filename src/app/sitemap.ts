import type { MetadataRoute } from "next";
import { absolutePublicUrl } from "@/lib/site";
import { getSitemapEntries } from "@/lib/works/queries";

export const dynamic = "force-dynamic";

// Lists only public pages: published works and public collections. Drafts, scheduled,
// archived and unapproved works never appear because they come from the same public query.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { works, collections } = await getSitemapEntries();
  const staticPages = ["/", "/works", "/collections", "/about", "/copyright", "/contact"].map((path) => ({
    url: absolutePublicUrl(path),
  }));
  return [
    ...staticPages,
    ...works.map((work) => ({ url: absolutePublicUrl(`/works/${work.slug}`), lastModified: work.updatedAt })),
    ...collections.map((c) => ({ url: absolutePublicUrl(`/collections/${c.slug}`), lastModified: c.updatedAt })),
  ];
}
