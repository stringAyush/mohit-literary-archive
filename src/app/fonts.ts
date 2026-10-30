import localFont from "next/font/local";

// Fonts are self-hosted from npm packages (no requests to Google at runtime or build time).
// next/font preloads them and sizes a fallback font to match, which prevents layout shift.

export const instrumentSerif = localFont({
  src: [
    { path: "../../node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2", style: "normal", weight: "400" },
    { path: "../../node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2", style: "italic", weight: "400" },
  ],
  variable: "--font-instrument",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

export const cormorant = localFont({
  src: [
    { path: "../../node_modules/@fontsource-variable/cormorant-garamond/files/cormorant-garamond-latin-wght-normal.woff2", style: "normal", weight: "300 700" },
    { path: "../../node_modules/@fontsource-variable/cormorant-garamond/files/cormorant-garamond-latin-wght-italic.woff2", style: "italic", weight: "300 700" },
  ],
  variable: "--font-cormorant",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

export const geist = localFont({
  src: [
    { path: "../../node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2", style: "normal", weight: "100 900" },
    { path: "../../node_modules/geist/dist/fonts/geist-sans/Geist-Italic[wght].woff2", style: "italic", weight: "100 900" },
  ],
  variable: "--font-geist",
  display: "swap",
  adjustFontFallback: "Arial",
});

export const inter = localFont({
  src: [{ path: "../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2", style: "normal", weight: "100 900" }],
  variable: "--font-inter",
  display: "swap",
  adjustFontFallback: "Arial",
});

// Hindi and Marathi text (Devanagari script) falls back to this serif.
export const devanagari = localFont({
  src: [{ path: "../../node_modules/@fontsource-variable/noto-serif-devanagari/files/noto-serif-devanagari-devanagari-wght-normal.woff2", style: "normal", weight: "100 900" }],
  variable: "--font-devanagari",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});

export const fontVariables = [
  instrumentSerif.variable,
  cormorant.variable,
  geist.variable,
  inter.variable,
  devanagari.variable,
].join(" ");
