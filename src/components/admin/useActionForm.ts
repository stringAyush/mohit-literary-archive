"use client";

import { useActionState, useTransition } from "react";
import type { ActionState } from "@/lib/admin/action-state";

type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

/**
 * Runs a server action from a form without React's automatic form reset,
 * so an editor never loses what was typed when the server reports a problem.
 */
export function useActionForm(action: Action) {
  const [state, dispatch, isPending] = useActionState<ActionState, FormData>(action, { status: "idle" });
  const [, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget, (event.nativeEvent as SubmitEvent).submitter);
    startTransition(() => dispatch(formData));
  }

  return { state, isPending, onSubmit };
}
