import { randomUUID } from "node:crypto";
import { hasScopedPermission } from "@/lib/projects/project-permissions";
import type {
  PermissionSlug,
  RoleAssignment,
} from "@/lib/security/permissions";

export class CommercialValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CommercialValidationError";
  }
}

export type ServicePricingMode = "base_plus_per_guest" | "flat" | "per_guest";
export type AddonPricingMode = Exclude<
  ServicePricingMode,
  "base_plus_per_guest"
>;
export type ServiceCatalogStatus = "active" | "archived" | "draft" | "inactive";
export type ContractStatus =
  | "approved"
  | "cancelled"
  | "draft"
  | "generated"
  | "sent_for_approval"
  | "superseded";
export type ContractAddendumStatus =
  | "approved"
  | "cancelled"
  | "draft"
  | "generated"
  | "rejected"
  | "sent_for_approval";
export type PaymentStatus = "cancelled" | "confirmed" | "recorded" | "rejected";
export type PaymentGateStatus =
  | "exception_override"
  | "locked"
  | "payment_confirmed";
export type GuestListAccessStatus = "contract_approved" | "locked";
export type CommercialGestureType = "fixed_amount" | "percentage";

export type ServicePackage = {
  basePriceCents: number;
  description?: string | null;
  id: string;
  includedGuestCount: number;
  name: string;
  packageCode: string;
  pricePerAdditionalGuestCents: number;
  pricingMode: ServicePricingMode;
  status: ServiceCatalogStatus;
};

export type ServicePackageAddon = {
  addonCode: string;
  description?: string | null;
  id: string;
  name: string;
  priceCents: number;
  pricingMode: AddonPricingMode;
  status: ServiceCatalogStatus;
};

export type EventPackagePricingInput = {
  addons: ServicePackageAddon[];
  eventId: string;
  eventName: string;
  plannedGuestCount: number;
  servicePackage: ServicePackage;
};

export type EventPricingBreakdown = {
  addonAmountCents: number;
  addonSnapshot: Array<{
    addonCode: string;
    id: string;
    name: string;
    priceCents: number;
    pricingMode: AddonPricingMode;
  }>;
  eventId: string;
  eventName: string;
  packageAmountCents: number;
  packageSnapshot: {
    basePriceCents: number;
    id: string;
    includedGuestCount: number;
    name: string;
    packageCode: string;
    pricePerAdditionalGuestCents: number;
    pricingMode: ServicePricingMode;
  };
  plannedGuestCount: number;
  totalAmountCents: number;
};

export type CommercialGesture = {
  amountCents?: number | null;
  gestureType: CommercialGestureType;
  id: string;
  percentageBps?: number | null;
  reason: string;
  status: "active" | "revoked";
};

export type ProjectPricingCalculation = {
  currency: "USD";
  discountAmountCents: number;
  eventBreakdown: EventPricingBreakdown[];
  plannedGuestCountSnapshot: number;
  subtotalAmountCents: number;
  totalAmountCents: number;
};

export type ProjectContract = {
  approvalConfirmationText: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  contractNumber: string;
  finalAmountCents: number;
  id: string;
  isLatest: boolean;
  packageSnapshot: EventPricingBreakdown[];
  plannedGuestCountSnapshot: number;
  pricingSnapshot: ProjectPricingCalculation;
  projectId: string;
  renderedContract: string;
  status: ContractStatus;
  version: number;
};

export type ContractApprovalInput = {
  actorUserId: string;
  approvedAt: string;
  checked: boolean;
  confirmationText: string;
};

export type ContractApprovalResult = {
  auditActions: CommercialAuditAction[];
  contract: ProjectContract;
  guestListAccessStatus: GuestListAccessStatus;
};

export type PaymentRecord = {
  paidAmountCents: number;
  status: PaymentStatus;
};

export type PaymentException = {
  expiresAt?: string | null;
  id: string;
  reason: string;
  status: "active" | "expired" | "revoked";
};

export type PaymentBalance = {
  activeExceptionId: string | null;
  addendumAmountCents: number;
  balanceDueCents: number;
  confirmedPaidAmountCents: number;
  contractAmountCents: number;
  expectedAmountCents: number;
  hasActiveException: boolean;
  isFullyPaid: boolean;
};

export type PaymentGateDecision = {
  auditActions: CommercialAuditAction[];
  reason: string;
  status: PaymentGateStatus;
};

