import { z } from "zod";
import { LANGUAGE_CODES } from "@/lib/constants";
import { csvToRecords } from "./csv";

// One row of an import file (JSON or CSV). See content/import-template.csv.

const blankToUndefined = (value: unknown) =>
  value === null || value === undefined || (typeof value === "string" && value.trim() === "") ? undefined : value;

const enumFromText = <const T extends string>(values: readonly [T, ...T[]], label: string) =>
  z.preprocess(
    (value) => (typeof value === "string" ? value.trim().toUpperCase().replace(/[\s-]+/g, "_") : value),
    z.enum(values, { errorMap: () => ({ message: `${label} must be one of: ${values.join(", ").toLowerCase()}` }) }),
  );

const calendarDate = z.preprocess(
  blankToUndefined,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Dates must look like 2021-03-14")
    .optional(),
);

const listField = z.preprocess((value) => {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") return value.split(";").map((s) => s.trim()).filter(Boolean);
  return [];
}, z.array(z.string().max(60)).max(20));

export const importRowSchema = z
  .object({
    title: z.preprocess(blankToUndefined, z.string().trim().max(200).optional()),
    text: z.preprocess((v) => (typeof v === "string" ? v.replace(/\r\n?/g, "\n") : ""), z.string().max(50_000)),
    contentType: enumFromText(["QUOTE", "POEM", "APHORISM", "REFLECTION", "SHORT_PIECE"], "contentType"),
    language: z.preprocess((v) => blankToUndefined(v) ?? "en", z.enum(LANGUAGE_CODES)),
    sourcePlatform: enumFromText(
      ["YOURQUOTE", "LINKEDIN", "INSTAGRAM", "PERSONAL_SUBMISSION", "PRINT", "OTHER"],
      "sourcePlatform",
    ),
    sourceUrl: z.preprocess(
      blankToUndefined,
      z.string().trim().url("sourceUrl must be a full https:// address").max(500).optional(),
    ),
    originalPublishedAt: calendarDate,
    composedOn: calendarDate,
    themes: listField,
    collections: listField,
    reviewStatus: z.preprocess(
      (v) => blankToUndefined(v) ?? "NEEDS_VERIFICATION",
      enumFromText(["DISCOVERED", "NEEDS_VERIFICATION", "PERMISSION_PENDING"], "reviewStatus"),
    ),
    permissionStatus: z.preprocess(
      (v) => blankToUndefined(v) ?? "UNKNOWN",
      enumFromText(["UNKNOWN", "REQUESTED", "GRANTED", "AUTHOR_SUBMITTED", "DENIED"], "permissionStatus"),
    ),
    permissionNote: z.preprocess(blankToUndefined, z.string().trim().max(1000).optional()),
    notes: z.preprocess(blankToUndefined, z.string().trim().max(2000).optional()),
  })
  .superRefine((row, ctx) => {
    if (row.text.trim() === "" && row.reviewStatus !== "DISCOVERED") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["text"],
        message: 'Rows without text must use reviewStatus "discovered"',
      });
    }
    if (row.text.trim() === "" && !row.sourceUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sourceUrl"],
        message: "A row without text needs a sourceUrl so it can be found again",
      });
    }
  });

export type ImportRow = z.infer<typeof importRowSchema>;

export type ParsedImport = {
  rows: { index: number; row: ImportRow }[];
  errors: { index: number; messages: string[] }[];
  fatal?: string;
};

export const MAX_IMPORT_ROWS = 500;

/** Reads a JSON array, {"works": [...]}, or CSV text, and validates every row. */
export function parseImport(raw: string, format: "json" | "csv"): ParsedImport {
  let records: unknown[];
  try {
    if (format === "json") {
      const data = JSON.parse(raw);
      records = Array.isArray(data) ? data : Array.isArray(data?.works) ? data.works : [];
      if (!Array.isArray(data) && !Array.isArray(data?.works)) {
        return { rows: [], errors: [], fatal: 'JSON must be an array of works or an object with a "works" array.' };
      }
    } else {
      records = csvToRecords(raw);
    }
  } catch (error) {
    return { rows: [], errors: [], fatal: error instanceof Error ? error.message : "The file could not be read." };
  }

  if (records.length === 0) return { rows: [], errors: [], fatal: "The file has no rows to import." };
  if (records.length > MAX_IMPORT_ROWS) {
    return { rows: [], errors: [], fatal: `Import at most ${MAX_IMPORT_ROWS} rows at a time.` };
  }

  const result: ParsedImport = { rows: [], errors: [] };
  records.forEach((record, i) => {
    const index = i + 1;
    const parsed = importRowSchema.safeParse(record);
    if (parsed.success) result.rows.push({ index, row: parsed.data });
    else result.errors.push({ index, messages: parsed.error.issues.map((issue) => `${issue.path.join(".") || "row"}: ${issue.message}`) });
  });
  return result;
}
