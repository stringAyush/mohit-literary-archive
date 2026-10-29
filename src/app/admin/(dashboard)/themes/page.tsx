import type { Metadata } from "next";
import { DeleteTagButton, TagForm } from "@/components/admin/SiteForms";
import { PageHeader, Panel } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Themes" };

export default async function ThemesPage() {
  await requireAdmin();
  const tags = await db.tag.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { works: true } } } });
  return (
    <>
      <PageHeader title="Themes" description="Themes let readers filter the archive (for example: grief, home, rain). Only themes with published works are offered to readers." />
      <div className="space-y-8">
        <Panel title="Add a theme" id="add-theme">
          <TagForm />
        </Panel>
        {tags.length === 0 ? (
          <p className="font-sans text-sm text-muted">No themes yet.</p>
        ) : (
          <ul className="divide-y divide-line border hairline bg-surface">
            {tags.map((tag) => (
              <li key={tag.id} className="space-y-1 p-4">
                <TagForm
                  key={tag.updatedAt.toISOString()}
                  tag={{ id: tag.id, name: tag.name, slug: tag.slug, description: tag.description ?? "" }}
                />
                <div className="flex flex-wrap items-center gap-4 font-sans text-xs text-muted">
                  <span>Used by {tag._count.works} works</span>
                  <DeleteTagButton id={tag.id} name={tag.name} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