export type PlannedGuestCountChangeDecision =
  | {
      additionalAmountCents: number;
      nextAmountCents: number;
      previousAmountCents: number;
      reason: string;
      type: "addendum_required";
    }
  | {
      nextAmountCents: number;
      previousAmountCents: number;
      reason: string;
      type: "no_automatic_reduction" | "no_addendum";
    };

export type CommercialAction =
  | "addendums.manage"
  | "contracts.approve"
  | "contracts.generate"
  | "contracts.read"
  | "packages.manage"
  | "payments.confirm"
  | "payments.record"
  | "payments.summary.read"
  | "pricing.calculate"
  | "pricing.manage"
  | "revenue.read";

export const commercialAuditActions = [
  "service_packages.created",
  "service_packages.updated",
  "service_package_addons.created",
  "service_package_addons.updated",
  "project_event_package_selections.selected",
  "project_event_package_selections.updated",
  "pricing_calculations.generated",
  "contracts.generated",
  "contracts.approved",
  "contract_approvals.created",
  "contract_addendums.generated",
  "contract_addendums.approved",
  "payments.recorded",
  "payments.confirmed",
  "payment_exceptions.created",
  "payment_exceptions.revoked",
  "commercial_gestures.applied",
  "payment_gate_events.created",
] as const;

export type CommercialAuditAction = (typeof commercialAuditActions)[number];

const actionPermissions: Record<CommercialAction, PermissionSlug> = {
  "addendums.manage": "contracts.manage_addendums",
  "contracts.approve": "contracts.approve",
  "contracts.generate": "contracts.generate",
  "contracts.read": "contracts.read",
  "packages.manage": "service_packages.manage",
  "payments.confirm": "payments.confirm",
  "payments.record": "payments.record",
  "payments.summary.read": "payments.summary.read",
  "pricing.calculate": "pricing.calculate",
  "pricing.manage": "pricing.manage",
  "revenue.read": "revenue.read",
};

function assertNonNegativeInteger(value: number, fieldName: string) {
  if (!Number.isInteger(value) || value < 0) {
    throw new CommercialValidationError(`${fieldName} must be non-negative.`);
  }
}

function requiredText(value: string | null | undefined, fieldName: string) {
  if (!value || value.trim().length === 0) {
    throw new CommercialValidationError(`${fieldName} is required.`);
  }

  return value.trim();
}

function priceForGuestCount(input: {
  basePriceCents: number;
  includedGuestCount?: number;
  plannedGuestCount: number;
  pricePerGuestCents?: number;
  pricingMode: ServicePricingMode;
}) {
  assertNonNegativeInteger(input.basePriceCents, "base price");
  assertNonNegativeInteger(input.plannedGuestCount, "planned guest count");

  if (input.pricingMode === "flat") {
    return input.basePriceCents;
  }

  if (input.pricingMode === "per_guest") {
    return input.basePriceCents * input.plannedGuestCount;
  }

  const includedGuestCount = input.includedGuestCount ?? 0;
  const pricePerGuestCents = input.pricePerGuestCents ?? 0;
  assertNonNegativeInteger(includedGuestCount, "included guest count");
  assertNonNegativeInteger(pricePerGuestCents, "additional guest price");

  return (
    input.basePriceCents +
    Math.max(0, input.plannedGuestCount - includedGuestCount) *
      pricePerGuestCents
  );
}

export function calculateEventPackageAmount(
  input: EventPackagePricingInput,
): EventPricingBreakdown {
  assertNonNegativeInteger(input.plannedGuestCount, "planned guest count");

  if (input.servicePackage.status !== "active") {
    throw new CommercialValidationError("Service package must be active.");
  }

  const packageAmountCents = priceForGuestCount({
    basePriceCents: input.servicePackage.basePriceCents,
    includedGuestCount: input.servicePackage.includedGuestCount,
    plannedGuestCount: input.plannedGuestCount,
    pricePerGuestCents: input.servicePackage.pricePerAdditionalGuestCents,
    pricingMode: input.servicePackage.pricingMode,
  });
  const activeAddons = input.addons.filter(
    (addon) => addon.status === "active",
  );
  const addonAmountCents = activeAddons.reduce((total, addon) => {
    return (
      total +
      priceForGuestCount({
        basePriceCents: addon.priceCents,
        plannedGuestCount: input.plannedGuestCount,
        pricingMode: addon.pricingMode,
      })
    );
  }, 0);

  return {
    addonAmountCents,
    addonSnapshot: activeAddons.map((addon) => ({
      addonCode: addon.addonCode,
      id: addon.id,
      name: addon.name,
      priceCents: addon.priceCents,
      pricingMode: addon.pricingMode,
    })),
    eventId: input.eventId,
    eventName: input.eventName,
    packageAmountCents,
    packageSnapshot: {
      basePriceCents: input.servicePackage.basePriceCents,
      id: input.servicePackage.id,
      includedGuestCount: input.servicePackage.includedGuestCount,
      name: input.servicePackage.name,
      packageCode: input.servicePackage.packageCode,
      pricePerAdditionalGuestCents:
        input.servicePackage.pricePerAdditionalGuestCents,
      pricingMode: input.servicePackage.pricingMode,
    },
    plannedGuestCount: input.plannedGuestCount,
    totalAmountCents: packageAmountCents + addonAmountCents,
  };
}

