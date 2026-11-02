"use client";

import { MobileMenu } from "./MobileMenu";
import { NavLinks } from "./NavLinks";
import { SearchDialog } from "./SearchDialog";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Wordmark } from "./Wordmark";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full bg-paper/85 py-3 sm:py-4 backdrop-blur-md border-b hairline transition-colors duration-200">
      <div className="page-container flex items-center justify-between gap-4">
        {/* Separated out name on the top left */}
        <div className="shrink-0">
          <Wordmark />
        </div>

        {/* Minimal navbar component with only the nav links and actions with search */}
        <nav
          aria-label="Main"
          className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full border border-ink/10 bg-surface/80 p-1 sm:p-1.5 shadow-[0_4px_24px_-4px_rgba(20,19,18,0.05)] backdrop-blur-md ring-1 ring-white/60"
        >
          <NavLinks />
          <div className="flex items-center gap-0.5 lg:pl-1.5 lg:border-l lg:border-line/70">
            <SearchDialog />
            <ThemeToggle />
            <MobileMenu />
          </div>
        </nav>
      </div>
    </header>
  );
}

export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-ink focus:px-4 focus:py-3 focus:font-sans focus:text-sm focus:text-paper"
    >
      Skip to content
    </a>
  );
}

export default SiteHeader;
