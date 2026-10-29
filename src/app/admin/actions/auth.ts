"use server";

import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/admin/action-state";
import { clearSessionCookie, getSessionToken, setSessionCookie } from "@/lib/auth/cookies";
import { getDummyHash, verifyPassword } from "@/lib/auth/password";
import { createSession, invalidateSessionToken } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { clearRateLimit, hashIdentifier, rateLimit } from "@/lib/rate-limit";
import { clientIp, userAgent } from "@/lib/request";
import { loginInputSchema } from "@/lib/validation/site";

const WINDOW_MS = 1000 * 60 * 15; // 15 minutes
const MAX_PER_IP = 20;
const MAX_PER_ACCOUNT = 5;

const GENERIC_FAILURE = "That email and password don't match an administrator account.";

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginInputSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { status: "error", message: "Enter your email address and password." };

  const { email, password } = parsed.data;
  const secret = getEnv().SESSION_SECRET;
  const ipKey = `login-ip:${hashIdentifier(await clientIp(), secret)}`;
  const accountKey = `login-account:${hashIdentifier(email, secret)}`;

  const [ipLimit, accountLimit] = await Promise.all([
    rateLimit(ipKey, MAX_PER_IP, WINDOW_MS),
    rateLimit(accountKey, MAX_PER_ACCOUNT, WINDOW_MS),
  ]);
  if (!ipLimit.allowed || !accountLimit.allowed) {
    return { status: "error", message: "Too many sign-in attempts. Please wait 15 minutes and try again." };
  }

  const user = await db.adminUser.findUnique({ where: { email } });
  // Check a password even when the account doesn't exist, so timing reveals nothing.
  const valid = await verifyPassword(password, user?.passwordHash ?? (await getDummyHash()));
  if (!user || !valid || user.disabledAt || user.role !== "ADMIN") {
    return { status: "error", message: GENERIC_FAILURE };
  }

  await clearRateLimit(accountKey);
  const session = await createSession(user.id, await userAgent());
  await db.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await setSessionCookie(session.token, session.expiresAt);
  redirect("/admin");
}

export async function logoutAction() {
  const token = await getSessionToken();
  if (token) await invalidateSessionToken(token);
  await clearSessionCookie();
  redirect("/admin/login");
}
