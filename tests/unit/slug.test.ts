import { describe, expect, it } from "vitest";
import { ensureUniqueSlug, isValidSlug, slugify, suggestSlug } from "@/lib/works/slug";

describe("slugify", () => {
  it("makes readable, lowercase addresses", () => {
    expect(slugify("The Weight of Rain!")).toBe("the-weight-of-rain");
    expect(slugify("  Café — déjà vu  ")).toBe("cafe-deja-vu");
    expect(slugify("Don't look back")).toBe("dont-look-back");
  });

  it("returns an empty string for text without Latin letters", () => {
    expect(slugify("शब्द कम थे")).toBe("");
  });

  it("limits length without leaving a trailing hyphen", () => {
    const slug = slugify("word ".repeat(40));
    expect(slug.length).toBeLessThanOrEqual(80);
    expect(slug.endsWith("-")).toBe(false);
  });
});

describe("suggestSlug", () => {
  it("prefers the title and falls back to the opening words", () => {
    expect(suggestSlug("Monsoon Inventory", "anything")).toBe("monsoon-inventory");
    expect(suggestSlug(null, "Some doors you close gently,\nnot because")).toBe("some-doors-you-close-gently-not-because");
  });
});

describe("isValidSlug", () => {
  it("accepts simple hyphenated slugs only", () => {
    expect(isValidSlug("a-b-c")).toBe(true);
    expect(isValidSlug("A-b")).toBe(false);
    expect(isValidSlug("a--b")).toBe(false);
    expect(isValidSlug("-a")).toBe(false);
    expect(isValidSlug("")).toBe(false);
  });
});

describe("ensureUniqueSlug", () => {
  it("adds a number when the slug is taken", async () => {
    const taken = new Set(["rain", "rain-2"]);
    expect(await ensureUniqueSlug("rain", async (s) => taken.has(s))).toBe("rain-3");
    expect(await ensureUniqueSlug("snow", async (s) => taken.has(s))).toBe("snow");
  });

  it("uses a fallback when the base is empty", async () => {
    const slug = await ensureUniqueSlug("", async () => false, "poem");
    expect(slug.startsWith("poem-")).toBe(true);
    expect(isValidSlug(slug)).toBe(true);
  });
});
