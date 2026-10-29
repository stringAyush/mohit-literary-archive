import "server-only";
import { headers } from "next/headers";

/** Best-effort client IP. Hosting platforms set x-forwarded-for; the first entry is the client. */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

export async function userAgent(): Promise<string | null> {
  const h = await headers();
  return h.get("user-agent");
}
