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
        className="inline-flex h-11 w-11 items-center justify-center text-ink transition-colors hover:text-accent lg:hidden"
        aria-label="Open menu"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <MenuIcon className="h-6 w-6" />
      </button>

      <dialog
        ref={ref}
        aria-label="Site menu"
        className="m-0 ml-auto h-dvh max-h-none w-[min(22rem,88vw)] max-w-none bg-paper p-0 text-ink shadow-[-1px_0_0_var(--color-line)]"
      >
        <div className="flex h-full flex-col px-6 pb-8">
          <div className="flex h-[68px] items-center justify-between border-b hairline">
            <span className="eyebrow">Menu</span>
            <button
              type="button"
              onClick={close}
              className="-mr-2 inline-flex h-11 w-11 items-center justify-center hover:text-accent"
              aria-label="Close menu"
            >
              <CloseIcon className="h-6 w-6" />
            </button>
          </div>
          <nav aria-label="Main" className="mt-6">
            <ul>
              {NAV_LINKS.map((link) => {
                const active = isActivePath(pathname, link.href);
                return (
                  <li key={link.href} className="border-b hairline">
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-14 items-center font-display text-2xl no-underline transition-colors hover:text-accent ${
                        active ? "text-accent" : "text-ink"
                      }`}
                    >
                      {link.label}
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
