import type { Metadata } from "next";
import { InquiryHandledButton } from "@/components/admin/SiteForms";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { isEmailConfigured } from "@/lib/env";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Messages" };

export default async function InquiriesPage() {
  await requireAdmin();
  const inquiries = await db.contactInquiry.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return (
    <>
      <PageHeader
        title="Messages"
        description={
          isEmailConfigured()
            ? "Messages from the contact form. Each is also emailed to the configured address."
            : "Messages from the contact form. Email delivery is not configured, so they are only stored here."
        }
      />
      {inquiries.length === 0 ? (
        <p className="border-y hairline py-12 text-center font-sans text-sm text-muted">No messages yet.</p>
      ) : (
        <ul className="space-y-4">
          {inquiries.map((m) => (
            <li key={m.id} className={`border hairline bg-surface p-5 font-sans text-sm ${m.handledAt ? "opacity-70" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{m.subject}</p>
                  <p className="mt-1 text-muted">
                    {m.name} ·{" "}
                    <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`} className="text-accent underline">
                      {m.email}
                    </a>{" "}
                    · {formatDateTime(m.createdAt)}
                  </p>
                </div>
                <InquiryHandledButton id={m.id} handled={Boolean(m.handledAt)} />
              </div>
              <p className="mt-4 whitespace-pre-line break-words text-ink">{m.message}</p>
              <p className="mt-3 text-xs text-muted">
                {m.emailDelivered ? "Emailed" : `Not emailed${m.deliveryError ? ` (${m.deliveryError})` : ""}`}
                {m.handledAt ? ` · handled ${formatDateTime(m.handledAt)}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
