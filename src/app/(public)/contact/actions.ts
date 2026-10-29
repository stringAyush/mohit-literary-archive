"use server";

import { db } from "@/lib/db";
import { sendContactEmail } from "@/lib/email";
import { getEnv } from "@/lib/env";
import { checkFormToken } from "@/lib/form-token";
import { hashIdentifier, rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { contactFormToObject, contactInputSchema } from "@/lib/validation/contact";
import { toFieldErrors, type FieldErrors } from "@/lib/validation/helpers";

export type ContactState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: FieldErrors;
  values?: { name: string; email: string; subject: string; message: string };
};

const CONTACT_LIMIT = 5; // messages
const CONTACT_WINDOW_MS = 1000 * 60 * 60; // per hour, per sender

export async function sendContactMessage(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const values = contactFormToObject(formData);
  const env = getEnv();

  // A field humans never see. Bots fill it in; we quietly accept and discard their message.
  if (String(formData.get("website") ?? "").trim() !== "") {
    return { status: "success", message: "Thank you — your message has been received." };
  }

  const token = checkFormToken(String(formData.get("formToken") ?? ""), env.SESSION_SECRET);
  if (token === "too-fast") {
    return { status: "error", message: "That was quicker than expected. Please wait a moment and send again.", values };
  }
  if (token !== "ok") {
    return { status: "error", message: "This form has expired. Please reload the page and try again.", values };
  }

  const parsed = contactInputSchema.safeParse(values);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error),
      values,
    };
  }

  try {
    const ipHash = hashIdentifier(await clientIp(), env.SESSION_SECRET);
    const limit = await rateLimit(`contact:${ipHash}`, CONTACT_LIMIT, CONTACT_WINDOW_MS);
    if (!limit.allowed) {
      return {
        status: "error",
        message: "You have sent several messages recently. Please try again in an hour.",
        values,
      };
    }

    const inquiry = await db.contactInquiry.create({
      data: { ...parsed.data, ipHash },
    });

    const email = await sendContactEmail({
      name: parsed.data.name,
      email: parsed.data.email,
      subject: parsed.data.subject,
      body: parsed.data.message,
    });
    await db.contactInquiry.update({
      where: { id: inquiry.id },
      data: { emailDelivered: email.delivered, deliveryError: email.delivered ? null : (email.error ?? null) },
    });

    return { status: "success", message: "Thank you — your message has been received." };
  } catch (error) {
    console.error("Contact form failed", error instanceof Error ? error.message : "unknown error");
    return {
      status: "error",
      message: "Your message could not be sent just now. Please try again in a few minutes.",
      values,
    };
  }
}
