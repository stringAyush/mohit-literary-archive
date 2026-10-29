import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Copyright & Permissions",
  description: `How to quote, share and request permission to use writing by ${SITE_NAME}.`,
  alternates: { canonical: "/copyright" },
};

const sections = [
  { id: "ownership", title: "Ownership" },
  { id: "attribution", title: "How to credit the writing" },
  { id: "sharing", title: "Sharing" },
  { id: "commercial", title: "Commercial use and licensing" },
  { id: "records", title: "Dates and text fingerprints" },
  { id: "permission", title: "Requesting permission" },
  { id: "misattribution", title: "Reporting misattribution" },
];

export default function CopyrightPage() {
  return (
    <div className="page-container pb-16 pt-12 lg:pb-24 lg:pt-20">
      <div className="grid gap-12 lg:grid-cols-[240px_1fr] lg:gap-20">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow">On this page</p>
          <ol className="mt-4 space-y-1 font-sans text-sm">
            {sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className="inline-flex min-h-9 items-center text-muted hover:text-accent">
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </aside>

        <div className="max-w-[760px]">
          <h1 className="font-display text-[clamp(2.5rem,5vw,4rem)] leading-[1.05] tracking-[-0.015em]">
            Copyright &amp; Permissions
          </h1>
          <p className="mt-6 font-editorial text-[1.5rem] leading-snug text-ink/85">
            Words travel easily. These notes explain how to share them without losing the person who wrote them.
          </p>

          <div className="mt-12 space-y-12 font-sans text-[0.9688rem] leading-[1.75] text-ink/90 [&_h2]:font-display [&_h2]:text-[1.625rem] [&_h2]:leading-tight [&_h2]:text-ink [&_li]:pl-1 [&_p+p]:mt-4 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
            <section id="ownership" aria-labelledby="ownership-h">
              <h2 id="ownership-h">Ownership</h2>
              <p className="mt-4">
                The writing in this archive is by {SITE_NAME}, who holds the copyright in it. In India, and in most
                countries, copyright in an original literary work exists from the moment it is written; registration is
                optional and is not what creates the right.
              </p>
              <p>
                Some pieces first appeared on other platforms, such as YourQuote. They are published here by, or with the
                permission of, the writer, and the original appearance is noted on each work&apos;s page.
              </p>
            </section>

            <section id="attribution" aria-labelledby="attribution-h">
              <h2 id="attribution-h">How to credit the writing</h2>
              <ul>
                <li>
                  Name the writer as <strong className="font-medium">{SITE_NAME}</strong>.
                </li>
                <li>Link to the work&apos;s own page in this archive wherever a link is possible.</li>
                <li>Quote the words exactly. Please do not shorten, edit or combine pieces without asking.</li>
                <li>Never present the writing as anonymous, as a proverb, or as someone else&apos;s.</li>
              </ul>
            </section>

            <section id="sharing" aria-labelledby="sharing-h">
              <h2 id="sharing-h">Sharing</h2>
              <p className="mt-4">You are welcome, without asking, to:</p>
              <ul>
                <li>share a link to any page of this archive;</li>
                <li>
                  quote a single short piece or a short excerpt for personal, non-commercial purposes, with the credit
                  described above;
                </li>
                <li>
                  share the quote artwork generated on this site, unaltered and with its attribution intact, for
                  personal, non-commercial purposes.
                </li>
              </ul>
              <p className="mt-4">Please ask first before reproducing complete poems or several pieces together elsewhere.</p>
            </section>

            <section id="commercial" aria-labelledby="commercial-h">
              <h2 id="commercial-h">Commercial use and licensing</h2>
              <p className="mt-4">
                Any commercial use needs written permission from the writer. This includes printed products and
                merchandise, books and anthologies, advertising, paid newsletters or courses, and content published to
                earn money.
              </p>
              <p>Licences are considered case by case. Please describe the intended use when you write.</p>
            </section>

            <section id="records" aria-labelledby="records-h">
              <h2 id="records-h">Dates and text fingerprints</h2>
              <p className="mt-4">
                Each work&apos;s page records when it first appeared on its original platform (where known) and when it
                was published in this archive. Each published text also has a SHA-256 fingerprint, which changes if even a
                single character changes, so copies can be compared with the original.
              </p>
              <p>
                These are records kept by this archive. They are not an official copyright registration, and a
                fingerprint on its own does not prove who wrote a text or when it was written.
              </p>
            </section>

            <section id="permission" aria-labelledby="permission-h">
              <h2 id="permission-h">Requesting permission</h2>
              <p className="mt-4">
                Tell us which piece you would like to use, where and how it will appear, and whether the use is
                commercial.
              </p>
              <Link href="/contact?subject=Permission%20request" className="btn btn-primary mt-6">
                Request permission
              </Link>
            </section>

            <section id="misattribution" aria-labelledby="misattribution-h">
              <h2 id="misattribution-h">Reporting misattribution</h2>
              <p className="mt-4">
                If you find this writing credited to someone else, or a quote credited to {SITE_NAME} that does not
                appear in this archive, please let us know and include a link to where you saw it.
              </p>
              <Link href="/contact?subject=Misattribution%20report" className="btn btn-secondary mt-6">
                Report misattribution
              </Link>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
