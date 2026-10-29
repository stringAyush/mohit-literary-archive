"use client";

import { useState } from "react";
import {
  deleteCollectionAction,
  deleteTagAction,
  saveAuthorAction,
  saveCollectionAction,
  saveTagAction,
  toggleInquiryHandledAction,
} from "@/app/admin/actions/site";
import { FieldError, FormMessage } from "./FormMessage";
import { useActionForm } from "./useActionForm";

// ─── Collections ──────────────────────────────────────────────────────────

export type CollectionFormValues = {
  id: string;
  name: string;
  slug: string;
  description: string;
  introduction: string;
  isPublished: boolean;
  sortOrder: number;
};

export function CollectionForm({ collection }: { collection: CollectionFormValues | null }) {
  const { state, isPending, onSubmit } = useActionForm(saveCollectionAction);
  const errors = state.fieldErrors ?? {};
  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <FormMessage state={state} />
      {collection && <input type="hidden" name="id" value={collection.id} />}
      <div className="grid gap-5 sm:grid-cols-[2fr_1fr]">
        <div>
          <label htmlFor="c-name" className="field-label">Name</label>
          <input id="c-name" name="name" defaultValue={collection?.name} maxLength={120} required className="input" aria-invalid={errors.name ? true : undefined} />
          <FieldError id="c-name-error" message={errors.name} />
        </div>
        <div>
          <label htmlFor="c-sort" className="field-label">Order</label>
          <input id="c-sort" name="sortOrder" type="number" defaultValue={collection?.sortOrder ?? 0} className="input" />
          <p className="field-hint">Lower numbers come first.</p>
        </div>
      </div>
      <div>
        <label htmlFor="c-slug" className="field-label">Web address</label>
        <div className="flex">
          <span className="inline-flex items-center border border-r-0 hairline bg-surface-2 px-3 font-mono text-sm text-muted">/collections/</span>
          <input id="c-slug" name="slug" defaultValue={collection?.slug} maxLength={80} placeholder="created from the name" className="input font-mono text-sm" />
        </div>
        <FieldError id="c-slug-error" message={errors.slug} />
      </div>
      <div>
        <label htmlFor="c-description" className="field-label">Short description</label>
        <input id="c-description" name="description" defaultValue={collection?.description} maxLength={300} className="input" />
        <p className="field-hint">One line, shown on collection cards.</p>
      </div>
      <div>
        <label htmlFor="c-intro" className="field-label">Introduction</label>
        <textarea id="c-intro" name="introduction" rows={5} defaultValue={collection?.introduction} maxLength={3000} className="input" />
      </div>
      <label className="flex items-start gap-3 font-sans text-sm">
        <input type="checkbox" name="isPublished" defaultChecked={collection?.isPublished} className="checkbox mt-0.5" />
        <span>
          Show this collection publicly
          <span className="block text-muted">It appears only when it contains at least one published work.</span>
        </span>
      </label>
      <button type="submit" className="btn btn-primary" disabled={isPending}>
        {isPending ? "Saving…" : collection ? "Save collection" : "Create collection"}
      </button>
    </form>
  );
}

export function DeleteCollectionForm({ id }: { id: string }) {
  const { state, isPending, onSubmit } = useActionForm(deleteCollectionAction);
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <label className="flex items-start gap-3 font-sans text-sm">
        <input type="checkbox" name="confirm" className="checkbox mt-0.5" />
        <span>Delete this collection. The works in it are kept.</span>
      </label>
      <button type="submit" className="btn btn-danger" disabled={isPending}>
        {isPending ? "Deleting…" : "Delete collection"}
      </button>
      <FormMessage state={state} />
    </form>
  );
}

// ─── Themes ───────────────────────────────────────────────────────────────

export function TagForm({ tag }: { tag?: { id: string; name: string; slug: string; description: string } }) {
  const { state, isPending, onSubmit } = useActionForm(saveTagAction);
  const errors = state.fieldErrors ?? {};
  const prefix = tag ? `t-${tag.id}` : "t-new";
  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      {tag && <input type="hidden" name="id" value={tag.id} />}
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_2fr_auto] sm:items-end">
        <div>
          <label htmlFor={`${prefix}-name`} className="field-label text-xs">Name</label>
          <input id={`${prefix}-name`} name="name" defaultValue={tag?.name} maxLength={60} className="input text-sm" aria-invalid={errors.name ? true : undefined} />
        </div>
        <div>
          <label htmlFor={`${prefix}-slug`} className="field-label text-xs">Address</label>
          <input id={`${prefix}-slug`} name="slug" defaultValue={tag?.slug} maxLength={80} placeholder="from the name" className="input font-mono text-sm" />
        </div>
        <div>
          <label htmlFor={`${prefix}-desc`} className="field-label text-xs">Description</label>
          <input id={`${prefix}-desc`} name="description" defaultValue={tag?.description} maxLength={300} className="input text-sm" />
        </div>
        <button type="submit" className={`btn ${tag ? "btn-quiet" : "btn-primary"}`} disabled={isPending}>
          {isPending ? "Saving…" : tag ? "Save" : "Add theme"}
        </button>
      </div>
      <FieldError id={`${prefix}-error`} message={errors.name ?? errors.slug} />
      {state.status !== "idle" && !state.fieldErrors && <FormMessage state={state} />}
    </form>
  );
}

