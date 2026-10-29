import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/ui";
import { RestoreVersionButton } from "@/components/admin/WorkflowForms";
import { WorkText } from "@/components/works/WorkText";
import { requireAdmin } from "@/lib/auth/admin";
import { contentTypeLabel, languageLabel } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Version" };

type Props = { params: Promise<{ id: string; version: string }> };

export default async function VersionPage({ params }: Props) {
  await requireAdmin();
  const { id, version: versionParam } = await params;
  const versionNumber = Number.parseInt(versionParam, 10);
  if (!Number.isInteger(versionNumber)) notFound();

  const [work, version] = await Promise.all([
    db.work.findUnique({ where: { id }, select: { id: true, currentVersion: true, title: true, slug: true } }),
    db.workVersion.findUnique({
      where: { workId_version: { workId: id, version: versionNumber } },
      include: { createdBy: { select: { name: true } } },
    }),
  ]);
  if (!work || !version) notFound();

  return (
    <>
      <PageHeader
        title={`Version ${version.version}${version.version === work.currentVersion ? " (current)" : ""}`}
        back={{ label: "History", href: `/admin/works/${work.id}/history` }}
        description={`Saved ${formatDateTime(version.createdAt)} by ${version.createdBy?.name ?? "the system"}${
          version.changeReason ? ` — ${version.changeReason}` : ""
        }`}
      />
      <dl className="mb-8 grid gap-4 font-sans text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs text-muted">Form</dt>
          <dd>{contentTypeLabel(version.contentType)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Language</dt>
          <dd>{languageLabel(version.language)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Address</dt>
          <dd className="font-mono text-xs">/works/{version.slug}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">SHA-256</dt>
          <dd className="break-all font-mono text-[0.6875rem]">{version.contentHash}</dd>
        </div>
      </dl>
      <div className="max-w-[760px] border hairline bg-surface p-6 lg:p-10">
        {version.title && <h2 className="mb-6 font-display text-[2rem] leading-tight">{version.title}</h2>}
        <WorkText body={version.body || "(no text)"} language={version.language} lineated={version.contentType !== "REFLECTION"} />
      </div>
      {version.version !== work.currentVersion && (
        <div className="mt-8">
          <RestoreVersionButton workId={work.id} version={version.version} />
          <p className="mt-2 font-sans text-xs text-muted">
            Restoring creates a new version with this text. Nothing in the history is removed.
          </p>
        </div>
      )}
    </>
  );
}
