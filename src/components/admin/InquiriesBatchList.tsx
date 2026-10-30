"use client";

import { useState } from "react";
import { Trash2, AlertTriangle, CheckSquare, Square, X } from "lucide-react";
import { deleteInquiryAction, deleteMultipleInquiriesAction, toggleInquiryHandledAction } from "@/app/admin/actions/site";
import { formatDateTime } from "@/lib/format";

export type AdminInquiry = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  handledAt: Date | null;
  createdAt: Date;
  emailDelivered: boolean;
  deliveryError: string | null;
};

export function InquiriesBatchList({ inquiries }: { inquiries: AdminInquiry[] }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [singleDeleteId, setSingleDeleteId] = useState<string | null>(null);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const allSelected = inquiries.length > 0 && selectedIds.size === inquiries.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < inquiries.length;

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(inquiries.map((m) => m.id)));
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

  if (inquiries.length === 0) {
    return <p className="border-y hairline py-12 text-center font-sans text-sm text-muted">No messages yet.</p>;
  }

  const singleDeleteItem = singleDeleteId ? inquiries.find((m) => m.id === singleDeleteId) : null;

  return (
    <>
      <div className="space-y-4">
        {/* Header toolbar with Select All */}
        <div className="flex items-center justify-between border hairline bg-surface px-4 py-2.5">
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
            <span>Select all messages ({inquiries.length})</span>
          </button>
          <span className="font-sans text-xs text-muted">
            {selectedIds.size > 0 ? `${selectedIds.size} of ${inquiries.length} selected` : `${inquiries.length} total`}
          </span>
        </div>

        <ul className="space-y-4">
          {inquiries.map((m) => {
            const isSelected = selectedIds.has(m.id);
            return (
              <li
                key={m.id}
                className={`border hairline bg-surface p-5 font-sans text-sm transition-colors ${
                  isSelected ? "bg-accent/5 ring-1 ring-accent/30" : ""
                } ${m.handledAt ? "opacity-75" : ""}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => toggleOne(m.id)}
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted hover:text-ink mt-0.5"
                      aria-label={`Select message from ${m.name}`}
                    >
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-accent" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink">{m.subject}</p>
                      <p className="mt-1 text-muted text-xs sm:text-sm">
                        {m.name} ·{" "}
                        <a
                          href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`}
                          className="text-accent underline"
                        >
                          {m.email}
                        </a>{" "}
                        · {formatDateTime(m.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Toggle handled state */}
                    <form action={async (formData) => {
                      formData.set("id", m.id);
                      await toggleInquiryHandledAction({ status: "idle" }, formData);
                    }}>
                      <input type="hidden" name="id" value={m.id} />
                      <button
                        type="submit"
                        className="btn btn-quiet h-8 min-h-8 px-2.5 text-xs"
                      >
                        {m.handledAt ? "Mark unhandled" : "Mark handled"}
                      </button>
                    </form>

                    {/* Delete single message */}
                    <button
                      type="button"
                      onClick={() => setSingleDeleteId(m.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line/80 text-muted transition-colors hover:border-[#8f2f22] hover:bg-[#8f2f22]/10 hover:text-[#8f2f22]"
                      aria-label={`Delete message from ${m.name}`}
                      title="Delete message"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <p className="mt-4 whitespace-pre-line break-words text-ink pl-8">{m.message}</p>
                <p className="mt-3 text-xs text-muted pl-8">
                  {m.emailDelivered ? "Emailed" : `Not emailed${m.deliveryError ? ` (${m.deliveryError})` : ""}`}
                  {m.handledAt ? ` · handled ${formatDateTime(m.handledAt)}` : ""}
                </p>
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
            <span>{selectedIds.size === 1 ? "message selected" : "messages selected"}</span>
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
            onClick={() => setBatchModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#8f2f22] px-3.5 py-1.5 font-sans text-xs font-semibold text-white shadow-xs transition-all hover:bg-[#72241a] hover:shadow-sm"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete selected ({selectedIds.size})</span>
          </button>
        </aside>
      )}

      {/* Modal for Single Message Delete */}
      {singleDeleteItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 text-left whitespace-normal backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeleting) setSingleDeleteId(null);
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl animate-page-enter">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#8f2f22]/15 text-[#8f2f22]">
                <Trash2 className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-xl font-normal text-ink">
                  Delete message?
                </h3>
                <p className="mt-2 font-sans text-sm text-muted leading-relaxed">
                  Are you sure you want to delete the message from <strong className="text-ink">{singleDeleteItem.name}</strong> (&quot;{singleDeleteItem.subject}&quot;)?
                  This message will be permanently removed.
                </p>
              </div>
            </div>

            <form
              action={async (formData) => {
                setIsDeleting(true);
                formData.set("id", singleDeleteItem.id);
                await deleteInquiryAction({ status: "idle" }, formData);
                setSingleDeleteId(null);
                setIsDeleting(false);
              }}
              className="mt-6 flex items-center justify-end gap-3 border-t hairline pt-4"
            >
              <input type="hidden" name="id" value={singleDeleteItem.id} />
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setSingleDeleteId(null)}
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
                <span>{isDeleting ? "Deleting..." : "Delete message"}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Batch Messages Delete */}
      {batchModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 text-left whitespace-normal backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeleting) setBatchModalOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl animate-page-enter">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#8f2f22]/15 text-[#8f2f22]">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-xl font-normal text-ink">
                  Delete {selectedIds.size} {selectedIds.size === 1 ? "message" : "messages"}?
                </h3>
                <p className="mt-2 font-sans text-sm text-muted leading-relaxed">
                  Are you sure you want to permanently delete the <strong className="text-ink">{selectedIds.size} selected messages</strong>?
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <form
              action={async (formData) => {
                setIsDeleting(true);
                formData.set("ids", Array.from(selectedIds).join(","));
                await deleteMultipleInquiriesAction({ status: "idle" }, formData);
                setSelectedIds(new Set());
                setBatchModalOpen(false);
                setIsDeleting(false);
              }}
              className="mt-6 flex items-center justify-end gap-3 border-t hairline pt-4"
            >
              <input type="hidden" name="ids" value={Array.from(selectedIds).join(",")} />
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setBatchModalOpen(false)}
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
                <span>{isDeleting ? "Deleting..." : `Delete ${selectedIds.size} messages`}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
