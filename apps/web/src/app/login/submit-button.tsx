"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export type LoginSubmitButtonProps = {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  pendingLabel?: string;
};

// Keep auth submissions single-flight to avoid repeated email sends.
export function LoginSubmitButton({
  children,
  className = "button",
  disabled = false,
  pendingLabel = "Processing...",
}: LoginSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
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
    </Button>
  );
}
