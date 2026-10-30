"use server";

import { revalidatePath } from "next/cache";
import { errorToState, failure, success, type ActionState } from "@/lib/admin/action-state";
import { requireAdmin } from "@/lib/auth/admin";
import { getSessionToken } from "@/lib/auth/cookies";
import { hashPassword, MIN_PASSWORD_LENGTH, verifyPassword } from "@/lib/auth/password";
import { hashToken } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { z } from "zod";

const emailUpdateSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newEmail: z.string().trim().toLowerCase().email("Enter a valid email address").max(200),
});

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(MIN_PASSWORD_LENGTH, `New password must be at least ${MIN_PASSWORD_LENGTH} characters`),
  confirmPassword: z.string().min(1, "Confirm your new password"),
});

export async function updateAdminEmailAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();

  const parsed = emailUpdateSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newEmail: formData.get("newEmail"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]?.toString() ?? "form";
      fieldErrors[field] = issue.message;
    }
    return failure("Please correct the errors below.", fieldErrors);
  }

  const { currentPassword, newEmail } = parsed.data;

  try {
    const user = await db.adminUser.findUnique({ where: { id: admin.id } });
    if (!user) return failure("Administrator account not found.");

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) {
      return failure("Incorrect current password.", { currentPassword: "Incorrect password" });
    }

    if (user.email === newEmail) {
      return failure("The new email is the same as your current email.", { newEmail: "Must be a different email" });
    }

    const existing = await db.adminUser.findUnique({ where: { email: newEmail } });
    if (existing) {
      return failure("That email address is already in use.", { newEmail: "Email already registered" });
    }

    await db.adminUser.update({
      where: { id: admin.id },
      data: { email: newEmail },
    });

    revalidatePath("/admin/security");
    revalidatePath("/admin", "layout");
    return success(`Email address updated to ${newEmail}.`);
  } catch (error) {
    return errorToState(error);
  }
}

export async function changeAdminPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();

  const parsed = passwordChangeSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]?.toString() ?? "form";
      fieldErrors[field] = issue.message;
    }
    return failure("Please check the password requirements.", fieldErrors);
  }

  const { currentPassword, newPassword, confirmPassword } = parsed.data;

  if (newPassword !== confirmPassword) {
    return failure("New password and confirmation do not match.", {
      confirmPassword: "Passwords do not match",
    });
  }

  try {
    const user = await db.adminUser.findUnique({ where: { id: admin.id } });
    if (!user) return failure("Administrator account not found.");

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) {
      return failure("Incorrect current password.", { currentPassword: "Incorrect password" });
    }

    const newHash = await hashPassword(newPassword);

    // Keep the current session alive while revoking any stale sessions
    const currentToken = await getSessionToken();
    const currentTokenHash = currentToken ? hashToken(currentToken) : null;

    await db.$transaction([
      db.adminUser.update({
        where: { id: admin.id },
        data: { passwordHash: newHash },
      }),
      db.adminSession.deleteMany({
        where: {
          userId: admin.id,
          ...(currentTokenHash ? { tokenHash: { not: currentTokenHash } } : {}),
        },
      }),
    ]);

    revalidatePath("/admin/security");
    return success("Password successfully changed. Other active sessions were signed out for security.");
  } catch (error) {
    return errorToState(error);
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function revokeOtherSessionsAction(_prev?: ActionState): Promise<ActionState> {
  const admin = await requireAdmin();
  try {
    const currentToken = await getSessionToken();
    if (!currentToken) return failure("Current session not found.");

    const currentTokenHash = hashToken(currentToken);
    const deleted = await db.adminSession.deleteMany({
      where: {
        userId: admin.id,
        tokenHash: { not: currentTokenHash },
      },
    });

    revalidatePath("/admin/security");
    return success(`Revoked ${deleted.count} other active session(s).`);
  } catch (error) {
    return errorToState(error);
  }
}
