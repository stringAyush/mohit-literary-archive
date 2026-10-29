import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const hasDb = Boolean(process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL);
  const hasSecret = Boolean(process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32);
  const hasSiteUrl = Boolean(process.env.SITE_URL || process.env.VERCEL_URL);

  return NextResponse.json({
    status: hasDb && hasSecret ? "ok" : "config_missing",
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
    checks: {
      databaseConfigured: hasDb,
      sessionSecretConfigured: hasSecret,
      siteUrlConfigured: hasSiteUrl,
    },
    timestamp: new Date().toISOString(),
  });
}
