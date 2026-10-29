import type { Metadata } from "next";
import { PhotoPostForm } from "@/components/admin/PhotoPostForm";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "New Photograph" };

export default async function NewPhotoPostPage() {
  await requireAdmin();

  return (
    <>
      <PageHeader
        title="New Photograph"
        back={{ label: "Book Photography", href: "/admin/bookstagram" }}
        description="Upload or link a photograph to create a new Bookstagram gallery post."
      />

      <PhotoPostForm />
    </>
  );
}