export function calculateCommercialGestureDiscount(
  subtotalAmountCents: number,
  gestures: CommercialGesture[],
) {
  assertNonNegativeInteger(subtotalAmountCents, "subtotal");

  return gestures
    .filter((gesture) => gesture.status === "active")
    .reduce((total, gesture) => {
      requiredText(gesture.reason, "commercial gesture reason");

      if (gesture.gestureType === "fixed_amount") {
        const amount = gesture.amountCents ?? 0;
        assertNonNegativeInteger(amount, "commercial gesture amount");
        return total + amount;
      }

      const percentageBps = gesture.percentageBps ?? 0;

      if (
        !Number.isInteger(percentageBps) ||
        percentageBps <= 0 ||
        percentageBps > 10000
      ) {
        throw new CommercialValidationError(
          "Commercial gesture percentage must be between 1 and 10000 basis points.",
        );
      }

      return total + Math.floor((subtotalAmountCents * percentageBps) / 10000);
    }, 0);
}

export function calculateProjectPricing(input: {
  eventSelections: EventPackagePricingInput[];
  gestures?: CommercialGesture[];
}): ProjectPricingCalculation {
  const eventBreakdown = input.eventSelections.map(calculateEventPackageAmount);
  const subtotalAmountCents = eventBreakdown.reduce(
    (total, event) => total + event.totalAmountCents,
    0,
  );
  const discountAmountCents = Math.min(
    calculateCommercialGestureDiscount(
      subtotalAmountCents,
      input.gestures ?? [],
    ),
    subtotalAmountCents,
  );

  return {
    currency: "USD",
    discountAmountCents,
    eventBreakdown,
    plannedGuestCountSnapshot: eventBreakdown.reduce(
      (total, event) => total + event.plannedGuestCount,
      0,
    ),
    subtotalAmountCents,
    totalAmountCents: subtotalAmountCents - discountAmountCents,
  };
}

export function buildContractNumber(projectCode: string, version: number) {
  if (!Number.isInteger(version) || version < 1) {
    throw new CommercialValidationError("Contract version must be positive.");
  }

  return `${requiredText(projectCode, "project code")}-CTR-V${String(version).padStart(2, "0")}`;
}

export function renderProjectContractMarkdown(input: {
  brideName: string;
  groomName: string;
  paymentTerms: string;
  pricing: ProjectPricingCalculation;
  projectCode: string;
}) {
  const coupleNames = `${requiredText(input.brideName, "bride name")} & ${requiredText(input.groomName, "groom name")}`;
  const eventLines = input.pricing.eventBreakdown
    .map(
      (event) =>
        `- ${event.eventName}: ${event.plannedGuestCount} planned guests, ${formatUsd(event.totalAmountCents)} (${event.packageSnapshot.name})`,
    )
    .join("\n");

  return [
    `# Diginoces Wedding Services Contract`,
    ``,
    `Project: ${requiredText(input.projectCode, "project code")}`,
    `Couple: ${coupleNames}`,
    ``,
    `## Event services`,
    eventLines || "- No event package selections have been configured.",
    ``,
    `## Pricing`,
    `Subtotal: ${formatUsd(input.pricing.subtotalAmountCents)}`,
    `Commercial gesture/discount: ${formatUsd(input.pricing.discountAmountCents)}`,
    `Total due: ${formatUsd(input.pricing.totalAmountCents)}`,
    ``,
    `## Payment and access gates`,
    requiredText(input.paymentTerms, "payment terms"),
    ``,
    `Guest-list access opens after in-app contract approval. Guest public pages and invitation sending open after full payment or an audited payment exception.`,
  ].join("\n");
}

