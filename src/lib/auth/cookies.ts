import "server-only";
import { cookies } from "next/headers";
import { siteUrl } from "@/lib/env";

// The session cookie is HttpOnly (JavaScript cannot read it), SameSite=Lax (not sent
// on cross-site form posts) and Secure whenever the site runs on https.
export const SESSION_COOKIE_NAMES = ["__Host-archive_session", "archive_session"] as const;

function isSecureSite(): boolean {
  return siteUrl().startsWith("https://");
}

function cookieName(): string {
  return isSecureSite() ? SESSION_COOKIE_NAMES[0] : SESSION_COOKIE_NAMES[1];
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const store = await cookies();
  store.set(cookieName(), token, {
    httpOnly: true,
    secure: isSecureSite(),
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function getSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(cookieName())?.value ?? null;
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(cookieName());
}
