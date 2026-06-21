export const LANGUAGE_COOKIE_NAME = "diginoces_language";

export const SUPPORTED_LANGUAGES = ["fr", "en"] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = "fr";

export const LANGUAGE_LABELS: Record<
  SupportedLanguage,
  {
    name: string;
    shortName: string;
  }
> = {
  en: {
    name: "English",
    shortName: "EN",
  },
  fr: {
    name: "Français",
    shortName: "FR",
  },
};

// Keep French language-only because Diginoces is used across French-speaking
// regions; English copy currently follows US spelling and date conventions.
export const LANGUAGE_HTML_LANG: Record<SupportedLanguage, string> = {
  en: "en-US",
  fr: "fr",
};

export function normalizeLanguage(value: unknown): SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(value as SupportedLanguage)
    ? (value as SupportedLanguage)
    : DEFAULT_LANGUAGE;
}

export function getLanguageHtmlLang(language: SupportedLanguage) {
  return LANGUAGE_HTML_LANG[language];
}

export function isFrench(language: SupportedLanguage) {
  return language === "fr";
}

/**
 * Formats a date for the selected interface language.
 *
 * Throws when the value is not a valid Date or parseable date string. Callers
 * that pass untrusted input should validate first or handle the error.
 */
export function formatLocalizedDate(
  value: Date | string,
  language: SupportedLanguage,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
) {
  const date =
    typeof value === "string"
      ? new Date(value)
      : value instanceof Date
        ? value
        : new Date(NaN);

  if (Number.isNaN(date.getTime())) {
    const invalidValueDescription =
      value instanceof Date
        ? "Date object with invalid time"
        : JSON.stringify(
            String(value).replace(/\s+/g, " ").trim().slice(0, 80),
          );

    throw new Error(
      `Invalid localized date value for ${typeof value === "string" ? "string input" : "Date input"}: ${invalidValueDescription}.`,
    );
  }

  return (
    new Intl.DateTimeFormat(language === "fr" ? "fr-FR" : "en-US", options)
      .format(date)
      // French Intl output may contain narrow no-break spaces; normalize them
      // so static text comparison and translation tests remain predictable.
      .replace(/\u202f/g, " ")
  );
}
