import { MobileMenu } from "./MobileMenu";
import { NavLinks } from "./NavLinks";
import { SearchDialog } from "./SearchDialog";
import { Wordmark } from "./Wordmark";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b hairline bg-paper/95 backdrop-blur-[2px] supports-[backdrop-filter]:bg-paper/90">
      <div className="page-container flex h-[68px] items-center justify-between gap-6 lg:h-[84px]">
        <Wordmark />
        <nav aria-label="Main" className="flex items-center gap-2 lg:gap-8">
          <NavLinks />
          <div className="flex items-center lg:border-l lg:hairline lg:pl-5">
            <SearchDialog />
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
