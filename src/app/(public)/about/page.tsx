import type { Metadata } from "next";
import Link from "next/link";
import { WorkPreview } from "@/components/works/WorkPreview";
import { SITE_NAME } from "@/lib/constants";
import { getPrimaryAuthor, getSelectedWorks, profileLinks } from "@/lib/works/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About the writer",
  description: `About ${SITE_NAME} and the writing in this archive.`,
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const [author, selected] = await Promise.all([getPrimaryAuthor(), getSelectedWorks(3)]);
  const name = author?.displayName ?? SITE_NAME;
  // Biographical text is shown only after the writer has approved it in the admin.
  const approved = Boolean(author?.profileApprovedAt);
  const biography = approved ? author?.biography : null;
  const philosophy = approved ? author?.writingPhilosophy : null;
  const links = profileLinks(author?.links);

  return (
    <div className="page-container pb-16 pt-12 lg:pb-24 lg:pt-20">
      <div className="reading-column">
        <p className="eyebrow">About the writer</p>
        <h1 className="mt-4 font-display text-[clamp(2.5rem,5vw,4rem)] leading-[1.05] tracking-[-0.015em]">{name}</h1>

        {biography ? (
          <div className="mt-10 whitespace-pre-line font-editorial text-[1.375rem] leading-[1.65] text-ink sm:text-[1.5rem]">
            {biography}
          </div>
        ) : (
          <p className="mt-10 font-editorial text-[1.375rem] leading-[1.65] text-ink sm:text-[1.5rem]">
            This archive gathers the quotes, poems, aphorisms and reflections of {name}.
          </p>
        )}

        {philosophy && (
          <section aria-labelledby="philosophy-heading" className="mt-14 border-t hairline pt-10">
            <h2 id="philosophy-heading" className="font-display text-[1.75rem] leading-tight">
              On writing
            </h2>
            <div className="mt-5 whitespace-pre-line font-editorial text-[1.375rem] leading-[1.65] text-ink/90 sm:text-[1.5rem]">
              {philosophy}
            </div>
          </section>
        )}

        {links.length > 0 && (
          <section aria-labelledby="elsewhere-heading" className="mt-14 border-t hairline pt-10">
            <h2 id="elsewhere-heading" className="eyebrow">
              Elsewhere
            </h2>
            <ul className="mt-4 space-y-1 font-sans text-sm">
              {links.map((link) => (
                <li key={link.url}>
                  <a href={link.url} className="text-link inline-flex min-h-11 items-center" rel="noopener noreferrer" target="_blank">
                    {link.label}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="contact-heading" className="mt-14 border-t hairline pt-10">
          <h2 id="contact-heading" className="font-display text-[1.75rem] leading-tight">
            Get in touch
          </h2>
          <p className="mt-4 font-sans text-[0.9375rem] text-ink/85">
            For permission to quote or publish, invitations, or to report a misattributed quote, please use the contact
            form.
          </p>
          <Link href="/contact" className="btn btn-secondary mt-6">
            Contact
          </Link>
        </section>
      </div>

      {selected.length > 0 && (
        <section aria-labelledby="selected-heading" className="mt-20 lg:mt-28">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <h2 id="selected-heading" className="font-display text-[1.875rem] leading-tight sm:text-[2.25rem]">
              Selected works
            </h2>
            <Link href="/works" className="text-link font-sans text-sm">
              The whole archive
            </Link>
          </div>
          <ul className="grid gap-x-10 md:grid-cols-3">
            {selected.map((work) => (
              <li key={work.id}>
                <WorkPreview work={work} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
