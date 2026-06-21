import type { MessageDeliveryStatus } from "@/lib/messages/message-service";
import { isInternalProjectDisplayText } from "@/lib/projects/project-foundation";

const internalMessageBodyPattern =
  /\bqa message\b|\bmessage de controle\b|\bqademo\b/i;

export function formatStatus(status: MessageDeliveryStatus | string) {
  const labels: Record<string, string> = {
    active: "Active",
    api_ready: "Ready to send",
    api_sent: "Sent",
    archived: "Archived",
    cancelled: "Cancelled",
    draft: "Draft",
    event_reminder: "Event reminder",
    failed: "Failed",
    generated: "Generated",
    guided_manual: "Guided manual send",
    inactive: "Inactive",
    invitation: "Invitation",
    invitation_resend: "Invitation resend",
    manual_custom: "Custom message",
    maybe_follow_up: "Maybe follow-up",
    modification_notice: "Event update",
    needs_regeneration: "Needs regeneration",
    not_prepared: "Not prepared",
    not_generated: "Not generated",
    opened_manually: "Opened in WhatsApp",
    prepared: "Prepared",
    queued: "Waiting to send",
    resent: "Resent",
    rsvp_request: "RSVP request",
    sent: "Sent",
    skipped: "Skipped",
    welcome_table_placeholder: "Welcome and table note",
  };

  return labels[status] ?? status.replaceAll("_", " ");
}

export function formatMessageLanguage(language: string | null | undefined) {
  const labels: Record<string, string> = {
    en: "English",
    fr: "French",
  };

  return labels[(language ?? "fr").toLowerCase()] ?? "Preferred language";
}

export function formatMessageGuestDisplayName(
  value: string | null | undefined,
  fallback = "Guest",
) {
  if (!value || isInternalProjectDisplayText(value)) {
    return fallback;
  }

  return value;
}

export function formatMessageBodyPreview(
  value: string | null | undefined,
  fallback = "Saved wording preview is hidden for this sample workspace record.",
) {
  if (
    !value ||
    isInternalProjectDisplayText(value) ||
    internalMessageBodyPattern.test(value)
  ) {
    return fallback;
  }

  return value;
}

export function publicManualWhatsappUrl(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  let decodedValue = value;
  try {
    decodedValue = decodeURIComponent(value);
  } catch {
    decodedValue = value;
  }

  if (
    isInternalProjectDisplayText(decodedValue) ||
    internalMessageBodyPattern.test(decodedValue)
  ) {
    return null;
  }

  return value;
}

export function formatMessageWhatsappNumber(value: string | null | undefined) {
  if (!value) {
    return "No number linked";
  }

  const digitsOnly = value.replace(/\D/g, "");
  if (/^(?:243)?0{6,}\d*$/.test(digitsOnly)) {
    return "Sample number hidden";
  }

  return value;
}

export function shortId(value: string | null) {
  if (!value) {
    return null;
  }

  return value.length > 8 ? `${value.slice(0, 8)}...` : value;
}

export function sanitizeFeedbackMessage(value: string | undefined) {
  const sanitized = value
    ?.replace(/[<>]/g, "")
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/[\u200b-\u200d\u2028-\u2029\u202a-\u202e\ufeff]+/g, "")
    .trim()
    .slice(0, 180);

  return sanitized && sanitized.length > 0 ? sanitized : undefined;
}
