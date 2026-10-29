"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { errorToState, failure, type ActionState } from "@/lib/admin/action-state";
import { requireAdmin } from "@/lib/auth/admin";
import { toFieldErrors } from "@/lib/validation/helpers";
import {
  approveInputSchema,
  reviewChangeSchema,
  scheduleInputSchema,
  workFormToObject,
  workInputSchema,
} from "@/lib/validation/work";
import {
  approveWork,
  archiveWork,
  cancelSchedule,
  changeReview,
  createWork,
  deleteWork,
  publishWork,
  restoreVersion,
  restoreWork,
  scheduleWork,
  unpublishWork,
  updateWork,
} from "@/lib/works/service";

// Every action re-checks the administrator on the server before doing anything.

function workId(formData: FormData): string {
  const id = String(formData.get("id") ?? "");
  if (!id || id.length > 50) throw new Error("Missing work id");
  return id;
}

function refresh() {
  // Public pages are rendered on request, so this only refreshes the admin's view.
  revalidatePath("/", "layout");
}

export async function saveWorkAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = workInputSchema.safeParse(workFormToObject(formData));
  if (!parsed.success) {
    return failure("Please correct the highlighted fields.", toFieldErrors(parsed.error));
  }

  const id = String(formData.get("id") ?? "");
  let savedId = id;
  try {
    if (id) {
      const expected = String(formData.get("expectedUpdatedAt") ?? "");
      await updateWork(id, parsed.data, admin, expected ? new Date(expected) : undefined);
    } else {
      savedId = (await createWork(parsed.data, admin)).id;
    }
  } catch (error) {
    return errorToState(error);
  }

  refresh();
  redirect(`/admin/works/${savedId}?done=${id ? "saved" : "created"}`);
}

/** Runs one workflow step, then returns to the editor with a confirmation banner. */
async function runStep(
  formData: FormData,
  doneKey: string,
  step: (id: string, admin: { id: string }) => Promise<unknown>,
): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = workId(formData);
  try {
    await step(id, admin);
  } catch (error) {
    return errorToState(error);
  }
  refresh();
  redirect(`/admin/works/${id}?done=${doneKey}`);
}

export async function publishAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runStep(formData, "published", (id, admin) => publishWork(id, admin));
}

export async function scheduleAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = scheduleInputSchema.safeParse({ scheduledFor: formData.get("scheduledFor") });
  if (!parsed.success) return failure("Choose a date and time.", toFieldErrors(parsed.error));
  return runStep(formData, "scheduled", (id, admin) => scheduleWork(id, parsed.data.scheduledFor, admin));
}

export async function cancelScheduleAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runStep(formData, "schedule-cancelled", (id, admin) => cancelSchedule(id, admin));
}

export async function unpublishAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const note = String(formData.get("note") ?? "").trim().slice(0, 500);
  return runStep(formData, "unpublished", (id, admin) => unpublishWork(id, admin, note || undefined));
}

export async function archiveAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runStep(formData, "archived", (id, admin) => archiveWork(id, admin));
}

export async function restoreAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runStep(formData, "restored", (id, admin) => restoreWork(id, admin));
}

export async function approveAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = approveInputSchema.safeParse({
    permissionStatus: formData.get("permissionStatus"),
    permissionNote: formData.get("permissionNote") ?? "",
    confirmAuthorship: formData.get("confirmAuthorship") === "on",
    sourceVerified: formData.get("sourceVerified") === "on",
    verificationNote: formData.get("verificationNote") ?? "",
  });
  if (!parsed.success) return failure("Please complete the review.", toFieldErrors(parsed.error));
  return runStep(formData, "approved", (id, admin) => approveWork(id, parsed.data, admin));
}

export async function changeReviewAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const permission = String(formData.get("permissionStatus") ?? "");
  const parsed = reviewChangeSchema.safeParse({
    reviewStatus: formData.get("reviewStatus"),
    permissionStatus: permission || undefined,
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) return failure("Choose a review status.", toFieldErrors(parsed.error));
  return runStep(formData, "review-changed", (id, admin) => changeReview(id, parsed.data, admin));
}

export async function restoreVersionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const version = Number(formData.get("version"));
  if (!Number.isInteger(version) || version < 1) return failure("Choose a version.");
  const id = workId(formData);
  try {
    await restoreVersion(id, version, admin);
  } catch (error) {
    return errorToState(error);
  }
  refresh();
  redirect(`/admin/works/${id}/history?restored=${version}`);
}

export async function deleteWorkAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = workId(formData);
  try {
    await deleteWork(id);
  } catch (error) {
    return errorToState(error);
  }
  refresh();
  redirect("/admin/works?deleted=1");
}
