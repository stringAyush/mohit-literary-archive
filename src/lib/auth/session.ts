import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";

// Database-backed sessions. The browser keeps a random token in an HttpOnly cookie;
// the database only stores its SHA-256 hash, so a database leak does not reveal live sessions.

export const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
const TOUCH_INTERVAL_MS = 1000 * 60 * 60; // update lastUsedAt at most hourly

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string, userAgent?: string | null) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await db.adminSession.create({
    data: { tokenHash: hashToken(token), userId, expiresAt, userAgent: userAgent?.slice(0, 300) ?? null },
  });
  return { token, expiresAt };
}

export async function validateSessionToken(token: string) {
  if (!token || token.length > 200) return null;
  const session = await db.adminSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session) return null;

  const now = Date.now();
  if (session.expiresAt.getTime() <= now || session.user.disabledAt) {
    await db.adminSession.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  if (now - session.lastUsedAt.getTime() > TOUCH_INTERVAL_MS) {
    await db.adminSession.update({ where: { id: session.id }, data: { lastUsedAt: new Date() } });
  }
  return { session, user: session.user };
}

export async function invalidateSessionToken(token: string) {
  await db.adminSession.deleteMany({ where: { tokenHash: hashToken(token) } });
}

export async function deleteExpiredSessions() {
  await db.adminSession.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}
