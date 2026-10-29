import type { ActionState } from "@/lib/admin/action-state";

export function FormMessage({ state }: { state: ActionState }) {
  if (state.status === "idle" || !state.message) return null;
  const isError = state.status === "error";
  return (
    <div
      role={isError ? "alert" : "status"}
      className={`border-l-2 px-4 py-3 font-sans text-sm ${
        isError ? "border-[#8f2f22] bg-[#8f2f22]/5 text-[#7a281d]" : "border-[#3d6b4a] bg-[#3d6b4a]/5 text-[#2f5539]"
      }`}
    >
      <p>{state.message}</p>
      {state.reasons && state.reasons.length > 0 && (
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {state.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="field-error">
      {message}
    </p>
  );
}
