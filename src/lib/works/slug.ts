// Slugs are the permanent part of a work's address: /works/<slug>.
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const SLUG_MAX_LENGTH = 80;

/** Turns "The Weight of Rain!" into "the-weight-of-rain". Non-Latin text may produce "". */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/-+$/g, "");
}

/** A readable starting point for a slug: the title, or else the first words of the text. */
export function suggestSlug(title: string | null | undefined, body: string): string {
  const fromTitle = title ? slugify(title) : "";
  if (fromTitle) return fromTitle;
  const firstWords = body.trim().split(/\s+/).slice(0, 8).join(" ");
  return slugify(firstWords);
}

export function isValidSlug(slug: string): boolean {
  return slug.length > 0 && slug.length <= SLUG_MAX_LENGTH && SLUG_PATTERN.test(slug);
}

/**
 * Finds a free slug by adding -2, -3, ... when needed.
 * `isTaken` checks both current slugs and old (redirecting) slugs.
 */
export async function ensureUniqueSlug(
  base: string,
  isTaken: (candidate: string) => Promise<boolean>,
  fallbackPrefix = "work",
): Promise<string> {
  const start = base || `${fallbackPrefix}-${Date.now().toString(36)}`;
  if (!(await isTaken(start))) return start;
  for (let n = 2; n < 1000; n++) {
    const suffix = `-${n}`;
    const candidate = `${start.slice(0, SLUG_MAX_LENGTH - suffix.length)}${suffix}`;
    if (!(await isTaken(candidate))) return candidate;
  }
  throw new Error("Could not find a free slug");
}
