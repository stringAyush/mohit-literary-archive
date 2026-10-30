"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2, AlertTriangle, CheckSquare, Square, X } from "lucide-react";
import { StageBadge, StatusBadge } from "@/components/admin/ui";
import { DeleteWorkButton } from "@/components/admin/DeleteWorkButton";
import { deleteMultipleWorksAction } from "@/app/admin/actions/works";
import { contentTypeLabel } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import type { ContentType, ReviewStatus, TextStatus, WorkStatus } from "@prisma/client";

export type AdminWorkRow = {
  id: string;
  title: string | null;
  body: string;
  slug: string;
  status: WorkStatus;
  reviewStatus: ReviewStatus;
  contentType: ContentType;
  textStatus: TextStatus;
  updatedAt: Date;
  isDemo: boolean;
  featured: boolean;
};

export function WorksBatchTable({ works }: { works: AdminWorkRow[] }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const allSelected = works.length > 0 && selectedIds.size === works.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < works.length;

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(works.map((w) => w.id)));
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

  return (
    <>
      <div className="overflow-x-auto border hairline bg-surface">
        <table className="w-full min-w-[720px] font-sans text-sm">
          <caption className="sr-only">Works, most recently changed first</caption>
          <thead className="border-b hairline text-left text-xs text-muted">
            <tr>
              <th scope="col" className="w-10 px-4 py-3">
                <button
                  type="button"
                  onClick={toggleAll}
                  className="flex h-5 w-5 items-center justify-center rounded text-muted hover:text-ink"
                  aria-label={allSelected ? "Deselect all works" : "Select all works on page"}
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
                </button>
              </th>
              <th scope="col" className="px-4 py-3 font-medium">Work</th>
              <th scope="col" className="px-4 py-3 font-medium">Form</th>
              <th scope="col" className="px-4 py-3 font-medium">Stage</th>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
              <th scope="col" className="px-4 py-3 font-medium">Last changed</th>
              <th scope="col" className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {works.map((work) => {
              const isSelected = selectedIds.has(work.id);
              return (
                <tr
                  key={work.id}
                  className={`align-top transition-colors ${
                    isSelected ? "bg-accent/5 hover:bg-accent/10" : "hover:bg-paper"
                  }`}
                >
                  <td className="w-10 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleOne(work.id)}
                      className="flex h-5 w-5 items-center justify-center rounded text-muted hover:text-ink mt-0.5"
                      aria-label={`Select ${work.title || work.slug}`}
                    >
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-accent" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </td>
                  <td className="max-w-md px-4 py-3">
                    <Link
                      href={`/admin/works/${work.id}`}
                      className="font-medium text-ink underline decoration-line underline-offset-4 hover:text-accent"
                    >
                      {work.title ?? (work.body.split("\n")[0]?.slice(0, 80) || `Untitled (${work.slug})`)}
                    </Link>
                    <div className="mt-1 font-mono text-xs text-muted">/works/{work.slug}</div>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted">
                      {work.textStatus === "EXCERPT_ONLY" && <span className="text-accent font-medium">Excerpt</span>}
                      {work.textStatus === "METADATA_ONLY" && <span className="text-muted">Metadata only</span>}
                      {work.featured && <span>★ Featured</span>}
                      {work.isDemo && <span>Demo text</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-sans text-xs">{contentTypeLabel(work.contentType)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StageBadge work={work} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={work.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">
                    {formatDateTime(work.updatedAt)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/works/${work.id}`} className="btn btn-quiet h-8 min-h-8 px-2.5 text-xs">
                        Edit
                      </Link>
                      <DeleteWorkButton
                        workId={work.id}
                        workTitle={work.title ?? (work.body.split("\n")[0]?.slice(0, 40) || work.slug)}
                        variant="table-action"
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
            <span>{selectedIds.size === 1 ? "work selected" : "works selected"}</span>
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
                  Delete {selectedIds.size} {selectedIds.size === 1 ? "work" : "works"} permanently?
                </h3>
                <p className="mt-2 font-sans text-sm text-muted leading-relaxed">
                  Are you sure you want to delete the <strong className="text-ink">{selectedIds.size} selected works</strong>?
                  This action removes all text versions and public records and cannot be undone.
                </p>
              </div>
            </div>

            <form
              action={async (formData) => {
                setIsDeleting(true);
                formData.set("ids", Array.from(selectedIds).join(","));
                await deleteMultipleWorksAction({ status: "idle" }, formData);
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
                <span>{isDeleting ? "Deleting..." : `Delete ${selectedIds.size} works`}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
