import { describe, expect, it } from "vitest";
import { BOOKSTAGRAM_CATEGORIES } from "@/lib/bookstagram/types";

describe("bookstagram categories", () => {
  it("contains all curated editorial categories", () => {
    expect(BOOKSTAGRAM_CATEGORIES).toContain("Book Covers");
    expect(BOOKSTAGRAM_CATEGORIES).toContain("Reading Setups");
    expect(BOOKSTAGRAM_CATEGORIES).toContain("Bookshelves");
    expect(BOOKSTAGRAM_CATEGORIES).toContain("Annotated Pages");
    expect(BOOKSTAGRAM_CATEGORIES).toContain("Currently Reading");
    expect(BOOKSTAGRAM_CATEGORIES).toContain("Literary Details");
    expect(BOOKSTAGRAM_CATEGORIES).toContain("Book Collections");
    expect(BOOKSTAGRAM_CATEGORIES).toContain("Reading Journals");
  });

  it("does not have duplicate categories", () => {
    const unique = new Set(BOOKSTAGRAM_CATEGORIES);
    expect(unique.size).toBe(BOOKSTAGRAM_CATEGORIES.length);
  });
});