export function generateProjectContract(input: {
  brideName: string;
  generatedAt: string;
  groomName: string;
  paymentTerms?: string;
  pricing: ProjectPricingCalculation;
  projectCode: string;
  projectId: string;
  version: number;
}): ProjectContract {
  const contractNumber = buildContractNumber(input.projectCode, input.version);
  const renderedContract = renderProjectContractMarkdown({
    brideName: input.brideName,
    groomName: input.groomName,
    paymentTerms:
      input.paymentTerms ??
      "Payments are recorded manually in USD. Full confirmed payment unlocks guest-facing access and invitation sending unless Diginoces grants an exception.",
    pricing: input.pricing,
    projectCode: input.projectCode,
  });

  return {
    approvalConfirmationText: null,
    approvedAt: null,
    approvedBy: null,
    contractNumber,
    finalAmountCents: input.pricing.totalAmountCents,
    id: randomUUID(),
    isLatest: true,
    packageSnapshot: input.pricing.eventBreakdown,
    plannedGuestCountSnapshot: input.pricing.plannedGuestCountSnapshot,
    pricingSnapshot: input.pricing,
    projectId: input.projectId,
    renderedContract,
    status: "generated",
    version: input.version,
  };
}

export function approveProjectContract(
  contract: ProjectContract,
  input: ContractApprovalInput,
): ContractApprovalResult {
  if (!input.checked) {
    throw new CommercialValidationError(
      "Contract approval checkbox must be checked.",
    );
  }

  const confirmationText = requiredText(
    input.confirmationText,
    "contract approval confirmation",
  );

  if (
    contract.status !== "generated" &&
    contract.status !== "sent_for_approval"
  ) {
    throw new CommercialValidationError(
      "Only generated contracts can be approved.",
    );
  }

  return {
    auditActions: ["contracts.approved", "contract_approvals.created"],
    contract: {
      ...contract,
      approvalConfirmationText: confirmationText,
      approvedAt: input.approvedAt,
      approvedBy: input.actorUserId,
      status: "approved",
    },
    guestListAccessStatus: "contract_approved",
  };
}

export function calculatePaymentBalance(input: {
  activeException?: PaymentException | null;
  approvedAddendumAmountCents?: number;
  approvedContractAmountCents: number;
  payments: PaymentRecord[];
}): PaymentBalance {
  assertNonNegativeInteger(
    input.approvedContractAmountCents,
    "approved contract amount",
  );

  const addendumAmountCents = input.approvedAddendumAmountCents ?? 0;
  assertNonNegativeInteger(addendumAmountCents, "approved addendum amount");

  const expectedAmountCents =
    input.approvedContractAmountCents + addendumAmountCents;
  const confirmedPaidAmountCents = input.payments
    .filter((payment) => payment.status === "confirmed")
    .reduce((total, payment) => {
      assertNonNegativeInteger(payment.paidAmountCents, "paid amount");
      return total + payment.paidAmountCents;
    }, 0);
  const activeException =
    input.activeException?.status === "active" ? input.activeException : null;

  return {
    activeExceptionId: activeException?.id ?? null,
    addendumAmountCents,
    balanceDueCents: Math.max(
      expectedAmountCents - confirmedPaidAmountCents,
      0,
    ),
    confirmedPaidAmountCents,
    contractAmountCents: input.approvedContractAmountCents,
    expectedAmountCents,
    hasActiveException: Boolean(activeException),
    isFullyPaid: confirmedPaidAmountCents >= expectedAmountCents,
  };
}

export function evaluatePaymentGate(
  balance: PaymentBalance,
): PaymentGateDecision {
  if (balance.isFullyPaid) {
    return {
      auditActions: ["payment_gate_events.created"],
      reason: "Full confirmed payment meets or exceeds expected amount.",
      status: "payment_confirmed",
    };
  }

  if (balance.hasActiveException) {
    return {
      auditActions: ["payment_gate_events.created"],
      reason: "Active payment exception override unlocks guest-facing access.",
      status: "exception_override",
    };
  }

  return {
    auditActions: [],
    reason:
      "Payment gate remains locked until full payment or active exception.",
    status: "locked",
  };
}

