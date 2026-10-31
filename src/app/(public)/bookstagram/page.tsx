import type { Metadata } from "next";
import { CategoryFilter } from "@/components/bookstagram/CategoryFilter";
import { PhotoGrid } from "@/components/bookstagram/PhotoGrid";
import { FadeIn } from "@/components/ui/MotionWrapper";
import { getPhotoCategories, getPublicPhotoPosts } from "@/lib/bookstagram/queries";

export const revalidate = 60;

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
      <FadeIn>
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
      </FadeIn>

      {/* Photography Grid */}
      <main>
        <PhotoGrid posts={posts} />
      </main>

      {/* Editorial Note / Footer Insight */}
      <FadeIn delay={0.1}>
        <aside className="mt-20 rounded-2xl border border-ink/10 bg-surface/70 backdrop-blur-md p-8 sm:p-10 text-center ring-1 ring-white/60 shadow-[0_8px_32px_0_rgba(20,19,18,0.04)]">
          <p className="eyebrow mb-2">Original Photography</p>
          <h2 className="font-display text-2xl sm:text-3xl text-ink">Curated &amp; Composed by the Author</h2>
          <p className="mx-auto mt-3 max-w-xl font-sans text-sm text-muted leading-relaxed">
            All photographs in this gallery are original works composed and photographed by Mohit Yenugwar.
            Images may not be reproduced or republished without prior written permission.
          </p>
        </aside>
      </FadeIn>
    </div>
  );
}
