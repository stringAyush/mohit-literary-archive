import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";

export const hasDatabase = Boolean(process.env.TEST_DATABASE_URL);

/** Empties every table between tests. */
export async function resetDatabase() {
  await db.$executeRawUnsafe(`
    TRUNCATE TABLE "PublicationEvent", "WorkVersion", "SourceReference", "SlugRedirect", "WorkCollection",
      "WorkTag", "Work", "Collection", "Tag", "AuthorProfile", "ContactInquiry", "AdminSession", "AdminUser",
      "RateLimitBucket" RESTART IDENTITY CASCADE
  `);
}

export async function createAuthor(overrides: { isDemo?: boolean; slug?: string; isPrimary?: boolean } = {}) {
  return db.authorProfile.create({
    data: {
      slug: overrides.slug ?? "mohit-kaushik-yenugwar",
      displayName: overrides.isDemo ? "Sample Writer (demo)" : "Mohit Kaushik Yenugwar",
      isPrimary: overrides.isPrimary ?? !overrides.isDemo,
      isDemo: overrides.isDemo ?? false,
    },
  });
}

export async function createAdmin(email = "admin@example.test") {
  return db.adminUser.create({
    data: { email, name: "Test Admin", passwordHash: await hashPassword("correct horse battery staple") },
  });
}