export function evaluatePlannedGuestCountChange(input: {
  approvedContractExists: boolean;
  nextSelection: EventPackagePricingInput;
  previousSelection: EventPackagePricingInput;
}): PlannedGuestCountChangeDecision {
  const previousAmountCents = calculateEventPackageAmount(
    input.previousSelection,
  ).totalAmountCents;
  const nextAmountCents = calculateEventPackageAmount(
    input.nextSelection,
  ).totalAmountCents;

  if (
    !input.approvedContractExists ||
    nextAmountCents === previousAmountCents
  ) {
    return {
      nextAmountCents,
      previousAmountCents,
      reason:
        "No approved contract snapshot exists yet, so the selection can be recalculated without an addendum.",
      type: "no_addendum",
    };
  }

  if (nextAmountCents > previousAmountCents) {
    return {
      additionalAmountCents: nextAmountCents - previousAmountCents,
      nextAmountCents,
      previousAmountCents,
      reason:
        "Planned guest count or paid scope increased after contract approval.",
      type: "addendum_required",
    };
  }

  return {
    nextAmountCents,
    previousAmountCents,
    reason:
      "Planned guest count decreased after contract approval; no automatic price reduction is applied.",
    type: "no_automatic_reduction",
  };
}

export function validateCommercialGesture(input: {
  amountCents?: number | null;
  gestureType: CommercialGestureType;
  percentageBps?: number | null;
  reason: string;
}) {
  requiredText(input.reason, "commercial gesture reason");

  if (input.gestureType === "fixed_amount") {
    if (!input.amountCents || input.amountCents <= 0) {
      throw new CommercialValidationError(
        "Fixed commercial gestures require a positive amount.",
      );
    }

    return;
  }

  if (
    !input.percentageBps ||
    input.percentageBps <= 0 ||
    input.percentageBps > 10000
  ) {
    throw new CommercialValidationError(
      "Percentage commercial gestures require 1-10000 basis points.",
    );
  }
}

export function validatePaymentExceptionReason(reason: string) {
  requiredText(reason, "payment exception reason");
}

export function canPerformCommercialAction(
  assignments: RoleAssignment[],
  projectId: string,
  action: CommercialAction,
) {
  return hasScopedPermission(assignments, actionPermissions[action], {
    projectId,
    scope: "project",
  });
}

export function canViewRevenue(
  assignments: RoleAssignment[],
  projectId: string,
) {
  return canPerformCommercialAction(assignments, projectId, "revenue.read");
}

export function buildCommercialAuditActions() {
  return [...commercialAuditActions];
}

export function formatUsd(cents: number) {
  assertNonNegativeInteger(cents, "amount");

  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
  }).format(cents / 100);
}

export function getSprint10CommercialStatus() {
  return {
    epic: "EPIC-PAY",
    features: ["FEAT-PAY-001", "FEAT-PAY-002", "FEAT-PAY-003", "FEAT-PAY-004"],
    issue: 26,
    modules: [
      {
        name: "Service package and event package selection foundation",
        requirementIds: [
          "PAY-006",
          "PAY-007",
          "PAY-008",
          "PAY-009",
          "PROJ-006",
        ],
      },
      {
        name: "One project-level contract and in-app approval foundation",
        requirementIds: ["PAY-001", "PAY-002", "PAY-003", "PAY-004"],
      },
      {
        name: "Addendum and guest-count change foundation",
        requirementIds: ["PAY-005", "PAY-010", "PAY-011"],
      },
      {
        name: "Manual payment, balance, exception, and gate foundation",
        requirementIds: [
          "PAY-013",
          "PAY-014",
          "PAY-015",
          "RSVP-002",
          "MSG-004",
        ],
      },
      {
        name: "Commercial gesture, revenue restrictions, permissions, and audit",
        requirementIds: [
          "PAY-012",
          "ROLE-002",
          "ROLE-004",
          "REP-006",
          "TECH-004",
        ],
      },
    ],
    outOfScope: [
      "online payment processing",
      "tax/VAT handling",
      "multi-currency",
      "partner commission management",
      "full reports/dashboard module",
      "post-event workflows",
      "e-signature provider integration",
      "contract negotiation workflow",
    ],
    requirementIds: [
      "PAY-001",
      "PAY-002",
      "PAY-003",
      "PAY-004",
      "PAY-005",
      "PAY-006",
      "PAY-007",
      "PAY-008",
      "PAY-009",
      "PAY-010",
      "PAY-011",
      "PAY-012",
      "PAY-013",
      "PAY-014",
      "PAY-015",
      "PROJ-006",
      "RSVP-002",
      "MSG-004",
      "ROLE-002",
      "ROLE-004",
      "REP-006",
      "TECH-004",
    ],
    sprint: "Sprint 10 - Contracts, Pricing & Payment Controls",
    stories: ["STORY-PAY-001", "STORY-PAY-002", "STORY-PAY-003"],
    tasks: ["TASK-PAY-001", "TASK-PAY-002"],
    tests: ["TEST-PAY-001", "TEST-PAY-002", "TEST-PAY-003"],
  };
}
