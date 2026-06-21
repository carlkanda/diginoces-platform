"use client";

import { InfoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type InfoHintProps = {
  className?: string;
  // Pass a localized label when the page already has language-specific copy.
  label: string;
  side?: "bottom" | "left" | "right" | "top";
  text: string;
};

export function InfoHint({
  className,
  label,
  side = "top",
  text,
}: InfoHintProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            aria-label={label}
            className={cn("text-muted-foreground", className)}
            size="icon-xs"
            type="button"
            variant="ghost"
          >
            <InfoIcon aria-hidden="true" data-no-translate />
          </Button>
        }
      />
      <TooltipContent
        className="max-w-72 text-left leading-5"
        data-no-translate
        side={side}
      >
        {text}
      </TooltipContent>
    </Tooltip>
  );
}
