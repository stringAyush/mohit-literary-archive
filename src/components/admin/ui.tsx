import type { ReviewStatus, WorkStatus } from "@prisma/client";
import Link from "next/link";
import { WORKFLOW_STAGE_LABELS, workflowStage, type WorkflowStage } from "@/lib/constants";

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { label: string; href: string };
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b hairline pb-6">
      <div className="min-w-0">
        {back && (
          <Link href={back.href} className="mb-3 inline-block font-sans text-xs text-muted hover:text-accent">
            ← {back.label}
          </Link>
        )}
        <h1 className="font-display text-[1.875rem] leading-tight sm:text-[2.25rem]">{title}</h1>
        {description && <div className="mt-2 max-w-2xl font-sans text-sm text-muted">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

const stageStyles: Record<WorkflowStage, string> = {
  discovered: "border-[#7a6a3a]/40 text-[#5f5229]",
  needs_verification: "border-[#8f2f22]/40 text-[#7a281d]",
  permission_pending: "border-[#8a5a1c]/40 text-[#6f4712]",
  approved: "border-[#3d6b4a]/40 text-[#2f5539]",
  published: "border-[#3d6b4a] bg-[#3d6b4a] text-white",
  rejected: "border-ink/30 text-muted line-through",
};

export function StageBadge({ work }: { work: { status: WorkStatus; reviewStatus: ReviewStatus } }) {
  const stage = workflowStage(work);
  return (
    <span className={`inline-flex items-center border px-2 py-0.5 font-sans text-xs ${stageStyles[stage]}`}>
      {WORKFLOW_STAGE_LABELS[stage]}
    </span>
  );
}

export function StatusBadge({ status }: { status: WorkStatus }) {
  const labels: Record<WorkStatus, string> = { DRAFT: "Draft", SCHEDULED: "Scheduled", PUBLISHED: "Live", ARCHIVED: "Archived" };
  return (
    <span className="inline-flex items-center border hairline bg-surface px-2 py-0.5 font-sans text-xs text-ink">
      {labels[status]}
    </span>
  );
}

export function Panel({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <section aria-labelledby={id} className="border hairline bg-surface">
      <h2 id={id} className="border-b hairline px-5 py-3 font-sans text-sm font-semibold">
        {title}
      </h2>
      <div className="p-5">{children}</div>
    </section>
  );
}
