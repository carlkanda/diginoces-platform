import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  approveProjectContract,
  buildCommercialAuditActions,
  calculatePaymentBalance,
  calculateProjectPricing,
  canPerformCommercialAction,
  canViewRevenue,
  CommercialValidationError,
  evaluatePaymentGate,
  evaluatePlannedGuestCountChange,
  generateProjectContract,
  getSprint10CommercialStatus,
  validateCommercialGesture,
  type EventPackagePricingInput,
  type ProjectContract,
  type ServicePackage,
  type ServicePackageAddon,
} from "@/lib/contracts/contract-service";
import type { RoleAssignment } from "@/lib/security/permissions";

const projectId = "11111111-1111-4111-8111-111111111111";
const eventId = "22222222-2222-4222-8222-222222222222";

const fullPackage: ServicePackage = {
  basePriceCents: 100_000,
  id: "package-full",
  includedGuestCount: 100,
  name: "Full service",
  packageCode: "FULL",
  pricePerAdditionalGuestCents: 1_000,
  pricingMode: "base_plus_per_guest",
  status: "active",
};

const printAddon: ServicePackageAddon = {
  addonCode: "PRINT",
  id: "addon-print",
  name: "Printed cards",
  priceCents: 25_000,
  pricingMode: "flat",
  status: "active",
};

const perGuestAddon: ServicePackageAddon = {
  addonCode: "VIP",
  id: "addon-vip",
  name: "VIP support",
  priceCents: 250,
  pricingMode: "per_guest",
  status: "active",
};

const eventSelection: EventPackagePricingInput = {
  addons: [printAddon, perGuestAddon],
  eventId,
  eventName: "Reception",
  plannedGuestCount: 120,
  servicePackage: fullPackage,
};

const adminAssignments: RoleAssignment[] = [
  {
    role: "diginoces_admin",
    scope: "global",
  },
];

const groomAssignments: RoleAssignment[] = [
  {
    role: "groom",
    scope: "project",
    scopeId: projectId,
  },
];

const partnerAssignments: RoleAssignment[] = [
  {
    role: "partner_admin",
    scope: "custom",
    scopeId: projectId,
  },
];

const operationsManagerAssignments: RoleAssignment[] = [
  {
    role: "operations_manager",
    scope: "global",
  },
];

function repoRootFromCwd() {
  const configuredRoot = process.env.TEST_REPO_ROOT;

  if (configuredRoot) {
    return resolve(configuredRoot);
  }

  let current = resolve(process.cwd());

  while (true) {
    if (
      existsSync(join(current, "AGENTS.md")) &&
      existsSync(join(current, "supabase"))
    ) {
      return current;
    }

    const parent = dirname(current);

    if (parent === current) {
      throw new Error(
        `Unable to resolve repository root from ${process.cwd()}`,
      );
    }

    current = parent;
  }
}

function readSprint10Migration() {
  const migrationDir = join(repoRootFromCwd(), "supabase", "migrations");
  const match = readdirSync(migrationDir).find((entry) =>
    entry.endsWith("_sprint_10_contracts_pricing_payments.sql"),
  );

  if (!match) {
    throw new Error("Sprint 10 migration was not found.");
  }

  return readFileSync(join(migrationDir, match), "utf8");
}

function readMigrationBySuffix(suffix: string) {
  const migrationDir = join(repoRootFromCwd(), "supabase", "migrations");
  const match = readdirSync(migrationDir).find((entry) =>
    entry.endsWith(suffix),
  );

  if (!match) {
    throw new Error(`Migration ending with ${suffix} was not found.`);
  }

  return readFileSync(join(migrationDir, match), "utf8");
}

function approvedContract(): ProjectContract {
  const pricing = calculateProjectPricing({
    eventSelections: [eventSelection],
  });
  const generated = generateProjectContract({
    brideName: "Ada",
    generatedAt: "2026-05-30T12:00:00.000Z",
    groomName: "Ben",
    pricing,
    projectCode: "ADA-2026-001",
    projectId,
    version: 1,
  });

  return approveProjectContract(generated, {
    actorUserId: "groom-user",
    approvedAt: "2026-05-30T12:30:00.000Z",
    checked: true,
    confirmationText: "I approve the Diginoces project contract.",
  }).contract;
}

