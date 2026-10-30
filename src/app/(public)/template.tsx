"use client";

import { usePathname } from "next/navigation";

export default function PublicTemplate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <>
      {/* Dynamic route transition indicator / motion graphic progress shimmer */}
      <div
        key={`progress-${pathname}`}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 right-0 z-50 h-[2.5px] overflow-hidden"
      >
        <div
          className="h-full w-full bg-accent shadow-[0_0_10px_var(--color-accent)]"
          style={{
            animation: "progress-shimmer 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          }}
        />
      </div>

      {/* Dynamic page content with smooth page entrance motion */}
      <div key={`page-${pathname}`} className="animate-page-enter">
        {children}
      </div>
    </>
  );
}
