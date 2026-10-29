// Text layout for quote artwork. Pure functions (no canvas), so they can be tested.
//
// The goal: the largest readable font size at which the whole text fits the box,
// keeping the writer's own line breaks. If even the smallest readable size does not
// fit, we say so — the text is never cropped or cut short.

/** Returns the rendered width of `text` at `fontSize` pixels. */
export type Measure = (text: string, fontSize: number) => number;

export type Line = { text: string; continuation: boolean };

export type FitOptions = {
  maxWidth: number;
  maxHeight: number;
  minFontSize: number;
  maxFontSize: number;
  lineHeight: number; // multiple of font size
  /** Indent for wrapped continuation lines, as a fraction of font size (poetry convention). */
  continuationIndent?: number;
};

export type FitResult = { fontSize: number; lines: Line[]; height: number };

/** Splits a word that is wider than the box into pieces that fit. */
function breakLongWord(word: string, fontSize: number, width: number, measure: Measure): string[] {
  const pieces: string[] = [];
  let current = "";
  for (const char of Array.from(word)) {
    if (current && measure(current + char, fontSize) > width) {
      pieces.push(current);
      current = char;
    } else {
      current += char;
    }
  }
  if (current) pieces.push(current);
  return pieces;
}

export function wrapText(text: string, fontSize: number, maxWidth: number, measure: Measure, indentFactor = 0): Line[] {
  const lines: Line[] = [];
  const indentWidth = indentFactor * fontSize;
  const paragraphs = text.replace(/\r\n?/g, "\n").replace(/\s+$/g, "").split("\n");

  for (const paragraph of paragraphs) {
    if (paragraph.trim() === "") {
      lines.push({ text: "", continuation: false }); // a stanza break
      continue;
    }
    // Keep leading spaces (some poems indent lines on purpose).
    const leading = paragraph.match(/^\s*/)?.[0] ?? "";
    const words = paragraph.trim().split(/\s+/);
    let current = leading;
    let continuation = false;

    const available = () => maxWidth - (continuation ? indentWidth : 0);
    const push = () => {
      lines.push({ text: current, continuation });
      continuation = true;
    };

    for (const word of words) {
      const candidate = current.trim() === "" ? `${current}${word}` : `${current} ${word}`;
      if (measure(candidate, fontSize) <= available()) {
        current = candidate;
        continue;
      }
      if (current.trim() !== "") {
        push();
        current = "";
      }
      if (measure(word, fontSize) <= available()) {
        current = word;
      } else {
        const pieces = breakLongWord(word, fontSize, available(), measure);
        pieces.slice(0, -1).forEach((piece) => {
          current = piece;
          push();
        });
        current = pieces[pieces.length - 1] ?? "";
      }
    }
    if (current !== "") lines.push({ text: current, continuation });
  }

  // Drop blank lines at the very start.
  while (lines.length && lines[0].text === "") lines.shift();
  return lines;
}

export function textBlockHeight(lineCount: number, fontSize: number, lineHeight: number): number {
  return lineCount * fontSize * lineHeight;
}

function largestFitting(
  low: number,
  high: number,
  attempt: (size: number) => FitResult | null,
): FitResult | null {
  let best: FitResult | null = null;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const result = attempt(mid);
    if (result) {
      best = result;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return best;
}

/**
 * Chooses a font size for the text:
 *  1. Prefer the largest size at which none of the writer's lines has to wrap,
 *     as long as it is readable and not much smaller than the size that fills the box.
 *  2. Otherwise, the largest size at which the (wrapped) text fits.
 *  3. If even the minimum size does not fit, return null — never crop.
 */
export function fitText(text: string, measure: Measure, options: FitOptions): FitResult | null {
  const indent = options.continuationIndent ?? 0;
  const min = Math.ceil(options.minFontSize);
  const max = Math.floor(options.maxFontSize);
  const writtenLines = text.replace(/\r\n?/g, "\n").replace(/\s+$/g, "").split("\n").length;

  const fits = (size: number) => {
    const lines = wrapText(text, size, options.maxWidth, measure, indent);
    const height = textBlockHeight(lines.length, size, options.lineHeight);
    return height <= options.maxHeight ? { fontSize: size, lines, height } : null;
  };
  const fitsUnwrapped = (size: number) => {
    const result = fits(size);
    return result && !result.lines.some((line) => line.continuation) && result.lines.length <= writtenLines
      ? result
      : null;
  };

  // Wrapping is not perfectly monotonic, so if the search finds nothing, try the minimum directly.
  const filled = largestFitting(min, max, fits) ?? fits(min);
  if (!filled) return null;
  const unwrapped = largestFitting(min, max, fitsUnwrapped);
  if (unwrapped && unwrapped.fontSize >= Math.max(min, filled.fontSize * 0.7)) return unwrapped;
  return filled;
}

/** Every character of the original text must appear in the laid-out lines (ignoring whitespace). */
export function layoutPreservesText(original: string, lines: Line[]): boolean {
  const strip = (s: string) => s.replace(/\s+/g, "");
  return strip(original) === strip(lines.map((l) => l.text).join(""));
}
