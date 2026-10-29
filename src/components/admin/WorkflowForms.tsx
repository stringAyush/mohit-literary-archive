"use client";

import { useState } from "react";
import {
  approveAction,
  archiveAction,
  cancelScheduleAction,
  changeReviewAction,
  publishAction,
  restoreAction,
  restoreVersionAction,
  scheduleAction,
  unpublishAction,
} from "@/app/admin/actions/works";
import { PERMISSION_STATUS_LABELS } from "@/lib/constants";
import { FieldError, FormMessage } from "./FormMessage";
import { useActionForm } from "./useActionForm";

const actions = {
  publish: publishAction,
  cancelSchedule: cancelScheduleAction,
  unpublish: unpublishAction,
  archive: archiveAction,
  restore: restoreAction,
};

/** A single-button workflow step (publish, archive, …) that reports its result inline. */
export function WorkflowButton({
  workId,
  kind,
  label,
  variant = "quiet",
  disabled,
  withNote,
}: {
  workId: string;
  kind: keyof typeof actions;
  label: string;
  variant?: "primary" | "quiet" | "danger" | "secondary";
  disabled?: boolean;
  withNote?: string;
}) {
  const { state, isPending, onSubmit } = useActionForm(actions[kind]);
  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <input type="hidden" name="id" value={workId} />
      {withNote && (
        <div>
          <label htmlFor={`${kind}-note`} className="field-label text-xs">
            {withNote}
          </label>
          <input id={`${kind}-note`} name="note" maxLength={500} className="input text-sm" />
        </div>
      )}
      <button type="submit" className={`btn btn-${variant} w-full`} disabled={disabled || isPending}>
        {isPending ? "Working…" : label}
      </button>
      <FormMessage state={state} />
    </form>
  );
}

/** The date picker shows local time; the server receives an exact ISO timestamp. */
export function ScheduleForm({ workId, disabled }: { workId: string; disabled?: boolean }) {
  const { state, isPending, onSubmit } = useActionForm(scheduleAction);
  const [iso, setIso] = useState("");
  const zone = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "";
  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <input type="hidden" name="id" value={workId} />
      <input type="hidden" name="scheduledFor" value={iso} />
      <label htmlFor="schedule-at" className="field-label text-xs">
        Publish later {zone && <span className="font-normal text-muted">({zone} time)</span>}
      </label>
      <input
        id="schedule-at"
        type="datetime-local"
        className="input text-sm"
        onChange={(e) => setIso(e.target.value ? new Date(e.target.value).toISOString() : "")}
        aria-describedby={state.fieldErrors?.scheduledFor ? "schedule-error" : undefined}
      />
      <FieldError id="schedule-error" message={state.fieldErrors?.scheduledFor} />
      <button type="submit" className="btn btn-quiet w-full" disabled={disabled || isPending || !iso}>
        {isPending ? "Scheduling…" : "Schedule"}
      </button>
      {state.status !== "idle" && !state.fieldErrors?.scheduledFor && <FormMessage state={state} />}
    </form>
  );
}

export function ApproveForm({ workId, hasSource, current }: { workId: string; hasSource: boolean; current: { permissionStatus: string; permissionNote: string } }) {
  const { state, isPending, onSubmit } = useActionForm(approveAction);
  const errors = state.fieldErrors ?? {};
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <input type="hidden" name="id" value={workId} />
      <fieldset>
        <legend className="field-label">How was permission given?</legend>
        <div className="space-y-2 font-sans text-sm">
          {(["AUTHOR_SUBMITTED", "GRANTED"] as const).map((value) => (
            <label key={value} className="flex items-center gap-3">
              <input
                type="radio"
                name="permissionStatus"
                value={value}
                defaultChecked={current.permissionStatus === value}
                className="checkbox"
              />
              {PERMISSION_STATUS_LABELS[value]}
            </label>
          ))}
        </div>
        <FieldError id="permissionStatus-error" message={errors.permissionStatus} />
      </fieldset>
      <div>
        <label htmlFor="permissionNote" className="field-label">
          Evidence of permission
        </label>
        <textarea
          id="permissionNote"
          name="permissionNote"
          rows={3}
          defaultValue={current.permissionNote}
          placeholder="e.g. Mohit sent this text by WhatsApp on 2 Nov 2026 and asked for it to be published here."
          className="input min-h-20 text-sm"
          aria-invalid={errors.permissionNote ? true : undefined}
        />
        <FieldError id="permissionNote-error" message={errors.permissionNote} />
      </div>
      <label className="flex items-start gap-3 font-sans text-sm">
        <input type="checkbox" name="confirmAuthorship" className="checkbox mt-0.5" />
        <span>I confirm this is the writer&apos;s own work and the text matches what they wrote.</span>
      </label>
      <FieldError id="confirmAuthorship-error" message={errors.confirmAuthorship} />
      {hasSource && (
        <>
          <label className="flex items-start gap-3 font-sans text-sm">
            <input type="checkbox" name="sourceVerified" className="checkbox mt-0.5" />
            <span>I checked the source reference and the text matches it.</span>
          </label>
          <FieldError id="sourceVerified-error" message={errors.sourceVerified} />
        </>
      )}
      <div>
        <label htmlFor="verificationNote" className="field-label">
          Verification note <span className="font-normal text-muted">(optional)</span>
        </label>
        <input id="verificationNote" name="verificationNote" maxLength={1000} className="input text-sm" />
      </div>
      <button type="submit" className="btn btn-primary w-full" disabled={isPending}>
        {isPending ? "Approving…" : "Approve for publication"}
      </button>
      <FormMessage state={state} />
    </form>
  );
}

export function ReviewStatusForm({ workId, current }: { workId: string; current: string }) {
  const { state, isPending, onSubmit } = useActionForm(changeReviewAction);
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input type="hidden" name="id" value={workId} />
      <div>
        <label htmlFor="reviewStatus" className="field-label text-xs">
          Move to
        </label>
        <select id="reviewStatus" name="reviewStatus" defaultValue={current === "APPROVED" ? "NEEDS_VERIFICATION" : current} className="input text-sm">
          <option value="DISCOVERED">Discovered</option>
          <option value="NEEDS_VERIFICATION">Needs verification</option>
          <option value="PERMISSION_PENDING">Permission pending (requested)</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>
      <div>
        <label htmlFor="review-permission" className="field-label text-xs">
          Permission status
        </label>
        <select id="review-permission" name="permissionStatus" defaultValue="" className="input text-sm">
          <option value="">Leave unchanged</option>
          {Object.entries(PERMISSION_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="review-note" className="field-label text-xs">
          Note
        </label>
        <input id="review-note" name="note" maxLength={1000} className="input text-sm" />
      </div>
      <button type="submit" className="btn btn-quiet w-full" disabled={isPending}>
        {isPending ? "Updating…" : "Update review status"}
      </button>
      <FormMessage state={state} />
    </form>
  );
}

export function RestoreVersionButton({ workId, version }: { workId: string; version: number }) {
  const { state, isPending, onSubmit } = useActionForm(restoreVersionAction);
  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <input type="hidden" name="id" value={workId} />
      <input type="hidden" name="version" value={version} />
      <button type="submit" className="btn btn-quiet" disabled={isPending}>
        {isPending ? "Restoring…" : `Restore the text of version ${version}`}
      </button>
      <FormMessage state={state} />
    </form>
  );
}
