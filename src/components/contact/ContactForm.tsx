"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { sendContactMessage, type ContactState } from "@/app/(public)/contact/actions";
import { contactInputSchema } from "@/lib/validation/contact";

type Errors = Record<string, string>;

export function ContactForm({ formToken, initialSubject }: { formToken: string; initialSubject: string }) {
  const [state, formAction, isPending] = useActionState<ContactState, FormData>(sendContactMessage, { status: "idle" });
  const [clientErrors, setClientErrors] = useState<Errors>({});

  const errors: Errors = { ...(state.fieldErrors ?? {}), ...clientErrors };
  const values = state.values;

  // Check in the browser first for instant feedback; the server checks again regardless.
  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget);
    const result = contactInputSchema.safeParse({
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      subject: String(data.get("subject") ?? ""),
      message: String(data.get("message") ?? ""),
    });
    if (!result.success) {
      event.preventDefault();
      const next: Errors = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0]);
        next[key] ??= issue.message;
      }
      setClientErrors(next);
      const firstField = event.currentTarget.elements.namedItem(Object.keys(next)[0]) as HTMLElement | null;
      firstField?.focus();
    } else {
      setClientErrors({});
    }
  }

  if (state.status === "success") {
    return (
      <div role="status" className="border-y hairline py-14">
        <p className="font-editorial text-[2rem] italic leading-snug">{state.message}</p>
        <p className="mt-4 font-sans text-sm text-muted">If a reply is needed, it will come to the email address you gave.</p>
        <Link href="/works" className="btn btn-secondary mt-8">
          Return to the archive
        </Link>
      </div>
    );
  }

  const field = (name: "name" | "email" | "subject", label: string, type: string, autoComplete: string, maxLength: number) => (
    <div>
      <label htmlFor={`contact-${name}`} className="field-label">
        {label}
      </label>
      <input
        id={`contact-${name}`}
        name={name}
        type={type}
        autoComplete={autoComplete}
        maxLength={maxLength}
        required
        defaultValue={values?.[name] ?? (name === "subject" ? initialSubject : "")}
        aria-invalid={errors[name] ? true : undefined}
        aria-describedby={errors[name] ? `contact-${name}-error` : undefined}
        className="input"
      />
      {errors[name] && (
        <p id={`contact-${name}-error`} className="field-error">
          {errors[name]}
        </p>
      )}
    </div>
  );

  return (
    <form action={formAction} onSubmit={onSubmit} noValidate className="space-y-6">
      {state.status === "error" && state.message && (
        <p role="alert" className="border-l-2 border-[#8f2f22] bg-surface px-4 py-3 font-sans text-sm text-[#8f2f22]">
          {state.message}
        </p>
      )}

      <input type="hidden" name="formToken" value={formToken} />
      {/* Spam trap: hidden from people and screen readers, tempting to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="contact-website">Leave this field empty</label>
        <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {field("name", "Your name", "text", "name", 100)}
        {field("email", "Email address", "email", "email", 200)}
      </div>
      {field("subject", "Subject", "text", "off", 150)}

      <div>
        <label htmlFor="contact-message" className="field-label">
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={8}
          maxLength={5000}
          required
          defaultValue={values?.message ?? ""}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? "contact-message-error" : "contact-message-hint"}
          className="input font-sans"
        />
        {errors.message ? (
          <p id="contact-message-error" className="field-error">
            {errors.message}
          </p>
        ) : (
          <p id="contact-message-hint" className="field-hint">
            For permission requests, please name the piece and describe how you would like to use it.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="btn btn-primary" disabled={isPending}>
          {isPending ? "Sending…" : "Send message"}
        </button>
        <p className="font-sans text-xs text-muted">Your details are used only to reply to you.</p>
      </div>
    </form>
  );
}
