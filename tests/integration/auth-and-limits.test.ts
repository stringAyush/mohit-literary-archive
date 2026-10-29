import { beforeEach, describe, expect, it } from "vitest";
import { createSession, hashToken, invalidateSessionToken, validateSessionToken } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { createAdmin, hasDatabase, resetDatabase } from "../support/db";

describe.skipIf(!hasDatabase)("sessions and rate limits", () => {
  beforeEach(resetDatabase);

  it("stores only a hash of the session token", async () => {
    const admin = await createAdmin();
    const { token } = await createSession(admin.id);
    const stored = await db.adminSession.findFirstOrThrow();
    expect(stored.tokenHash).toBe(hashToken(token));
    expect(stored.tokenHash).not.toContain(token);
  });

  it("validates live sessions and rejects unknown, expired, revoked and disabled ones", async () => {
    const admin = await createAdmin();
    const { token } = await createSession(admin.id);
    expect((await validateSessionToken(token))?.user.id).toBe(admin.id);
    expect(await validateSessionToken("made-up-token")).toBeNull();

    await db.adminSession.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
    expect(await validateSessionToken(token)).toBeNull();
    expect(await db.adminSession.count()).toBe(0); // expired sessions are cleaned up

    const second = await createSession(admin.id);
    await invalidateSessionToken(second.token);
    expect(await validateSessionToken(second.token)).toBeNull();

    const third = await createSession(admin.id);
    await db.adminUser.update({ where: { id: admin.id }, data: { disabledAt: new Date() } });
    expect(await validateSessionToken(third.token)).toBeNull();
  });

  it("limits attempts within a window and resets afterwards", async () => {
    const results = [];
    for (let i = 0; i < 4; i++) results.push((await rateLimit("login:test", 3, 60_000)).allowed);
    expect(results).toEqual([true, true, true, false]);

    await db.rateLimitBucket.update({ where: { key: "login:test" }, data: { resetAt: new Date(Date.now() - 1) } });
    expect((await rateLimit("login:test", 3, 60_000)).allowed).toBe(true);
  });
});
