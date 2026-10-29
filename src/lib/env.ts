import "server-only";
import { z } from "zod";

// Server-side configuration, validated once. Nothing here is ever sent to the browser.
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required").refine(
    (value) => value.startsWith("postgresql://") || value.startsWith("postgres://"),
    "DATABASE_URL must use PostgreSQL",
  ),
  SITE_URL: z
    .string()
    .url()
    .default("http://localhost:3000")
    .transform((value) => value.replace(/\/+$/, "")),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters"),
  CRON_SECRET: z.string().optional().default("").refine(
    (value) => value.length === 0 || value.length >= 32,
    "CRON_SECRET must be empty or at least 32 characters",
  ),
  RESEND_API_KEY: z.string().optional().default(""),
  CONTACT_TO_EMAIL: z.string().optional().default(""),
  CONTACT_FROM_EMAIL: z.string().optional().default(""),
  SHOW_DEMO_CONTENT: z.enum(["true", "false"]).optional().default("false"),
}).superRefine((env, context) => {
  if (process.env.NODE_ENV === "production") {
    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(env.SITE_URL);
    if (!env.SITE_URL.startsWith("https://") && !isLocalhost) {
      context.addIssue({ code: "custom", path: ["SITE_URL"], message: "must use HTTPS in production" });
    }
    if (env.SHOW_DEMO_CONTENT === "true") {
      context.addIssue({ code: "custom", path: ["SHOW_DEMO_CONTENT"], message: "must be false in production" });
    }
  }

  const emailSettings = [env.RESEND_API_KEY, env.CONTACT_TO_EMAIL, env.CONTACT_FROM_EMAIL];
  if (emailSettings.some(Boolean) && !emailSettings.every(Boolean)) {
    context.addIssue({
      code: "custom",
      path: ["RESEND_API_KEY"],
      message: "RESEND_API_KEY, CONTACT_TO_EMAIL and CONTACT_FROM_EMAIL must be configured together",
    });
  }
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached && process.env.NODE_ENV !== "test") return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
    throw new Error(`Invalid environment configuration:\n${problems.join("\n")}`);
  }
  if (process.env.NODE_ENV !== "test") {
    cached = parsed.data;
  }
  return parsed.data;
}

export function siteUrl(): string {
  return getEnv().SITE_URL;
}

export function isEmailConfigured(): boolean {
  const env = getEnv();
  return Boolean(env.RESEND_API_KEY && env.CONTACT_TO_EMAIL && env.CONTACT_FROM_EMAIL);
}
