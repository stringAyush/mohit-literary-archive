import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { getCurrentAdmin } from "@/lib/auth/admin";
import { SITE_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await getCurrentAdmin()) redirect("/admin");
  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <p className="font-display text-sm uppercase tracking-[0.16em]">{SITE_NAME}</p>
        <h1 className="mt-6 font-display text-[2.25rem] leading-tight">Archive administration</h1>
        <p className="mt-2 font-sans text-sm text-muted">Sign in to manage the archive.</p>
        <div className="mt-8 border-t hairline pt-8">
          <LoginForm />
        </div>
        <p className="mt-10 font-sans text-sm">
          <Link href="/" className="text-link">
            ← Back to the site
          </Link>
        </p>
      </div>
    </main>
  );
}
