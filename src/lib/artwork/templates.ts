export type ArtworkFormat = "square" | "portrait";
export type ArtworkTemplate = "editorial" | "margin" | "folio";
export type ArtworkTone = "paper" | "light" | "dark";

export const FORMATS: Record<ArtworkFormat, { label: string; width: number; height: number }> = {
  square: { label: "Square (1:1)", width: 1080, height: 1080 },
  portrait: { label: "Portrait (4:5)", width: 1080, height: 1350 },
};

/** Exported PNGs are drawn at twice the base size: 2160 × 2160 or 2160 × 2700 pixels. */
export const EXPORT_SCALE = 2;

export const TEMPLATES: Record<ArtworkTemplate, { label: string; description: string }> = {
  editorial: { label: "Editorial", description: "Centred, with a fine rule" },
  margin: { label: "Margin", description: "Left-aligned beside a margin line" },
  folio: { label: "Folio", description: "Framed like a book page" },
};

export const TONES: Record<
  ArtworkTone,
  { label: string; background: string; text: string; muted: string; accent: string; frame: string }
> = {
  paper: { label: "Warm paper", background: "#F7F4EE", text: "#24221F", muted: "#6E685F", accent: "#A64B35", frame: "#DED8CD" },
  light: { label: "Light", background: "#FFFEFA", text: "#24221F", muted: "#6E685F", accent: "#A64B35", frame: "#E6E1D7" },
  dark: { label: "Dark", background: "#24221F", text: "#F7F4EE", muted: "#B8B5B0", accent: "#D9937E", frame: "#45413B" },
};

export type BoxSpec = { x: number; y: number; width: number; height: number; align: "center" | "left" };

/** Where the text may go for each template and format (in base 1080-wide pixels). */
export function textBox(template: ArtworkTemplate, format: ArtworkFormat, hasTitle: boolean): BoxSpec {
  const { width, height } = FORMATS[format];
  const titleSpace = hasTitle ? 80 : 0;
  switch (template) {
    case "margin":
      return { x: 190, y: 170 + titleSpace, width: width - 190 - 120, height: height - 170 - titleSpace - 230, align: "left" };
    case "folio":
      return { x: 170, y: 200 + titleSpace, width: width - 340, height: height - 200 - titleSpace - 260, align: "center" };
    case "editorial":
    default:
      return { x: 130, y: 190 + titleSpace, width: width - 260, height: height - 190 - titleSpace - 250, align: "center" };
  }
}

export const MIN_FONT_SIZE = 26;
export const MAX_FONT_SIZE = 76;
export const LINE_HEIGHT = 1.45;
