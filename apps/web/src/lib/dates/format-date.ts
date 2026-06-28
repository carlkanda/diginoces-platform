function format(
  value: string | null | undefined,
  options: Intl.DateTimeFormatOptions,
  locale?: string,
  fallback = "Not set",
  timeZone = "UTC",
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
    timeZone,
  }).format(date);
}

export const DIGINOCES_OPERATING_TIME_ZONE = "Africa/Kinshasa";

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

export function formatDateTimeInTimeZone(
  value: string | null | undefined,
  timeZone = "UTC",
  locale?: string,
  fallback?: string,
) {
  try {
    return format(
      value,
      {
        dateStyle: "medium",
        timeStyle: "short",
      },
      locale,
      fallback,
      timeZone,
    );
  } catch {
    return format(
      value,
      {
        dateStyle: "medium",
        timeStyle: "short",
      },
      locale,
      fallback,
      "UTC",
    );
  }
}

export function formatDiginocesDateTime(
  value: string | null | undefined,
  locale?: string,
  fallback?: string,
) {
  return format(
    value,
    {
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      month: "short",
      timeZoneName: "short",
      year: "numeric",
    },
    locale,
    fallback,
    DIGINOCES_OPERATING_TIME_ZONE,
  );
}
