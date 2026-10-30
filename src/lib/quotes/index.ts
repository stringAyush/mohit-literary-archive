// Authoritative Single Source of Truth for Mohit Yenugwar's Quotes
import quotesData from "./quotes.json";

export interface QuoteRecord {
  id: string;
  pageNumber: number;
  sourceFile: string;
  imageFile: string;
  title: string | null;
  body: string;
  contentType: "QUOTE" | "APHORISM";
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
  charCount: number;
  lineCount: number;
}

export const QUOTES: QuoteRecord[] = quotesData as QuoteRecord[];

export function getQuoteById(id: string): QuoteRecord | undefined {
  return QUOTES.find((q) => q.id === id);
}

export function getQuoteBySlug(slug: string): QuoteRecord | undefined {
  return QUOTES.find((q) => q.slug === slug);
}

export function getQuotesByCategory(category: string): QuoteRecord[] {
  return QUOTES.filter((q) => q.categories.includes(category));
}
