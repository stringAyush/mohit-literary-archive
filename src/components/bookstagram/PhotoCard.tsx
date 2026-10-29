"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpen, Maximize2 } from "lucide-react";
import { type PhotoPostData } from "@/lib/bookstagram/types";

type Props = {
  post: PhotoPostData;
  onOpenLightbox: () => void;
};

export function PhotoCard({ post, onOpenLightbox }: Props) {
  const mainImage = post.images[0];
  if (!mainImage) return null;

  const aspectRatio =
    mainImage.width && mainImage.height ? mainImage.width / mainImage.height : 1.4;

  return (
    <article className="group relative break-inside-avoid overflow-hidden rounded-xl border border-line/70 bg-surface shadow-xs transition-all duration-300 hover:border-ink/30 hover:shadow-md">
      {/* Photo Container */}
      <div
        className="relative cursor-pointer overflow-hidden bg-paper"
        style={{ aspectRatio: `${aspectRatio}` }}
        onClick={onOpenLightbox}
      >
        <Image
          src={mainImage.url}
          alt={mainImage.altText || post.title}
          fill
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          loading="lazy"
        />

        {/* Hover overlay with quick open icon */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 backdrop-blur-[1px] transition-opacity duration-300 group-hover:opacity-100">
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-surface/90 text-ink shadow-lg transition-transform hover:scale-110"
            aria-label="Expand image"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>

        {/* Multi-image indicator */}
        {post.images.length > 1 && (
          <div className="absolute top-3 right-3 rounded-md bg-black/60 px-2 py-0.5 font-sans text-[11px] font-medium text-white backdrop-blur-xs">
            +{post.images.length - 1} more
          </div>
        )}

        {/* Category tag */}
        {post.category && (
          <div className="absolute top-3 left-3 rounded-md bg-surface/90 px-2.5 py-1 font-sans text-[11px] font-medium text-ink shadow-xs backdrop-blur-xs">
            {post.category}
          </div>
        )}
      </div>

      {/* Caption & Metadata */}
      <div className="p-4 sm:p-5">
        {post.bookTitle && (
          <div className="flex items-center gap-1.5 font-sans text-xs font-semibold uppercase tracking-wider text-accent mb-1.5">
            <BookOpen className="h-3 w-3" />
            <span className="truncate">{post.bookTitle}</span>
          </div>
        )}

        <h3 className="font-display text-lg font-semibold leading-snug text-ink group-hover:text-accent transition-colors">
          <Link href={`/bookstagram/${post.slug}`} className="no-underline">
            {post.title}
          </Link>
        </h3>

        {post.bookAuthor && (
          <p className="mt-0.5 font-sans text-xs text-muted">
            by {post.bookAuthor}
          </p>
        )}

        {post.caption && (
          <p className="mt-2.5 font-sans text-xs leading-relaxed text-muted line-clamp-2">
            {post.caption}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between border-t hairline pt-3 font-sans text-[11px] text-muted">
          <span>Mohit Kaushik</span>
          <Link
            href={`/bookstagram/${post.slug}`}
            className="font-medium text-ink hover:text-accent transition-colors no-underline"
          >
            Read details →
          </Link>
        </div>
      </div>
    </article>
  );
}
