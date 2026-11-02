import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArtworkStudio } from "@/components/artwork/ArtworkStudio";
import { BackButton } from "@/components/ui/BackButton";
import { contentTypeLabel } from "@/lib/constants";
import { yearOf } from "@/lib/format";
import { getPublicWorkBySlug } from "@/lib/works/queries";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export const metadata: Metadata = {
  title: "Quote artwork",
  robots: { index: false, follow: true },
};

export default async function ArtworkPage({ params }: Props) {
  const { slug } = await params;
  const work = await getPublicWorkBySlug(slug);
  if (!work) notFound();

  const year = yearOf(work.originalPublishedAt) ?? yearOf(work.composedOn) ?? yearOf(work.firstPublishedAt) ?? new Date().getFullYear();

  return (
    <div className="page-container pb-16 pt-8 lg:pb-24 lg:pt-12">
      <div className="mb-4">
        <BackButton fallbackHref={`/works/${work.slug}`} label="Back to piece" />
      </div>
      <nav aria-label="Breadcrumb" className="font-sans text-[0.8125rem] text-muted">
        <ol className="flex flex-wrap gap-x-2">
          <li>
            <Link href="/works" className="hover:text-accent">
              The Archive
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={`/works/${work.slug}`} className="hover:text-accent">
              {work.title ?? "This piece"}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-ink">
            Artwork
          </li>
        </ol>
      </nav>
      <header className="mb-10 mt-10 max-w-2xl lg:mb-14">
        <h1 className="font-display text-[clamp(2.25rem,4.5vw,3.25rem)] leading-[1.1]">Quote artwork</h1>
        <p className="mt-4 font-sans text-[0.9375rem] text-ink/80">
          Make an image of this piece to share. The full text is always included — nothing is cropped — and the
          writer&apos;s name stays on every image.
        </p>
      </header>
      <ArtworkStudio
        slug={work.slug}
        body={work.body}
        title={work.title}
        author={work.author.displayName}
        label={contentTypeLabel(work.contentType)}
        url={`mohityenugwar.com/works/${work.slug}`}
        copyright={`© ${year} ${work.author.displayName}`}
        isPoem={work.contentType === "POEM"}
      />
      <p className="mt-12 font-sans text-sm">
        <Link href={`/works/${work.slug}`} className="text-link">
          ← Back to the piece
        </Link>
      </p>
    </div>
  );
}
