import Link from "next/link";

export function SectionHeading({
  id,
  title,
  eyebrow,
  link,
}: {
  id?: string;
  title: string;
  eyebrow?: string;
  link?: { label: string; href: string };
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 lg:mb-10">
      <div>
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h2 id={id} className="font-display text-[2rem] leading-[1.1] tracking-[-0.01em] sm:text-[2.5rem]">
          {title}
        </h2>
      </div>
      {link && (
        <Link href={link.href} className="text-link font-sans text-sm">
          {link.label}
        </Link>
      )}
    </div>
  );
}
