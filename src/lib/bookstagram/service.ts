import { db } from "@/lib/db";
import { type PhotoPostData } from "./types";

export type SavePhotoPostInput = {
  title: string;
  slug?: string;
  caption?: string | null;
  bookTitle?: string | null;
  bookAuthor?: string | null;
  publisher?: string | null;
  category?: string | null;
  tags?: string[];
  instagramUrl?: string | null;
  photographyDate?: Date | null;
  isPublished?: boolean;
  featured?: boolean;
  sortOrder?: number;
  images: {
    url: string;
    altText?: string | null;
    caption?: string | null;
    width?: number | null;
    height?: number | null;
    fileSize?: number | null;
    hash?: string | null;
    sortOrder?: number;
  }[];
};

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function ensureUniquePhotoSlug(baseSlug: string, currentId?: string): Promise<string> {
  let slug = baseSlug || "photograph";
  let count = 1;
  while (true) {
    const existing = await db.photoPost.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!existing || existing.id === currentId) {
      return slug;
    }
    slug = `${baseSlug}-${count}`;
    count++;
  }
}

export async function createPhotoPost(input: SavePhotoPostInput): Promise<PhotoPostData> {
  const baseSlug = input.slug ? generateSlug(input.slug) : generateSlug(input.title);
  const slug = await ensureUniquePhotoSlug(baseSlug);

  const post = await db.photoPost.create({
    data: {
      slug,
      title: input.title,
      caption: input.caption,
      bookTitle: input.bookTitle,
      bookAuthor: input.bookAuthor,
      publisher: input.publisher,
      category: input.category,
      tags: input.tags ?? [],
      instagramUrl: input.instagramUrl,
      photographyDate: input.photographyDate,
      isPublished: input.isPublished ?? true,
      featured: input.featured ?? false,
      sortOrder: input.sortOrder ?? 0,
      images: {
        create: input.images.map((img, idx) => ({
          url: img.url,
          altText: img.altText,
          caption: img.caption,
          width: img.width,
          height: img.height,
          fileSize: img.fileSize,
          hash: img.hash,
          sortOrder: img.sortOrder ?? idx,
        })),
      },
    },
    include: {
      images: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return post as unknown as PhotoPostData;
}

export async function updatePhotoPost(id: string, input: Partial<SavePhotoPostInput>): Promise<PhotoPostData> {
  let slug: string | undefined;
  if (input.slug) {
    slug = await ensureUniquePhotoSlug(generateSlug(input.slug), id);
  } else if (input.title) {
    slug = await ensureUniquePhotoSlug(generateSlug(input.title), id);
  }

  // Update post fields
  await db.photoPost.update({
    where: { id },
    data: {
      ...(slug ? { slug } : {}),
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.caption !== undefined ? { caption: input.caption } : {}),
      ...(input.bookTitle !== undefined ? { bookTitle: input.bookTitle } : {}),
      ...(input.bookAuthor !== undefined ? { bookAuthor: input.bookAuthor } : {}),
      ...(input.publisher !== undefined ? { publisher: input.publisher } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.tags !== undefined ? { tags: input.tags } : {}),
      ...(input.instagramUrl !== undefined ? { instagramUrl: input.instagramUrl } : {}),
      ...(input.photographyDate !== undefined ? { photographyDate: input.photographyDate } : {}),
      ...(input.isPublished !== undefined ? { isPublished: input.isPublished } : {}),
      ...(input.featured !== undefined ? { featured: input.featured } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
    },
  });

  // If new images provided, recreate image list
  if (input.images) {
    await db.photoImage.deleteMany({ where: { postId: id } });
    await db.photoImage.createMany({
      data: input.images.map((img, idx) => ({
        postId: id,
        url: img.url,
        altText: img.altText,
        caption: img.caption,
        width: img.width,
        height: img.height,
        fileSize: img.fileSize,
        hash: img.hash,
        sortOrder: img.sortOrder ?? idx,
      })),
    });
  }

  return db.photoPost.findUniqueOrThrow({
    where: { id },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  }) as unknown as PhotoPostData;
}

export async function deletePhotoPost(id: string): Promise<void> {
  await db.photoPost.delete({ where: { id } });
}

export async function togglePublishPost(id: string): Promise<boolean> {
  const post = await db.photoPost.findUniqueOrThrow({ where: { id }, select: { isPublished: true } });
  const updated = await db.photoPost.update({
    where: { id },
    data: { isPublished: !post.isPublished },
    select: { isPublished: true },
  });
  return updated.isPublished;
}

export async function toggleFeaturePost(id: string): Promise<boolean> {
  const post = await db.photoPost.findUniqueOrThrow({ where: { id }, select: { featured: true } });
  const updated = await db.photoPost.update({
    where: { id },
    data: { featured: !post.featured },
    select: { featured: true },
  });
  return updated.featured;
}

export async function getAdminPhotoPosts(options: {
  status?: string;
  category?: string;
  query?: string;
} = {}): Promise<PhotoPostData[]> {
  const where: Record<string, unknown> = {};

  if (options.status === "published") where.isPublished = true;
  if (options.status === "draft") where.isPublished = false;
  if (options.status === "featured") where.featured = true;
  if (options.category) where.category = options.category;
  if (options.query) {
    const q = options.query.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { bookTitle: { contains: q, mode: "insensitive" } },
      { bookAuthor: { contains: q, mode: "insensitive" } },
      { caption: { contains: q, mode: "insensitive" } },
    ];
  }

  const posts = await db.photoPost.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
    include: {
      images: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return posts as unknown as PhotoPostData[];
}
