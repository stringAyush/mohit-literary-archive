"use client";

import { useState } from "react";
import { Camera } from "lucide-react";
import { type PhotoPostData } from "@/lib/bookstagram/types";
import { PhotoCard } from "./PhotoCard";
import { PhotoLightbox } from "./PhotoLightbox";

type Props = {
  posts: PhotoPostData[];
};

export function PhotoGrid({ posts }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border hairline bg-surface/50 p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent mb-4">
          <Camera className="h-6 w-6" />
        </div>
        <h3 className="font-display text-xl font-semibold text-ink">No photographs in this collection</h3>
        <p className="mt-2 max-w-sm font-sans text-sm text-muted">
          New literary frames, reading setups, and book photography are added continuously. Check back soon or browse all frames.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
        {posts.map((post, index) => (
          <PhotoCard
            key={post.id}
            post={post}
            onOpenLightbox={() => setLightboxIndex(index)}
          />
        ))}
      </div>

      <PhotoLightbox
        posts={posts}
        currentIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={(index) => setLightboxIndex(index)}
      />
    </>
  );
}
