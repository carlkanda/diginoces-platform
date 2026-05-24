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
