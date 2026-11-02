import { db } from "@/lib/db";
import { type PhotoPostData } from "./types";

export async function getPublicPhotoPosts(options: {
  category?: string;
  limit?: number;
} = {}): Promise<PhotoPostData[]> {
  const where = {
    isPublished: true,
    ...(options.category ? { category: options.category } : {}),
  };

  const posts = await db.photoPost.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
    take: options.limit,
    include: {
      images: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return posts as unknown as PhotoPostData[];
}

export async function getPhotoPostBySlug(slug: string): Promise<PhotoPostData | null> {
  const post = await db.photoPost.findUnique({
    where: { slug },
    include: {
      images: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!post || !post.isPublished) return null;
  return post as unknown as PhotoPostData;
}

export async function getFeaturedPhotoPosts(limit = 6): Promise<PhotoPostData[]> {
  const featured = await db.photoPost.findMany({
    where: {
      isPublished: true,
      featured: true,
    },
    orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }],
    take: limit,
    include: {
      images: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (featured.length >= limit) {
    return featured as unknown as PhotoPostData[];
  }

  // Fallback to fill up to limit with other published posts
  const remaining = limit - featured.length;
  const more = await db.photoPost.findMany({
    where: {
      isPublished: true,
      id: { notIn: featured.map((p) => p.id) },
    },
    orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
    take: remaining,
    include: {
      images: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return [...featured, ...more] as unknown as PhotoPostData[];
}

export async function getPhotoCategories(): Promise<{ name: string; count: number }[]> {
  const posts = await db.photoPost.findMany({
    where: { isPublished: true },
    select: { category: true },
  });

  const counts = new Map<string, number>();
  for (const p of posts) {
    if (p.category) {
      counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries()).map(([name, count]) => ({ name, count }));
}

export async function getAdjacentPhotoPosts(postId: string): Promise<{
  previous: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
}> {
  const allPosts = await db.photoPost.findMany({
    where: { isPublished: true },
    orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }],
    select: { id: true, slug: true, title: true },
  });

  const currentIndex = allPosts.findIndex((p: { id: string; slug: string; title: string }) => p.id === postId);
  if (currentIndex === -1) return { previous: null, next: null };

  const previous = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const next = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;

  return { previous, next };
}
