"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FitResult } from "@/lib/artwork/layout";
import {
  EXPORT_SCALE,
  FORMATS,
  TEMPLATES,
  TONES,
  type ArtworkFormat,
  type ArtworkTemplate,
  type ArtworkTone,
} from "@/lib/artwork/templates";
import { computeLayout, drawCard, loadFonts, type CardSpec, type Fonts } from "./render";

type Props = {
  slug: string;
  body: string;
  title: string | null;
  author: string;
  label: string;
  url: string;
  copyright: string;
  isPoem: boolean;
};

function Choice<T extends string>({
  legend,
  name,
  value,
  options,
  onChange,
}: {
  legend: string;
  name: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="eyebrow mb-3 text-[0.6875rem]">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={`inline-flex min-h-11 items-center border px-4 font-sans text-sm transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent ${
              value === option.value ? "border-ink bg-ink text-paper" : "border-line bg-surface text-ink hover:border-ink"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function ArtworkStudio({ slug, body, title, author, label, url, copyright, isPoem }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fonts, setFonts] = useState<Fonts | null>(null);
  const [fontError, setFontError] = useState(false);
  const [format, setFormat] = useState<ArtworkFormat>(body.split("\n").length > 6 ? "portrait" : "square");
  const [template, setTemplate] = useState<ArtworkTemplate>("editorial");
  const [tone, setTone] = useState<ArtworkTone>("paper");
  const [showTitle, setShowTitle] = useState(Boolean(title));
  const [showUrl, setShowUrl] = useState(true);
  const [showCopyright, setShowCopyright] = useState(true);
  const [layout, setLayout] = useState<FitResult | null | undefined>(undefined);
  const [downloading, setDownloading] = useState(false);

  const spec: CardSpec = useMemo(
    () => ({
      body,
      title: showTitle ? title : null,
      author,
      label,
      url: showUrl ? url : null,
      copyright: showCopyright ? copyright : null,
      isPoem,
      format,
      template,
      tone,
    }),
    [body, title, author, label, url, copyright, isPoem, format, template, tone, showTitle, showUrl, showCopyright],
  );

  // Fonts must be ready before drawing, or the canvas would use a fallback font.
  useEffect(() => {
    let cancelled = false;
    loadFonts(body)
      .then((loaded) => !cancelled && setFonts(loaded))
      .catch(() => !cancelled && setFontError(true));
    return () => {
      cancelled = true;
    };
  }, [body]);

  // Redraw the preview whenever an option changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !fonts) return;
    const { width, height } = FORMATS[spec.format];
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const result = computeLayout(ctx, spec, fonts);
    setLayout(result);
    if (result) drawCard(ctx, spec, fonts, result, 1);
    else {
      ctx.fillStyle = TONES[spec.tone].background;
      ctx.fillRect(0, 0, width, height);
    }
  }, [spec, fonts]);

  async function download() {
    if (!fonts || !layout) return;
    setDownloading(true);
    try {
      const { width, height } = FORMATS[spec.format];
      const canvas = document.createElement("canvas");
      canvas.width = width * EXPORT_SCALE;
      canvas.height = height * EXPORT_SCALE;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");
      const exportLayout = computeLayout(ctx, spec, fonts);
      if (!exportLayout) throw new Error("Text does not fit");
      drawCard(ctx, spec, fonts, exportLayout, EXPORT_SCALE);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("Export failed");
      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = `${slug}-${spec.format}-${spec.template}-${spec.tone}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(href), 1000);
    } finally {
      setDownloading(false);
    }
  }

  const { width, height } = FORMATS[format];
  const tooLong = layout === null;

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-14">
      <div>
        <div
          className="relative mx-auto w-full border hairline bg-surface-2"
          style={{ maxWidth: format === "portrait" ? 560 : 640, aspectRatio: `${width} / ${height}` }}
        >
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={`Preview of quote artwork: ${title ? `${title}. ` : ""}${body.slice(0, 200)} — ${author}`}
            className="block h-full w-full"
          />
          {(!fonts || tooLong || fontError) && (
            <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
              <p className="max-w-sm font-sans text-sm text-muted" role="status">
                {fontError
                  ? "The fonts could not be loaded, so the artwork can't be drawn accurately. Please reload the page."
                  : !fonts
                    ? "Preparing fonts…"
                    : "This piece is too long to fit on an image at a readable size. Try the portrait format, or share a link to it instead."}
              </p>
            </div>
          )}
        </div>
        {layout && (
          <p className="mt-3 text-center font-sans text-xs text-muted">
            Preview · downloads as a {width * EXPORT_SCALE} × {height * EXPORT_SCALE} px PNG · text set at{" "}
            {layout.fontSize}px on {width}px
          </p>
        )}
      </div>

      <div className="space-y-7">
        <Choice
          legend="Format"
          name="format"
          value={format}
          onChange={setFormat}
          options={(Object.keys(FORMATS) as ArtworkFormat[]).map((v) => ({ value: v, label: FORMATS[v].label }))}
        />
        <Choice
          legend="Template"
          name="template"
          value={template}
          onChange={setTemplate}
          options={(Object.keys(TEMPLATES) as ArtworkTemplate[]).map((v) => ({ value: v, label: TEMPLATES[v].label }))}
        />
        <Choice
          legend="Tone"
          name="tone"
          value={tone}
          onChange={setTone}
          options={(Object.keys(TONES) as ArtworkTone[]).map((v) => ({ value: v, label: TONES[v].label }))}
        />
        <fieldset className="space-y-3">
          <legend className="eyebrow mb-3 text-[0.6875rem]">Include</legend>
          {title && (
            <label className="flex min-h-8 items-center gap-3 font-sans text-sm">
              <input type="checkbox" className="checkbox" checked={showTitle} onChange={(e) => setShowTitle(e.target.checked)} />
              Title
            </label>
          )}
          <label className="flex min-h-8 items-center gap-3 font-sans text-sm">
            <input type="checkbox" className="checkbox" checked={showUrl} onChange={(e) => setShowUrl(e.target.checked)} />
            Link to this piece
          </label>
          <label className="flex min-h-8 items-center gap-3 font-sans text-sm">
            <input
              type="checkbox"
              className="checkbox"
              checked={showCopyright}
              onChange={(e) => setShowCopyright(e.target.checked)}
            />
            Copyright line
          </label>
          <p className="font-sans text-xs text-muted">The writer&apos;s name is always included.</p>
        </fieldset>

        <button
          type="button"
          onClick={download}
          disabled={!layout || downloading}
          className="btn btn-primary w-full"
        >
          {downloading ? "Preparing image…" : "Download PNG"}
        </button>
      </div>
    </div>
  );
}
