import { describe, expect, it } from "vitest";
import {
  canPublish,
  unmetRequirements,
  type PublishableWork,
} from "@/lib/works/publishing-rules";
import { mapPermissionStatus, mapReviewStatus, mapTextStatus } from "../../scripts/import-catalog";

describe("catalog publication policy and rights gating", () => {
  it("blocks publication of metadata-only records with empty body", () => {
    const metadataOnlyWork: PublishableWork = {
      slug: "dil-ko-itna-taala-chaabi",
      body: "",
      status: "DRAFT",
      reviewStatus: "NEEDS_VERIFICATION",
      permissionStatus: "REQUESTED",
      permissionNote: "Catalog candidate from YourQuote reference",
      rightsConfirmedAt: null,
      isDemo: false,
      sourceReference: { verifiedAt: null },
    };

    expect(canPublish(metadataOnlyWork)).toBe(false);
    const unmet = unmetRequirements(metadataOnlyWork).map((r) => r.key);
    expect(unmet).toContain("text");
    expect(unmet).toContain("rights");
    expect(unmet).toContain("review");
    expect(unmet).toContain("permission");
    expect(unmet).toContain("source");
  });

  it("blocks publication of excerpt-only records when rights are pending", () => {
    const excerptWork: PublishableWork = {
      slug: "robbed",
      body: "And I— i am dominantly the thief of my own breath, the quiet assassin of my own becoming.",
      status: "DRAFT",
      reviewStatus: "NEEDS_VERIFICATION",
      permissionStatus: "REQUESTED",
      permissionNote: "Source verified excerpt; full poem in caption not extracted",
      rightsConfirmedAt: null,
      isDemo: false,
      sourceReference: { verifiedAt: null },
    };

    expect(canPublish(excerptWork)).toBe(false);
    const unmet = unmetRequirements(excerptWork).map((r) => r.key);
    expect(unmet).toContain("rights");
    expect(unmet).toContain("permission");
    expect(unmet).toContain("source");
  });

  it("maps catalog status values accurately without assuming permissions", () => {
    expect(mapPermissionStatus("permission_pending")).toBe("REQUESTED");
    expect(mapPermissionStatus("unknown")).toBe("UNKNOWN");
    expect(mapPermissionStatus("permission_granted")).toBe("GRANTED");
    expect(mapPermissionStatus("author_submitted")).toBe("AUTHOR_SUBMITTED");
    expect(mapPermissionStatus("permission_denied")).toBe("DENIED");

    expect(mapReviewStatus("needs_verification")).toBe("NEEDS_VERIFICATION");
    expect(mapReviewStatus("discovered")).toBe("DISCOVERED");
    expect(mapReviewStatus("published")).toBe("APPROVED");
  });

  it("maps text status accurately according to content presence", () => {
    expect(mapTextStatus("full_text", true, false)).toBe("FULL_TEXT");
    expect(mapTextStatus("excerpt_only", false, true)).toBe("EXCERPT_ONLY");
    expect(mapTextStatus("metadata_only", false, false)).toBe("METADATA_ONLY");
    // Fallbacks
    expect(mapTextStatus("unknown", true, false)).toBe("FULL_TEXT");
    expect(mapTextStatus("unknown", false, true)).toBe("EXCERPT_ONLY");
    expect(mapTextStatus("unknown", false, false)).toBe("METADATA_ONLY");
  });
});
