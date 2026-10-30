"use client";

import { useState } from "react";
import { saveHomepageConfigAction } from "@/app/admin/actions/site";
import { FormMessage } from "./FormMessage";
import { useActionForm } from "./useActionForm";
import type { HomepageConfig } from "@/lib/settings/service";

export type FeaturedWorkOption = {
  id: string;
  title: string | null;
  slug: string;
  contentType: string;
};

export function HomepageCustomizerForm({
  config,
  works,
}: {
  config: HomepageConfig;
  works: FeaturedWorkOption[];
}) {
  const { state, isPending, onSubmit } = useActionForm(saveHomepageConfigAction);
  const [marqueeEnabled, setMarqueeEnabled] = useState(config.marqueeEnabled);
  const [showAuthorNote, setShowAuthorNote] = useState(config.showAuthorNote);

  return (
    <form onSubmit={onSubmit} className="space-y-8 max-w-3xl">
      <FormMessage state={state} />

      {/* ─── Hero Section ─── */}
      <fieldset className="border hairline bg-surface p-6 rounded-2xl shadow-xs space-y-5">
        <legend className="font-display text-xl font-normal text-ink px-2">Hero Section</legend>

        <div>
          <label htmlFor="heroHeadline" className="field-label">
            Main Headline
          </label>
          <input
            id="heroHeadline"
            name="heroHeadline"
            type="text"
            defaultValue={config.heroHeadline}
            placeholder="Some things are better left in words."
            className="input font-display text-lg"
            required
          />
          <p className="field-hint">The primary headline displayed prominently on the homepage.</p>
        </div>

        <div>
          <label htmlFor="heroSubtitle" className="field-label">
            Editorial Subtitle
          </label>
          <textarea
            id="heroSubtitle"
            name="heroSubtitle"
            rows={2}
            defaultValue={config.heroSubtitle}
            placeholder="An evolving collection of thoughts, poems, fragments, and observations."
            className="input"
            required
          />
          <p className="field-hint">The literary summary text below the headline.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t hairline">
          <div>
            <label htmlFor="heroCtaText" className="field-label">
              Primary Button Label
            </label>
            <input
              id="heroCtaText"
              name="heroCtaText"
              type="text"
              defaultValue={config.heroCtaText}
              placeholder="Enter the archive"
              className="input text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="heroCtaHref" className="field-label">
              Primary Button Link
            </label>
            <input
              id="heroCtaHref"
              name="heroCtaHref"
              type="text"
              defaultValue={config.heroCtaHref}
              placeholder="/works"
              className="input text-sm"
              required
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 pt-2">
          <div>
            <label htmlFor="heroSecondaryText" className="field-label">
              Secondary Button Label
            </label>
            <input
              id="heroSecondaryText"
              name="heroSecondaryText"
              type="text"
              defaultValue={config.heroSecondaryText}
              placeholder="About the writer"
              className="input text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="heroSecondaryHref" className="field-label">
              Secondary Button Link
            </label>
            <input
              id="heroSecondaryHref"
              name="heroSecondaryHref"
              type="text"
              defaultValue={config.heroSecondaryHref}
              placeholder="/about"
              className="input text-sm"
              required
            />
          </div>
        </div>
      </fieldset>

      {/* ─── Kinetic Marquee Ticker ─── */}
      <fieldset className="border hairline bg-surface p-6 rounded-2xl shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <legend className="font-display text-xl font-normal text-ink px-2">
            Dynamic Category Marquee Ticker
          </legend>
          <label className="flex items-center gap-2 cursor-pointer font-sans text-xs font-medium text-ink">
            <input
              type="checkbox"
              name="marqueeEnabled"
              checked={marqueeEnabled}
              onChange={(e) => setMarqueeEnabled(e.target.checked)}
              className="checkbox"
            />
            <span>Enable Marquee</span>
          </label>
        </div>

        {marqueeEnabled && (
          <div>
            <label htmlFor="marqueeItems" className="field-label">
              Ticker Items (one per line or comma-separated)
            </label>
            <textarea
              id="marqueeItems"
              name="marqueeItems"
              rows={4}
              defaultValue={config.marqueeItems.join("\n")}
              placeholder={"Poetry & Ghazals\nMicro-Fiction & Stories\nReflections & Prose\nBook Photography"}
              className="input font-mono text-xs"
            />
            <p className="field-hint">
              These items scroll continuously in the kinetic ribbon below the hero.
            </p>
          </div>
        )}
      </fieldset>

      {/* ─── Featured Highlight & Author Note ─── */}
      <fieldset className="border hairline bg-surface p-6 rounded-2xl shadow-xs space-y-5">
        <legend className="font-display text-xl font-normal text-ink px-2">
          Featured Highlight &amp; Author Note
        </legend>

        <div>
          <label htmlFor="featuredWorkId" className="field-label">
            Featured Highlight Work
          </label>
          <select
            id="featuredWorkId"
            name="featuredWorkId"
            defaultValue={config.featuredWorkId || ""}
            className="input"
          >
            <option value="">Auto-select latest featured work</option>
            {works.map((w) => (
              <option key={w.id} value={w.id}>
                [{w.contentType}] {w.title || w.slug}
              </option>
            ))}
          </select>
          <p className="field-hint">
            Choose which work appears in the large quotation spotlight on the homepage.
          </p>
        </div>

        <div className="pt-2 border-t hairline flex items-center justify-between">
          <div>
            <p className="field-label mb-0">Author Note Section</p>
            <p className="field-hint mt-0.5">
              Display &quot;Behind the words&quot; author introduction on the homepage.
            </p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer font-sans text-xs font-medium text-ink">
            <input
              type="checkbox"
              name="showAuthorNote"
              checked={showAuthorNote}
              onChange={(e) => setShowAuthorNote(e.target.checked)}
              className="checkbox"
            />
            <span>Show Section</span>
          </label>
        </div>
      </fieldset>

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="btn btn-primary min-h-11 px-6 text-sm font-semibold shadow-xs"
        >
          {isPending ? "Saving changes..." : "Save Homepage Customization"}
        </button>
      </div>
    </form>
  );
}
