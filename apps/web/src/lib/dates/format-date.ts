function format(
  value: string | null | undefined,
  options: Intl.DateTimeFormatOptions,
  locale?: string,
  fallback = "Not set",
) {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat(locale, {
    ...options,
    timeZone: "UTC",
  }).format(date);
}

export function formatDate(
  value: string | null | undefined,
  locale?: string,
  fallback?: string,
) {
  return format(
    value,
    {
      dateStyle: "medium",
    },
    locale,
    fallback,
  );
}

export function formatDateTime(
  value: string | null | undefined,
  locale?: string,
  fallback?: string,
) {
  return format(
    value,
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
    locale,
    fallback,
  );
}
