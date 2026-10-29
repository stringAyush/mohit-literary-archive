import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { PhotoPostForm } from "@/components/admin/PhotoPostForm";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/admin";
import { type PhotoPostData } from "@/lib/bookstagram/types";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await db.photoPost.findUnique({ where: { id }, select: { title: true } });
  return { title: post ? `Edit ${post.title}` : "Edit Photograph" };
}

export default async function EditPhotoPostPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;

  const post = await db.photoPost.findUnique({
    where: { id },
    include: {
      images: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!post) notFound();

  return (
    <>
      <PageHeader
        title={`Edit: ${post.title}`}
        back={{ label: "Book Photography", href: "/admin/bookstagram" }}
        description={
          <span className="flex items-center gap-3">
            <span>/bookstagram/{post.slug}</span>
            {post.isPublished ? (
              <span className="text-[#2f5539] font-medium">● Published</span>
            ) : (
              <span className="text-muted">○ Draft</span>
            )}
            {post.featured && <span className="text-accent font-medium">★ Featured</span>}
          </span>
        }
        actions={
          post.isPublished && (
            <Link
              href={`/bookstagram/${post.slug}`}
              target="_blank"
              className="btn btn-secondary inline-flex items-center gap-1.5"
            >
              <span>View live</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          )
        }
      />

      <PhotoPostForm post={post as unknown as PhotoPostData} />
    </>
  );
}
