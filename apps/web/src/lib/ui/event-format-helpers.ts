export function formatGuestSide(value: string | null | undefined) {
  const labels: Record<string, string> = {
    both: "Both families",
    bride: "Bride side",
    groom: "Groom side",
  };

  return value ? (labels[value] ?? value.replaceAll("_", " ")) : "No side";
}

export function formatRsvpStatus(value: string | null | undefined) {
  const labels: Record<string, string> = {
    locked: "Locked",
    manual_review: "Needs review",
    maybe: "Maybe",
    no: "Cannot attend",
    pending: "Awaiting reply",
    yes: "Attending",
  };

  return value ? (labels[value] ?? value.replaceAll("_", " ")) : "No RSVP";
}

export function formatGuestDeliveryType(isPrintedOnly: boolean) {
  return isPrintedOnly ? "Printed invitation" : "Digital link";
}

export function seatingStatusBadgeVariant(status: string) {
  switch (status) {
    case "active":
      return "secondary" as const;
    case "locked":
      return "outline" as const;
    case "archived":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
}
