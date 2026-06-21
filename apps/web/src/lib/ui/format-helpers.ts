export function pluralize(
  count: number,
  singular: string,
  plural = `${singular}s`,
) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function formatLabel(
  value: string | null | undefined,
  {
    fallback = "None",
    labels = {},
  }: {
    fallback?: string;
    labels?: Record<string, string>;
  } = {},
) {
  if (!value) {
    return fallback;
  }

  if (labels[value]) {
    return labels[value];
  }

  const label = value
    .replaceAll(".", " ")
    .replaceAll("_", " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  return label
    .replace(/\bApi\b/g, "App")
    .replace(/\bCsv\b/g, "CSV")
    .replace(/\bId\b/g, "ID")
    .replace(/\bPdf\b/g, "PDF")
    .replace(/\bQr\b/g, "QR")
    .replace(/\bRsvp\b/g, "RSVP");
}

export function formatDateTime(
  value: string | null | undefined,
  fallback = "Time not recorded",
) {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
