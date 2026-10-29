"use client";

import { useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, ChevronLeft, ChevronRight, BookOpen, ExternalLink, Tag } from "lucide-react";
import { type PhotoPostData } from "@/lib/bookstagram/types";

type Props = {
  posts: PhotoPostData[];
  currentIndex: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
};

export function PhotoLightbox({ posts, currentIndex, onClose, onNavigate }: Props) {
  const currentPost = currentIndex !== null ? posts[currentIndex] : null;
  const currentImage = currentPost?.images[0];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (currentIndex === null) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && currentIndex > 0) onNavigate(currentIndex - 1);
      if (e.key === "ArrowRight" && currentIndex < posts.length - 1) onNavigate(currentIndex + 1);
    },
    [currentIndex, posts.length, onClose, onNavigate],
  );

  useEffect(() => {
    if (currentIndex !== null) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentIndex, handleKeyDown]);

  if (currentIndex === null || !currentPost || !currentImage) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={currentPost.title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 sm:p-6 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Top action bar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between text-white/80">
        <div className="flex items-center gap-3 font-sans text-xs tracking-wider uppercase">
          <span className="font-mono text-accent">
            {String(currentIndex + 1).padStart(2, "0")} / {String(posts.length).padStart(2, "0")}
          </span>
          {currentPost.category && (
            <span className="hidden sm:inline-block rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] text-white/90">
              {currentPost.category}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close lightbox"
          className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation arrows */}
      {currentIndex > 0 && (
        <button
          type="button"
          onClick={() => onNavigate(currentIndex - 1)}
          aria-label="Previous photograph"
          className="absolute left-3 sm:left-6 z-10 rounded-full bg-black/40 p-3 text-white/90 hover:bg-black/80 hover:text-white transition-all backdrop-blur-xs"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {currentIndex < posts.length - 1 && (
        <button
          type="button"
          onClick={() => onNavigate(currentIndex + 1)}
          aria-label="Next photograph"
          className="absolute right-3 sm:right-6 z-10 rounded-full bg-black/40 p-3 text-white/90 hover:bg-black/80 hover:text-white transition-all backdrop-blur-xs"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Main content modal */}
      <div className="relative flex max-h-[90vh] w-full max-w-5xl flex-col lg:flex-row items-center overflow-hidden rounded-xl bg-[#141210] border border-white/10 shadow-2xl">
        {/* Photo view */}
        <div className="relative flex h-[50vh] sm:h-[60vh] lg:h-[75vh] w-full items-center justify-center bg-black/50 p-2 sm:p-6 lg:w-3/5">
          <div className="relative h-full w-full">
            <Image
              src={currentImage.url}
              alt={currentImage.altText || currentPost.title}
              fill
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 60vw"
              priority
            />
          </div>
        </div>

        {/* Editorial description sidebar */}
        <div className="flex w-full flex-col justify-between overflow-y-auto p-6 sm:p-8 lg:h-[75vh] lg:w-2/5 border-t lg:border-t-0 lg:border-l border-white/10 text-white">
          <div>
            {currentPost.bookTitle && (
              <div className="flex items-center gap-2 text-xs font-medium text-accent uppercase tracking-wider mb-2">
                <BookOpen className="h-3.5 w-3.5" />
                <span>{currentPost.bookTitle}</span>
              </div>
            )}
            <h2 className="font-display text-2xl font-semibold leading-snug sm:text-3xl text-balance">
              {currentPost.title}
            </h2>
            {currentPost.bookAuthor && (
              <p className="mt-1 font-sans text-xs text-white/60">
                By <span className="text-white/90">{currentPost.bookAuthor}</span>
                {currentPost.publisher && ` · ${currentPost.publisher}`}
              </p>
            )}

            {currentPost.caption && (
              <p className="mt-4 font-editorial text-base leading-relaxed text-white/80">
                {currentPost.caption}
              </p>
            )}

            {currentImage.caption && currentImage.caption !== currentPost.caption && (
              <p className="mt-3 font-sans text-xs italic text-white/60 border-l border-accent/40 pl-3">
                {currentImage.caption}
              </p>
            )}

            {currentPost.tags && currentPost.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-1.5">
                {currentPost.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 font-sans text-[11px] text-white/70"
                  >
                    <Tag className="h-2.5 w-2.5 text-accent" />
                    <span>{tag}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 border-t border-white/10 pt-4 flex items-center justify-between">
            <span className="font-sans text-[11px] text-white/40 tracking-wider uppercase">
              Mohit Kaushik Photography
            </span>
            <Link
              href={`/bookstagram/${currentPost.slug}`}
              className="inline-flex items-center gap-1.5 font-sans text-xs font-medium text-accent hover:underline"
            >
              <span>View full post</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
