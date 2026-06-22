"use client";

import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";

import { cn } from "@/lib/utils";

type InputPrimitiveProps = React.ComponentProps<typeof InputPrimitive>;

function Input({
  className,
  maxLength,
  onCompositionEnd,
  onCompositionStart,
  onInput,
  type,
  ...props
}: InputPrimitiveProps) {
  const isComposing = React.useRef(false);

  const handleCompositionStart = React.useCallback<
    NonNullable<InputPrimitiveProps["onCompositionStart"]>
  >(
    (event) => {
      isComposing.current = true;
      onCompositionStart?.(event);
    },
    [onCompositionStart],
  );

  const handleCompositionEnd = React.useCallback<
    NonNullable<InputPrimitiveProps["onCompositionEnd"]>
  >(
    (event) => {
      isComposing.current = false;
      clampInputElementValue(event.currentTarget, maxLength);
      onCompositionEnd?.(event);
    },
    [maxLength, onCompositionEnd],
  );

  const handleInput = React.useCallback<
    NonNullable<InputPrimitiveProps["onInput"]>
  >(
    (event) => {
      if (!isComposing.current) {
        clampInputElementValue(event.currentTarget, maxLength);
      }

      onInput?.(event);
    },
    [maxLength, onInput],
  );

  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      maxLength={maxLength}
      onCompositionEnd={handleCompositionEnd}
      onCompositionStart={handleCompositionStart}
      onInput={handleInput}
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    />
  );
}

function clampInputElementValue(
  input: HTMLInputElement,
  maxLength: InputPrimitiveProps["maxLength"],
) {
  if (
    typeof maxLength === "number" &&
    maxLength >= 0 &&
    input.value.length > maxLength
  ) {
    input.value = input.value.slice(0, maxLength);
  }
}

export { Input };
