"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { NAV_LINKS, isActivePath } from "./nav";

export function NavLinks() {
  const pathname = usePathname();
  const listRef = useRef<HTMLUListElement>(null);
  const itemsRef = useRef<(HTMLLIElement | null)[]>([]);
  const [pillState, setPillState] = useState<{
    left: number;
    width: number;
    height: number;
    top: number;
    isAnimated: boolean;
  } | null>(null);

  const activeIndex = NAV_LINKS.findIndex((link) => isActivePath(pathname, link.href));

  useEffect(() => {
    if (activeIndex === -1) {
      setPillState(null);
      return;
    }

    const activeEl = itemsRef.current[activeIndex];
    const parentEl = listRef.current;
    if (!activeEl || !parentEl) return;

    const left = activeEl.offsetLeft;
    const width = activeEl.offsetWidth;
    const height = activeEl.offsetHeight;
    const top = activeEl.offsetTop;

    setPillState((prev) => ({
      left,
      width,
      height,
      top,
      isAnimated: prev !== null,
    }));
  }, [pathname, activeIndex]);

  return (
    <ul ref={listRef} className="relative hidden items-center gap-1 lg:flex h-8">
      {pillState && (
        <motion.div
          aria-hidden="true"
          initial={
            pillState.isAnimated
              ? false
              : {
                  x: pillState.left,
                  width: pillState.width,
                  opacity: 0,
                }
          }
          animate={{
            x: pillState.left,
            width: pillState.width,
            opacity: 1,
          }}
          transition={{
            type: "spring",
            stiffness: 450,
            damping: 34,
            mass: 0.7,
          }}
          style={{
            position: "absolute",
            left: 0,
            top: pillState.top,
            height: pillState.height,
            y: 0,
            zIndex: 0,
          }}
          className="rounded-full bg-accent shadow-xs pointer-events-none"
        />
      )}
      {NAV_LINKS.map((link, idx) => {
        const active = activeIndex === idx;
        return (
          <li
            key={link.href}
            ref={(el) => {
              itemsRef.current[idx] = el;
            }}
            className="relative flex items-center h-full"
          >
            <Link
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`relative z-10 inline-flex items-center justify-center px-3.5 py-1.5 rounded-full font-sans text-xs font-medium tracking-wide no-underline transition-colors duration-200 ${
                active
                  ? "text-white font-medium"
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

export default NavLinks;

