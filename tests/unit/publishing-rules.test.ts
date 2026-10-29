import { describe, expect, it } from "vitest";
import { canPublish, publishingRequirements, unmetRequirements, type PublishableWork } from "@/lib/works/publishing-rules";

const ready: PublishableWork = {
  slug: "a-poem",
  body: "Text",
  status: "DRAFT",
  reviewStatus: "APPROVED",
  permissionStatus: "AUTHOR_SUBMITTED",
  permissionNote: "Sent by the writer on 1 Nov",
  rightsConfirmedAt: new Date(),
  isDemo: false,
  sourceReference: null,
};

describe("publishing requirements", () => {
  it("allows a fully reviewed work", () => {
    expect(canPublish(ready)).toBe(true);
  });

  it.each([
    ["text", { body: "   " }],
    ["slug", { slug: "Bad Slug" }],
    ["permission", { permissionStatus: "REQUESTED" as const }],
    ["permission", { permissionStatus: "UNKNOWN" as const }],
    ["evidence", { permissionNote: "ok" }],
    ["rights", { rightsConfirmedAt: null }],
    ["review", { reviewStatus: "PERMISSION_PENDING" as const }],
    ["review", { reviewStatus: "DISCOVERED" as const }],
    ["not-archived", { status: "ARCHIVED" as const }],
  ])("blocks publication when %s is missing", (key, change) => {
    const work = { ...ready, ...change } as PublishableWork;
    expect(canPublish(work)).toBe(false);
    expect(unmetRequirements(work).map((r) => r.key)).toContain(key);
  });

  it("requires a verified source when the work has one", () => {
    const unverified = { ...ready, sourceReference: { verifiedAt: null } };
    expect(unmetRequirements(unverified).map((r) => r.key)).toEqual(["source"]);
    expect(canPublish({ ...ready, sourceReference: { verifiedAt: new Date() } })).toBe(true);
  });

  it("lists every requirement with a label for the editor", () => {
    for (const requirement of publishingRequirements(ready)) {
      expect(requirement.label.length).toBeGreaterThan(5);
    }
  });
});
