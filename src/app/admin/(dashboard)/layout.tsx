import Link from "next/link";
import { logoutAction } from "@/app/admin/actions/auth";
import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const [reviewCount, inquiryCount] = await Promise.all([
    db.work.count({
      where: { reviewStatus: { in: ["DISCOVERED", "NEEDS_VERIFICATION", "PERMISSION_PENDING"] }, status: { not: "ARCHIVED" } },
    }),
    db.contactInquiry.count({ where: { handledAt: null } }),
  ]);

  const items = [
    { label: "Overview", href: "/admin" },
    { label: "Works", href: "/admin/works" },
    { label: "Review queue", href: "/admin/review", count: reviewCount },
    { label: "Collections", href: "/admin/collections" },
    { label: "Themes", href: "/admin/themes" },
    { label: "Writer profile", href: "/admin/author" },
    { label: "Import", href: "/admin/import" },
    { label: "Messages", href: "/admin/inquiries", count: inquiryCount },
  ];

  return (
    <div className="min-h-dvh bg-paper lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b hairline bg-surface lg:sticky lg:top-0 lg:h-dvh lg:border-b-0 lg:border-r">
        <div className="flex h-full flex-col gap-4 px-4 py-4 lg:px-5 lg:py-6">
          <div className="flex items-center justify-between lg:block">
            <Link href="/admin" className="font-display text-sm uppercase tracking-[0.14em] no-underline">
              Archive admin
            </Link>
            <Link href="/" className="font-sans text-xs text-muted hover:text-accent lg:mt-1 lg:block">
              View site ↗
            </Link>
          </div>
          <nav aria-label="Administration">
            <AdminNav items={items} />
          </nav>
          <div className="mt-auto hidden border-t hairline pt-4 font-sans text-xs text-muted lg:block">
            <p className="truncate">Signed in as {admin.name}</p>
            <form action={logoutAction} className="mt-2">
              <button type="submit" className="min-h-9 text-ink underline hover:text-accent">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>
      <div className="min-w-0">
        <div className="flex items-center justify-end gap-4 border-b hairline px-5 py-2 font-sans text-xs text-muted lg:hidden">
          <span className="truncate">{admin.name}</span>
          <form action={logoutAction}>
            <button type="submit" className="min-h-9 text-ink underline">
              Sign out
            </button>
          </form>
        </div>
        <main className="px-5 py-8 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
