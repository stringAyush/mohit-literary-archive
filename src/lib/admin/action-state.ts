import { Prisma } from "@prisma/client";
import { WorkflowError } from "@/lib/works/service";

/** What every admin form action returns, so forms can show messages next to fields. */
export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
  /** Unmet publishing requirements, listed for the editor. */
  reasons?: string[];
};

export const idleState: ActionState = { status: "idle" };

export function success(message: string): ActionState {
  return { status: "success", message };
}

export function failure(message: string, fieldErrors?: Record<string, string>): ActionState {
  return { status: "error", message, fieldErrors };
}

/** Turns known errors into friendly messages; unexpected ones are logged without details. */
export function errorToState(error: unknown): ActionState {
  if (error instanceof WorkflowError) {
    return { status: "error", message: error.message, fieldErrors: error.fieldErrors, reasons: error.reasons };
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    const target = String((error.meta?.target as string[] | string | undefined) ?? "");
    if (target.includes("slug")) {
      return failure("That web address is already used.", { slug: "Another item already uses this web address" });
    }
    if (target.includes("email")) return failure("That email address is already used.");
    return failure("That value is already used.");
  }
  console.error("Admin action failed:", error instanceof Error ? error.message : "unknown error");
  return failure("Something went wrong while saving. Nothing was changed. Please try again.");
}
