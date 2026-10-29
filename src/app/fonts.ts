import localFont from "next/font/local";

// Fonts are self-hosted from npm packages (no requests to Google at runtime or build time).
// next/font preloads them and sizes a fallback font to match, which prevents layout shift.

export const playfair = localFont({
  src: [
    { path: "../../node_modules/@fontsource-variable/playfair-display/files/playfair-display-latin-wght-normal.woff2", style: "normal", weight: "400 900" },
    { path: "../../node_modules/@fontsource-variable/playfair-display/files/playfair-display-latin-wght-italic.woff2", style: "italic", weight: "400 900" },
  ],
  variable: "--font-playfair",
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

export const fontVariables = [playfair.variable, cormorant.variable, inter.variable, devanagari.variable].join(" ");