export function DeleteTagButton({ id, name }: { id: string; name: string }) {
  const { state, isPending, onSubmit } = useActionForm(deleteTagAction);
  return (
    <form onSubmit={onSubmit}>
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="min-h-9 font-sans text-xs text-[#8f2f22] underline" disabled={isPending}>
        {isPending ? "Removing…" : `Remove “${name}”`}
      </button>
      {state.status === "error" && <FormMessage state={state} />}
    </form>
  );
}

// ─── Writer profile ───────────────────────────────────────────────────────

export type AuthorFormValues = {
  id: string;
  displayName: string;
  shortIntro: string;
  biography: string;
  writingPhilosophy: string;
  links: { label: string; url: string }[];
  approvedAt: string | null;
  approvalNote: string;
};

export function AuthorForm({ author }: { author: AuthorFormValues }) {
  const { state, isPending, onSubmit } = useActionForm(saveAuthorAction);
  const errors = state.fieldErrors ?? {};
  // Each row gets a stable key so removing one row never shifts the others' values.
  const [links, setLinks] = useState(() =>
    (author.links.length ? author.links : [{ label: "", url: "" }]).map((link, i) => ({ ...link, key: i })),
  );
  const [nextKey, setNextKey] = useState(links.length);

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <FormMessage state={state} />
      <input type="hidden" name="id" value={author.id} />
      <div>
        <label htmlFor="a-name" className="field-label">Name as shown on the site</label>
        <input id="a-name" name="displayName" defaultValue={author.displayName} maxLength={120} className="input" />
        <FieldError id="a-name-error" message={errors.displayName} />
      </div>
      <div>
        <label htmlFor="a-intro" className="field-label">Short introduction (home page)</label>
        <textarea id="a-intro" name="shortIntro" rows={3} defaultValue={author.shortIntro} maxLength={1000} className="input" />
      </div>
      <div>
        <label htmlFor="a-bio" className="field-label">Biography (About page)</label>
        <textarea id="a-bio" name="biography" rows={8} defaultValue={author.biography} maxLength={10000} className="input" />
        <p className="field-hint">Use only details the writer has given or confirmed. Never guess education, work, awards or places.</p>
      </div>
      <div>
        <label htmlFor="a-philosophy" className="field-label">On writing (About page)</label>
        <textarea id="a-philosophy" name="writingPhilosophy" rows={5} defaultValue={author.writingPhilosophy} maxLength={5000} className="input" />
      </div>

      <fieldset className="border hairline bg-surface p-5">
        <legend className="px-1 font-sans text-sm font-semibold">Links elsewhere</legend>
        <div className="space-y-3">
          {links.map((link, i) => (
            <div key={link.key} className="grid gap-3 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
              <div>
                <label htmlFor={`link-label-${i}`} className="field-label text-xs">Label</label>
                <input id={`link-label-${i}`} name="linkLabel" defaultValue={link.label} maxLength={60} className="input text-sm" />
              </div>
              <div>
                <label htmlFor={`link-url-${i}`} className="field-label text-xs">URL</label>
                <input id={`link-url-${i}`} name="linkUrl" type="url" defaultValue={link.url} className="input text-sm" />
              </div>
              <button type="button" className="btn btn-quiet" onClick={() => setLinks(links.filter((l) => l.key !== link.key))}>
                Remove
              </button>
            </div>
          ))}
        </div>
        {links.length < 8 && (
          <button type="button" className="mt-4 font-sans text-sm text-accent underline" onClick={() => {
              setLinks([...links, { label: "", url: "", key: nextKey }]);
              setNextKey(nextKey + 1);
            }}>
            Add a link
          </button>
        )}
        {Object.entries(errors)
          .filter(([key]) => key.startsWith("links"))
          .slice(0, 1)
          .map(([key, message]) => (
            <p key={key} className="field-error">{message}</p>
          ))}
      </fieldset>

      <fieldset className="border hairline bg-surface p-5">
        <legend className="px-1 font-sans text-sm font-semibold">Writer&apos;s approval</legend>
        <p className="mb-4 font-sans text-sm text-muted">
          {author.approvedAt
            ? `The current text was approved on ${new Date(author.approvedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.`
            : "Not approved yet: the introduction, biography and “On writing” text are hidden from readers."}{" "}
          Editing the text withdraws the approval.
        </p>
        <label htmlFor="a-approval" className="field-label text-xs">Approval</label>
        <select id="a-approval" name="approval" defaultValue="keep" className="input text-sm">
          <option value="keep">{author.approvedAt ? "Keep the approval (unless the text changed)" : "Leave unapproved"}</option>
          <option value="approve">The writer has read and approved the text above</option>
          <option value="withdraw">Withdraw approval and hide the text</option>
        </select>
        <label htmlFor="a-approval-note" className="field-label mt-4 text-xs">How was it approved? (optional)</label>
        <input id="a-approval-note" name="profileApprovalNote" defaultValue={author.approvalNote} maxLength={300} className="input text-sm" placeholder="e.g. Approved by Mohit over email, 3 Nov 2026" />
      </fieldset>

      <button type="submit" className="btn btn-primary" disabled={isPending}>
        {isPending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}

// ─── Messages ─────────────────────────────────────────────────────────────

export function InquiryHandledButton({ id, handled }: { id: string; handled: boolean }) {
  const { isPending, onSubmit } = useActionForm(toggleInquiryHandledAction);
  return (
    <form onSubmit={onSubmit}>
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="btn btn-quiet min-h-9 py-0 text-xs" disabled={isPending}>
        {handled ? "Mark as unread" : "Mark as handled"}
      </button>
    </form>
  );
}
