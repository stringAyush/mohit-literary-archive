"use client";

import Link from "next/link";
import { useActionState } from "react";
import { confirmImportAction, previewImportAction, type ImportState } from "@/app/admin/actions/import";
import { REVIEW_STATUS_LABELS } from "@/lib/constants";
import { FormMessage } from "./FormMessage";

export function ImportForm() {
  const [preview, previewAction, previewing] = useActionState<ImportState, FormData>(previewImportAction, { status: "idle" });
  const [result, confirmAction, importing] = useActionState<ImportState, FormData>(confirmImportAction, { status: "idle" });

  if (result.stage === "done" && result.outcome) {
    return (
      <div className="space-y-6">
        <FormMessage state={result} />
        {result.outcome.created.length > 0 && (
          <div>
            <h2 className="font-sans text-sm font-semibold">Created</h2>
            <ul className="mt-2 space-y-1 font-sans text-sm">
              {result.outcome.created.map((c) => (
                <li key={c.id}>
                  Row {c.index}:{" "}
                  <Link href={`/admin/works/${c.id}`} className="text-link">
                    /works/{c.slug}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        {result.outcome.skipped.length > 0 && (
          <div>
            <h2 className="font-sans text-sm font-semibold">Skipped</h2>
            <ul className="mt-2 space-y-1 font-sans text-sm text-muted">
              {result.outcome.skipped.map((s) => (
                <li key={s.index}>
                  Row {s.index}: {s.reason}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex gap-3">
          <Link href="/admin/review" className="btn btn-primary">
            Go to the review queue
          </Link>
          {/* A full page load clears the previous import. */}
          <a href="/admin/import" className="btn btn-quiet">
            Import another file
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <form action={previewAction} className="space-y-5 border hairline bg-surface p-5">
        <div>
          <label htmlFor="import-file" className="field-label">
            Import file (JSON or CSV, up to 1 MB)
          </label>
          <input id="import-file" name="file" type="file" accept=".json,.csv,application/json,text/csv" className="block font-sans text-sm" />
        </div>
        <div>
          <label htmlFor="import-raw" className="field-label">
            …or paste the contents
          </label>
          <textarea id="import-raw" name="raw" rows={6} className="input font-mono text-xs" />
        </div>
        <div>
          <label htmlFor="import-format" className="field-label">
            Format
          </label>
          <select id="import-format" name="format" defaultValue="" className="input max-w-xs text-sm">
            <option value="">Detect automatically</option>
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary" disabled={previewing}>
          {previewing ? "Checking…" : "Check file"}
        </button>
      </form>

      <FormMessage state={preview} />

      {preview.stage === "preview" && preview.preview && (
        <div className="space-y-6">
          {preview.preview.errors.length > 0 && (
            <div>
              <h2 className="font-sans text-sm font-semibold text-[#7a281d]">Rows with problems (will be skipped)</h2>
              <ul className="mt-2 space-y-2 font-sans text-sm">
                {preview.preview.errors.map((e) => (
                  <li key={e.index}>
                    <span className="font-medium">Row {e.index}:</span> {e.messages.join("; ")}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {preview.preview.valid.length > 0 && (
            <>
              <div className="overflow-x-auto border hairline bg-surface">
                <table className="w-full min-w-[600px] font-sans text-sm">
                  <caption className="sr-only">Rows ready to import</caption>
                  <thead className="border-b hairline text-left text-xs text-muted">
                    <tr>
                      <th scope="col" className="px-3 py-2 font-medium">Row</th>
                      <th scope="col" className="px-3 py-2 font-medium">Work</th>
                      <th scope="col" className="px-3 py-2 font-medium">Form</th>
                      <th scope="col" className="px-3 py-2 font-medium">Source</th>
                      <th scope="col" className="px-3 py-2 font-medium">Starts as</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {preview.preview.valid.map((row) => (
                      <tr key={row.index}>
                        <td className="px-3 py-2 tabular-nums text-muted">{row.index}</td>
                        <td className="max-w-xs truncate px-3 py-2">
                          {row.label}
                          {!row.hasText && <span className="ml-2 text-xs text-muted">(no text)</span>}
                        </td>
                        <td className="px-3 py-2">{row.contentType.toLowerCase().replace("_", " ")}</td>
                        <td className="px-3 py-2">{row.platform.toLowerCase().replace("_", " ")}</td>
                        <td className="px-3 py-2">{REVIEW_STATUS_LABELS[row.reviewStatus as keyof typeof REVIEW_STATUS_LABELS]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <form action={confirmAction} className="space-y-3">
                <input type="hidden" name="raw" value={preview.raw} />
                <input type="hidden" name="format" value={preview.format} />
                <p className="font-sans text-sm text-muted">
                  Imported works are created as drafts in the review queue. None are published, and each keeps its source reference.
                </p>
                <button type="submit" className="btn btn-primary" disabled={importing}>
                  {importing ? "Importing…" : `Import ${preview.preview.valid.length} works`}
                </button>
                <FormMessage state={result} />
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}
