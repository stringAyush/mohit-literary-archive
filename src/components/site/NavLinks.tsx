"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_LINKS, isActivePath } from "./nav";

export function NavLinks() {
  const pathname = usePathname();
  return (
    <ul className="hidden items-center gap-1 lg:flex">
      {NAV_LINKS.map((link) => {
        const active = isActivePath(pathname, link.href);
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`relative inline-flex items-center px-3.5 py-1.5 rounded-full font-sans text-xs font-medium tracking-wide no-underline transition-all duration-200 ${
                active
                  ? "bg-accent text-white font-medium shadow-xs"
                  : "text-ink/80 hover:text-ink hover:bg-ink/5"
              }`}
            >
              <span>{link.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
