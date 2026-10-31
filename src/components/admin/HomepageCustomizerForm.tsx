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

  // Section Toggles State
  const [showHeroBadge, setShowHeroBadge] = useState(config.showHeroBadge ?? true);
  const [showContentsCard, setShowContentsCard] = useState(config.showContentsCard ?? true);
  const [marqueeEnabled, setMarqueeEnabled] = useState(config.marqueeEnabled ?? true);
  const [showFeaturedWork, setShowFeaturedWork] = useState(config.showFeaturedWork ?? true);
  const [showRecentWorks, setShowRecentWorks] = useState(config.showRecentWorks ?? true);
  const [showCollections, setShowCollections] = useState(config.showCollections ?? true);
  const [showPhotography, setShowPhotography] = useState(config.showPhotography ?? true);
  const [showAuthorNote, setShowAuthorNote] = useState(config.showAuthorNote ?? true);

  return (
    <form onSubmit={onSubmit} className="space-y-8 max-w-3xl">
      <FormMessage state={state} />

      {/* ─── 1. Hero Section ─── */}
      <fieldset className="border hairline bg-surface p-6 rounded-2xl shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <legend className="font-display text-xl font-normal text-ink px-2">Hero Section</legend>
          <span className="eyebrow text-xs">Above the fold</span>
        </div>

        {/* Hero Badge Toggle & Input */}
        <div className="border border-line/70 rounded-xl p-4 bg-surface-2/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-sans text-xs font-semibold uppercase tracking-wider text-ink">Hero Top Badge</span>
            <label className="flex items-center gap-2 cursor-pointer font-sans text-xs font-medium text-ink">
              <input
                type="checkbox"
                name="showHeroBadge"
                checked={showHeroBadge}
                onChange={(e) => setShowHeroBadge(e.target.checked)}
                className="checkbox"
              />
              <span>Show Badge</span>
            </label>
          </div>
          {showHeroBadge && (
            <div>
              <input
                id="heroBadgeText"
                name="heroBadgeText"
                type="text"
                defaultValue={config.heroBadgeText ?? "Personal Literary Archive · Est. 2024"}
                placeholder="Personal Literary Archive · Est. 2024"
                className="input text-xs"
              />
              <p className="field-hint mt-1">Small badge pill displayed above the main headline.</p>
            </div>
          )}
        </div>

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

      {/* ─── 2. Table of Contents Glass Card ─── */}
      <fieldset className="border hairline bg-surface p-6 rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <legend className="font-display text-xl font-normal text-ink px-2">Table of Contents Glass Card</legend>
          <label className="flex items-center gap-2 cursor-pointer font-sans text-xs font-medium text-ink">
            <input
              type="checkbox"
              name="showContentsCard"
              checked={showContentsCard}
              onChange={(e) => setShowContentsCard(e.target.checked)}
              className="checkbox"
            />
            <span>Show Card</span>
          </label>
        </div>

        {showContentsCard && (
          <div className="grid gap-4 sm:grid-cols-2 pt-2">
            <div>
              <label htmlFor="contentsCardTitle" className="field-label">
                Card Title
              </label>
              <input
                id="contentsCardTitle"
                name="contentsCardTitle"
                type="text"
                defaultValue={config.contentsCardTitle ?? "Contents"}
                placeholder="Contents"
                className="input text-sm"
              />
            </div>
            <div>
              <label htmlFor="contentsCardBadge" className="field-label">
                Card Badge Label
              </label>
              <input
                id="contentsCardBadge"
                name="contentsCardBadge"
                type="text"
                defaultValue={config.contentsCardBadge ?? "Archive Index"}
                placeholder="Archive Index"
                className="input text-sm"
              />
            </div>
          </div>
        )}
      </fieldset>

      {/* ─── 3. Kinetic Marquee Ticker ─── */}
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
              defaultValue={config.marqueeItems?.join("\n") ?? ""}
              placeholder={"Poetry & Ghazals\nMicro-Fiction & Stories\nReflections & Prose\nBook Photography"}
              className="input font-mono text-xs"
            />
            <p className="field-hint">
              These items scroll continuously in the kinetic ribbon below the hero.
            </p>
          </div>
        )}
      </fieldset>

      {/* ─── 4. Featured Highlight Work ─── */}
      <fieldset className="border hairline bg-surface p-6 rounded-2xl shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <legend className="font-display text-xl font-normal text-ink px-2">Featured Piece Spotlight</legend>
          <label className="flex items-center gap-2 cursor-pointer font-sans text-xs font-medium text-ink">
            <input
              type="checkbox"
              name="showFeaturedWork"
              checked={showFeaturedWork}
              onChange={(e) => setShowFeaturedWork(e.target.checked)}
              className="checkbox"
            />
            <span>Show Featured</span>
          </label>
        </div>

        {showFeaturedWork && (
          <div className="space-y-4 pt-1">
            <div>
              <label htmlFor="featuredSectionTitle" className="field-label">
                Badge / Section Label
              </label>
              <input
                id="featuredSectionTitle"
                name="featuredSectionTitle"
                type="text"
                defaultValue={config.featuredSectionTitle ?? "Featured Piece"}
                placeholder="Featured Piece"
                className="input text-sm"
              />
            </div>

            <div>
              <label htmlFor="featuredWorkId" className="field-label">
                Spotlight Piece
              </label>
              <select
                id="featuredWorkId"
                name="featuredWorkId"
                defaultValue={config.featuredWorkId || ""}
                className="input text-sm"
              >
                <option value="">Auto-select latest featured work</option>
                {works.map((w) => (
                  <option key={w.id} value={w.id}>
                    [{w.contentType}] {w.title || w.slug}
                  </option>
                ))}
              </select>
              <p className="field-hint">
                Choose which piece appears in the large quotation card on the homepage.
              </p>
            </div>
          </div>
        )}
      </fieldset>

      {/* ─── 5. Recent Works Section ─── */}
      <fieldset className="border hairline bg-surface p-6 rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <legend className="font-display text-xl font-normal text-ink px-2">Recent Works Section</legend>
          <label className="flex items-center gap-2 cursor-pointer font-sans text-xs font-medium text-ink">
            <input
              type="checkbox"
              name="showRecentWorks"
              checked={showRecentWorks}
              onChange={(e) => setShowRecentWorks(e.target.checked)}
              className="checkbox"
            />
            <span>Show Section</span>
          </label>
        </div>

        {showRecentWorks && (
          <div className="grid gap-4 sm:grid-cols-2 pt-1">
            <div>
              <label htmlFor="recentWorksTitle" className="field-label">
                Section Title
              </label>
              <input
                id="recentWorksTitle"
                name="recentWorksTitle"
                type="text"
                defaultValue={config.recentWorksTitle ?? "Recently written"}
                placeholder="Recently written"
                className="input text-sm"
              />
            </div>
            <div>
              <label htmlFor="recentWorksCount" className="field-label">
                Number of Works to Display
              </label>
              <select
                id="recentWorksCount"
                name="recentWorksCount"
                defaultValue={config.recentWorksCount ?? 6}
                className="input text-sm"
              >
                <option value="3">3 works</option>
                <option value="6">6 works (standard)</option>
                <option value="9">9 works</option>
                <option value="12">12 works</option>
              </select>
            </div>
          </div>
        )}
      </fieldset>

      {/* ─── 6. Collections Showcase ─── */}
      <fieldset className="border hairline bg-surface p-6 rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <legend className="font-display text-xl font-normal text-ink px-2">Collections Section</legend>
          <label className="flex items-center gap-2 cursor-pointer font-sans text-xs font-medium text-ink">
            <input
              type="checkbox"
              name="showCollections"
              checked={showCollections}
              onChange={(e) => setShowCollections(e.target.checked)}
              className="checkbox"
            />
            <span>Show Collections</span>
          </label>
        </div>

        {showCollections && (
          <div className="grid gap-4 sm:grid-cols-2 pt-1">
            <div>
              <label htmlFor="collectionsTitle" className="field-label">
                Section Title
              </label>
              <input
                id="collectionsTitle"
                name="collectionsTitle"
                type="text"
                defaultValue={config.collectionsTitle ?? "Explore by feeling"}
                placeholder="Explore by feeling"
                className="input text-sm"
              />
            </div>
            <div>
              <label htmlFor="collectionsCount" className="field-label">
                Number of Collections to Display
              </label>
              <select
                id="collectionsCount"
                name="collectionsCount"
                defaultValue={config.collectionsCount ?? 6}
                className="input text-sm"
              >
                <option value="3">3 collections</option>
                <option value="6">6 collections (standard)</option>
                <option value="9">9 collections</option>
              </select>
            </div>
          </div>
        )}
      </fieldset>

      {/* ─── 7. Book Photography Gallery ─── */}
      <fieldset className="border hairline bg-surface p-6 rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <legend className="font-display text-xl font-normal text-ink px-2">Book Photography Gallery</legend>
          <label className="flex items-center gap-2 cursor-pointer font-sans text-xs font-medium text-ink">
            <input
              type="checkbox"
              name="showPhotography"
              checked={showPhotography}
              onChange={(e) => setShowPhotography(e.target.checked)}
              className="checkbox"
            />
            <span>Show Gallery</span>
          </label>
        </div>

        {showPhotography && (
          <div className="space-y-4 pt-1">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="photographyEyebrow" className="field-label">
                  Eyebrow Label
                </label>
                <input
                  id="photographyEyebrow"
                  name="photographyEyebrow"
                  type="text"
                  defaultValue={config.photographyEyebrow ?? "Through the reader's lens"}
                  placeholder="Through the reader's lens"
                  className="input text-sm"
                />
              </div>
              <div>
                <label htmlFor="photographyCount" className="field-label">
                  Display Count
                </label>
                <select
                  id="photographyCount"
                  name="photographyCount"
                  defaultValue={config.photographyCount ?? 6}
                  className="input text-sm"
                >
                  <option value="3">3 photos</option>
                  <option value="6">6 photos (standard)</option>
                  <option value="9">9 photos</option>
                  <option value="12">12 photos</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="photographyTitle" className="field-label">
                Gallery Title
              </label>
              <input
                id="photographyTitle"
                name="photographyTitle"
                type="text"
                defaultValue={config.photographyTitle ?? "Book Photography"}
                placeholder="Book Photography"
                className="input text-sm"
              />
            </div>

            <div>
              <label htmlFor="photographySubtitle" className="field-label">
                Gallery Editorial Description
              </label>
              <input
                id="photographySubtitle"
                name="photographySubtitle"
                type="text"
                defaultValue={config.photographySubtitle ?? "Book covers, natural light reading setups, and quiet moments between pages."}
                placeholder="Book covers, natural light reading setups, and quiet moments between pages."
                className="input text-sm"
              />
            </div>
          </div>
        )}
      </fieldset>

      {/* ─── 8. Author Note Section ─── */}
      <fieldset className="border hairline bg-surface p-6 rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <legend className="font-display text-xl font-normal text-ink px-2">Author Note Section</legend>
          <label className="flex items-center gap-2 cursor-pointer font-sans text-xs font-medium text-ink">
            <input
              type="checkbox"
              name="showAuthorNote"
              checked={showAuthorNote}
              onChange={(e) => setShowAuthorNote(e.target.checked)}
              className="checkbox"
            />
            <span>Show Author Note</span>
          </label>
        </div>

        {showAuthorNote && (
          <div className="space-y-4 pt-1">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="authorNoteEyebrow" className="field-label">
                  Eyebrow Label
                </label>
                <input
                  id="authorNoteEyebrow"
                  name="authorNoteEyebrow"
                  type="text"
                  defaultValue={config.authorNoteEyebrow ?? "Author Note"}
                  placeholder="Author Note"
                  className="input text-sm"
                />
              </div>
              <div>
                <label htmlFor="authorNoteTitle" className="field-label">
                  Section Title
                </label>
                <input
                  id="authorNoteTitle"
                  name="authorNoteTitle"
                  type="text"
                  defaultValue={config.authorNoteTitle ?? "Behind the words"}
                  placeholder="Behind the words"
                  className="input text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="authorNoteCustomText" className="field-label">
                Custom Intro Text Override (Optional)
              </label>
              <textarea
                id="authorNoteCustomText"
                name="authorNoteCustomText"
                rows={3}
                defaultValue={config.authorNoteCustomText ?? ""}
                placeholder="Leave blank to use author profile introduction automatically."
                className="input text-sm"
              />
              <p className="field-hint">
                If provided, this text will be displayed instead of the default profile short intro.
              </p>
            </div>
          </div>
        )}
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
