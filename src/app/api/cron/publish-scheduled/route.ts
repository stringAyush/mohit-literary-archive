import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getEnv } from "@/lib/env";
import { publishDueWorks } from "@/lib/works/service";

export const dynamic = "force-dynamic";

/**
 * Publishes scheduled works whose time has come. Call it every few minutes from a
 * scheduler (Vercel Cron, GitHub Actions, or crontab) with:
 *
 *   Authorization: Bearer <CRON_SECRET>
 *
 * It is safe to call more often than needed — nothing happens if nothing is due.
 */
function authorised(request: NextRequest, secret: string): boolean {
  const header = request.headers.get("authorization") ?? "";
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(header);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

async function handle(request: NextRequest) {
  const secret = getEnv().CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Scheduling is not configured: set CRON_SECRET." }, { status: 503 });
  }
  if (!authorised(request, secret)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  const result = await publishDueWorks();
  return NextResponse.json({ ok: true, ...result, ranAt: new Date().toISOString() });
}

export const GET = handle; // Vercel Cron sends GET requests
export const POST = handle;
