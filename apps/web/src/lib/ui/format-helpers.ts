export function pluralize(
  count: number,
  singular: string,
  plural = `${singular}s`,
) {
  return `${count} ${count === 1 ? singular : plural}`;
}

// MVP shell copy is authored in English, then translated by the static
// localization layer where these normalized system labels appear in the UI.
const defaultLabelOverrides: Record<string, string> = {
  active: "Active",
  applied: "Applied",
  approved: "Approved",
  archived: "Archived",
  blocked: "Blocked",
  cancelled: "Cancelled",
  complete: "Complete",
  completed: "Complete",
  confirmed: "Confirmed",
  digital: "Digital link",
  draft: "Draft",
  in_progress: "In progress",
  inactive: "Inactive",
  locked: "Locked",
  manual_review: "Needs review",
  maybe: "Maybe",
  no: "No",
  not_configured: "Not connected",
  partial: "Partially ready",
  payment_gate_locked: "Guest page locked",
  pending: "Waiting",
  printed_only: "Printed invitation",
  ready: "Ready",
  ready_for_review: "Ready for review",
  recorded: "Recorded",
  rejected: "Rejected",
  sent: "Sent",
  yes: "Yes",
};

function hasOwnLabel(labels: Record<string, string>, value: string) {
  return Object.prototype.hasOwnProperty.call(labels, value);
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

  if (hasOwnLabel(labels, value)) {
    return labels[value];
  }

  if (hasOwnLabel(defaultLabelOverrides, value)) {
    return defaultLabelOverrides[value];
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
