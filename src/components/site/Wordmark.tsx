import Link from "next/link";
import { SITE_NAME, SITE_SUBTITLE } from "@/lib/constants";

export function Wordmark({ tone = "ink" }: { tone?: "ink" | "night" }) {
  const subtitleColor = tone === "night" ? "text-night-muted" : "text-muted";
  return (
    <Link
      href="/"
      className="group inline-flex flex-col justify-center no-underline transition-opacity hover:opacity-85"
      aria-label={`${SITE_NAME}, ${SITE_SUBTITLE} — home`}
    >
      <span className="whitespace-nowrap font-display text-[1rem] sm:text-[1.1875rem] font-normal tracking-[0.04em] text-ink leading-tight flex items-center gap-1.5">
        <span>{SITE_NAME}</span>
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent animate-pulse-dot" aria-hidden="true" />
      </span>
      <span className={`mt-0.5 font-sans text-[0.5625rem] font-semibold uppercase tracking-[0.24em] sm:text-[0.625rem] ${subtitleColor}`}>
        {SITE_SUBTITLE}
      </span>
    </Link>
  );
}
