"use server";

import { revalidatePath } from "next/cache";
import { errorToState, type ActionState } from "@/lib/admin/action-state";
import { requireAdmin } from "@/lib/auth/admin";
import { importRows, type ImportOutcome } from "@/lib/import/run";
import { parseImport, type ParsedImport } from "@/lib/import/schema";

export type ImportState = ActionState & {
  stage?: "preview" | "done";
  format?: "json" | "csv";
  raw?: string;
  preview?: {
    valid: { index: number; label: string; contentType: string; platform: string; reviewStatus: string; hasText: boolean }[];
    errors: ParsedImport["errors"];
  };
  outcome?: ImportOutcome;
};

const MAX_BYTES = 1_000_000;

async function readInput(formData: FormData): Promise<{ raw: string; format: "json" | "csv" } | { error: string }> {
  const file = formData.get("file");
  let raw = String(formData.get("raw") ?? "");
  let format = String(formData.get("format") ?? "") as "json" | "csv" | "";

  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_BYTES) return { error: "The file is larger than 1 MB. Split it into smaller files." };
    raw = await file.text();
    if (!format) format = file.name.toLowerCase().endsWith(".csv") ? "csv" : "json";
  }
  if (!raw.trim()) return { error: "Choose a JSON or CSV file, or paste its contents." };
  if (raw.length > MAX_BYTES) return { error: "The text is larger than 1 MB. Split it into smaller files." };
  if (!format) format = raw.trim().startsWith("[") || raw.trim().startsWith("{") ? "json" : "csv";
  return { raw, format };
}

export async function previewImportAction(_prev: ImportState, formData: FormData): Promise<ImportState> {
  await requireAdmin();
  const input = await readInput(formData);
  if ("error" in input) return { status: "error", message: input.error };

  const parsed = parseImport(input.raw, input.format);
  if (parsed.fatal) return { status: "error", message: parsed.fatal };

  return {
    status: parsed.rows.length ? "success" : "error",
    message: parsed.rows.length
      ? `${parsed.rows.length} rows are ready to import${parsed.errors.length ? `; ${parsed.errors.length} rows have problems and will be skipped` : ""}.`
      : "No rows could be imported. Fix the problems below and try again.",
    stage: "preview",
    format: input.format,
    raw: input.raw,
    preview: {
      valid: parsed.rows.slice(0, 200).map(({ index, row }) => ({
        index,
        label: row.title ?? (row.text.split("\n")[0]?.slice(0, 80) || row.sourceUrl || "(untitled)"),
        contentType: row.contentType,
        platform: row.sourcePlatform,
        reviewStatus: row.reviewStatus,
        hasText: row.text.trim().length > 0,
      })),
      errors: parsed.errors,
    },
  };
}

export async function confirmImportAction(_prev: ImportState, formData: FormData): Promise<ImportState> {
  const admin = await requireAdmin();
  const raw = String(formData.get("raw") ?? "");
  const format = formData.get("format") === "csv" ? "csv" : "json";
  // Validate again on the server — never trust what came back from the browser.
  const parsed = parseImport(raw, format);
  if (parsed.fatal) return { status: "error", message: parsed.fatal };
  try {
    const outcome = await importRows(parsed.rows, admin);
    revalidatePath("/", "layout");
    return {
      status: "success",
      stage: "done",
      message: `Imported ${outcome.created.length} works as drafts for review${outcome.skipped.length ? `; skipped ${outcome.skipped.length}` : ""}.`,
      outcome,
    };
  } catch (error) {
    return errorToState(error);
  }
}
