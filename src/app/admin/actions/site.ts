"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { errorToState, failure, success, type ActionState } from "@/lib/admin/action-state";
import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { toFieldErrors } from "@/lib/validation/helpers";
import { authorProfileInputSchema, collectionInputSchema, tagInputSchema } from "@/lib/validation/site";
import { slugify } from "@/lib/works/slug";

function refresh() {
  revalidatePath("/", "layout");
}

async function uniqueSlug(base: string, taken: (slug: string) => Promise<boolean>): Promise<string> {
  const start = base || `item-${Date.now().toString(36)}`;
  if (!(await taken(start))) return start;
  for (let n = 2; n < 500; n++) {
    if (!(await taken(`${start}-${n}`))) return `${start}-${n}`;
  }
  throw new Error("No free slug");
}

// ─── Collections ──────────────────────────────────────────────────────────

export async function saveCollectionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = collectionInputSchema.safeParse({
    name: formData.get("name") ?? "",
    slug: formData.get("slug"),
    description: formData.get("description"),
    introduction: formData.get("introduction"),
    isPublished: formData.get("isPublished"),
    sortOrder: formData.get("sortOrder") || 0,
  });
  if (!parsed.success) return failure("Please correct the highlighted fields.", toFieldErrors(parsed.error));

  const id = String(formData.get("id") ?? "");
  const data = parsed.data;
  let newId: string | null = null;
  try {
    if (id) {
      await db.collection.update({
        where: { id },
        data: { ...data, slug: data.slug ?? undefined },
      });
    } else {
      const slug =
        data.slug ??
        (await uniqueSlug(slugify(data.name), async (s) => Boolean(await db.collection.findUnique({ where: { slug: s } }))));
      const created = await db.collection.create({ data: { ...data, slug } });
      newId = created.id;
    }
  } catch (error) {
    return errorToState(error);
  }
  refresh();
  if (newId) redirect(`/admin/collections/${newId}?created=1`);
  return success(data.isPublished ? "Saved. The collection is shown publicly once it contains published work." : "Saved. The collection is hidden from readers.");
}

export async function deleteCollectionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  if (formData.get("confirm") !== "on") {
    return failure("Tick the box to confirm. Works in the collection are not deleted.", {
      confirm: "Please confirm",
    });
  }
  try {
    await db.collection.delete({ where: { id: String(formData.get("id")) } });
  } catch (error) {
    return errorToState(error);
  }
  refresh();
  redirect("/admin/collections?deleted=1");
}

// ─── Themes ───────────────────────────────────────────────────────────────

export async function saveTagAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = tagInputSchema.safeParse({
    name: formData.get("name") ?? "",
    slug: formData.get("slug"),
    description: formData.get("description"),
  });
  if (!parsed.success) return failure("Please correct the highlighted fields.", toFieldErrors(parsed.error));
  const id = String(formData.get("id") ?? "");
  const data = parsed.data;
  try {
    if (id) {
      await db.tag.update({ where: { id }, data: { ...data, slug: data.slug ?? undefined } });
    } else {
      const slug =
        data.slug ?? (await uniqueSlug(slugify(data.name), async (s) => Boolean(await db.tag.findUnique({ where: { slug: s } }))));
      await db.tag.create({ data: { ...data, slug } });
    }
  } catch (error) {
    return errorToState(error);
  }
  refresh();
  return success(id ? "Theme saved." : "Theme added.");
}

export async function deleteTagAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  try {
    await db.tag.delete({ where: { id: String(formData.get("id")) } });
  } catch (error) {
    return errorToState(error);
  }
  refresh();
  return success("Theme removed. The works themselves were not changed.");
}

// ─── Writer profile ───────────────────────────────────────────────────────

export async function saveAuthorAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const labels = formData.getAll("linkLabel").map(String);
  const urls = formData.getAll("linkUrl").map(String);
  const links = labels
    .map((label, i) => ({ label: label.trim(), url: (urls[i] ?? "").trim() }))
    .filter((link) => link.label || link.url);

  const parsed = authorProfileInputSchema.safeParse({
    displayName: formData.get("displayName") ?? "",
    shortIntro: formData.get("shortIntro"),
    biography: formData.get("biography"),
    writingPhilosophy: formData.get("writingPhilosophy"),
    links,
    approval: formData.get("approval") ?? "keep",
    profileApprovalNote: formData.get("profileApprovalNote"),
  });
  if (!parsed.success) return failure("Please correct the highlighted fields.", toFieldErrors(parsed.error));

  const id = String(formData.get("id") ?? "");
  const { approval, ...data } = parsed.data;
  let approvedNow = false;
  try {
    const existing = await db.authorProfile.findUnique({ where: { id } });
    if (!existing) return failure("The writer profile could not be found.");
    const textChanged =
      existing.shortIntro !== data.shortIntro ||
      existing.biography !== data.biography ||
      existing.writingPhilosophy !== data.writingPhilosophy;

    // Approval covers the exact text the writer approved: editing the text withdraws it.
    let profileApprovedAt = existing.profileApprovedAt;
    if (approval === "approve") profileApprovedAt = new Date();
    else if (approval === "withdraw" || textChanged) profileApprovedAt = null;
    approvedNow = profileApprovedAt !== null;

    await db.authorProfile.update({
      where: { id },
      data: {
        ...data,
        links: data.links,
        profileApprovedAt,
        profileApprovalNote:
          approval === "approve" ? (data.profileApprovalNote ?? `Marked approved by ${admin.name}`) : data.profileApprovalNote,
      },
    });
  } catch (error) {
    return errorToState(error);
  }
  refresh();
  return success(
    approvedNow
      ? "Saved. The approved introduction and biography are shown on the site."
      : "Saved. Biographical text stays hidden until the writer has approved it.",
  );
}

// ─── Messages ─────────────────────────────────────────────────────────────

export async function toggleInquiryHandledAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  try {
    const inquiry = await db.contactInquiry.findUnique({ where: { id }, select: { handledAt: true } });
    if (!inquiry) return failure("That message no longer exists.");
    await db.contactInquiry.update({ where: { id }, data: { handledAt: inquiry.handledAt ? null : new Date() } });
  } catch (error) {
    return errorToState(error);
  }
  refresh();
  return success("Updated.");
}
