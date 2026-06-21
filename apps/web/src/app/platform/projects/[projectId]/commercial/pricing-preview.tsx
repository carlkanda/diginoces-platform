import {
  formatUsd,
  type ProjectPricingCalculation,
} from "@/lib/contracts/contract-service";

type PricingPreviewProps = {
  canReadCommercialGestures: boolean;
  pricing: ProjectPricingCalculation | null;
};

function PricingMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-lg border bg-background p-3">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <strong className="text-sm font-medium break-words">{value}</strong>
    </div>
  );
}

export function PricingPreview({
  canReadCommercialGestures,
  pricing,
}: PricingPreviewProps) {
  const subtotal = pricing
    ? formatUsd(pricing.subtotalAmountCents)
    : "No estimate yet";
  const commercialGesture = pricing
    ? formatUsd(pricing.discountAmountCents)
    : "No estimate yet";
  const total = pricing
    ? formatUsd(pricing.totalAmountCents)
    : "No estimate yet";
  const plannedGuests = pricing
    ? String(pricing.plannedGuestCountSnapshot)
    : "No estimate yet";

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <PricingMetric label="Subtotal" value={subtotal} />
      {canReadCommercialGestures ? (
        <PricingMetric label="Approved adjustment" value={commercialGesture} />
      ) : null}
      <PricingMetric label="Total" value={total} />
      <PricingMetric label="Planned guests" value={plannedGuests} />
    </div>
  );
}
