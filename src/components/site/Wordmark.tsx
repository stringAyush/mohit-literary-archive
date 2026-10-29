import Link from "next/link";
import { SITE_NAME, SITE_SUBTITLE } from "@/lib/constants";

export function Wordmark({ tone = "ink" }: { tone?: "ink" | "night" }) {
  const subtitleColor = tone === "night" ? "text-night-muted" : "text-muted";
  return (
    <Link
      href="/"
      className="group inline-flex flex-col justify-center no-underline"
      aria-label={`${SITE_NAME}, ${SITE_SUBTITLE} — home`}
    >
      <span className="whitespace-nowrap font-display text-[0.8125rem] font-semibold uppercase leading-none tracking-[0.11em] min-[400px]:text-[0.875rem] sm:text-[1.05rem] sm:tracking-[0.16em]">
        {SITE_NAME}
      </span>
      <span className={`mt-1.5 font-sans text-[0.625rem] font-medium uppercase tracking-[0.28em] sm:tracking-[0.32em] ${subtitleColor}`}>
        {SITE_SUBTITLE}
      </span>
    </Link>
  );
}
