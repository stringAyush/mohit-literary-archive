import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Camera, Plus, Star, Eye, Trash2 } from "lucide-react";
import {
  deletePhotoPostAction,
  toggleFeaturePhotoAction,
  togglePublishPhotoAction,
} from "@/app/admin/actions/bookstagram";
import { PageHeader } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { requireAdmin } from "@/lib/auth/admin";
import { getAdminPhotoPosts } from "@/lib/bookstagram/service";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Book Photography Admin" };

type Props = {
  searchParams: Promise<{ status?: string; category?: string; q?: string; done?: string }>;
};

const TABS = [
  { key: "", label: "All frames" },
  { key: "published", label: "Published" },
  { key: "draft", label: "Drafts" },
  { key: "featured", label: "Featured" },
];

export default async function AdminBookstagramPage({ searchParams }: Props) {
  await requireAdmin();
  const { status, category, q, done } = await searchParams;

  const posts = await getAdminPhotoPosts({
    status,
    category,
    query: q,
  });

  return (
    <>
      <PageHeader
        title="Book Photography"
        description="Manage the literary photography gallery, book covers, and bookstagram frames."
        actions={
          <Link href="/admin/bookstagram/new" className="btn btn-primary inline-flex items-center gap-1.5">
            <Plus className="h-4 w-4" />
            <span>New photograph</span>
          </Link>
        }
      />

      {done && (
        <p role="status" className="mb-6 border-l-2 border-[#3d6b4a] bg-[#3d6b4a]/5 px-4 py-3 font-sans text-sm text-[#2f5539]">
          {done === "created" && "Photograph post created successfully."}
          {done === "saved" && "Photograph post updated successfully."}
          {done === "deleted" && "Photograph post deleted."}
          {done === "status-changed" && "Post status updated."}
        </p>
      )}

      {/* Tabs & Search */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <nav aria-label="Filter by status">
          <ul className="flex flex-wrap gap-1">
            {TABS.map((t) => (
              <li key={t.key}>
                <Link
                  href={`/admin/bookstagram${t.key ? `?status=${t.key}` : ""}`}
                  aria-current={t.key === (status || "") ? "page" : undefined}
                  className={`inline-flex min-h-10 items-center px-3 font-sans text-sm no-underline ${
                    t.key === (status || "") ? "border-b-2 border-accent text-ink" : "text-muted hover:text-ink"
                  }`}
                >
                  {t.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <form method="get" action="/admin/bookstagram" className="flex gap-2" role="search">
          {status && <input type="hidden" name="status" value={status} />}
          <label htmlFor="admin-photo-q" className="sr-only">
            Search photographs
          </label>
          <input
            id="admin-photo-q"
            name="q"
            type="search"
            defaultValue={q || ""}
            placeholder="Search title, book, author"
            className="input h-10 min-h-10 w-60 text-sm"
          />
          <button type="submit" className="btn btn-quiet min-h-10 py-0">
            Search
          </button>
        </form>
      </div>

      {/* Posts Table */}
      {posts.length === 0 ? (
        <p className="border-y hairline py-12 text-center font-sans text-sm text-muted">
          No photographs match the current filter.
        </p>
      ) : (
        <div className="overflow-x-auto border hairline bg-surface">
          <table className="w-full min-w-[760px] font-sans text-sm">
            <thead className="border-b hairline text-left text-xs text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Photograph</th>
                <th scope="col" className="px-4 py-3 font-medium">Book Details</th>
                <th scope="col" className="px-4 py-3 font-medium">Category</th>
                <th scope="col" className="px-4 py-3 font-medium">Visibility</th>
                <th scope="col" className="px-4 py-3 font-medium">Order</th>
                <th scope="col" className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {posts.map((post) => {
                const img = post.images[0];
                return (
                  <tr key={post.id} className="align-middle hover:bg-paper">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-line bg-paper">
                          {img?.url ? (
                            <Image
                              src={img.url}
                              alt={img.altText || post.title}
                              fill
                              className="object-cover"
                              sizes="56px"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted">
                              <Camera className="h-5 w-5 opacity-40" />
                            </div>
                          )}
                        </div>
                        <div>
                          <Link
                            href={`/admin/bookstagram/${post.id}`}
                            className="font-medium text-ink underline decoration-line underline-offset-4 hover:text-accent"
                          >
                            {post.title}
                          </Link>
                          <div className="mt-0.5 font-mono text-xs text-muted">
                            /bookstagram/{post.slug}
                          </div>
                          {post.featured && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-accent font-medium mt-0.5">
                              ★ Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {post.bookTitle ? (
                        <div>
                          <p className="font-medium text-ink">{post.bookTitle}</p>
                          {post.bookAuthor && (
                            <p className="text-xs text-muted">{post.bookAuthor}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {post.category ? (
                        <Badge variant="secondary">{post.category}</Badge>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <form action={togglePublishPhotoAction}>
                        <input type="hidden" name="id" value={post.id} />
                        <button
                          type="submit"
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium cursor-pointer transition-colors ${
                            post.isPublished
                              ? "bg-[#3d6b4a]/15 text-[#2f5539] hover:bg-[#3d6b4a]/25"
                              : "bg-black/10 text-muted hover:bg-black/20"
                          }`}
                        >
                          {post.isPublished ? "Live" : "Draft"}
                        </button>
                      </form>
                    </td>

                    <td className="px-4 py-3 font-mono text-xs text-muted">
                      {post.sortOrder}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {post.isPublished && (
                          <Link
                            href={`/bookstagram/${post.slug}`}
                            target="_blank"
                            className="btn btn-quiet h-8 min-h-8 px-2 text-xs"
                            title="View public page"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                        )}

                        <form action={toggleFeaturePhotoAction}>
                          <input type="hidden" name="id" value={post.id} />
                          <button
                            type="submit"
                            className={`btn btn-quiet h-8 min-h-8 px-2 text-xs ${
                              post.featured ? "text-accent" : "text-muted"
                            }`}
                            title={post.featured ? "Unfeature" : "Feature on homepage"}
                          >
                            <Star className={`h-3.5 w-3.5 ${post.featured ? "fill-current" : ""}`} />
                          </button>
                        </form>

                        <Link
                          href={`/admin/bookstagram/${post.id}`}
                          className="btn btn-quiet h-8 min-h-8 px-2.5 text-xs"
                        >
                          Edit
                        </Link>

                        <form action={deletePhotoPostAction}>
                          <input type="hidden" name="id" value={post.id} />
                          <button
                            type="submit"
                            className="btn btn-quiet h-8 min-h-8 px-2 text-xs text-[#8f2f22] hover:bg-[#8f2f22]/10"
                            title="Delete photograph"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
