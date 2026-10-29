import { describe, expect, it } from "vitest";
import { makeExcerpt, oneLineSummary } from "@/lib/works/excerpt";

describe("makeExcerpt", () => {
  it("returns short pieces whole and says they are not truncated", () => {
    const result = makeExcerpt("one\ntwo");
    expect(result).toEqual({ text: "one\ntwo", truncated: false });
  });

  it("keeps whole lines and flags truncation for long poems", () => {
    const body = Array.from({ length: 12 }, (_, i) => `line ${i + 1}`).join("\n");
    const result = makeExcerpt(body, 4);
    expect(result.text).toBe("line 1\nline 2\nline 3\nline 4");
    expect(result.truncated).toBe(true);
  });

  it("cuts a very long single line at a word boundary", () => {
    const body = "word ".repeat(200).trim();
    const result = makeExcerpt(body, 6, 50);
    expect(result.text.length).toBeLessThanOrEqual(50);
    expect(result.text.endsWith("word")).toBe(true);
    expect(result.truncated).toBe(true);
  });
});

describe("oneLineSummary", () => {
  it("flattens line breaks and adds an ellipsis only when shortened", () => {
    expect(oneLineSummary("a\nb")).toBe("a b");
    expect(oneLineSummary("word ".repeat(100), 20).endsWith("…")).toBe(true);
  });
});
