"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type ConfirmSubmitButtonProps = {
  children: ReactNode;
  message: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function ConfirmSubmitButton({
  children,
  message,
  onClick,
  ...props
}: ConfirmSubmitButtonProps) {
  return (
    <button
      {...props}
      onClick={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
          return;
        }

        onClick?.(event);
      }}
    >
      {children}
    </button>
  );
}
