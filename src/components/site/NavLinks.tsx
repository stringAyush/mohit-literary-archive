"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { NAV_LINKS, isActivePath } from "./nav";

export function NavLinks() {
  const pathname = usePathname();
  return (
    <ul className="hidden items-center gap-1 lg:flex">
      {NAV_LINKS.map((link) => {
        const active = isActivePath(pathname, link.href);
        return (
          <li key={link.href} className="relative">
            <Link
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`relative z-10 inline-flex items-center px-3.5 py-1.5 rounded-full font-sans text-xs font-medium tracking-wide no-underline transition-colors duration-200 ${
                active
                  ? "text-white font-medium"
                  : "text-ink/80 hover:text-ink hover:bg-ink/5"
              }`}
            >
              <span>{link.label}</span>
            </Link>
            {active && (
              <motion.div
                layoutId="active-nav-pill"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                className="absolute inset-0 rounded-full bg-accent shadow-xs"
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default NavLinks;
