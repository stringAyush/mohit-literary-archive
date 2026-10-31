"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { CloseIcon, MenuIcon } from "@/components/ui/icons";
import { SITE_NAME } from "@/lib/constants";
import { NAV_LINKS, isActivePath } from "./nav";

export function MobileMenu() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close the drawer after navigating.
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Lock scroll when open
  useEffect(() => {
    if (isOpen) {
      document.documentElement.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink transition-all hover:bg-ink/5 lg:hidden"
        aria-label="Open menu"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <MenuIcon className="h-5 w-5" />
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <>
                {/* Backdrop */}
                <motion.div
                  key="mobile-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs lg:hidden"
                  onClick={() => setIsOpen(false)}
                  aria-hidden="true"
                />

                {/* Sliding Drawer */}
                <motion.aside
                  key="mobile-drawer"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  aria-label="Site menu"
                  role="dialog"
                  aria-modal="true"
                  className="fixed top-0 right-0 bottom-0 z-50 flex h-dvh w-[min(22rem,88vw)] flex-col bg-paper/95 backdrop-blur-xl px-6 pb-8 text-ink shadow-[-1px_0_0_var(--color-line)] shadow-2xl lg:hidden"
                >
                  <div className="flex h-[68px] items-center justify-between border-b hairline">
                    <span className="eyebrow flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-dot" />
                      Navigation
                    </span>
                    <div className="flex items-center gap-2">
                      <ThemeToggle />
                      <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="-mr-2 inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-ink/5 transition-transform duration-200 hover:rotate-90"
                        aria-label="Close menu"
                      >
                        <CloseIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <nav aria-label="Main" className="mt-6">
                    <ul className="space-y-1">
                      {NAV_LINKS.map((link, index) => {
                        const active = isActivePath(pathname, link.href);
                        return (
                          <motion.li
                            key={link.href}
                            initial={{ opacity: 0, x: 12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                              delay: 0.05 + index * 0.04,
                              duration: 0.25,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                            className="border-b hairline"
                          >
                            <Link
                              href={link.href}
                              onClick={() => setIsOpen(false)}
                              aria-current={active ? "page" : undefined}
                              className={`flex min-h-14 items-center justify-between font-display text-2xl no-underline transition-all duration-200 hover:translate-x-1 ${
                                active ? "text-ink font-semibold" : "text-ink/80 hover:text-ink"
                              }`}
                            >
                              <span>{link.label}</span>
                              {active && <span className="h-2 w-2 rounded-full bg-accent animate-pulse-dot" />}
                            </Link>
                          </motion.li>
                        );
                      })}
                    </ul>
                  </nav>

                  <ul className="mt-8 space-y-1 font-sans text-sm text-muted">
                    <li>
                      <Link
                        href="/copyright"
                        onClick={() => setIsOpen(false)}
                        className="inline-flex min-h-11 items-center hover:text-accent"
                      >
                        Copyright &amp; Permissions
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/contact"
                        onClick={() => setIsOpen(false)}
                        className="inline-flex min-h-11 items-center hover:text-accent"
                      >
                        Contact
                      </Link>
                    </li>
                  </ul>

                  <p className="mt-auto font-display text-sm uppercase tracking-[0.16em] text-muted">{SITE_NAME}</p>
                </motion.aside>
              </>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
