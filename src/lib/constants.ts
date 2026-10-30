import type { ContentType, PermissionStatus, ReviewStatus, SourcePlatform, WorkStatus } from "@prisma/client";

export const SITE_NAME = "Mohit Yenugwar";
export const SITE_SUBTITLE = "Writer & Poet";
export const SITE_DESCRIPTION =
  "A personal literary archive of quotes, poetry, short stories, prose, aphorisms, and reflections by Mohit Yenugwar.";

export const ARCHIVE_PAGE_SIZE = 12;

export const CONTENT_TYPES: {
  value: ContentType;
  label: string;
  plural: string;
  hindiLabel: string;
  hindiPlural: string;
}[] = [
  { value: "QUOTE", label: "Quote", plural: "Quotes", hindiLabel: "उद्धरण", hindiPlural: "उद्धरण / सुविचार" },
  { value: "POEM", label: "Poem", plural: "Poetry / Poems", hindiLabel: "कविता / शायरी", hindiPlural: "कविताएँ / शायरी" },
  { value: "SHORT_STORY", label: "Short Story", plural: "Short Stories", hindiLabel: "लघु कथा", hindiPlural: "लघु कथाएँ" },
  { value: "PROSE", label: "Prose & Write-up", plural: "Prose & Write-ups", hindiLabel: "गद्य और लेख", hindiPlural: "गद्य और लेख" },
  { value: "REFLECTION", label: "Reflection", plural: "Reflections & Life Lessons", hindiLabel: "विचार", hindiPlural: "विचार और जीवन-अनुभव" },
  { value: "APHORISM", label: "Aphorism", plural: "Aphorisms", hindiLabel: "सूक्ति", hindiPlural: "सूक्तियाँ" },
  { value: "SHORT_PIECE", label: "Short piece", plural: "Short pieces", hindiLabel: "लघु रचना", hindiPlural: "लघु रचनाएँ" },
  { value: "OTHER", label: "Other Work", plural: "Other Works", hindiLabel: "अन्य रचना", hindiPlural: "अन्य रचनाएँ" },
];

export function contentTypeLabel(type: ContentType, lang?: string): string {
  const match = CONTENT_TYPES.find((t) => t.value === type);
  if (!match) return type;
  return lang === "hi" ? match.hindiLabel : match.label;
}

export function contentTypePlural(type: ContentType, lang?: string): string {
  const match = CONTENT_TYPES.find((t) => t.value === type);
  if (!match) return type;
  return lang === "hi" ? match.hindiPlural : match.plural;
}

/** URL-friendly names for content types, used in archive filters (?type=poem). */
export function contentTypeParam(type: ContentType): string {
  return type.toLowerCase().replace(/_/g, "-");
}

export function contentTypeFromParam(param: string | undefined | null): ContentType | null {
  if (!param) return null;
  const match = CONTENT_TYPES.find((t) => contentTypeParam(t.value) === param.toLowerCase());
  return match ? match.value : null;
}

export const LANGUAGES: { code: string; label: string; nativeLabel: string }[] = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "hi", label: "Hindi", nativeLabel: "हिंदी (Hindi)" },
  { code: "hi-Latn", label: "Hinglish / Mixed", nativeLabel: "Hinglish / Mixed" },
  { code: "mr", label: "Marathi", nativeLabel: "मराठी (Marathi)" },
  { code: "ur", label: "Urdu", nativeLabel: "اردو (Urdu)" },
  { code: "other", label: "Other", nativeLabel: "Other" },
];

export const LANGUAGE_CODES = LANGUAGES.map((l) => l.code) as [string, ...string[]];

export function languageLabel(code: string, native = false): string {
  const match = LANGUAGES.find((l) => l.code === code);
  if (!match) return code;
  return native ? match.nativeLabel : match.label;
}

export const WORK_STATUS_LABELS: Record<WorkStatus, string> = {
  DRAFT: "Draft",
  SCHEDULED: "Scheduled",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  DISCOVERED: "Discovered",
  NEEDS_VERIFICATION: "Needs verification",
  PERMISSION_PENDING: "Permission pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export const PERMISSION_STATUS_LABELS: Record<PermissionStatus, string> = {
  UNKNOWN: "Not yet established",
  REQUESTED: "Requested from the writer",
  GRANTED: "Granted by the writer",
  AUTHOR_SUBMITTED: "Submitted by the writer",
  DENIED: "Denied",
};

export const SOURCE_PLATFORMS: { value: SourcePlatform; label: string }[] = [
  { value: "YOURQUOTE", label: "YourQuote" },
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "PERSONAL_SUBMISSION", label: "Sent directly by the writer" },
  { value: "PRINT", label: "Print publication" },
  { value: "OTHER", label: "Other" },
];

export function sourcePlatformLabel(platform: SourcePlatform): string {
  return SOURCE_PLATFORMS.find((p) => p.value === platform)?.label ?? platform;
}

/** The single "workflow stage" shown in the admin, combining review and publication state. */
export type WorkflowStage =
  | "discovered"
  | "needs_verification"
  | "permission_pending"
  | "approved"
  | "published"
  | "rejected";

export function workflowStage(work: { status: WorkStatus; reviewStatus: ReviewStatus }): WorkflowStage {
  if (work.status === "PUBLISHED") return "published";
  return work.reviewStatus.toLowerCase() as WorkflowStage;
}

export const WORKFLOW_STAGE_LABELS: Record<WorkflowStage, string> = {
  discovered: "Discovered",
  needs_verification: "Needs verification",
  permission_pending: "Permission pending",
  approved: "Approved",
  published: "Published",
  rejected: "Rejected",
};
