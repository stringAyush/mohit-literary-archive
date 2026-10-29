"use client";

import { saveWorkAction } from "@/app/admin/actions/works";
import { CONTENT_TYPES, LANGUAGES, SOURCE_PLATFORMS } from "@/lib/constants";
import { FieldError, FormMessage } from "./FormMessage";
import { useActionForm } from "./useActionForm";

export type EditorWork = {
  id: string;
  title: string;
  slug: string;
  body: string;
  contentType: string;
  language: string;
  featured: boolean;
  composedOn: string;
  originalPublishedAt: string;
  collectionIds: string[];
  tagIds: string[];
  updatedAt: string;
  isPublic: boolean;
  everPublished: boolean;
  source: { platform: string; url: string; originalTitle: string; retrievalMethod: string; notes: string } | null;
};

type Option = { id: string; name: string };

export function WorkEditor({
  work,
  collections,
  tags,
}: {
  work: EditorWork | null;
  collections: Option[];
  tags: Option[];
}) {
  const { state, isPending, onSubmit } = useActionForm(saveWorkAction);
  const errors = state.fieldErrors ?? {};
  const invalid = (name: string) => (errors[name] ? { "aria-invalid": true, "aria-describedby": `${name}-error` } : {});

  return (
    <form onSubmit={onSubmit} className="space-y-8" noValidate>
      <FormMessage state={state} />
      {work && <input type="hidden" name="id" value={work.id} />}
      {work && <input type="hidden" name="expectedUpdatedAt" value={work.updatedAt} />}

      <div>
        <label htmlFor="title" className="field-label">
          Title <span className="font-normal text-muted">(optional — many quotes have none)</span>
        </label>
        <input id="title" name="title" defaultValue={work?.title} maxLength={200} className="input" {...invalid("title")} />
        <FieldError id="title-error" message={errors.title} />
      </div>

      <div>
        <label htmlFor="body" className="field-label">
          Text
        </label>
        <textarea
          id="body"
          name="body"
          defaultValue={work?.body}
          rows={14}
          spellCheck
          className="input min-h-72 font-editorial text-[1.375rem] leading-[1.6]"
          style={{ whiteSpace: "pre-wrap" }}
          {...invalid("body")}
        />
        <p className="field-hint">Line breaks, blank lines and spacing are kept exactly as typed.</p>
        <FieldError id="body-error" message={errors.body} />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="contentType" className="field-label">
            Form
          </label>
          <select id="contentType" name="contentType" defaultValue={work?.contentType ?? "QUOTE"} className="input" {...invalid("contentType")}>
            {CONTENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <FieldError id="contentType-error" message={errors.contentType} />
        </div>
        <div>
          <label htmlFor="language" className="field-label">
            Language
          </label>
          <select id="language" name="language" defaultValue={work?.language ?? "en"} className="input" {...invalid("language")}>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
          <FieldError id="language-error" message={errors.language} />
        </div>
      </div>

      <div>
        <label htmlFor="slug" className="field-label">
          Web address
        </label>
        <div className="flex items-stretch">
          <span className="inline-flex items-center border border-r-0 hairline bg-surface-2 px-3 font-mono text-sm text-muted">
            /works/
          </span>
          <input
            id="slug"
            name="slug"
            defaultValue={work?.slug}
            maxLength={80}
            placeholder="created from the title if left empty"
            className="input font-mono text-sm"
            {...invalid("slug")}
          />
        </div>
        <p className="field-hint">
          {work?.everPublished
            ? "This work has been published. If you change the address, the old one will keep working and redirect here."
            : "Lowercase letters, numbers and hyphens. This becomes the permanent address once published."}
        </p>
        <FieldError id="slug-error" message={errors.slug} />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="composedOn" className="field-label">
            Date written <span className="font-normal text-muted">(if known)</span>
          </label>
          <input id="composedOn" name="composedOn" type="date" defaultValue={work?.composedOn} className="input" {...invalid("composedOn")} />
          <FieldError id="composedOn-error" message={errors.composedOn} />
        </div>
        <div>
          <label htmlFor="originalPublishedAt" className="field-label">
            First published elsewhere <span className="font-normal text-muted">(if known)</span>
          </label>
          <input
            id="originalPublishedAt"
            name="originalPublishedAt"
            type="date"
            defaultValue={work?.originalPublishedAt}
            className="input"
            {...invalid("originalPublishedAt")}
          />
          <FieldError id="originalPublishedAt-error" message={errors.originalPublishedAt} />
        </div>
      </div>

      <label className="flex items-start gap-3 font-sans text-sm">
        <input type="checkbox" name="featured" defaultChecked={work?.featured} className="checkbox mt-0.5" />
        <span>
          Feature on the home page
          <span className="block text-muted">The most recent featured work appears as &ldquo;A piece to sit with&rdquo;.</span>
        </span>
      </label>

      <div className="grid gap-8 sm:grid-cols-2">
        <fieldset>
          <legend className="field-label">Collections</legend>
          {collections.length === 0 ? (
            <p className="field-hint">No collections yet.</p>
          ) : (
            <div className="max-h-56 space-y-2 overflow-y-auto border hairline bg-surface p-3">
              {collections.map((c) => (
                <label key={c.id} className="flex items-center gap-3 font-sans text-sm">
                  <input type="checkbox" name="collectionIds" value={c.id} defaultChecked={work?.collectionIds.includes(c.id)} className="checkbox" />
                  {c.name}
                </label>
              ))}
            </div>
          )}
        </fieldset>
        <fieldset>
          <legend className="field-label">Themes</legend>
          {tags.length === 0 ? (
            <p className="field-hint">No themes yet.</p>
          ) : (
            <div className="max-h-56 space-y-2 overflow-y-auto border hairline bg-surface p-3">
              {tags.map((t) => (
                <label key={t.id} className="flex items-center gap-3 font-sans text-sm">
                  <input type="checkbox" name="tagIds" value={t.id} defaultChecked={work?.tagIds.includes(t.id)} className="checkbox" />
                  {t.name}
                </label>
              ))}
            </div>
          )}
        </fieldset>
      </div>

      <fieldset className="border hairline bg-surface p-5">
        <legend className="px-1 font-sans text-sm font-semibold">Source</legend>
        <p className="field-hint mt-0 mb-4">
          Where this text came from. Works with a source must have it verified before they can be published.
        </p>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="sourcePlatform" className="field-label">
              Platform
            </label>
            <select id="sourcePlatform" name="sourcePlatform" defaultValue={work?.source?.platform ?? ""} className="input">
              <option value="">No source recorded</option>
              {SOURCE_PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sourceUrl" className="field-label">
              Original URL
            </label>
            <input id="sourceUrl" name="sourceUrl" type="url" defaultValue={work?.source?.url} className="input" {...invalid("source.url")} />
            <FieldError id="source.url-error" message={errors["source.url"]} />
          </div>
          <div>
            <label htmlFor="sourceOriginalTitle" className="field-label">
              Title on the original platform
            </label>
            <input id="sourceOriginalTitle" name="sourceOriginalTitle" defaultValue={work?.source?.originalTitle} className="input" />
          </div>
          <div>
            <label htmlFor="sourceRetrievalMethod" className="field-label">
              How the text was obtained
            </label>
            <input
              id="sourceRetrievalMethod"
              name="sourceRetrievalMethod"
              defaultValue={work?.source?.retrievalMethod}
              placeholder="e.g. Sent by the writer by email"
              className="input"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="sourceNotes" className="field-label">
              Notes
            </label>
            <textarea id="sourceNotes" name="sourceNotes" rows={3} defaultValue={work?.source?.notes} className="input min-h-20" />
          </div>
        </div>
      </fieldset>

      {work && (
        <div>
          <label htmlFor="changeReason" className="field-label">
            Reason for this change <span className="font-normal text-muted">(optional, kept in the version history)</span>
          </label>
          <input id="changeReason" name="changeReason" maxLength={300} className="input" placeholder="e.g. Corrected a typo the writer pointed out" />
        </div>
      )}

      <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center gap-3 border-t hairline bg-paper/95 px-1 py-4">
        <button type="submit" className="btn btn-primary" disabled={isPending}>
          {isPending ? "Saving…" : work ? "Save changes" : "Save draft"}
        </button>
        <span className="font-sans text-xs text-muted">
          {work?.isPublic ? "This work is live: saved changes appear on the site immediately." : "Saving never publishes."}
        </span>
      </div>
    </form>
  );
}
