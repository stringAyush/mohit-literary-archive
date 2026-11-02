"use client";

import { LazyImage } from "@/components/ui/LazyImage";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Layers, Maximize2 } from "lucide-react";
import { InstagramIcon } from "@/components/ui/icons";
import { type PhotoPostData } from "@/lib/bookstagram/types";

type Props = {
  post: PhotoPostData;
  onOpenLightbox: () => void;
  priority?: boolean;
};

export function PhotoCard({ post, onOpenLightbox, priority = false }: Props) {
  const mainImage = post.images[0];
  if (!mainImage) return null;

  const aspectRatio =
    mainImage.width && mainImage.height ? mainImage.width / mainImage.height : 1.4;

  return (
    <article className="group relative block w-full">
      {/* ─── Framed Photograph (Pinterest Pin Style) ─── */}
      <div className="relative overflow-hidden rounded-2xl bg-paper ring-1 ring-line/70 shadow-xs transition-all duration-300 ease-out group-hover:-translate-y-0.5 group-hover:shadow-xl group-hover:shadow-ink/10 group-hover:ring-ink/20">
        <div
          className="relative w-full cursor-pointer overflow-hidden"
          style={{ aspectRatio: `${aspectRatio}` }}
          onClick={onOpenLightbox}
        >
          <LazyImage
            src={mainImage.url}
            alt={mainImage.altText || post.title}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
            priority={priority}
          />

          {/* Translucent hover scrim */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Top Bar: Clean corner action */}
          <div className="absolute top-2.5 sm:top-3 right-2.5 sm:right-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Link
              href={`/bookstagram/${post.slug}`}
              onClick={(e) => e.stopPropagation()}
              className="pointer-events-auto inline-flex items-center gap-1 rounded-md bg-accent px-2.5 py-1 font-sans text-xs font-medium text-white shadow-sm backdrop-blur-xs transition-all hover:bg-accent-hover"
              aria-label={`View ${post.title}`}
            >
              <span>View</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Bottom Bar: Multi-photo count & Lightbox Expand */}
          <div className="absolute bottom-2.5 sm:bottom-3 inset-x-2.5 sm:inset-x-3 flex items-end justify-between gap-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {post.images.length > 1 ? (
              <span className="inline-flex items-center gap-1 rounded bg-black/70 px-2 py-0.5 font-sans text-[11px] font-medium text-white backdrop-blur-md">
                <Layers className="h-3 w-3" />
                <span>{post.images.length} photos</span>
              </span>
            ) : (
              <span />
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenLightbox();
              }}
              className="pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-md bg-black/70 text-white shadow-sm backdrop-blur-md transition-all hover:bg-black/90 hover:scale-105 active:scale-95"
              aria-label="Expand in lightbox"
              title="Expand in lightbox"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Placement / Metadata (Editorial Photo Details) ─── */}
      <div className="pt-3 pb-1 px-1">
        {/* Book Title & Category */}
        <div className="flex flex-wrap items-center gap-2 font-sans text-[11px] font-medium text-muted">
          {post.category && (
            <span className="rounded-xs bg-ink/5 px-1.5 py-0.5 text-[10px] uppercase tracking-wider font-semibold text-ink">
              {post.category}
            </span>
          )}
          {post.bookTitle && (
            <div className="flex items-center gap-1 truncate font-semibold uppercase tracking-wider text-ink/80">
              <BookOpen className="h-3 w-3 shrink-0" />
              <span className="truncate">{post.bookTitle}</span>
              {post.bookAuthor && (
                <span className="font-normal text-muted normal-case tracking-normal truncate">
                  · {post.bookAuthor}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Post Title */}
        <h3 className="mt-1.5 font-display text-lg font-normal leading-snug text-ink transition-colors hover:underline decoration-accent decoration-2">
          <Link href={`/bookstagram/${post.slug}`} className="no-underline">
            {post.title}
          </Link>
        </h3>

        {/* Caption snippet if bookTitle was not present */}
        {post.caption && !post.bookTitle && (
          <p className="mt-1 font-sans text-xs text-muted line-clamp-2 leading-relaxed">
            {post.caption}
          </p>
        )}

        {/* Editorial Signature Row */}
        <div className="mt-2.5 flex items-center justify-between font-sans text-xs text-muted border-t hairline pt-2">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
            <span className="text-[11px] font-medium text-muted">Folio Photograph</span>
          </div>

          {post.instagramUrl && (
            <a
              href={post.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-ink transition-colors"
              aria-label="View on Instagram"
              title="View on Instagram"
            >
              <InstagramIcon className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
