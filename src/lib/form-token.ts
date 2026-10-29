import { createHmac, timingSafeEqual } from "node:crypto";

// A signed timestamp placed in the contact form when the page is rendered.
// Bots that post instantly, replay old forms or forge the field are rejected.

const MIN_FILL_MS = 3_000; // humans take longer than 3 seconds to write a message
const MAX_AGE_MS = 1000 * 60 * 60 * 24; // forms older than a day must be reloaded

function sign(timestamp: string, secret: string): string {
  return createHmac("sha256", secret).update(`contact:${timestamp}`).digest("base64url");
}

export function createFormToken(secret: string, now = Date.now()): string {
  const timestamp = String(now);
  return `${timestamp}.${sign(timestamp, secret)}`;
}

export type FormTokenCheck = "ok" | "invalid" | "too-fast" | "expired";

export function checkFormToken(token: string | null | undefined, secret: string, now = Date.now()): FormTokenCheck {
  if (!token) return "invalid";
  const [timestamp, signature] = token.split(".");
  if (!timestamp || !signature || !/^\d+$/.test(timestamp)) return "invalid";
  const expected = Buffer.from(sign(timestamp, secret));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return "invalid";
  const age = now - Number(timestamp);
  if (age < MIN_FILL_MS) return "too-fast";
  if (age > MAX_AGE_MS) return "expired";
  return "ok";
}
