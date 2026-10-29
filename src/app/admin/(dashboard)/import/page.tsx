import type { Metadata } from "next";
import { ImportForm } from "@/components/admin/ImportForm";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Import" };

export default async function ImportPage() {
  await requireAdmin();
  return (
    <>
      <PageHeader
        title="Import works"
        description={
          <>
            Add many works at once from a JSON or CSV file. Templates are in the project&apos;s <code>content/</code>{" "}
            folder. Only import text the writer has supplied or agreed to; imported works always start in review.
          </>
        }
      />
      <div className="max-w-4xl">
        <ImportForm />
      </div>
    </>
  );
}
