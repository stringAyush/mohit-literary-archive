export type Excerpt = {
  text: string;
  /** True when the excerpt is shorter than the full work — the UI must say so. */
  truncated: boolean;
};

/**
 * A short opening for previews. Keeps whole lines where possible so poems are not cut mid-line.
 * Never used on a work's own page, which always shows the full text.
 */
export function makeExcerpt(body: string, maxLines = 6, maxChars = 320): Excerpt {
  const text = body.replace(/\r\n?/g, "\n").trim();
  const lines = text.split("\n");
  let result = "";
  let lineCount = 0;

  for (const line of lines) {
    const next = result ? `${result}\n${line}` : line;
    if (lineCount >= maxLines || next.length > maxChars) break;
    result = next;
    lineCount++;
  }

  if (!result) {
    // The first line alone is too long: cut at a word boundary.
    const cut = text.slice(0, maxChars);
    const lastSpace = cut.lastIndexOf(" ");
    result = (lastSpace > maxChars * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd();
  }

  result = result.replace(/\n{3,}/g, "\n\n").trimEnd();
  return { text: result, truncated: result.length < text.length };
}

/** One line of plain text for meta descriptions and search results. */
export function oneLineSummary(body: string, maxChars = 155): string {
  const flat = body.replace(/\s+/g, " ").trim();
  if (flat.length <= maxChars) return flat;
  const cut = flat.slice(0, maxChars - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > maxChars * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}
