"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { label: string; href: string; count?: number };

export function AdminNav({ items }: { items: Item[] }) {
  const pathname = usePathname();
  return (
    <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {items.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <li key={item.href} className="shrink-0">
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-10 items-center justify-between gap-3 whitespace-nowrap rounded-xs px-3 font-sans text-sm no-underline transition-colors ${
                active ? "bg-ink text-paper" : "text-ink hover:bg-surface-2"
              }`}
            >
              {item.label}
              {item.count ? (
                <span
                  className={`min-w-6 rounded-xs px-1.5 text-center text-xs tabular-nums ${
                    active ? "bg-paper/20" : "bg-accent text-surface"
                  }`}
                >
                  {item.count}
                </span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
