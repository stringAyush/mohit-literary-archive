import { describe, expect, it } from "vitest";
import { canonicalText, contentHash, normaliseLineEndings } from "@/lib/works/hash";

describe("content fingerprints", () => {
  it("treats Windows and Unix line endings as the same text", () => {
    expect(contentHash("T", "a\r\nb")).toBe(contentHash("T", "a\nb"));
  });

  it("normalises Unicode so visually identical text matches", () => {
    const composed = "café";
    const decomposed = "café";
    expect(contentHash(null, composed)).toBe(contentHash(null, decomposed));
  });

  it("changes when a single character changes", () => {
    expect(contentHash(null, "silence")).not.toBe(contentHash(null, "silence."));
    expect(contentHash("A", "x")).not.toBe(contentHash("B", "x"));
  });

  it("is a 64-character hex SHA-256", () => {
    expect(contentHash(null, "x")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("documents the canonical form: title, blank line, body", () => {
    expect(canonicalText("Title", "Body")).toBe("Title\n\nBody");
    expect(canonicalText(null, "Body")).toBe("\n\nBody");
  });

  it("keeps spacing exactly apart from line endings", () => {
    expect(normaliseLineEndings("  a\r\n\r\n  b  ")).toBe("  a\n\n  b  ");
  });
});
