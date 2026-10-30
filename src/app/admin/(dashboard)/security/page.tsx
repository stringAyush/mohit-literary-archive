import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { SecuritySettings } from "@/components/admin/SecuritySettings";
import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Security & Account" };

export default async function SecurityPage() {
  const admin = await requireAdmin();

  const [user, activeSessionCount] = await Promise.all([
    db.adminUser.findUnique({ where: { id: admin.id } }),
    db.adminSession.count({
      where: {
        userId: admin.id,
        expiresAt: { gt: new Date() },
      },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Security & Account"
        description="Monitor security status, change account credentials, and manage active sessions."
      />

      <SecuritySettings
        currentEmail={user?.email ?? admin.email}
        adminName={user?.name ?? admin.name}
        activeSessionCount={activeSessionCount}
      />
    </>
  );
}
