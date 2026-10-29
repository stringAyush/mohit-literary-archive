import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader, SkipLink } from "@/components/site/SiteHeader";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <>
      <SkipLink />
      <SiteHeader />
      <main id="main" className="page-container flex min-h-[62vh] items-center py-20">
        <div className="reading-column text-center">
          <p className="eyebrow">404</p>
          <h1 className="mt-6 font-editorial text-[clamp(2.25rem,5vw,3.5rem)] italic leading-tight">
            This page has not been written.
          </h1>
          <p className="mx-auto mt-5 max-w-md font-sans text-sm text-muted">
            The address may be mistyped, or the piece may no longer be published.
          </p>
          <Link href="/works" className="btn btn-primary mt-10">
            Return to the archive
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
