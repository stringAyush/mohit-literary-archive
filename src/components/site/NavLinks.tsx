"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_LINKS, isActivePath } from "./nav";

export function NavLinks() {
  const pathname = usePathname();
  return (
    <ul className="hidden items-center gap-8 lg:flex">
      {NAV_LINKS.map((link) => {
        const active = isActivePath(pathname, link.href);
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`relative py-2 font-sans text-[0.875rem] tracking-[0.02em] no-underline transition-colors hover:text-accent ${
                active ? "text-ink after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:bg-accent" : "text-muted"
              }`}
            >
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
