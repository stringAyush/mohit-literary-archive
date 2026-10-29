"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { errorToState, failure, type ActionState } from "@/lib/admin/action-state";
import { requireAdmin } from "@/lib/auth/admin";
import {
  createPhotoPost,
  deletePhotoPost,
  toggleFeaturePost,
  togglePublishPost,
  updatePhotoPost,
} from "@/lib/bookstagram/service";

function refresh() {
  revalidatePath("/", "layout");
  revalidatePath("/bookstagram", "page");
  revalidatePath("/admin/bookstagram", "page");
}

export async function savePhotoPostAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const caption = String(formData.get("caption") ?? "").trim();
  const bookTitle = String(formData.get("bookTitle") ?? "").trim();
  const bookAuthor = String(formData.get("bookAuthor") ?? "").trim();
  const publisher = String(formData.get("publisher") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const instagramUrl = String(formData.get("instagramUrl") ?? "").trim();
  const isPublished = formData.get("isPublished") === "on";
  const featured = formData.get("featured") === "on";
  const sortOrder = Number(formData.get("sortOrder") || 0);

  const rawTags = String(formData.get("tags") ?? "").trim();
  const tags = rawTags
    ? rawTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const altText = String(formData.get("altText") ?? "").trim();
  const imageCaption = String(formData.get("imageCaption") ?? "").trim();

  if (!title) {
    return failure("Title is required", { title: "Title is required" });
  }

  if (!id && !imageUrl) {
    return failure("An image URL or uploaded photo is required", { imageUrl: "Image is required" });
  }

  try {
    if (id) {
      await updatePhotoPost(id, {
        title,
        slug: slug || undefined,
        caption: caption || null,
        bookTitle: bookTitle || null,
        bookAuthor: bookAuthor || null,
        publisher: publisher || null,
        category: category || null,
        tags,
        instagramUrl: instagramUrl || null,
        isPublished,
        featured,
        sortOrder,
        ...(imageUrl
          ? {
              images: [
                {
                  url: imageUrl,
                  altText: altText || title,
                  caption: imageCaption || null,
                },
              ],
            }
          : {}),
      });
    } else {
      await createPhotoPost({
        title,
        slug: slug || undefined,
        caption: caption || null,
        bookTitle: bookTitle || null,
        bookAuthor: bookAuthor || null,
        publisher: publisher || null,
        category: category || null,
        tags,
        instagramUrl: instagramUrl || null,
        isPublished,
        featured,
        sortOrder,
        images: [
          {
            url: imageUrl,
            altText: altText || title,
            caption: imageCaption || null,
          },
        ],
      });
    }
  } catch (error) {
    return errorToState(error);
  }

  refresh();
  redirect(`/admin/bookstagram?done=${id ? "saved" : "created"}`);
}

export async function deletePhotoPostAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("Missing photo id");

  await deletePhotoPost(id);
  refresh();
  redirect("/admin/bookstagram?done=deleted");
}

export async function togglePublishPhotoAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("Missing photo id");

  await togglePublishPost(id);
  refresh();
  redirect("/admin/bookstagram?done=status-changed");
}

export async function toggleFeaturePhotoAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("Missing photo id");

  await toggleFeaturePost(id);
  refresh();
  redirect("/admin/bookstagram?done=status-changed");
}
