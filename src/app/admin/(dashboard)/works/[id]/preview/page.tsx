import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { WorkText } from "@/components/works/WorkText";
import { requireAdmin } from "@/lib/auth/admin";
import { contentTypeLabel, WORK_STATUS_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false } };

type Props = { params: Promise<{ id: string }> };

// Shows a draft the way readers will see it. Only administrators can reach this page.
export default async function PreviewPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const work = await db.work.findUnique({ where: { id }, include: { author: { select: { displayName: true } } } });
  if (!work) notFound();

  return (
    <div className="-mx-5 -my-8 min-h-dvh bg-paper lg:-mx-10 lg:-my-10">
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 bg-ink px-5 py-3 font-sans text-sm text-paper lg:px-10">
        <span>
          Preview · {WORK_STATUS_LABELS[work.status]}
          {work.status !== "PUBLISHED" && " — not visible to readers"}
        </span>
        <Link href={`/admin/works/${work.id}`} className="underline">
          Back to editing
        </Link>
      </div>
      <article className="px-5 pb-24 pt-16 lg:pt-24">
        <div className="reading-column">
          <p className="eyebrow text-accent">{contentTypeLabel(work.contentType)}</p>
          {work.title && (
            <h1 className="mt-5 font-display text-[clamp(2.25rem,4.5vw,3.25rem)] leading-[1.1] tracking-[-0.01em]">{work.title}</h1>
          )}
          <div className={work.title ? "mt-10" : "mt-8"}>
            {work.body.trim() ? (
              <WorkText body={work.body} language={work.language} lineated={work.contentType !== "REFLECTION"} />
            ) : (
              <p className="font-sans text-sm text-muted">This work has no text yet.</p>
            )}
          </div>
          <p className="mt-10 font-editorial text-[1.5rem] italic">— {work.author.displayName}</p>
        </div>
      </article>
    </div>
  );
}
