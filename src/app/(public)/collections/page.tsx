import type { Metadata } from "next";
import { CollectionGrid } from "@/components/collections/CollectionPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { FadeIn } from "@/components/ui/MotionWrapper";
import { BackButton } from "@/components/ui/BackButton";
import { getPublicCollections } from "@/lib/works/queries";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Collections",
  description: "Writing gathered by feeling and theme.",
  alternates: { canonical: "/collections" },
};

export default async function CollectionsPage() {
  const collections = await getPublicCollections();
  return (
    <div className="page-container pb-16 pt-12 lg:pb-24 lg:pt-20">
      <div className="mb-6">
        <BackButton fallbackHref="/" label="Back to home" />
      </div>
      <FadeIn>
        <header className="max-w-3xl">
          <p className="eyebrow">Curated groupings</p>
          <h1 className="mt-4 font-display text-[clamp(2.5rem,5vw,4rem)] leading-[1.05] tracking-[-0.015em]">
            Collections
          </h1>
          <p className="mt-5 font-editorial text-[1.5rem] leading-snug text-ink/80">
            Pieces gathered by feeling, season and theme — another way into the archive.
          </p>
        </header>
      </FadeIn>
      <div className="mt-12 lg:mt-16">
        {collections.length > 0 ? (
          <CollectionGrid collections={collections} />
        ) : (
          <EmptyState
            title="No collections yet."
            message="Collections will appear here once they contain published writing."
            action={{ label: "Browse the archive", href: "/works" }}
          />
        )}
      </div>
    </div>
  );
}
