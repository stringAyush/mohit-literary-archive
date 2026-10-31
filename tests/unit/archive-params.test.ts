import { describe, expect, it } from "vitest";
import { archiveParamsToQuery, parseArchiveParams } from "@/lib/works/archive-params";

describe("archive URL parameters", () => {
  it("reads valid filters", () => {
    const params = parseArchiveParams({ q: " rain ", type: "poem", collection: "night-notes", lang: "hi", sort: "oldest", page: "3" });
    expect(params).toEqual({ q: "rain", type: "POEM", collection: "night-notes", language: "hi", sort: "oldest", page: 3, view: "normal" });
  });

  it("ignores invalid values instead of failing", () => {
    const params = parseArchiveParams({ type: "novel", collection: "Bad Slug!", lang: "xx", sort: "random", page: "-4" });
    expect(params).toEqual({ q: "", type: null, collection: null, language: null, sort: "newest", page: 1, view: "normal" });
  });

  it("reads book flip view when specified", () => {
    const params = parseArchiveParams({ view: "book" });
    expect(params.view).toBe("book");
  });

  it("round-trips to a clean query string, keeping every active filter", () => {
    const params = parseArchiveParams({ q: "rain", type: "short-piece", page: "2" });
    expect(archiveParamsToQuery(params)).toEqual({
      q: "rain",
      type: "short-piece",
      collection: undefined,
      lang: undefined,
      sort: undefined,
      page: "2",
      view: undefined,
    });
  });
});
