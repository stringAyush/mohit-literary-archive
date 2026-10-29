import { z } from "zod";

/** Field name → first error message, ready to show next to form fields. */
export type FieldErrors = Record<string, string>;

export function toFieldErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

const emptyToNull = (value: unknown) =>
  value === undefined || value === null || (typeof value === "string" && value.trim() === "") ? null : value;

/** Optional text: "" becomes null, other values are trimmed and length-checked. */
export const optionalText = (max: number, label = "This field") =>
  z.preprocess(emptyToNull, z.string().trim().max(max, `${label} must be ${max} characters or fewer`).nullable());

export const requiredText = (max: number, label: string) =>
  z
    .string({ required_error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be ${max} characters or fewer`);

/** yyyy-mm-dd from <input type="date">, stored as a calendar date. */
export const optionalCalendarDate = z.preprocess(
  emptyToNull,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the format YYYY-MM-DD")
    .transform((value) => new Date(`${value}T00:00:00.000Z`))
    .refine((date) => !Number.isNaN(date.getTime()), "Enter a real date")
    .nullable(),
);

export const checkbox = z.preprocess(
  (value) => value === "on" || value === "true" || value === true,
  z.boolean(),
);

export const httpUrl = z
  .string()
  .trim()
  .max(500)
  .url("Enter a full web address starting with https://")
  .refine((value) => /^https?:\/\//i.test(value), "Only http and https addresses are allowed");

export const optionalHttpUrl = z.preprocess(emptyToNull, httpUrl.nullable());
