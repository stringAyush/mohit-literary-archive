import { describe, expect, it } from "vitest";
import { csvToRecords, parseCsv } from "@/lib/import/csv";
import { parseImport } from "@/lib/import/schema";

describe("parseCsv", () => {
  it("handles quotes, commas, escaped quotes and line breaks inside fields", () => {
    const rows = parseCsv('a,b,c\r\n"x, y","He said ""hi""","line 1\nline 2"\n');
    expect(rows).toEqual([
      ["a", "b", "c"],
      ["x, y", 'He said "hi"', "line 1\nline 2"],
    ]);
  });

  it("ignores a byte-order mark and blank lines", () => {
    expect(parseCsv("﻿a,b\n\n1,2\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("reports an unclosed quote", () => {
    expect(() => parseCsv('a\n"open')).toThrow(/never closed/);
  });

  it("maps rows to objects using the header", () => {
    expect(csvToRecords("title,text\nT,\"a\nb\"")).toEqual([{ title: "T", text: "a\nb" }]);
  });
});

describe("parseImport", () => {
  const header = "title,text,contentType,language,sourcePlatform,sourceUrl,reviewStatus,themes\n";

  it("accepts valid rows and normalises enum spellings", () => {
    const result = parseImport(`${header}Rain,"one\ntwo",poem,en,personal submission,,needs-verification,"rain; home"`, "csv");
    expect(result.errors).toEqual([]);
    expect(result.rows[0].row).toMatchObject({
      title: "Rain",
      text: "one\ntwo",
      contentType: "POEM",
      sourcePlatform: "PERSONAL_SUBMISSION",
      reviewStatus: "NEEDS_VERIFICATION",
      themes: ["rain", "home"],
    });
  });

  it("only allows rows without text when they are discovered sources with a URL", () => {
    const result = parseImport(
      `${header},,quote,en,yourquote,,needs_verification,\n,,quote,en,yourquote,https://example.com/q,discovered,`,
      "csv",
    );
    expect(result.rows.map((r) => r.index)).toEqual([2]);
    expect(result.errors[0].index).toBe(1);
    expect(result.errors[0].messages.join(" ")).toMatch(/discovered/);
  });

  it("never lets an import approve a work", () => {
    const result = parseImport(JSON.stringify([{ text: "x", contentType: "quote", sourcePlatform: "other", reviewStatus: "approved" }]), "json");
    expect(result.rows).toHaveLength(0);
    expect(result.errors[0].messages.join(" ")).toMatch(/reviewStatus/);
  });

  it("accepts {works: [...]} JSON and rejects other shapes", () => {
    expect(parseImport(JSON.stringify({ works: [{ text: "x", contentType: "quote", sourcePlatform: "other" }] }), "json").rows).toHaveLength(1);
    expect(parseImport(JSON.stringify({ items: [] }), "json").fatal).toBeTruthy();
    expect(parseImport("{not json", "json").fatal).toBeTruthy();
  });
});
