import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/ContactForm";
import { SITE_NAME } from "@/lib/constants";
import { getEnv } from "@/lib/env";
import { createFormToken } from "@/lib/form-token";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact",
  description: `Write to ${SITE_NAME} about permissions, invitations, or misattributed quotes.`,
  alternates: { canonical: "/contact" },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ContactPage({ searchParams }: Props) {
  const raw = (await searchParams).subject;
  const subject = (Array.isArray(raw) ? raw[0] : raw)?.slice(0, 150) ?? "";
  const token = createFormToken(getEnv().SESSION_SECRET);

  return (
    <div className="page-container pb-16 pt-12 lg:pb-24 lg:pt-20">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
        <header>
          <p className="eyebrow">Contact</p>
          <h1 className="mt-4 font-display text-[clamp(2.5rem,5vw,4rem)] leading-[1.05] tracking-[-0.015em]">
            Write a letter
          </h1>
          <p className="mt-6 max-w-md font-editorial text-[1.5rem] leading-snug text-ink/80">
            For permission to quote or publish, invitations, or to report writing that has been credited to the wrong
            person.
          </p>
        </header>
        <ContactForm formToken={token} initialSubject={subject} />
      </div>
    </div>
  );
}
