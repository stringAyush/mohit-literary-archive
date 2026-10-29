import "server-only";
import { getEnv, isEmailConfigured } from "@/lib/env";

// Sends contact messages by email through Resend's HTTP API, but only when it is
// configured. Messages are always saved to the database first, so nothing is lost
// if email is not set up or delivery fails.

export type EmailResult = { delivered: boolean; error?: string };

export async function sendContactEmail(message: {
  name: string;
  email: string;
  subject: string;
  body: string;
}): Promise<EmailResult> {
  if (!isEmailConfigured()) return { delivered: false, error: "Email delivery is not configured" };
  const env = getEnv();

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.CONTACT_FROM_EMAIL,
        to: [env.CONTACT_TO_EMAIL],
        reply_to: message.email,
        subject: `[Archive] ${message.subject}`,
        text: `From: ${message.name} <${message.email}>\n\n${message.body}`,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return { delivered: false, error: `Email provider responded ${response.status}` };
    return { delivered: true };
  } catch {
    return { delivered: false, error: "Email provider could not be reached" };
  }
}
