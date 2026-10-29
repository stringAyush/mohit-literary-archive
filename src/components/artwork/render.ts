import { fitText, type FitResult } from "@/lib/artwork/layout";
import {
  FORMATS,
  LINE_HEIGHT,
  MAX_FONT_SIZE,
  MIN_FONT_SIZE,
  TONES,
  textBox,
  type ArtworkFormat,
  type ArtworkTemplate,
  type ArtworkTone,
} from "@/lib/artwork/templates";

// Draws quote artwork on a <canvas>. All positions are in base pixels (1080 wide);
// `scale` multiplies everything for high-resolution export.

export type Fonts = { editorial: string; italic: string; display: string; sans: string };

export type CardSpec = {
  body: string;
  title: string | null;
  author: string;
  label: string;
  url: string | null;
  copyright: string | null;
  isPoem: boolean;
  format: ArtworkFormat;
  template: ArtworkTemplate;
  tone: ArtworkTone;
};

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** The first family in a CSS font-family list, e.g. "cormorant" from '"cormorant","cormorant Fallback"'. */
function primaryFamily(list: string): string {
  return list.split(",")[0]?.trim() || "serif";
}

/**
 * Reads the font families next/font registered, and waits until they are loaded.
 * Only the real, self-hosted fonts are awaited: next/font's size-matched fallback faces
 * point at system fonts (Times New Roman, Arial) that some devices don't have, and a
 * missing fallback must not stop the artwork from being drawn.
 */
export async function loadFonts(sampleText: string): Promise<Fonts> {
  const cormorant = cssVar("--font-cormorant") || "Georgia";
  const devanagari = cssVar("--font-devanagari");
  const fonts: Fonts = {
    editorial: [cormorant, devanagari, "Georgia", "serif"].filter(Boolean).join(", "),
    italic: [cormorant, "Georgia", "serif"].join(", "),
    display: [cssVar("--font-playfair"), "Georgia", "serif"].filter(Boolean).join(", "),
    sans: [cssVar("--font-inter"), "system-ui", "sans-serif"].filter(Boolean).join(", "),
  };
  const editorial = primaryFamily(cormorant);
  const requests = [
    `400 48px ${editorial}`,
    `italic 400 34px ${editorial}`,
    `500 40px ${primaryFamily(fonts.display)}`,
    `500 20px ${primaryFamily(fonts.sans)}`,
  ];
  await Promise.allSettled([
    ...requests.map((font) => document.fonts.load(font)),
    // Devanagari (Hindi, Marathi) glyphs come from a second font, loaded only if needed.
    devanagari ? document.fonts.load(`400 48px ${primaryFamily(devanagari)}`, sampleText || "अ") : Promise.resolve([]),
  ]);
  await document.fonts.ready;
  if (!requests.every((font) => document.fonts.check(font))) {
    throw new Error("Fonts unavailable");
  }
  return fonts;
}

export function computeLayout(ctx: CanvasRenderingContext2D, spec: CardSpec, fonts: Fonts): FitResult | null {
  const box = textBox(spec.template, spec.format, Boolean(spec.title));
  const measure = (text: string, size: number) => {
    ctx.font = `400 ${size}px ${fonts.editorial}`;
    return ctx.measureText(text).width;
  };
  return fitText(spec.body, measure, {
    maxWidth: box.width,
    maxHeight: box.height,
    minFontSize: MIN_FONT_SIZE,
    maxFontSize: MAX_FONT_SIZE,
    lineHeight: LINE_HEIGHT,
    continuationIndent: spec.isPoem && box.align === "left" ? 1.2 : 0,
  });
}

function setSpacing(ctx: CanvasRenderingContext2D, value: string) {
  // letterSpacing is supported by modern browsers; older ones simply ignore it.
  if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = value;
}

export function drawCard(
  ctx: CanvasRenderingContext2D,
  spec: CardSpec,
  fonts: Fonts,
  layout: FitResult,
  scale: number,
) {
  const { width, height } = FORMATS[spec.format];
  const tone = TONES[spec.tone];
  const box = textBox(spec.template, spec.format, Boolean(spec.title));
  const centerX = width / 2;

  ctx.save();
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.textBaseline = "middle";

  // Background
  ctx.fillStyle = tone.background;
  ctx.fillRect(0, 0, width, height);

  const eyebrow = (text: string, x: number, y: number, align: CanvasTextAlign) => {
    ctx.font = `500 19px ${fonts.sans}`;
    ctx.fillStyle = tone.muted;
    ctx.textAlign = align;
    setSpacing(ctx, "5px");
    ctx.fillText(text.toUpperCase(), x, y);
    setSpacing(ctx, "0px");
  };

  // Template furniture
  if (spec.template === "editorial") {
    eyebrow(spec.label, centerX, 112, "center");
    ctx.fillStyle = tone.accent;
    ctx.fillRect(centerX - 24, 142, 48, 2);
  } else if (spec.template === "margin") {
    ctx.fillStyle = tone.accent;
    ctx.fillRect(130, 170, 2, height - 170 - 230);
    eyebrow(spec.label, 190, 112, "left");
  } else {
    ctx.strokeStyle = tone.frame;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(56, 56, width - 112, height - 112);
    ctx.strokeRect(68, 68, width - 136, height - 136);
    eyebrow(spec.label, centerX, 140, "center");
  }

  // Title
  if (spec.title) {
    ctx.font = `500 40px ${fonts.display}`;
    ctx.fillStyle = tone.text;
    ctx.textAlign = box.align === "left" ? "left" : "center";
    ctx.fillText(spec.title, box.align === "left" ? box.x : centerX, box.y - 52, box.width);
  }

  // The text itself, vertically centred in its box
  const lineHeightPx = layout.fontSize * LINE_HEIGHT;
  const startY = box.y + (box.height - layout.height) / 2;
  ctx.font = `400 ${layout.fontSize}px ${fonts.editorial}`;
  ctx.fillStyle = tone.text;
  ctx.textAlign = box.align === "left" ? "left" : "center";
  layout.lines.forEach((line, index) => {
    const y = startY + (index + 0.5) * lineHeightPx;
    const indent = line.continuation && box.align === "left" && spec.isPoem ? layout.fontSize * 1.2 : 0;
    const x = box.align === "left" ? box.x + indent : centerX;
    ctx.fillText(line.text, x, y);
  });

  // Attribution and footer
  const footerAlign: CanvasTextAlign = spec.template === "margin" ? "left" : "center";
  const footerX = spec.template === "margin" ? 190 : centerX;
  const attributionY = height - (spec.template === "folio" ? 190 : 170);
  ctx.font = `italic 400 36px ${fonts.italic}`;
  ctx.fillStyle = tone.text;
  ctx.textAlign = footerAlign;
  ctx.fillText(`— ${spec.author}`, footerX, attributionY);

  ctx.font = `400 19px ${fonts.sans}`;
  ctx.fillStyle = tone.muted;
  let footerY = height - (spec.template === "folio" ? 128 : 104);
  if (spec.url) {
    ctx.fillText(spec.url.replace(/^https?:\/\//, ""), footerX, footerY, width - 2 * (spec.template === "margin" ? 190 : 120));
    footerY += 32;
  }
  if (spec.copyright) {
    ctx.fillText(spec.copyright, footerX, footerY);
  }

  ctx.restore();
}
