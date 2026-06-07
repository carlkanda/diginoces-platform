import {
  formatUsd,
  type ProjectPricingCalculation,
} from "@/lib/contracts/contract-service";

type PricingPreviewProps = {
  canReadCommercialGestures: boolean;
  pricing: ProjectPricingCalculation | null;
};

export function PricingPreview({
  canReadCommercialGestures,
  pricing,
}: PricingPreviewProps) {
  const subtotal = pricing
    ? formatUsd(pricing.subtotalAmountCents)
    : "Not calculated";
  const commercialGesture = pricing
    ? formatUsd(pricing.discountAmountCents)
    : "Not calculated";
  const total = pricing
    ? formatUsd(pricing.totalAmountCents)
    : "Not calculated";
  const plannedGuests = pricing
    ? String(pricing.plannedGuestCountSnapshot)
    : "Not calculated";

  return (
    <div className="detail-grid">
      <div>
        <span>Subtotal</span>
        <strong>{subtotal}</strong>
      </div>
      {canReadCommercialGestures ? (
        <div>
          <span>Commercial gesture</span>
          <strong>{commercialGesture}</strong>
        </div>
      ) : null}
      <div>
        <span>Total</span>
        <strong>{total}</strong>
      </div>
      <div>
        <span>Planned guests</span>
        <strong>{plannedGuests}</strong>
      </div>
    </div>
  );
}
