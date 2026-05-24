"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

type SubmitButtonProps = {
  children: ReactNode;
  className?: string;
  pendingLabel?: string;
};

export function SubmitButton({
  children,
  className = "button secondary",
  pendingLabel = "Processing...",
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      aria-busy={pending}
      className={className}
      disabled={pending}
      type="submit"
    >
      <span aria-live="polite">
        {pending ? (
          <>
            <span aria-hidden="true">...</span> {pendingLabel}
          </>
        ) : (
          children
        )}
      </span>
    </button>
  );
}
