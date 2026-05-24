import type { MessageDeliveryStatus } from "@/lib/messages/message-service";

export function formatStatus(status: MessageDeliveryStatus | string) {
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
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
