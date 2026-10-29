"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteWorkAction } from "@/app/admin/actions/works";
import { FormMessage } from "./FormMessage";
import { useActionForm } from "./useActionForm";

export function DeleteWorkButton({
  workId,
  workTitle,
  variant = "button",
}: {
  workId: string;
  workTitle?: string;
  variant?: "button" | "table-action";
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { state, isPending, onSubmit } = useActionForm(deleteWorkAction);

  return (
    <>
      {variant === "table-action" ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex h-8 items-center gap-1.5 rounded border border-[#8f2f22]/30 px-2.5 text-xs font-medium text-[#8f2f22] transition-colors hover:bg-[#8f2f22]/10"
          title="Delete work"
          aria-label={`Delete ${workTitle || "work"}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Delete</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="btn btn-danger inline-flex w-full items-center justify-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          <span>Delete work</span>
        </button>
      )}

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`delete-title-${workId}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isPending) setIsOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-lg border border-line bg-surface p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#8f2f22]/15 text-[#8f2f22]">
                <Trash2 className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 id={`delete-title-${workId}`} className="font-display text-lg font-semibold text-ink">
                  Delete work permanently?
                </h3>
                <p className="mt-2 font-sans text-sm text-muted">
                  Are you sure you want to delete <strong className="text-ink">{workTitle || "this work"}</strong>?
                </p>
                <p className="mt-2 font-sans text-xs text-muted">
                  This will permanently delete the text, all version history, source references, and publication events. This action cannot be undone.
                </p>
              </div>
            </div>

            <form onSubmit={onSubmit} className="mt-6 flex items-center justify-end gap-3">
              <input type="hidden" name="id" value={workId} />
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
                className="btn btn-quiet px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="btn btn-danger px-4 py-2 text-sm"
              >
                {isPending ? "Deleting…" : "Yes, delete work"}
              </button>
            </form>
            {state.status !== "idle" && (
              <div className="mt-4">
                <FormMessage state={state} />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
