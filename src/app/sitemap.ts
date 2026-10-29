import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { absolutePublicUrl } from "@/lib/site";
import { getSitemapEntries } from "@/lib/works/queries";

export const dynamic = "force-dynamic";

// Lists only public pages: published works, public collections, and published bookstagram posts.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ works, collections }, photos] = await Promise.all([
    getSitemapEntries(),
    db.photoPost.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const staticPages = ["/", "/works", "/bookstagram", "/collections", "/about", "/copyright", "/contact"].map((path) => ({
    url: absolutePublicUrl(path),
  }));

  return [
    ...staticPages,
    ...works.map((work) => ({ url: absolutePublicUrl(`/works/${work.slug}`), lastModified: work.updatedAt })),
    ...collections.map((c) => ({ url: absolutePublicUrl(`/collections/${c.slug}`), lastModified: c.updatedAt })),
    ...photos.map((p) => ({ url: absolutePublicUrl(`/bookstagram/${p.slug}`), lastModified: p.updatedAt })),
  ];
}
