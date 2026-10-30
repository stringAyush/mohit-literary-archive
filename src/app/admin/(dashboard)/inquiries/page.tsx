import type { Metadata } from "next";
import { InquiriesBatchList } from "@/components/admin/InquiriesBatchList";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { isEmailConfigured } from "@/lib/env";

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
      <InquiriesBatchList inquiries={inquiries} />
    </>
  );
}
