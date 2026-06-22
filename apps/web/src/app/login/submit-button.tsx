"use client";

import type { ComponentProps, ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export type LoginSubmitButtonProps = {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  pendingLabel?: string;
  variant?: ComponentProps<typeof Button>["variant"];
};

// Keep auth submissions single-flight to avoid repeated email sends.
export function LoginSubmitButton({
  children,
  className,
  disabled = false,
  pendingLabel = "Processing...",
  variant,
}: LoginSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      aria-busy={pending}
      className={className}
      disabled={disabled || pending}
      type="submit"
      variant={variant}
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
