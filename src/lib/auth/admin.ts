import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getSessionToken } from "./cookies";
import { validateSessionToken } from "./session";

/** The signed-in administrator for this request, or null. Checked against the database. */
export const getCurrentAdmin = cache(async () => {
  const token = await getSessionToken();
  if (!token) return null;
  const result = await validateSessionToken(token);
  if (!result || result.user.role !== "ADMIN") return null;
  return { id: result.user.id, email: result.user.email, name: result.user.name };
});

export type CurrentAdmin = NonNullable<Awaited<ReturnType<typeof getCurrentAdmin>>>;

/**
 * Call at the top of every admin page and every admin server action.
 * Hiding buttons is not security — this check on the server is.
 */
export async function requireAdmin(): Promise<CurrentAdmin> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
