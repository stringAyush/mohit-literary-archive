import type { Metadata } from "next";
import { HomepageCustomizerForm } from "@/components/admin/HomepageCustomizerForm";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { getHomepageConfig } from "@/lib/settings/service";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Homepage Customizer" };

export default async function AdminHomepageCustomizerPage() {
  await requireAdmin();

  const [config, works] = await Promise.all([
    getHomepageConfig(),
    db.work.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, title: true, slug: true, contentType: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Homepage Customizer"
        description="Fine-tune the hero headline, editorial subtitle, action buttons, dynamic marquee ticker, and featured highlight on your public home page."
      />
      <HomepageCustomizerForm config={config} works={works} />
    </div>
  );
}
