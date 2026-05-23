import type { MessageDeliveryStatus } from "@/lib/messages/message-service";

export function formatStatus(status: MessageDeliveryStatus | string) {
  return status.replaceAll("_", " ");
}
