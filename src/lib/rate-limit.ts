import { createHmac } from "node:crypto";
import { db } from "@/lib/db";

// Fixed-window rate limiting stored in PostgreSQL, so it works even when the site
// runs on several servers at once (as serverless hosting does).

export type RateLimitResult = { allowed: boolean; remaining: number; resetAt: Date };

export async function rateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const resetAtIfNew = new Date(Date.now() + windowMs);
  const rows = await db.$queryRaw<{ count: number; resetAt: Date }[]>`
    INSERT INTO "RateLimitBucket" ("key", "count", "resetAt")
    VALUES (${key}, 1, ${resetAtIfNew})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimitBucket"."resetAt" <= now() THEN 1 ELSE "RateLimitBucket"."count" + 1 END,
      "resetAt" = CASE WHEN "RateLimitBucket"."resetAt" <= now() THEN ${resetAtIfNew} ELSE "RateLimitBucket"."resetAt" END
    RETURNING "count", "resetAt"`;
  const { count, resetAt } = rows[0];
  return { allowed: count <= limit, remaining: Math.max(0, limit - count), resetAt };
}

export async function clearRateLimit(key: string) {
  await db.rateLimitBucket.deleteMany({ where: { key } });
}

/** A keyed hash of an IP address: good for counting attempts, useless for identifying anyone. */
export function hashIdentifier(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("hex").slice(0, 32);
}
