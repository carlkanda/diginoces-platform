"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type KeyboardEvent } from "react";
import { LanguagesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LANGUAGE_COOKIE_NAME,
  LANGUAGE_LABELS,
  SUPPORTED_LANGUAGES,
  getLanguageHtmlLang,
  normalizeLanguage,
  type SupportedLanguage,
} from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

const oneYear = 60 * 60 * 24 * 365;

function writeLanguageCookie(language: SupportedLanguage) {
  const secureFlag = window.location.protocol === "https:" ? "; Secure" : "";

  document.cookie = `${LANGUAGE_COOKIE_NAME}=${language}; path=/; max-age=${oneYear}; SameSite=Lax${secureFlag}`;
  document.documentElement.lang = getLanguageHtmlLang(language);
  document.documentElement.dataset.language = language;

  try {
    window.localStorage.setItem(LANGUAGE_COOKIE_NAME, language);
  } catch {
    // Cookie persistence is enough for server-rendered language selection.
  }

  window.dispatchEvent(
    new CustomEvent("diginoces:language-change", {
      detail: { language },
    }),
  );
}

function getLanguageOptionLabel(
  option: SupportedLanguage,
  activeLanguage: SupportedLanguage,
) {
  if (activeLanguage === "fr") {
    return option === "fr" ? "Français" : "Anglais";
  }

  return LANGUAGE_LABELS[option].name;
}

export function LanguageSwitcher({
  className,
  label,
  language,
}: {
  className?: string;
  label: string;
  language: SupportedLanguage;
}) {
  const router = useRouter();
  const [optimisticLanguage, setOptimisticLanguage] =
    useState<SupportedLanguage | null>(null);
  const [isPending, startTransition] = useTransition();
  const radioRefs = useRef<Record<SupportedLanguage, HTMLButtonElement | null>>(
    Object.fromEntries(
      SUPPORTED_LANGUAGES.map((item) => [item, null]),
    ) as Record<SupportedLanguage, HTMLButtonElement | null>,
  );
  const activeLanguage = optimisticLanguage ?? language;

  function selectLanguage(nextLanguage: SupportedLanguage) {
    const normalized = normalizeLanguage(nextLanguage);

    if (normalized === activeLanguage) {
      return;
    }

    setOptimisticLanguage(normalized);
    writeLanguageCookie(normalized);
    startTransition(() => router.refresh());
  }

  // Arrow keys intentionally move focus only instead of committing selection.
  // Committing immediately would call router.refresh() on every arrow press;
  // Space/Enter keep the language change deliberate and avoid refresh churn.
  function handleRadioKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const previousKeys = ["ArrowLeft", "ArrowUp"];
    const nextKeys = ["ArrowDown", "ArrowRight"];
    const commitKeys = [" ", "Enter"];
    const focusedLanguage =
      SUPPORTED_LANGUAGES.find(
        (item) => radioRefs.current[item] === document.activeElement,
      ) ?? activeLanguage;

    if (![...previousKeys, ...nextKeys].includes(event.key)) {
      if (commitKeys.includes(event.key)) {
        event.preventDefault();
        selectLanguage(focusedLanguage);
      }

      return;
    }

    event.preventDefault();

    const currentIndex = SUPPORTED_LANGUAGES.indexOf(focusedLanguage);
    const direction = previousKeys.includes(event.key) ? -1 : 1;
    const nextLanguage =
      SUPPORTED_LANGUAGES[
        (currentIndex + direction + SUPPORTED_LANGUAGES.length) %
          SUPPORTED_LANGUAGES.length
      ];

    radioRefs.current[nextLanguage]?.focus();
  }

  return (
    <div
      aria-label={label}
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border bg-background p-1",
        className,
      )}
      data-no-translate
      onKeyDown={handleRadioKeyDown}
      role="radiogroup"
    >
      <LanguagesIcon
        aria-hidden="true"
        className="mx-1 size-4 text-muted-foreground"
      />
      {SUPPORTED_LANGUAGES.map((item) => {
        const isSelected = item === activeLanguage;

        return (
          <Button
            aria-checked={isSelected}
            aria-label={getLanguageOptionLabel(item, activeLanguage)}
            className={cn(
              "h-7 min-w-9 px-2",
              isSelected && "pointer-events-none",
            )}
            disabled={isPending && !isSelected}
            key={item}
            onClick={() => selectLanguage(item)}
            ref={(button) => {
              radioRefs.current[item] = button;
            }}
            role="radio"
            size="sm"
            tabIndex={isSelected ? 0 : -1}
            type="button"
            variant={isSelected ? "default" : "ghost"}
          >
            {LANGUAGE_LABELS[item].shortName}
          </Button>
        );
      })}
    </div>
  );
}