describe("Sprint 10 commercial foundation", () => {
  it("calculates USD all-inclusive event and project pricing from packages, add-ons, guest counts, and gestures", () => {
    const pricing = calculateProjectPricing({
      eventSelections: [eventSelection],
      gestures: [
        {
          amountCents: 10_000,
          gestureType: "fixed_amount",
          id: "gesture-1",
          reason: "Commercial gesture approved by Diginoces",
          status: "active",
        },
      ],
    });

    expect(pricing.currency).toBe("USD");
    expect(pricing.plannedGuestCountSnapshot).toBe(120);
    expect(pricing.subtotalAmountCents).toBe(175_000);
    expect(pricing.discountAmountCents).toBe(10_000);
    expect(pricing.totalAmountCents).toBe(165_000);
    expect(pricing.eventBreakdown[0]).toMatchObject({
      addonAmountCents: 55_000,
      packageAmountCents: 120_000,
      totalAmountCents: 175_000,
    });
  });

  it("requires admin/internal commercial permissions for package, pricing, payment, exception, and revenue actions", () => {
    expect(
      canPerformCommercialAction(
        adminAssignments,
        projectId,
        "packages.manage",
      ),
    ).toBe(true);
    expect(
      canPerformCommercialAction(
        partnerAssignments,
        projectId,
        "packages.manage",
      ),
    ).toBe(false);
    expect(
      canPerformCommercialAction(
        operationsManagerAssignments,
        projectId,
        "packages.manage",
      ),
    ).toBe(true);
    expect(canViewRevenue(adminAssignments, projectId)).toBe(true);
    expect(canViewRevenue(operationsManagerAssignments, projectId)).toBe(true);
    expect(canViewRevenue(partnerAssignments, projectId)).toBe(false);
    expect(
      canPerformCommercialAction(
        groomAssignments,
        projectId,
        "contracts.approve",
      ),
    ).toBe(true);
    expect(
      canPerformCommercialAction(
        groomAssignments,
        projectId,
        "payments.record",
      ),
    ).toBe(false);
  });

  it("generates one project-level contract covering all event package snapshots", () => {
    const pricing = calculateProjectPricing({
      eventSelections: [eventSelection],
    });
    const contract = generateProjectContract({
      brideName: "Ada",
      generatedAt: "2026-05-30T12:00:00.000Z",
      groomName: "Ben",
      pricing,
      projectCode: "ADA-2026-001",
      projectId,
      version: 1,
    });

    expect(contract.contractNumber).toBe("ADA-2026-001-CTR-V01");
    expect(contract.projectId).toBe(projectId);
    expect(contract.packageSnapshot).toHaveLength(1);
    expect(contract.renderedContract).toContain("## Event services");
    expect(contract.renderedContract).toContain("Guest-list access opens");
  });

  it("approves contracts only with explicit checkbox and confirmation", () => {
    const contract = approvedContract();

    expect(contract.status).toBe("approved");
    expect(contract.approvalConfirmationText).toContain("approve");

    expect(() =>
      approveProjectContract(contract, {
        actorUserId: "groom-user",
        approvedAt: "2026-05-30T13:00:00.000Z",
        checked: false,
        confirmationText: "Approve",
      }),
    ).toThrow(CommercialValidationError);
  });

  it("represents guest-count increase addendum path and no automatic decrease reduction after approval", () => {
    const increase = evaluatePlannedGuestCountChange({
      approvedContractExists: true,
      nextSelection: {
        ...eventSelection,
        plannedGuestCount: 150,
      },
      previousSelection: eventSelection,
    });
    const decrease = evaluatePlannedGuestCountChange({
      approvedContractExists: true,
      nextSelection: {
        ...eventSelection,
        plannedGuestCount: 80,
      },
      previousSelection: eventSelection,
    });

    expect(increase).toMatchObject({
      additionalAmountCents: 37_500,
      type: "addendum_required",
    });
    expect(decrease).toMatchObject({
      type: "no_automatic_reduction",
    });
  });

  it("requires reasoned commercial gestures", () => {
    expect(() =>
      validateCommercialGesture({
        amountCents: 5000,
        gestureType: "fixed_amount",
        reason: "",
      }),
    ).toThrow(CommercialValidationError);
  });

  it("tracks manual payments, balance, full payment gate, unpaid lock, and exception override", () => {
    const unpaid = calculatePaymentBalance({
      approvedContractAmountCents: 200_000,
      payments: [{ paidAmountCents: 50_000, status: "confirmed" }],
    });
    const paid = calculatePaymentBalance({
      approvedContractAmountCents: 200_000,
      payments: [{ paidAmountCents: 200_000, status: "confirmed" }],
    });
    const exception = calculatePaymentBalance({
      activeException: {
        id: "exception-1",
        reason: "Diginoces approved guest-facing access before final payment.",
        status: "active",
      },
      approvedContractAmountCents: 200_000,
      payments: [{ paidAmountCents: 50_000, status: "confirmed" }],
    });
    const zeroDollar = calculatePaymentBalance({
      approvedContractAmountCents: 0,
      payments: [],
    });

    expect(unpaid.balanceDueCents).toBe(150_000);
    expect(evaluatePaymentGate(unpaid).status).toBe("locked");
    expect(evaluatePaymentGate(paid).status).toBe("payment_confirmed");
    expect(evaluatePaymentGate(exception).status).toBe("exception_override");
    expect(evaluatePaymentGate(zeroDollar).status).toBe("payment_confirmed");
  });

  it("lists Sprint 10 requirements, audit actions, and migration evidence", () => {
    const status = getSprint10CommercialStatus();
    const migration = readSprint10Migration();
    const normalizedMigration = migration.replace(/\s+/g, " ");

    expect(status.requirementIds).toEqual(
      expect.arrayContaining(["PAY-001", "PAY-014", "PAY-015", "TECH-004"]),
    );
    expect(buildCommercialAuditActions()).toEqual(
      expect.arrayContaining([
        "contracts.generated",
        "contracts.approved",
        "payments.recorded",
        "payment_exceptions.created",
        "payment_gate_events.created",
      ]),
    );
    expect(migration).toContain(
      "create table if not exists public.service_packages",
    );
    expect(migration).toContain("create table if not exists public.contracts");
    expect(migration).toContain("create table if not exists public.payments");
    expect(migration).toContain("payment_exceptions.manage");
    expect(migration).toContain("guest_page_access_status = v_next");
    expect(migration).toContain("current_user_has_any_commercial_read");
    expect(normalizedMigration).toContain(
      'create policy "Payments recorded by payment recorders"',
    );
    expect(normalizedMigration).toContain("status <> 'confirmed'");
    expect(normalizedMigration).toContain("p_snapshot - 'rendered_contract'");
    expect(normalizedMigration).toContain("auth.jwt() ->> 'aal'");
  });

  it("keeps the commercial audit trigger from comparing table-specific status enums across tables", () => {
    const migration = readMigrationBySuffix(
      "_mvp_commercial_audit_trigger_fix.sql",
    );
    const contractBranchIndex = migration.indexOf(
      "elsif tg_table_name = 'contracts' then",
    );
    const paymentExceptionBranchIndex = migration.indexOf(
      "elsif tg_table_name = 'payment_exceptions' then",
    );
    const contractApprovedIndex = migration.indexOf(
      "new.status = 'approved'",
      contractBranchIndex,
    );
    const paymentExceptionRevokedIndex = migration.indexOf(
      "new.status = 'revoked'",
      paymentExceptionBranchIndex,
    );

    expect(contractBranchIndex).toBeGreaterThanOrEqual(0);
    expect(paymentExceptionBranchIndex).toBeGreaterThan(contractBranchIndex);
    expect(contractApprovedIndex).toBeGreaterThan(contractBranchIndex);
    expect(contractApprovedIndex).toBeLessThan(paymentExceptionBranchIndex);
    expect(paymentExceptionRevokedIndex).toBeGreaterThan(
      paymentExceptionBranchIndex,
    );
  });
});
