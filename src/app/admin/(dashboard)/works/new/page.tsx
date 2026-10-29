import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { WorkEditor } from "@/components/admin/WorkEditor";
import { getEditorOptions } from "@/lib/admin/editor-data";
import { requireAdmin } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "New work" };

export default async function NewWorkPage() {
  await requireAdmin();
  const { collections, tags } = await getEditorOptions();
  return (
    <>
      <PageHeader
        title="New work"
        back={{ label: "Works", href: "/admin/works" }}
        description="New works are saved as drafts that need review. Nothing is published until you approve and publish it."
      />
      <div className="max-w-3xl">
        <WorkEditor work={null} collections={collections} tags={tags} />
      </div>
    </>
  );
}
