import { z } from "zod";
import { SLUG_PATTERN } from "@/lib/works/slug";
import { checkbox, httpUrl, optionalText, requiredText } from "./helpers";

const optionalSlug = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  z
    .string()
    .trim()
    .toLowerCase()
    .max(80)
    .regex(SLUG_PATTERN, "Use lowercase letters, numbers and single hyphens")
    .nullable(),
);

export const collectionInputSchema = z.object({
  name: requiredText(120, "Name"),
  slug: optionalSlug,
  description: optionalText(300, "Description"),
  introduction: optionalText(3000, "Introduction"),
  isPublished: checkbox.default(false),
  sortOrder: z.coerce.number().int().min(-1000).max(1000).default(0),
});

export type CollectionInput = z.infer<typeof collectionInputSchema>;

export const tagInputSchema = z.object({
  name: requiredText(60, "Name"),
  slug: optionalSlug,
  description: optionalText(300, "Description"),
});

export type TagInput = z.infer<typeof tagInputSchema>;

export const profileLinkSchema = z.object({
  label: requiredText(60, "Link label"),
  url: httpUrl,
});

export const authorProfileInputSchema = z.object({
  displayName: requiredText(120, "Name"),
  shortIntro: optionalText(1000, "Short introduction"),
  biography: optionalText(10_000, "Biography"),
  writingPhilosophy: optionalText(5000, "Writing philosophy"),
  links: z.array(profileLinkSchema).max(8, "Add at most 8 links").default([]),
  // keep: leave approval as it is (but editing the text clears it) · approve · withdraw
  approval: z.enum(["keep", "approve", "withdraw"]).default("keep"),
  profileApprovalNote: optionalText(300, "Approval note"),
});

export type AuthorProfileInput = z.infer<typeof authorProfileInputSchema>;

export const loginInputSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter your email address").max(200),
  password: z.string().min(1, "Enter your password").max(200),
});
