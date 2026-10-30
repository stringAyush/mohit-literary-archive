import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { CategoryFilter } from "@/components/bookstagram/CategoryFilter";
import { PhotoGrid } from "@/components/bookstagram/PhotoGrid";
import { getPhotoCategories, getPublicPhotoPosts } from "@/lib/bookstagram/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Book Photography — Bookstagram",
  description: "A curated literary photography gallery of book covers, reading setups, bookshelves, and reading moments by Mohit Yenugwar.",
};

type Props = {
  searchParams: Promise<{ category?: string }>;
};

export default async function BookstagramPage({ searchParams }: Props) {
  const { category } = await searchParams;
  const [posts, categories] = await Promise.all([
    getPublicPhotoPosts({ category }),
    getPhotoCategories(),
  ]);

  const totalPhotos = categories.reduce((sum, c) => sum + c.count, 0);

  return (
    <div className="page-container py-12 lg:py-20">
      {/* Editorial Header */}
      <header className="mb-12 max-w-3xl">
        <div className="flex items-center justify-between gap-4 mb-4">
          <p className="eyebrow">Book Photography</p>
          <span className="font-sans text-xs text-muted">
            {posts.length} {posts.length === 1 ? "frame" : "frames"}
          </span>
        </div>

        <h1 className="font-display text-[clamp(2.5rem,5.5vw,4.5rem)] leading-[1.05] tracking-[-0.02em] text-ink">
          Through the reader&apos;s lens.
        </h1>
        <p className="mt-6 font-editorial text-xl sm:text-2xl leading-relaxed text-ink/80 text-balance">
          Book covers, natural outdoor reading setups, and quiet literary details captured in natural light.
        </p>
      </header>

      {/* Filter Navigation */}
      <div className="mb-10 border-b hairline pb-6">
        <CategoryFilter categories={categories} totalCount={totalPhotos} />
      </div>

      {/* Photography Grid */}
      <main>
        <PhotoGrid posts={posts} />
      </main>

      {/* Editorial Note / Footer Insight */}
      <aside className="mt-20 rounded-2xl border hairline bg-surface/70 p-8 sm:p-10 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent mb-3">
          <Sparkles className="h-4 w-4" />
        </div>
        <h2 className="font-display text-xl sm:text-2xl text-ink">Original Photography</h2>
        <p className="mx-auto mt-2 max-w-xl font-sans text-sm text-muted">
          All photographs in this gallery are original works composed and photographed by Mohit Yenugwar.
          Images may not be reproduced or republished without prior written permission.
        </p>
      </aside>
    </div>
  );
}
