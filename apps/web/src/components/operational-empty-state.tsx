import type { ComponentType, ReactNode, SVGProps } from "react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { DEFAULT_LANGUAGE, type SupportedLanguage } from "@/lib/i18n/config";
import { translateStaticCopy } from "@/lib/i18n/static-translations";
import { cn } from "@/lib/utils";

export function OperationalEmptyState({
  action,
  className,
  description,
  icon: Icon,
  language = DEFAULT_LANGUAGE,
  nextStep,
  title,
}: {
  action?: ReactNode;
  className?: string;
  description: ReactNode;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  language?: SupportedLanguage;
  nextStep?: ReactNode;
  title: ReactNode;
}) {
  const suggestedNextStepLabel = translateStaticCopy(
    "Suggested next step",
    language,
  );

  return (
    <Empty className={cn("border bg-card", className)}>
      <EmptyHeader>
        {Icon ? (
          <EmptyMedia variant="icon">
            <Icon aria-hidden="true" />
          </EmptyMedia>
        ) : null}
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {nextStep || action ? (
        <EmptyContent className="max-w-md">
          {nextStep ? (
            <div className="w-full rounded-lg border bg-muted/35 px-3 py-2 text-left">
              <p className="text-xs font-medium text-muted-foreground">
                {suggestedNextStepLabel}
              </p>
              <div className="mt-1 text-sm leading-5 text-foreground">
                {nextStep}
              </div>
            </div>
          ) : null}
          {action}
        </EmptyContent>
      ) : null}
    </Empty>
  );
}
