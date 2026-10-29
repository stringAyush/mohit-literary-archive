"use client";

import Link from "next/link";

export default function PublicError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="page-container section-space">
      <div className="reading-column border-y hairline py-16 text-center">
        <p className="font-editorial text-[2rem] italic">This page could not be loaded just now.</p>
        <p className="mt-3 font-sans text-sm text-muted">Please try again in a moment.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="btn btn-primary">
            Try again
          </button>
          <Link href="/works" className="btn btn-secondary">
            Return to the archive
          </Link>
        </div>
      </div>
    </div>
  );
}
