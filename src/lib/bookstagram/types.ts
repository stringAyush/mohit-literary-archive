export const BOOKSTAGRAM_CATEGORIES = [
  "Book Covers",
  "Reading Setups",
  "Bookshelves",
  "Annotated Pages",
  "Currently Reading",
  "Literary Details",
  "Book Collections",
  "Reading Journals",
] as const;

export type BookstagramCategory = (typeof BOOKSTAGRAM_CATEGORIES)[number];

export type PhotoImageData = {
  id?: string;
  url: string;
  altText?: string | null;
  caption?: string | null;
  width?: number | null;
  height?: number | null;
  fileSize?: number | null;
  hash?: string | null;
  sortOrder?: number;
};

export type PhotoPostData = {
  id: string;
  slug: string;
  title: string;
  caption?: string | null;
  bookTitle?: string | null;
  bookAuthor?: string | null;
  publisher?: string | null;
  category?: string | null;
  tags: string[];
  instagramUrl?: string | null;
  photographyDate?: Date | null;
  publishedAt?: Date | null;
  isPublished: boolean;
  featured: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  images: PhotoImageData[];
};
