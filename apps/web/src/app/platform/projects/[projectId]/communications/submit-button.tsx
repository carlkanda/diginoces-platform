"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

type SubmitButtonProps = {
  ariaLabel?: string;
  children: ReactNode;
  className?: string;
  pendingLabel?: string;
};

export function SubmitButton({
  ariaLabel,
  children,
  className = "button secondary",
  pendingLabel = "Processing...",
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      aria-label={ariaLabel}
      aria-busy={pending}
      className={className}
      disabled={pending}
      type="submit"
    >
      {pending ? (
        <span role="status">
          <span aria-hidden="true">...</span> {pendingLabel}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
