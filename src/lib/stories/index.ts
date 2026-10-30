// Authoritative Single Source of Truth for Mohit Yenugwar's Stories and Poems
import storiesData from "./stories.json";

export interface StoryRecord {
  id: string;
  pageNumber: number;
  sourceFile: string;
  imageFile: string;
  title: string | null;
  body: string;
  contentType: "POEM" | "STORY" | "REFLECTION" | "SHORT_PIECE";
  language: string;
  author: string;
  sourcePlatform: string;
  sourceUrl: string;
  originalDate: string | null;
  visibleDate: string | null;
  likes: number;
  categories: string[];
  tags: string[];
  slug: string;
  readingTime?: string;
  charCount: number;
  lineCount: number;
}

export const STORIES: StoryRecord[] = storiesData as StoryRecord[];

export function getStoryById(id: string): StoryRecord | undefined {
  return STORIES.find((s) => s.id === id);
}

export function getStoryBySlug(slug: string): StoryRecord | undefined {
  return STORIES.find((s) => s.slug === slug);
}

export function getStoriesByCategory(category: string): StoryRecord[] {
  return STORIES.filter((s) => s.categories.includes(category));
}
