import { describe, expect, it } from "vitest";
import { searchTerms, toPrefixTsQuery } from "@/lib/works/search-query";

describe("search queries", () => {
  it("joins words with AND and matches the last word as a prefix", () => {
    expect(toPrefixTsQuery("quiet  assas")).toBe("quiet & assas:*");
  });

  it("removes characters that have meaning in PostgreSQL queries", () => {
    expect(toPrefixTsQuery("rain' | !(drop) & table:*")).toBe("rain & drop & table:*");
    expect(toPrefixTsQuery("&&&|||")).toBeNull();
    expect(toPrefixTsQuery("   ")).toBeNull();
  });

  it("keeps non-Latin words, including Devanagari vowel signs", () => {
    const phrase = "ख़ामोशी ज़्यादा";
    expect(searchTerms(phrase)).toEqual(phrase.normalize("NFC").split(" "));
  });

  it("limits the number and length of terms", () => {
    expect(searchTerms("a b c d e f g h i j k")).toHaveLength(8);
    expect(searchTerms("x".repeat(100))[0]).toHaveLength(40);
  });
});
