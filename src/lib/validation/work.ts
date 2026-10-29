import { ContentType, PermissionStatus, SourcePlatform } from "@prisma/client";
import { z } from "zod";
import { LANGUAGE_CODES } from "@/lib/constants";
import { SLUG_MAX_LENGTH, SLUG_PATTERN } from "@/lib/works/slug";
import { checkbox, optionalCalendarDate, optionalHttpUrl, optionalText } from "./helpers";

export const MAX_BODY_LENGTH = 50_000;

export const slugField = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  z
    .string()
    .trim()
    .toLowerCase()
    .max(SLUG_MAX_LENGTH, `Use ${SLUG_MAX_LENGTH} characters or fewer`)
    .regex(SLUG_PATTERN, "Use lowercase letters, numbers and single hyphens, e.g. the-weight-of-rain")
    .nullable(),
);

export const sourceInputSchema = z
  .object({
    platform: z.nativeEnum(SourcePlatform),
    url: optionalHttpUrl,
    originalTitle: optionalText(200, "Original title"),
    originalPublishedAt: optionalCalendarDate,
    retrievalMethod: optionalText(120, "Retrieval method"),
    notes: optionalText(2000, "Notes"),
  })
  .nullable();

export const workInputSchema = z.object({
  title: optionalText(200, "Title"),
  slug: slugField,
  body: z
    .string()
    .max(MAX_BODY_LENGTH, `The text must be ${MAX_BODY_LENGTH.toLocaleString("en")} characters or fewer`)
    .default(""),
  contentType: z.nativeEnum(ContentType, { errorMap: () => ({ message: "Choose a type of writing" }) }),
  language: z.enum(LANGUAGE_CODES, { errorMap: () => ({ message: "Choose a language" }) }),
  featured: checkbox.default(false),
  composedOn: optionalCalendarDate.default(null),
  originalPublishedAt: optionalCalendarDate.default(null),
  collectionIds: z.array(z.string().min(1)).default([]),
  tagIds: z.array(z.string().min(1)).default([]),
  source: sourceInputSchema.default(null),
  changeReason: optionalText(300, "Reason for change").default(null),
});

export type WorkInput = z.infer<typeof workInputSchema>;

/** Reads the work editor form into the shape expected by workInputSchema. */
export function workFormToObject(formData: FormData) {
  const platform = String(formData.get("sourcePlatform") ?? "");
  return {
    title: formData.get("title"),
    slug: formData.get("slug"),
    body: String(formData.get("body") ?? ""),
    contentType: formData.get("contentType"),
    language: formData.get("language"),
    featured: formData.get("featured"),
    composedOn: formData.get("composedOn"),
    originalPublishedAt: formData.get("originalPublishedAt"),
    collectionIds: formData.getAll("collectionIds").map(String),
    tagIds: formData.getAll("tagIds").map(String),
    source: platform
      ? {
          platform,
          url: formData.get("sourceUrl"),
          originalTitle: formData.get("sourceOriginalTitle"),
          originalPublishedAt: formData.get("originalPublishedAt"),
          retrievalMethod: formData.get("sourceRetrievalMethod"),
          notes: formData.get("sourceNotes"),
        }
      : null,
    changeReason: formData.get("changeReason"),
  };
}

// ─── Review decisions ────────────────────────────────────────────────────

export const approveInputSchema = z.object({
  permissionStatus: z.enum([PermissionStatus.GRANTED, PermissionStatus.AUTHOR_SUBMITTED], {
    errorMap: () => ({ message: "Choose how permission was given" }),
  }),
  permissionNote: z
    .string()
    .trim()
    .min(10, "Describe how and when permission was given (at least 10 characters)")
    .max(1000),
  confirmAuthorship: z.literal(true, {
    errorMap: () => ({ message: "Confirm that this is the writer's own work" }),
  }),
  sourceVerified: z.boolean().default(false),
  verificationNote: z.string().trim().max(1000).optional().default(""),
});

export type ApproveInput = z.infer<typeof approveInputSchema>;

export const reviewChangeSchema = z.object({
  reviewStatus: z.enum(["DISCOVERED", "NEEDS_VERIFICATION", "PERMISSION_PENDING", "REJECTED"]),
  permissionStatus: z.nativeEnum(PermissionStatus).optional(),
  note: z.string().trim().max(1000).optional().default(""),
});

export type ReviewChangeInput = z.infer<typeof reviewChangeSchema>;

export const scheduleInputSchema = z.object({
  scheduledFor: z
    .string()
    .min(1, "Choose a date and time")
    .transform((value) => new Date(value))
    .refine((date) => !Number.isNaN(date.getTime()), "Choose a valid date and time"),
});
