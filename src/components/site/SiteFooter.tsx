import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";
import { Wordmark } from "./Wordmark";

const SECTIONS = [
  {
    heading: "Explore",
    links: [
      { label: "The Archive", href: "/works" },
      { label: "Book Photography", href: "/bookstagram" },
      { label: "Collections", href: "/collections" },
    ],
  },
  { heading: "About", links: [{ label: "About the writer", href: "/about" }] },
  {
    heading: "Copyright",
    links: [
      { label: "Copyright & Permissions", href: "/copyright" },
      { label: "Report misattribution", href: "/contact?subject=Misattribution%20report" },
    ],
  },
  {
    heading: "Contact",
    links: [
      { label: "Write to the writer", href: "/contact" },
      { label: "Request permission", href: "/contact?subject=Permission%20request" },
    ],
  },
];

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-night text-night-text">
      <div className="page-container py-14 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div className="max-w-sm">
            <Wordmark tone="night" />
            <p className="mt-6 font-editorial text-xl leading-snug text-night-muted">
              Some things are better left in words.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4">
            {SECTIONS.map((section) => (
              <div key={section.heading}>
                <h2 className="font-sans text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-night-muted">
                  {section.heading}
                </h2>
                <ul className="mt-3">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="inline-flex min-h-11 items-center font-sans text-sm text-night-text no-underline transition-colors hover:text-accent"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-14 border-t border-white/15 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-sans text-xs text-night-muted">
          <p>
            © {year} {SITE_NAME}. All rights reserved. Writing on this site may not be reproduced without permission —
            see{" "}
            <Link href="/copyright" className="underline hover:text-night-text">
              Copyright &amp; Permissions
            </Link>
            .
          </p>
          <p className="font-editorial italic text-xs text-night-muted/80">
            A digital literary publication &amp; continuous folio.
          </p>
        </div>
      </div>
    </footer>
  );
}
