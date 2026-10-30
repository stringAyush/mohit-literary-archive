import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, Calendar, ExternalLink, Tag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { InstagramIcon } from "@/components/ui/icons";
import { getAdjacentPhotoPosts, getPhotoPostBySlug } from "@/lib/bookstagram/queries";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPhotoPostBySlug(slug);
  if (!post) return { title: "Photograph Not Found" };

  return {
    title: `${post.title} — Book Photography`,
    description: post.caption || `Book photography of ${post.bookTitle || post.title} by Mohit Yenugwar.`,
    openGraph: {
      title: `${post.title} — Mohit Yenugwar`,
      description: post.caption || undefined,
      images: post.images[0] ? [{ url: post.images[0].url }] : [],
    },
  };
}

export default async function PhotoPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPhotoPostBySlug(slug);
  if (!post) notFound();

  const { previous, next } = await getAdjacentPhotoPosts(post.id);

  return (
    <div className="page-container py-10 lg:py-16">
      {/* Back link */}
      <nav aria-label="Breadcrumb" className="mb-8">
        <Link
          href="/bookstagram"
          className="inline-flex items-center gap-2 font-sans text-xs text-muted hover:text-accent transition-colors no-underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Book Photography gallery</span>
        </Link>
      </nav>

      {/* Main Grid: Images & Metadata */}
      <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-14">
        {/* Images Column */}
        <div className="space-y-6">
          {post.images.map((img, idx) => (
            <figure
              key={img.id || idx}
              className="overflow-hidden rounded-2xl border border-line/70 bg-surface shadow-sm"
            >
              <div
                className="relative w-full bg-paper"
                style={{
                  aspectRatio: img.width && img.height ? `${img.width} / ${img.height}` : "1.4",
                }}
              >
                <Image
                  src={img.url}
                  alt={img.altText || post.title}
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  priority={idx === 0}
                />
              </div>
              {img.caption && (
                <figcaption className="border-t hairline px-5 py-3 font-sans text-xs text-muted">
                  {img.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>

        {/* Metadata Sidebar */}
        <aside className="space-y-6">
          <Card className="p-6 sm:p-8 border border-line/80 bg-surface/90">
            {post.category && (
              <p className="eyebrow mb-3 text-accent font-semibold">{post.category}</p>
            )}

            <h1 className="font-display text-2xl sm:text-3xl leading-snug text-ink font-semibold">
              {post.title}
            </h1>

            {post.bookTitle && (
              <div className="mt-3 flex items-start gap-2 text-sm text-ink font-medium">
                <BookOpen className="h-4 w-4 shrink-0 text-accent mt-0.5" />
                <div>
                  <p>{post.bookTitle}</p>
                  {post.bookAuthor && (
                    <p className="font-sans text-xs text-muted mt-0.5">by {post.bookAuthor}</p>
                  )}
                  {post.publisher && (
                    <p className="font-sans text-xs text-muted">Publisher: {post.publisher}</p>
                  )}
                </div>
              </div>
            )}

            {post.caption && (
              <div className="mt-6 border-t hairline pt-6">
                <h2 className="font-sans text-xs uppercase tracking-wider text-muted mb-2 font-semibold">
                  About this frame
                </h2>
                <p className="font-editorial text-lg leading-relaxed text-ink/90 whitespace-pre-line">
                  {post.caption}
                </p>
              </div>
            )}

            <dl className="mt-6 border-t hairline pt-6 space-y-3 font-sans text-xs">
              <div className="flex justify-between">
                <dt className="text-muted">Photographer</dt>
                <dd className="font-medium text-ink">Mohit Yenugwar</dd>
              </div>

              {post.photographyDate && (
                <div className="flex justify-between">
                  <dt className="text-muted flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Captured on</span>
                  </dt>
                  <dd className="text-ink">{formatDate(post.photographyDate)}</dd>
                </div>
              )}

              {post.instagramUrl && (
                <div className="flex justify-between pt-2">
                  <dt className="text-muted">Instagram</dt>
                  <dd>
                    <a
                      href={post.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-accent hover:underline font-medium"
                    >
                      <InstagramIcon className="h-3.5 w-3.5" />
                      <span>View post</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </dd>
                </div>
              )}
            </dl>

            {post.tags && post.tags.length > 0 && (
              <div className="mt-6 border-t hairline pt-6">
                <h3 className="font-sans text-xs uppercase tracking-wider text-muted mb-3 font-semibold">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-xs border border-line bg-paper px-2.5 py-1 font-sans text-[11px] text-muted"
                    >
                      <Tag className="h-2.5 w-2.5 text-accent" />
                      <span>{tag}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </aside>
      </div>

      {/* Prev / Next Navigation */}
      <footer className="mt-16 border-t hairline pt-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 font-sans text-sm">
          {previous ? (
            <Link
              href={`/bookstagram/${previous.slug}`}
              className="inline-flex items-center gap-2 text-ink hover:text-accent transition-colors no-underline"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>
                <span className="block text-xs text-muted uppercase">Previous frame</span>
                <span className="font-medium font-display">{previous.title}</span>
              </span>
            </Link>
          ) : (
            <div />
          )}

          {next ? (
            <Link
              href={`/bookstagram/${next.slug}`}
              className="inline-flex items-center gap-2 text-right text-ink hover:text-accent transition-colors no-underline"
            >
              <span>
                <span className="block text-xs text-muted uppercase">Next frame</span>
                <span className="font-medium font-display">{next.title}</span>
              </span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <div />
          )}
        </div>
      </footer>
    </div>
  );
}
