"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Upload, Camera, AlertCircle } from "lucide-react";
import { savePhotoPostAction } from "@/app/admin/actions/bookstagram";
import { BOOKSTAGRAM_CATEGORIES, type PhotoPostData } from "@/lib/bookstagram/types";
import { useActionForm } from "./useActionForm";
import { FormMessage } from "./FormMessage";

type Props = {
  post?: PhotoPostData | null;
};

export function PhotoPostForm({ post }: Props) {
  const { state, isPending, onSubmit } = useActionForm(savePhotoPostAction);
  const [imageUrl, setImageUrl] = useState(post?.images[0]?.url || "");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError("");

    try {
      const data = new FormData();
      data.append("file", file);

      const res = await fetch("/api/admin/upload-photo", {
        method: "POST",
        body: data,
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "Upload failed");
      }

      setImageUrl(json.url);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8 max-w-4xl" noValidate>
      {post?.id && <input type="hidden" name="id" value={post.id} />}
      <input type="hidden" name="imageUrl" value={imageUrl} />

      {/* Photo Preview & Upload Box */}
      <div className="rounded-xl border border-line bg-surface p-6 shadow-xs">
        <label className="field-label mb-2 block">Photograph</label>
        <div className="grid gap-6 md:grid-cols-[280px_1fr] items-start">
          <div className="relative aspect-4/3 w-full overflow-hidden rounded-lg border border-line bg-paper flex items-center justify-center">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt="Photograph preview"
                fill
                className="object-contain"
                sizes="280px"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-muted p-4 text-center">
                <Camera className="h-8 w-8 mb-2 opacity-50" />
                <span className="text-xs">No photograph selected</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <p className="font-sans text-xs text-muted mb-2">
                Upload a high-resolution PNG, JPG, or WebP photograph (up to 15MB):
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                className="hidden"
                id="photo-upload-input"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="btn btn-secondary inline-flex items-center gap-2 text-xs"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>{isUploading ? "Uploading photograph…" : "Upload from computer"}</span>
              </button>
            </div>

            <div>
              <label htmlFor="manual-image-url" className="field-label text-xs">
                Or specify image URL / public path
              </label>
              <input
                id="manual-image-url"
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="/photos/my-book.png"
                className="input text-xs"
              />
            </div>

            {uploadError && (
              <p className="flex items-center gap-1.5 text-xs text-[#8f2f22]">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{uploadError}</span>
              </p>
            )}

            <div>
              <label htmlFor="alt-text-input" className="field-label text-xs">
                Alternative text (for accessibility)
              </label>
              <input
                id="alt-text-input"
                name="altText"
                defaultValue={post?.images[0]?.altText || ""}
                placeholder="Descriptive explanation of the photo content"
                className="input text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Metadata */}
      <div className="rounded-xl border border-line bg-surface p-6 shadow-xs space-y-6">
        <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-muted border-b hairline pb-3">
          Post Details &amp; Metadata
        </h3>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="post-title" className="field-label">
              Post title <span className="text-accent">*</span>
            </label>
            <input
              id="post-title"
              name="title"
              defaultValue={post?.title || ""}
              required
              placeholder="e.g. Norwegian Wood in Stillness"
              className="input font-medium"
            />
          </div>

          <div>
            <label htmlFor="post-book-title" className="field-label">
              Book title
            </label>
            <input
              id="post-book-title"
              name="bookTitle"
              defaultValue={post?.bookTitle || ""}
              placeholder="e.g. Norwegian Wood"
              className="input text-sm"
            />
          </div>

          <div>
            <label htmlFor="post-book-author" className="field-label">
              Book author
            </label>
            <input
              id="post-book-author"
              name="bookAuthor"
              defaultValue={post?.bookAuthor || ""}
              placeholder="e.g. Haruki Murakami"
              className="input text-sm"
            />
          </div>

          <div>
            <label htmlFor="post-publisher" className="field-label">
              Publisher or edition
            </label>
            <input
              id="post-publisher"
              name="publisher"
              defaultValue={post?.publisher || ""}
              placeholder="e.g. Vintage Classics"
              className="input text-sm"
            />
          </div>

          <div>
            <label htmlFor="post-category" className="field-label">
              Category
            </label>
            <select
              id="post-category"
              name="category"
              defaultValue={post?.category || "Book Covers"}
              className="input text-sm"
            >
              <option value="">Select a category</option>
              {BOOKSTAGRAM_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="post-caption" className="field-label">
              Caption / Editorial note
            </label>
            <textarea
              id="post-caption"
              name="caption"
              defaultValue={post?.caption || ""}
              rows={3}
              placeholder="Reflections on the book, the setting, or literary details..."
              className="input text-sm leading-relaxed"
            />
          </div>

          <div>
            <label htmlFor="post-tags" className="field-label">
              Tags (comma separated)
            </label>
            <input
              id="post-tags"
              name="tags"
              defaultValue={post?.tags?.join(", ") || ""}
              placeholder="Murakami, Japanese Literature, Red Cover"
              className="input text-sm"
            />
          </div>

          <div>
            <label htmlFor="post-instagram-url" className="field-label">
              Instagram post URL (optional)
            </label>
            <input
              id="post-instagram-url"
              name="instagramUrl"
              type="url"
              defaultValue={post?.instagramUrl || ""}
              placeholder="https://www.instagram.com/p/..."
              className="input text-sm"
            />
          </div>

          <div>
            <label htmlFor="post-sort-order" className="field-label">
              Gallery sort order
            </label>
            <input
              id="post-sort-order"
              name="sortOrder"
              type="number"
              defaultValue={post?.sortOrder ?? 0}
              className="input text-sm"
            />
            <p className="mt-1 text-xs text-muted">Lower numbers appear first in the gallery.</p>
          </div>

          <div>
            <label htmlFor="post-slug" className="field-label">
              Custom web address (slug)
            </label>
            <input
              id="post-slug"
              name="slug"
              defaultValue={post?.slug || ""}
              placeholder="auto-generated-from-title"
              className="input text-sm font-mono"
            />
          </div>
        </div>

        {/* Status Toggles */}
        <div className="border-t hairline pt-4 flex flex-wrap gap-6 font-sans text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="isPublished"
              defaultChecked={post ? post.isPublished : true}
              className="h-4 w-4 rounded border-line text-accent"
            />
            <span className="font-medium text-ink">Publish to public gallery</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={post?.featured || false}
              className="h-4 w-4 rounded border-line text-accent"
            />
            <span className="font-medium text-ink">Feature on homepage showcase</span>
          </label>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Link href="/admin/bookstagram" className="btn btn-quiet">
          ← Cancel
        </Link>
        <button type="submit" disabled={isPending || isUploading} className="btn btn-primary px-6">
          {isPending ? "Saving…" : post ? "Update photograph" : "Save photograph"}
        </button>
      </div>

      <FormMessage state={state} />
    </form>
  );
}
