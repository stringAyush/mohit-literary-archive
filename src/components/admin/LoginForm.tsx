"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/admin/actions/auth";
import type { ActionState } from "@/lib/admin/action-state";
import { FormMessage } from "./FormMessage";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(loginAction, { status: "idle" });
  return (
    <form action={formAction} className="space-y-5">
      <FormMessage state={state} />
      <div>
        <label htmlFor="login-email" className="field-label">
          Email address
        </label>
        <input id="login-email" name="email" type="email" autoComplete="username" required className="input" />
      </div>
      <div>
        <label htmlFor="login-password" className="field-label">
          Password
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="input"
        />
      </div>
      <button type="submit" disabled={isPending} className="btn btn-primary w-full">
        {isPending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
