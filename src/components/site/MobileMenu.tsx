"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { CloseIcon, MenuIcon } from "@/components/ui/icons";
import { SITE_NAME } from "@/lib/constants";
import { NAV_LINKS, isActivePath } from "./nav";
import { useModalDialog } from "./useModalDialog";

export function MobileMenu() {
  const pathname = usePathname();
  const { ref, isOpen, open, close } = useModalDialog();

  // Close the drawer after navigating.
  useEffect(() => {
    close();
  }, [pathname, close]);

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink transition-all hover:bg-ink/5 lg:hidden"
        aria-label="Open menu"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <MenuIcon className="h-5 w-5" />
      </button>

      <dialog
        ref={ref}
        aria-label="Site menu"
        className="mobile-menu-drawer m-0 ml-auto h-dvh max-h-none w-[min(22rem,88vw)] max-w-none bg-paper/95 backdrop-blur-xl p-0 text-ink shadow-[-1px_0_0_var(--color-line)]"
      >
        <div className="flex h-full flex-col px-6 pb-8">
          <div className="flex h-[68px] items-center justify-between border-b hairline">
            <span className="eyebrow flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-dot" />
              Navigation
            </span>
            <button
              type="button"
              onClick={close}
              className="-mr-2 inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-ink/5 transition-transform duration-200 hover:rotate-90"
              aria-label="Close menu"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
          <nav aria-label="Main" className="mt-6">
            <ul>
              {NAV_LINKS.map((link, index) => {
                const active = isActivePath(pathname, link.href);
                return (
                  <li
                    key={link.href}
                    className="border-b hairline"
                    style={{
                      animation: "menu-item-enter 0.35s cubic-bezier(0.16, 1, 0.3, 1) backwards",
                      animationDelay: `${(index + 1) * 65}ms`,
                    }}
                  >
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-14 items-center justify-between font-display text-2xl no-underline transition-all duration-200 hover:translate-x-1 ${
                        active ? "text-ink font-semibold" : "text-ink/80 hover:text-ink"
                      }`}
                    >
                      <span>{link.label}</span>
                      {active && <span className="h-2 w-2 rounded-full bg-accent animate-pulse-dot" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <ul className="mt-8 space-y-1 font-sans text-sm text-muted">
            <li>
              <Link href="/copyright" className="inline-flex min-h-11 items-center hover:text-accent">
                Copyright &amp; Permissions
              </Link>
            </li>
            <li>
              <Link href="/contact" className="inline-flex min-h-11 items-center hover:text-accent">
                Contact
              </Link>
            </li>
          </ul>
          <p className="mt-auto font-display text-sm uppercase tracking-[0.16em] text-muted">{SITE_NAME}</p>
        </div>
      </dialog>
    </>
  );
}
