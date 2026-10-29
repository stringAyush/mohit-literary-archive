"use client";

import Image from "next/image";
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
          <Image
            src={mainImage.url}
            alt={mainImage.altText || post.title}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            loading={priority ? "eager" : "lazy"}
            priority={priority}
          />

          {/* Pinterest-style translucent hover scrim */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          {/* Top Bar on Hover: Category (left) + View Pill (right) */}
          <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2 pointer-events-none">
            {post.category ? (
              <span className="rounded-full bg-black/55 px-2.5 py-1 font-sans text-[11px] font-medium text-white shadow-xs backdrop-blur-md">
                {post.category}
              </span>
            ) : (
              <span />
            )}

            <Link
              href={`/bookstagram/${post.slug}`}
              onClick={(e) => e.stopPropagation()}
              className="pointer-events-auto flex items-center gap-1 rounded-full bg-accent px-3 py-1 font-sans text-xs font-semibold text-white shadow-md backdrop-blur-xs transition-all hover:bg-accent/90 hover:scale-105 active:scale-95 no-underline"
              aria-label={`View ${post.title}`}
            >
              <span>View</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Bottom Bar on Hover: Multi-photo indicator + Quick Lightbox Expand */}
          <div className="absolute bottom-3 inset-x-3 flex items-end justify-between gap-2 pointer-events-none">
            {post.images.length > 1 ? (
              <span className="flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 font-sans text-[11px] font-medium text-white backdrop-blur-md">
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
              className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-ink shadow-md backdrop-blur-sm transition-all hover:bg-white hover:scale-110 active:scale-95"
              aria-label="Expand in lightbox"
              title="Expand in lightbox"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Placement / Metadata (Pinterest Pin Details) ─── */}
      <div className="pt-3 pb-1 px-1">
        {/* Book Title & Author Tagline */}
        {post.bookTitle && (
          <div className="flex items-center gap-1.5 font-sans text-[11px] font-semibold uppercase tracking-wider text-accent truncate">
            <BookOpen className="h-3 w-3 shrink-0" />
            <span className="truncate">{post.bookTitle}</span>
            {post.bookAuthor && (
              <span className="font-normal text-muted normal-case tracking-normal truncate">
                · {post.bookAuthor}
              </span>
            )}
          </div>
        )}

        {/* Post Title */}
        <h3 className="mt-1 font-display text-base font-semibold leading-snug text-ink transition-colors group-hover:text-accent">
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

        {/* Pinterest-style Curator / Photographer Row */}
        <div className="mt-2 flex items-center justify-between font-sans text-xs text-muted">
          <div className="flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/15 font-sans text-[9px] font-bold text-accent">
              MK
            </span>
            <span className="text-[11px] font-medium text-ink/80">Mohit Kaushik</span>
          </div>

          {post.instagramUrl && (
            <a
              href={post.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-accent transition-colors"
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
