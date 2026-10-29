import { createHash } from "node:crypto";

/**
 * The canonical text representation used for fingerprints:
 *
 *   1. Unicode normalised to NFC
 *   2. Windows/Mac line endings converted to "\n"
 *   3. Title (or empty string), then a blank line, then the body
 *
 * Nothing else is changed — spacing and punctuation are kept exactly.
 * The SHA-256 of this text identifies this exact wording. It does NOT prove
 * who wrote it, when it was written, or who owns it.
 */
export function canonicalText(title: string | null | undefined, body: string): string {
  const normalise = (value: string) => value.normalize("NFC").replace(/\r\n?/g, "\n");
  return `${normalise(title ?? "")}\n\n${normalise(body)}`;
}

export function contentHash(title: string | null | undefined, body: string): string {
  return createHash("sha256").update(canonicalText(title, body), "utf8").digest("hex");
}

/** Normalises line endings only — used before saving text. */
export function normaliseLineEndings(text: string): string {
  return text.replace(/\r\n?/g, "\n");
}
