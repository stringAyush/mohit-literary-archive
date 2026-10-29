import { describe, expect, it } from "vitest";
import { fitText, layoutPreservesText, wrapText, type Measure } from "@/lib/artwork/layout";
import { FORMATS, LINE_HEIGHT, MAX_FONT_SIZE, MIN_FONT_SIZE, textBox } from "@/lib/artwork/templates";

// A predictable stand-in for canvas text measurement: each character is half the font size wide.
const measure: Measure = (text, size) => Array.from(text).length * size * 0.5;

describe("wrapText", () => {
  it("keeps the writer's line breaks and stanza breaks", () => {
    const lines = wrapText("one\n\ntwo", 20, 1000, measure);
    expect(lines.map((l) => l.text)).toEqual(["one", "", "two"]);
  });

  it("wraps long lines and marks the wrapped part as a continuation", () => {
    const lines = wrapText("aaaa bbbb cccc", 10, 50, measure); // 10 chars per line
    expect(lines).toEqual([
      { text: "aaaa bbbb", continuation: false },
      { text: "cccc", continuation: true },
    ]);
  });

  it("breaks a word that is wider than the whole line instead of overflowing", () => {
    const lines = wrapText("x".repeat(25), 10, 50, measure);
    expect(lines.every((l) => measure(l.text, 10) <= 50)).toBe(true);
    expect(lines.map((l) => l.text).join("")).toBe("x".repeat(25));
  });
});

describe("fitText", () => {
  const options = { maxWidth: 800, maxHeight: 600, minFontSize: MIN_FONT_SIZE, maxFontSize: MAX_FONT_SIZE, lineHeight: LINE_HEIGHT };

  it("uses the largest size that fits", () => {
    const result = fitText("A short line.", measure, options)!;
    expect(result.fontSize).toBe(MAX_FONT_SIZE);
    const longer = fitText("word ".repeat(60), measure, options)!;
    expect(longer.fontSize).toBeLessThan(MAX_FONT_SIZE);
    expect(longer.height).toBeLessThanOrEqual(600);
  });

  it("never drops or crops text", () => {
    const poem = "First line of the poem\nsecond line, a little longer than the first one\n\nthird";
    const result = fitText(poem, measure, options)!;
    expect(layoutPreservesText(poem, result.lines)).toBe(true);
  });

  it("prefers a size that keeps the writer's lines unbroken", () => {
    // Filling the box would need wrapping; a slightly smaller size keeps each line whole.
    const poem = "a".repeat(30) + "\n" + "b".repeat(30);
    const result = fitText(poem, measure, { ...options, maxWidth: 1000, maxHeight: 2000 })!;
    expect(result.lines.map((l) => l.text)).toEqual(["a".repeat(30), "b".repeat(30)]);
    expect(result.fontSize).toBe(66); // 30 chars × 0.5 × 66 = 990 ≤ 1000
  });

  it("wraps when keeping lines whole would make the text too small", () => {
    const prose = "word ".repeat(80).trim();
    const result = fitText(prose, measure, options)!;
    expect(result.lines.length).toBeGreaterThan(1);
    expect(result.lines.slice(1).every((l) => l.continuation)).toBe(true);
  });

  it("returns null when the text cannot fit at a readable size", () => {
    expect(fitText("word ".repeat(2000), measure, options)).toBeNull();
  });

  it("produces boxes that fit inside every format", () => {
    for (const format of ["square", "portrait"] as const) {
      for (const template of ["editorial", "margin", "folio"] as const) {
        const box = textBox(template, format, true);
        expect(box.x + box.width).toBeLessThanOrEqual(FORMATS[format].width);
        expect(box.y + box.height).toBeLessThanOrEqual(FORMATS[format].height);
        expect(box.height).toBeGreaterThan(300);
      }
    }
  });
});
