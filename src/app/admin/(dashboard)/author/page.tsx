import type { Metadata } from "next";
import { AuthorForm } from "@/components/admin/SiteForms";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/admin";
import { getPrimaryAuthor, profileLinks } from "@/lib/works/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Writer profile" };

export default async function AuthorPage() {
  await requireAdmin();
  const author = await getPrimaryAuthor();
  return (
    <>
      <PageHeader
        title="Writer profile"
        description="The name, introduction and biography shown on the home and About pages. Biographical text is shown only after the writer approves it."
      />
      {author ? (
        <div className="max-w-3xl">
          <AuthorForm
            key={author.updatedAt.toISOString()}
            author={{
              id: author.id,
              displayName: author.displayName,
              shortIntro: author.shortIntro ?? "",
              biography: author.biography ?? "",
              writingPhilosophy: author.writingPhilosophy ?? "",
              links: profileLinks(author.links),
              approvedAt: author.profileApprovedAt?.toISOString() ?? null,
              approvalNote: author.profileApprovalNote ?? "",
            }}
          />
        </div>
      ) : (
        <p className="font-sans text-sm text-muted">No writer profile exists yet. Run <code>npm run db:seed</code> to create it.</p>
      )}
    </>
  );
}
