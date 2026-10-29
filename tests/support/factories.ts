import type { WorkInput } from "@/lib/validation/work";

export function workInput(overrides: Partial<WorkInput> = {}): WorkInput {
  return {
    title: null,
    slug: null,
    body: "The quiet keeps\nwhat the noise forgets.",
    contentType: "QUOTE",
    language: "en",
    featured: false,
    composedOn: null,
    originalPublishedAt: null,
    collectionIds: [],
    tagIds: [],
    source: null,
    changeReason: null,
    ...overrides,
  };
}

export const approval = {
  permissionStatus: "AUTHOR_SUBMITTED" as const,
  permissionNote: "Sent by the writer for this archive (test fixture)",
  confirmAuthorship: true as const,
  sourceVerified: true,
  verificationNote: "",
};
