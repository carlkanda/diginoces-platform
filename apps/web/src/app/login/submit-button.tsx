"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

export type LoginSubmitButtonProps = {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  pendingLabel?: string;
};

// MVP launch gate #58: keep auth submissions single-flight to avoid repeated Supabase email sends.
export function LoginSubmitButton({
  children,
  className = "button",
  disabled = false,
  pendingLabel = "Processing...",
}: LoginSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      aria-busy={pending}
      className={className}
      disabled={disabled || pending}
      type="submit"
    >
      {pending ? (
        <span role="status">
          <span aria-hidden={true}>...</span> {pendingLabel}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
