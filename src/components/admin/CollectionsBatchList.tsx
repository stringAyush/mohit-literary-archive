"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2, AlertTriangle, CheckSquare, Square, X } from "lucide-react";
import { deleteMultipleCollectionsAction } from "@/app/admin/actions/site";

export type AdminCollectionItem = {
  id: string;
  name: string;
  slug: string;
  isPublished: boolean;
  workCount: number;
  publicCount: number;
};

export function CollectionsBatchList({ collections }: { collections: AdminCollectionItem[] }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const allSelected = collections.length > 0 && selectedIds.size === collections.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < collections.length;

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(collections.map((c) => c.id)));
    }
  }

  function toggleOne(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  if (collections.length === 0) {
    return <p className="border-y hairline py-10 text-center font-sans text-sm text-muted">No collections yet.</p>;
  }

  return (
    <>
      <div className="border hairline bg-surface">
        {/* Header toolbar with Select All */}
        <div className="flex items-center justify-between border-b hairline px-4 py-2.5 bg-paper/50">
          <button
            type="button"
            onClick={toggleAll}
            className="flex items-center gap-2 font-sans text-xs text-muted hover:text-ink transition-colors"
          >
            {allSelected ? (
              <CheckSquare className="h-4 w-4 text-accent" />
            ) : someSelected ? (
              <div className="h-4 w-4 rounded border border-ink/40 bg-accent/20 flex items-center justify-center">
                <div className="h-1.5 w-1.5 bg-accent rounded-xs" />
              </div>
            ) : (
              <Square className="h-4 w-4" />
            )}
            <span>Select all ({collections.length})</span>
          </button>
          <span className="font-sans text-xs text-muted">
            {selectedIds.size > 0 ? `${selectedIds.size} of ${collections.length} selected` : `${collections.length} total`}
          </span>
        </div>

        <ul className="divide-y divide-line">
          {collections.map((c) => {
            const isSelected = selectedIds.has(c.id);
            const live = c.isPublished && c.publicCount > 0;
            return (
              <li
                key={c.id}
                className={`flex flex-wrap items-center justify-between gap-3 p-4 font-sans text-sm transition-colors ${
                  isSelected ? "bg-accent/5 hover:bg-accent/10" : "hover:bg-paper"
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => toggleOne(c.id)}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted hover:text-ink mt-0.5"
                    aria-label={`Select collection ${c.name}`}
                  >
                    {isSelected ? (
                      <CheckSquare className="h-4 w-4 text-accent" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <Link
                      href={`/admin/collections/${c.id}`}
                      className="font-medium text-ink underline decoration-line underline-offset-4 hover:text-accent"
                    >
                      {c.name}
                    </Link>
                    <p className="mt-1 text-xs text-muted">
                      {c.workCount} works · {c.publicCount} published ·{" "}
                      {live ? "visible to readers" : c.isPublished ? "public once it has published work" : "hidden"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {live && (
                    <Link href={`/collections/${c.slug}`} className="text-xs text-accent underline">
                      View ↗
                    </Link>
                  )}
                  <Link
                    href={`/admin/collections/${c.id}`}
                    className="btn btn-quiet h-8 min-h-8 px-2.5 text-xs"
                  >
                    Edit
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Floating Batch Actions Bar */}
      {selectedIds.size > 0 && (
        <aside
          aria-label="Batch actions"
          className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 flex items-center gap-4 rounded-2xl border border-line bg-surface/95 px-5 py-3 shadow-[0_12px_36px_-6px_rgba(20,19,18,0.25)] backdrop-blur-md ring-1 ring-white/60 animate-page-enter"
        >
          <div className="flex items-center gap-2 font-sans text-sm font-medium text-ink">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs text-white">
              {selectedIds.size}
            </span>
            <span>{selectedIds.size === 1 ? "collection selected" : "collections selected"}</span>
          </div>

          <div className="h-4 w-px bg-line" />

          <button
            type="button"
            onClick={clearSelection}
            className="flex items-center gap-1 font-sans text-xs text-muted hover:text-ink transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            <span>Deselect</span>
          </button>

          <button
            type="button"
            onClick={() => setConfirmModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#8f2f22] px-3.5 py-1.5 font-sans text-xs font-semibold text-white shadow-xs transition-all hover:bg-[#72241a] hover:shadow-sm"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete selected ({selectedIds.size})</span>
          </button>
        </aside>
      )}

      {/* Confirmation Modal for Bulk Delete */}
      {confirmModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 text-left whitespace-normal backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeleting) setConfirmModalOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl animate-page-enter">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#8f2f22]/15 text-[#8f2f22]">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-xl font-normal text-ink">
                  Delete {selectedIds.size} {selectedIds.size === 1 ? "collection" : "collections"}?
                </h3>
                <p className="mt-2 font-sans text-sm text-muted leading-relaxed">
                  Are you sure you want to delete the <strong className="text-ink">{selectedIds.size} selected collections</strong>?
                  Works inside these collections will <strong className="text-ink">not</strong> be deleted.
                </p>
              </div>
            </div>

            <form
              action={async (formData) => {
                setIsDeleting(true);
                formData.set("ids", Array.from(selectedIds).join(","));
                await deleteMultipleCollectionsAction({ status: "idle" }, formData);
              }}
              className="mt-6 flex items-center justify-end gap-3 border-t hairline pt-4"
            >
              <input type="hidden" name="ids" value={Array.from(selectedIds).join(",")} />
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setConfirmModalOpen(false)}
                className="btn btn-quiet h-10 min-h-10 px-4 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isDeleting}
                className="inline-flex h-10 min-h-10 items-center justify-center gap-2 rounded-xl bg-[#8f2f22] px-5 font-sans text-sm font-semibold text-white shadow-xs transition-all hover:bg-[#72241a] disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                <span>{isDeleting ? "Deleting..." : `Delete ${selectedIds.size} collections`}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
