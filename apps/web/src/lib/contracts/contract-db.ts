import type { SupabaseClient } from "@supabase/supabase-js";
import { serverLogger } from "@/lib/logging";
import {
  calculateEventPackageAmount,
  calculateProjectPricing,
  CommercialValidationError,
  generateProjectContract,
  validateCommercialGesture,
  validatePaymentExceptionReason,
  type CommercialGesture,
  type CommercialGestureType,
  type ContractAddendumStatus,
  type ContractStatus,
  type EventPackagePricingInput,
  type AddonPricingMode,
  type PaymentGateStatus,
  type PaymentStatus,
  type ProjectPricingCalculation,
  type ServiceCatalogStatus,
  type ServicePackage,
  type ServicePackageAddon,
  type ServicePricingMode,
} from "@/lib/contracts/contract-service";

export type ServicePackageRow = {
  base_price_cents: number;
  created_at: string;
  created_by: string | null;
  description: string | null;
  id: string;
  included_guest_count: number;
  name: string;
  package_code: string;
  price_per_additional_guest_cents: number;
  pricing_mode: ServicePricingMode;
  status: ServiceCatalogStatus;
  updated_at: string;
  updated_by: string | null;
};

export type ServicePackageAddonRow = {
  addon_code: string;
  created_at: string;
  created_by: string | null;
  description: string | null;
  id: string;
  name: string;
  price_cents: number;
  pricing_mode: AddonPricingMode;
  status: ServiceCatalogStatus;
  updated_at: string;
  updated_by: string | null;
};

export type EventPackageSelectionRow = {
  calculated_amount_cents: number;
  created_at: string;
  event_id: string;
  id: string;
  planned_guest_count: number;
  project_id: string;
  selected_addon_ids: string[];
  selected_addons_snapshot: unknown[];
  selected_by: string | null;
  service_package_id: string;
  status: "cancelled" | "draft" | "selected" | "superseded";
  updated_at: string;
};

export type PricingCalculationRow = {
  calculated_at: string;
  calculated_by: string | null;
  currency: "USD";
  discount_amount_cents: number;
  event_breakdown: unknown[];
  id: string;
  planned_guest_count_snapshot: number;
  project_id: string;
  status: "current" | "draft" | "snapshotted" | "superseded";
  subtotal_amount_cents: number;
  total_amount_cents: number;
};

export type ContractRow = {
  approval_confirmation_text: string | null;
  approved_at: string | null;
  approved_by: string | null;
  contract_number: string;
  created_at: string;
  currency: "USD";
  discount_amount_cents: number;
  file_id: string | null;
  final_amount_cents: number;
  generated_at: string;
  generated_by: string | null;
  id: string;
  is_latest: boolean;
  package_snapshot: unknown[];
  planned_guest_count_snapshot: number;
  pricing_snapshot: Record<string, unknown>;
  project_id: string;
  rendered_contract: string;
  status: ContractStatus;
  structured_data: Record<string, unknown>;
  updated_at: string;
  version: number;
};

export type ContractAddendumRow = {
  additional_amount_cents: number;
  addendum_number: string;
  approved_at: string | null;
  approved_by: string | null;
  contract_id: string;
  generated_at: string;
  generated_by: string | null;
  id: string;
  new_value_snapshot: Record<string, unknown>;
  old_value_snapshot: Record<string, unknown>;
  project_id: string;
  reason: string;
  status: ContractAddendumStatus;
};

export type PaymentRow = {
  addendum_id: string | null;
  confirmed_at: string | null;
  confirmed_by: string | null;
  contract_id: string | null;
  created_at: string;
  currency: "USD";
  expected_amount_cents: number;
  id: string;
  paid_amount_cents: number;
  payment_date: string;
  payment_method: string;
  project_id: string;
  reference_note: string | null;
  status: PaymentStatus;
};

export type PaymentExceptionRow = {
  amount_paid_at_approval_cents: number;
  conditions: string | null;
  contract_id: string | null;
  created_at: string;
  expires_at: string | null;
  id: string;
  project_id: string;
  reason: string;
  remaining_balance_cents: number;
  status: "active" | "expired" | "revoked";
};

export type CommercialGestureRow = {
  addendum_id: string | null;
  amount_cents: number | null;
  contract_id: string | null;
  created_at: string;
  gesture_type: CommercialGestureType;
  id: string;
  percentage_bps: number | null;
  project_id: string;
  reason: string;
  status: "active" | "revoked";
};

export type PaymentGateEventRow = {
  balance_snapshot: Record<string, unknown>;
  created_at: string;
  gate_type: "guest_public_page" | "invitation_sending";
  id: string;
  new_status: PaymentGateStatus;
  previous_status: PaymentGateStatus | null;
  project_id: string;
  reason: string;
};

export type CommercialProjectRow = {
  bride_name: string;
  groom_name: string;
  guest_list_access_status: "contract_approved" | "locked";
  guest_page_access_status: PaymentGateStatus;
  id: string;
  latest_contract_id: string | null;
  preferred_language: string | null;
  project_code: string;
};

export type CommercialEventRow = {
  event_date: string | null;
  id: string;
  name: string;
  project_id: string;
};

export type PaymentBalanceSnapshot = {
  activeExceptionId: string | null;
  addendumAmountCents: number;
  balanceDueCents: number;
  confirmedPaidAmountCents: number;
  contractAmountCents: number;
  contractId: string | null;
  contractStatus: ContractStatus | null;
  expectedAmountCents: number;
  gateReason?: string;
  gateStatus?: PaymentGateStatus;
  hasActiveException: boolean;
  isFullyPaid: boolean;
};

export type ProjectCommercialOverview = {
  addendums: ContractAddendumRow[];
  addons: ServicePackageAddonRow[];
  balance: PaymentBalanceSnapshot | null;
  contracts: ContractRow[];
  events: CommercialEventRow[];
  exceptions: PaymentExceptionRow[];
  gateEvents: PaymentGateEventRow[];
  gestures: CommercialGestureRow[];
  packages: ServicePackageRow[];
  payments: PaymentRow[];
  pricing: ProjectPricingCalculation | null;
  project: CommercialProjectRow;
  selections: EventPackageSelectionRow[];
};

export type CommercialOverviewAccess = {
  canManageExceptions?: boolean;
  canManageGestures?: boolean;
  canManagePackages?: boolean;
  canReadContracts?: boolean;
  canReadPackages?: boolean;
  canReadPayments?: boolean;
  canReadPaymentSummary?: boolean;
  canReadPricing?: boolean;
  canReadRevenue?: boolean;
};

const fullCommercialOverviewAccess: Required<CommercialOverviewAccess> = {
  canManageExceptions: true,
  canManageGestures: true,
  canManagePackages: true,
  canReadContracts: true,
  canReadPackages: true,
  canReadPayments: true,
  canReadPaymentSummary: true,
  canReadPricing: true,
  canReadRevenue: true,
};

const noCommercialOverviewAccess: Required<CommercialOverviewAccess> = {
  canManageExceptions: false,
  canManageGestures: false,
  canManagePackages: false,
  canReadContracts: false,
  canReadPackages: false,
  canReadPayments: false,
  canReadPaymentSummary: false,
  canReadPricing: false,
  canReadRevenue: false,
};

function normalizeOverviewAccess(
  access?: CommercialOverviewAccess,
): Required<CommercialOverviewAccess> {
  return access
    ? { ...noCommercialOverviewAccess, ...access }
    : fullCommercialOverviewAccess;
}

export function redactCommercialGesturePricing(
  pricing: ProjectPricingCalculation | null,
  canReadCommercialGestures: boolean,
): ProjectPricingCalculation | null {
  if (!pricing || canReadCommercialGestures) {
    return pricing;
  }

  return {
    ...pricing,
    discountAmountCents: 0,
    eventBreakdown: [],
    subtotalAmountCents: pricing.totalAmountCents,
  };
}

function toServicePackage(row: ServicePackageRow): ServicePackage {
  return {
    basePriceCents: row.base_price_cents,
    description: row.description,
    id: row.id,
    includedGuestCount: row.included_guest_count,
    name: row.name,
    packageCode: row.package_code,
    pricePerAdditionalGuestCents: row.price_per_additional_guest_cents,
    pricingMode: row.pricing_mode,
    status: row.status,
  };
}

function toAddon(row: ServicePackageAddonRow): ServicePackageAddon {
  return {
    addonCode: row.addon_code,
    description: row.description,
    id: row.id,
    name: row.name,
    priceCents: row.price_cents,
    pricingMode: row.pricing_mode,
    status: row.status,
  };
}

function toCommercialGesture(row: CommercialGestureRow): CommercialGesture {
  return {
    amountCents: row.amount_cents,
    gestureType: row.gesture_type,
    id: row.id,
    percentageBps: row.percentage_bps,
    reason: row.reason,
    status: row.status,
  };
}

function requiredString(value: unknown, fieldName: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new CommercialValidationError(`${fieldName} is required.`);
  }

  return value.trim();
}

function optionalString(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    throw new CommercialValidationError(
      "Optional text fields must be strings.",
    );
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function nonNegativeInteger(value: unknown, fieldName: string) {
  const numberValue =
    typeof value === "string" && value.trim().length > 0
      ? Number(value)
      : value;

  if (!Number.isInteger(numberValue) || Number(numberValue) < 0) {
    throw new CommercialValidationError(`${fieldName} must be non-negative.`);
  }

  return Number(numberValue);
}

function positiveInteger(value: unknown, fieldName: string) {
  const numberValue = nonNegativeInteger(value, fieldName);

  if (numberValue <= 0) {
    throw new CommercialValidationError(`${fieldName} must be positive.`);
  }

  return numberValue;
}

function parsePricingMode(value: unknown): ServicePricingMode {
  if (
    value === "flat" ||
    value === "per_guest" ||
    value === "base_plus_per_guest"
  ) {
    return value;
  }

  throw new CommercialValidationError("Unsupported pricing mode.");
}

function parseAddonPricingMode(value: unknown): AddonPricingMode {
  if (value === "flat" || value === "per_guest") {
    return value;
  }

  throw new CommercialValidationError(
    "Add-on pricing mode must be flat or per guest.",
  );
}

function normalizeCode(value: string, fieldName: string) {
  return requiredString(value, fieldName).toUpperCase().replace(/\s+/g, "_");
}

async function singleRecord<T>(
  promise: PromiseLike<{ data: T | null; error: unknown }>,
  name: string,
) {
  const { data, error } = await promise;

  if (error) {
    throw error;
  }

  if (!data) {
    throw new CommercialValidationError(`${name} was not found.`);
  }

  return data;
}

async function listRows<T>(
  promise: PromiseLike<{ data: T[] | null; error: unknown }>,
) {
  const { data, error } = await promise;

  if (error) {
    throw error;
  }

  return data ?? [];
}

function parseBalanceSnapshot(value: unknown): PaymentBalanceSnapshot {
  const snapshot = value as Record<string, unknown>;

  return {
    activeExceptionId:
      typeof snapshot.activeExceptionId === "string"
        ? snapshot.activeExceptionId
        : null,
    addendumAmountCents: Number(snapshot.addendumAmountCents ?? 0),
    balanceDueCents: Number(snapshot.balanceDueCents ?? 0),
    confirmedPaidAmountCents: Number(snapshot.confirmedPaidAmountCents ?? 0),
    contractAmountCents: Number(snapshot.contractAmountCents ?? 0),
    contractId:
      typeof snapshot.contractId === "string" ? snapshot.contractId : null,
    contractStatus:
      typeof snapshot.contractStatus === "string"
        ? (snapshot.contractStatus as ContractStatus)
        : null,
    expectedAmountCents: Number(snapshot.expectedAmountCents ?? 0),
    gateReason:
      typeof snapshot.gateReason === "string" ? snapshot.gateReason : undefined,
    gateStatus:
      typeof snapshot.gateStatus === "string"
        ? (snapshot.gateStatus as PaymentGateStatus)
        : undefined,
    hasActiveException: Boolean(snapshot.hasActiveException),
    isFullyPaid: Boolean(snapshot.isFullyPaid),
  };
}

async function getPricingContext(supabase: SupabaseClient, projectId: string) {
  const [project, events, selections, packages, addons, gestures] =
    await Promise.all([
      singleRecord<CommercialProjectRow>(
        supabase
          .from("wedding_projects")
          .select(
            "id, project_code, bride_name, groom_name, preferred_language, guest_list_access_status, guest_page_access_status, latest_contract_id",
          )
          .eq("id", projectId)
          .maybeSingle(),
        "Project",
      ),
      listRows<CommercialEventRow>(
        supabase
          .from("events")
          .select("id, project_id, name, event_date")
          .eq("project_id", projectId)
          .order("event_date", { ascending: true }),
      ),
      listRows<EventPackageSelectionRow>(
        supabase
          .from("project_event_package_selections")
          .select("*")
          .eq("project_id", projectId)
          .eq("status", "selected"),
      ),
      listRows<ServicePackageRow>(
        supabase
          .from("service_packages")
          .select("*")
          .order("package_code", { ascending: true }),
      ),
      listRows<ServicePackageAddonRow>(
        supabase
          .from("service_package_addons")
          .select("*")
          .order("addon_code", { ascending: true }),
      ),
      listRows<CommercialGestureRow>(
        supabase
          .from("commercial_gestures")
          .select("*")
          .eq("project_id", projectId)
          .eq("status", "active"),
      ),
    ]);

  return { addons, events, gestures, packages, project, selections };
}

async function getProjectOverviewContext(
  supabase: SupabaseClient,
  projectId: string,
  includeSelections = true,
) {
  const [project, events, selections] = await Promise.all([
    singleRecord<CommercialProjectRow>(
      supabase
        .from("wedding_projects")
        .select(
          "id, project_code, bride_name, groom_name, preferred_language, guest_list_access_status, guest_page_access_status, latest_contract_id",
        )
        .eq("id", projectId)
        .maybeSingle(),
      "Project",
    ),
    listRows<CommercialEventRow>(
      supabase
        .from("events")
        .select("id, project_id, name, event_date")
        .eq("project_id", projectId)
        .order("event_date", { ascending: true }),
    ),
    includeSelections
      ? listRows<EventPackageSelectionRow>(
          supabase
            .from("project_event_package_selections")
            .select("*")
            .eq("project_id", projectId)
            .eq("status", "selected"),
        )
      : Promise.resolve([]),
  ]);

  return { events, project, selections };
}

function buildPricingFromRows(
  input: Awaited<ReturnType<typeof getPricingContext>>,
) {
  if (input.selections.length === 0) {
    return null;
  }

  const eventsById = new Map(input.events.map((event) => [event.id, event]));
  const packagesById = new Map(input.packages.map((item) => [item.id, item]));
  const addonsById = new Map(input.addons.map((addon) => [addon.id, addon]));
  const eventSelections: EventPackagePricingInput[] = input.selections.map(
    (selection) => {
      const event = eventsById.get(selection.event_id);
      const servicePackage = packagesById.get(selection.service_package_id);

      if (!event || !servicePackage) {
        throw new CommercialValidationError(
          "Event package selection references missing catalog data.",
        );
      }

      return {
        addons: selection.selected_addon_ids.map((addonId) => {
          const addon = addonsById.get(addonId);

          if (!addon) {
            throw new CommercialValidationError(
              "Event package selection references missing add-on data.",
            );
          }

          return toAddon(addon);
        }),
        eventId: event.id,
        eventName: event.name,
        plannedGuestCount: selection.planned_guest_count,
        servicePackage: toServicePackage(servicePackage),
      };
    },
  );

  return calculateProjectPricing({
    eventSelections,
    gestures: input.gestures.map(toCommercialGesture),
  });
}

async function getCurrentPricingCalculation(
  supabase: SupabaseClient,
  projectId: string,
) {
  const rows = await listRows<PricingCalculationRow>(
    supabase
      .from("pricing_calculations")
      .select("*")
      .eq("project_id", projectId)
      .in("status", ["current", "snapshotted"])
      .order("calculated_at", { ascending: false })
      .limit(1),
  );
  const row = rows[0];

  if (!row) {
    return null;
  }

  return {
    currency: row.currency,
    discountAmountCents: row.discount_amount_cents,
    eventBreakdown:
      row.event_breakdown as ProjectPricingCalculation["eventBreakdown"],
    plannedGuestCountSnapshot: row.planned_guest_count_snapshot,
    subtotalAmountCents: row.subtotal_amount_cents,
    totalAmountCents: row.total_amount_cents,
  };
}

export async function listServicePackages(supabase: SupabaseClient) {
  return listRows<ServicePackageRow>(
    supabase
      .from("service_packages")
      .select("*")
      .order("package_code", { ascending: true }),
  );
}

export async function listServicePackageAddons(supabase: SupabaseClient) {
  return listRows<ServicePackageAddonRow>(
    supabase
      .from("service_package_addons")
      .select("*")
      .order("addon_code", { ascending: true }),
  );
}

export async function createServicePackage(
  supabase: SupabaseClient,
  payload: Record<string, unknown>,
  actorUserId: string,
) {
  const { data, error } = await supabase
    .from("service_packages")
    .insert({
      base_price_cents: positiveInteger(payload.basePriceCents, "base price"),
      created_by: actorUserId,
      description: optionalString(payload.description),
      included_guest_count: nonNegativeInteger(
        payload.includedGuestCount ?? 0,
        "included guest count",
      ),
      name: requiredString(payload.name, "package name"),
      package_code: normalizeCode(
        requiredString(payload.packageCode, "package code"),
        "package code",
      ),
      price_per_additional_guest_cents: nonNegativeInteger(
        payload.pricePerAdditionalGuestCents ?? 0,
        "additional guest price",
      ),
      pricing_mode: parsePricingMode(payload.pricingMode),
      status: "active",
      updated_by: actorUserId,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as ServicePackageRow;
}

export async function createServicePackageAddon(
  supabase: SupabaseClient,
  payload: Record<string, unknown>,
  actorUserId: string,
) {
  const { data, error } = await supabase
    .from("service_package_addons")
    .insert({
      addon_code: normalizeCode(
        requiredString(payload.addonCode, "add-on code"),
        "add-on code",
      ),
      created_by: actorUserId,
      description: optionalString(payload.description),
      name: requiredString(payload.name, "add-on name"),
      price_cents: positiveInteger(payload.priceCents, "add-on price"),
      pricing_mode: parseAddonPricingMode(payload.pricingMode),
      status: "active",
      updated_by: actorUserId,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as ServicePackageAddonRow;
}

export async function saveEventPackageSelection(
  supabase: SupabaseClient,
  projectId: string,
  payload: Record<string, unknown>,
  actorUserId: string,
) {
  const eventId = requiredString(payload.eventId, "event");
  const packageId = requiredString(payload.servicePackageId, "service package");
  const addonIds = Array.isArray(payload.addonIds)
    ? payload.addonIds.filter(
        (value): value is string => typeof value === "string",
      )
    : [];
  const plannedGuestCount = nonNegativeInteger(
    payload.plannedGuestCount,
    "planned guest count",
  );
  const [event, servicePackage, addons] = await Promise.all([
    singleRecord<CommercialEventRow>(
      supabase
        .from("events")
        .select("id, project_id, name, event_date")
        .eq("project_id", projectId)
        .eq("id", eventId)
        .maybeSingle(),
      "Event",
    ),
    singleRecord<ServicePackageRow>(
      supabase
        .from("service_packages")
        .select("*")
        .eq("id", packageId)
        .maybeSingle(),
      "Service package",
    ),
    addonIds.length > 0
      ? listRows<ServicePackageAddonRow>(
          supabase
            .from("service_package_addons")
            .select("*")
            .in("id", addonIds)
            .eq("status", "active"),
        )
      : Promise.resolve([]),
  ]);

  if (addons.length !== addonIds.length) {
    throw new CommercialValidationError(
      "One or more selected add-ons were not found.",
    );
  }

  const calculation = calculateEventPackageAmount({
    addons: addons.map(toAddon),
    eventId: event.id,
    eventName: event.name,
    plannedGuestCount,
    servicePackage: toServicePackage(servicePackage),
  });

  const supersedeResult = await supabase
    .from("project_event_package_selections")
    .update({ status: "superseded" })
    .eq("project_id", projectId)
    .eq("event_id", eventId)
    .eq("status", "selected");

  if (supersedeResult.error) {
    throw supersedeResult.error;
  }

  const { data, error } = await supabase
    .from("project_event_package_selections")
    .insert({
      calculated_amount_cents: calculation.totalAmountCents,
      event_id: eventId,
      planned_guest_count: plannedGuestCount,
      project_id: projectId,
      selected_addon_ids: addonIds,
      selected_addons_snapshot: calculation.addonSnapshot,
      selected_by: actorUserId,
      service_package_id: packageId,
      status: "selected",
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as EventPackageSelectionRow;
}

export async function calculateAndStoreProjectPricing(
  supabase: SupabaseClient,
  projectId: string,
  actorUserId: string,
) {
  const context = await getPricingContext(supabase, projectId);
  const pricing = buildPricingFromRows(context);

  if (!pricing) {
    throw new CommercialValidationError(
      "At least one event package selection is required before pricing.",
    );
  }

  const { data, error } = await supabase
    .from("pricing_calculations")
    .insert({
      calculated_by: actorUserId,
      currency: "USD",
      discount_amount_cents: pricing.discountAmountCents,
      event_breakdown: pricing.eventBreakdown,
      planned_guest_count_snapshot: pricing.plannedGuestCountSnapshot,
      project_id: projectId,
      status: "current",
      subtotal_amount_cents: pricing.subtotalAmountCents,
      total_amount_cents: pricing.totalAmountCents,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return {
    pricing,
    row: data as PricingCalculationRow,
  };
}

export async function generateProjectCommercialContract(
  supabase: SupabaseClient,
  projectId: string,
  actorUserId: string,
) {
  const context = await getPricingContext(supabase, projectId);
  const pricing = buildPricingFromRows(context);

  if (!pricing) {
    throw new CommercialValidationError(
      "Select at least one event package before generating a contract.",
    );
  }

  const { data: latestContracts, error: latestError } = await supabase
    .from("contracts")
    .select("version")
    .eq("project_id", projectId)
    .order("version", { ascending: false })
    .limit(1);

  if (latestError) {
    throw latestError;
  }

  const latestVersion =
    (latestContracts?.[0] as { version?: number } | undefined)?.version ?? 0;
  const contract = generateProjectContract({
    brideName: context.project.bride_name,
    generatedAt: new Date().toISOString(),
    groomName: context.project.groom_name,
    pricing,
    projectCode: context.project.project_code,
    projectId,
    version: latestVersion + 1,
  });

  const supersedeResult = await supabase
    .from("contracts")
    .update({ is_latest: false })
    .eq("project_id", projectId)
    .eq("is_latest", true);

  if (supersedeResult.error) {
    throw supersedeResult.error;
  }

  const { data, error } = await supabase
    .from("contracts")
    .insert({
      contract_number: contract.contractNumber,
      currency: "USD",
      discount_amount_cents: contract.pricingSnapshot.discountAmountCents,
      final_amount_cents: contract.finalAmountCents,
      generated_by: actorUserId,
      is_latest: true,
      package_snapshot: contract.packageSnapshot,
      planned_guest_count_snapshot: contract.plannedGuestCountSnapshot,
      pricing_snapshot: contract.pricingSnapshot,
      project_id: projectId,
      rendered_contract: contract.renderedContract,
      status: "generated",
      structured_data: {
        requirementIds: ["PAY-001", "PAY-002", "PAY-003", "PAY-004"],
      },
      subtotal_amount_cents: contract.pricingSnapshot.subtotalAmountCents,
      version: contract.version,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  const updateProject = await supabase
    .from("wedding_projects")
    .update({ latest_contract_id: (data as ContractRow).id })
    .eq("id", projectId);

  if (updateProject.error) {
    throw updateProject.error;
  }

  await calculateAndStoreProjectPricing(supabase, projectId, actorUserId);

  return data as ContractRow;
}

export async function approveProjectCommercialContract(
  supabase: SupabaseClient,
  contractId: string,
  confirmationText: string,
  checked: boolean,
) {
  const { data, error } = await supabase.rpc("approve_project_contract", {
    p_checked: checked,
    p_confirmation_text: confirmationText,
    p_contract_id: contractId,
  });

  if (error) {
    throw error;
  }

  return data as ContractRow;
}

export async function getProjectPaymentBalance(
  supabase: SupabaseClient,
  projectId: string,
) {
  const { data, error } = await supabase.rpc("get_project_payment_balance", {
    p_project_id: projectId,
  });

  if (error) {
    throw error;
  }

  return parseBalanceSnapshot(data);
}

export async function refreshProjectPaymentGate(
  supabase: SupabaseClient,
  projectId: string,
) {
  const { data, error } = await supabase.rpc("refresh_project_payment_gate", {
    p_project_id: projectId,
  });

  if (error) {
    throw error;
  }

  return parseBalanceSnapshot(data);
}

export async function recordProjectPayment(
  supabase: SupabaseClient,
  projectId: string,
  payload: Record<string, unknown>,
  actorUserId: string,
) {
  const shouldConfirm = payload.status === "confirmed";
  const { data, error } = await supabase
    .from("payments")
    .insert({
      confirmed_at: null,
      confirmed_by: null,
      contract_id: optionalString(payload.contractId),
      currency: "USD",
      expected_amount_cents: nonNegativeInteger(
        payload.expectedAmountCents ?? 0,
        "expected amount",
      ),
      paid_amount_cents: positiveInteger(
        payload.paidAmountCents,
        "paid amount",
      ),
      payment_date:
        optionalString(payload.paymentDate) ??
        new Date().toISOString().slice(0, 10),
      payment_method: requiredString(payload.paymentMethod, "payment method"),
      project_id: projectId,
      reference_note: optionalString(payload.referenceNote),
      recorded_by: actorUserId,
      status: "recorded",
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  if (shouldConfirm) {
    return confirmProjectPayment(
      supabase,
      projectId,
      (data as PaymentRow).id,
      actorUserId,
    );
  }

  return data as PaymentRow;
}

export async function confirmProjectPayment(
  supabase: SupabaseClient,
  projectId: string,
  paymentId: string,
  actorUserId: string,
) {
  const { data, error } = await supabase
    .from("payments")
    .update({
      confirmed_at: new Date().toISOString(),
      confirmed_by: actorUserId,
      status: "confirmed",
    })
    .eq("project_id", projectId)
    .eq("id", paymentId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await refreshProjectPaymentGate(supabase, projectId);

  return data as PaymentRow;
}

export async function createProjectPaymentException(
  supabase: SupabaseClient,
  projectId: string,
  payload: Record<string, unknown>,
  actorUserId: string,
) {
  const reason = requiredString(payload.reason, "payment exception reason");
  validatePaymentExceptionReason(reason);
  const balance = await getProjectPaymentBalance(supabase, projectId);
  const { data, error } = await supabase
    .from("payment_exceptions")
    .insert({
      amount_paid_at_approval_cents: balance.confirmedPaidAmountCents,
      approved_by: actorUserId,
      conditions: optionalString(payload.conditions),
      contract_id: balance.contractId,
      expires_at: optionalString(payload.expiresAt),
      project_id: projectId,
      reason,
      remaining_balance_cents: balance.balanceDueCents,
      status: "active",
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await refreshProjectPaymentGate(supabase, projectId);

  return data as PaymentExceptionRow;
}

export async function applyCommercialGesture(
  supabase: SupabaseClient,
  projectId: string,
  payload: Record<string, unknown>,
  actorUserId: string,
) {
  const gestureType =
    payload.gestureType === "percentage" ? "percentage" : "fixed_amount";
  const amountCents =
    gestureType === "fixed_amount"
      ? positiveInteger(payload.amountCents, "discount amount")
      : null;
  const percentageBps =
    gestureType === "percentage"
      ? positiveInteger(payload.percentageBps, "discount percentage")
      : null;
  const reason = requiredString(payload.reason, "commercial gesture reason");

  validateCommercialGesture({
    amountCents,
    gestureType,
    percentageBps,
    reason,
  });

  const { data, error } = await supabase
    .from("commercial_gestures")
    .insert({
      amount_cents: amountCents,
      applied_by: actorUserId,
      gesture_type: gestureType,
      percentage_bps: percentageBps,
      project_id: projectId,
      reason,
      status: "active",
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as CommercialGestureRow;
}

export async function createContractAddendum(
  supabase: SupabaseClient,
  projectId: string,
  payload: Record<string, unknown>,
  actorUserId: string,
) {
  const contractId = requiredString(payload.contractId, "contract");
  const reason = requiredString(payload.reason, "addendum reason");
  const additionalAmountCents = positiveInteger(
    payload.additionalAmountCents,
    "additional amount",
  );
  const { data: existingRows, error: existingError } = await supabase
    .from("contract_addendums")
    .select("id")
    .eq("project_id", projectId);

  if (existingError) {
    throw existingError;
  }

  const addendumNumber = `${requiredString(payload.projectCode, "project code")}-ADD-${String((existingRows?.length ?? 0) + 1).padStart(2, "0")}`;
  const { data, error } = await supabase
    .from("contract_addendums")
    .insert({
      additional_amount_cents: additionalAmountCents,
      addendum_number: addendumNumber,
      contract_id: contractId,
      generated_by: actorUserId,
      new_value_snapshot: {
        additionalAmountCents,
        reason,
      },
      old_value_snapshot: {},
      project_id: projectId,
      reason,
      status: "generated",
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as ContractAddendumRow;
}

export async function getProjectCommercialOverview(
  supabase: SupabaseClient,
  projectId: string,
  access?: CommercialOverviewAccess,
): Promise<ProjectCommercialOverview> {
  const overviewAccess = normalizeOverviewAccess(access);
  const canReadSelections =
    overviewAccess.canReadContracts || overviewAccess.canReadPricing;
  const context = await getProjectOverviewContext(
    supabase,
    projectId,
    canReadSelections,
  );
  const canReadPackages =
    overviewAccess.canReadPackages || overviewAccess.canManagePackages;
  const canReadExceptions = overviewAccess.canManageExceptions;
  const canReadGestures =
    overviewAccess.canManageGestures || overviewAccess.canReadRevenue;
  const canReadPaymentDetails = overviewAccess.canReadPayments;
  const canReadPaymentSummary =
    overviewAccess.canReadPaymentSummary ||
    overviewAccess.canReadPayments ||
    overviewAccess.canReadContracts;
  const [
    packages,
    addons,
    gestures,
    contracts,
    addendums,
    payments,
    exceptions,
    gateEvents,
    storedPricing,
  ] = await Promise.all([
    canReadPackages
      ? listRows<ServicePackageRow>(
          supabase
            .from("service_packages")
            .select("*")
            .order("package_code", { ascending: true }),
        )
      : Promise.resolve([]),
    canReadPackages
      ? listRows<ServicePackageAddonRow>(
          supabase
            .from("service_package_addons")
            .select("*")
            .order("addon_code", { ascending: true }),
        )
      : Promise.resolve([]),
    canReadGestures
      ? listRows<CommercialGestureRow>(
          supabase
            .from("commercial_gestures")
            .select("*")
            .eq("project_id", projectId)
            .eq("status", "active"),
        )
      : Promise.resolve([]),
    overviewAccess.canReadContracts
      ? listRows<ContractRow>(
          supabase
            .from("contracts")
            .select("*")
            .eq("project_id", projectId)
            .order("version", { ascending: false }),
        )
      : Promise.resolve([]),
    overviewAccess.canReadContracts
      ? listRows<ContractAddendumRow>(
          supabase
            .from("contract_addendums")
            .select("*")
            .eq("project_id", projectId)
            .order("generated_at", { ascending: false }),
        )
      : Promise.resolve([]),
    canReadPaymentDetails
      ? listRows<PaymentRow>(
          supabase
            .from("payments")
            .select("*")
            .eq("project_id", projectId)
            .order("payment_date", { ascending: false }),
        )
      : Promise.resolve([]),
    canReadExceptions
      ? listRows<PaymentExceptionRow>(
          supabase
            .from("payment_exceptions")
            .select("*")
            .eq("project_id", projectId)
            .order("created_at", { ascending: false }),
        )
      : Promise.resolve([]),
    canReadPaymentDetails
      ? listRows<PaymentGateEventRow>(
          supabase
            .from("payment_gate_events")
            .select("*")
            .eq("project_id", projectId)
            .order("created_at", { ascending: false })
            .limit(12),
        )
      : Promise.resolve([]),
    canReadSelections
      ? getCurrentPricingCalculation(supabase, projectId)
      : Promise.resolve(null),
  ]);
  let balance: PaymentBalanceSnapshot | null = null;
  let pricing: ProjectPricingCalculation | null = storedPricing;

  if (canReadPaymentSummary) {
    try {
      balance = await getProjectPaymentBalance(supabase, projectId);
    } catch (error) {
      serverLogger.error("Failed to load project commercial payment balance.", {
        alertKey: "commercial_overview_payment_balance_fallback",
        error,
        fallback: "balance_null",
        operation: "getProjectPaymentBalance",
        projectId,
      });
      balance = null;
    }
  }

  if (canReadPackages && canReadSelections) {
    try {
      pricing = buildPricingFromRows({
        ...context,
        addons,
        gestures,
        packages,
      });
    } catch (error) {
      serverLogger.error("Failed to build project commercial pricing.", {
        alertKey: "commercial_overview_pricing_fallback",
        error,
        fallback: "stored_pricing",
        operation: "buildPricingFromRows",
        projectId,
      });
      pricing = storedPricing;
    }
  }
  pricing = redactCommercialGesturePricing(pricing, canReadGestures);

  return {
    addendums,
    addons,
    balance,
    contracts,
    events: context.events,
    exceptions,
    gateEvents,
    gestures,
    packages,
    payments,
    pricing,
    project: context.project,
    selections: context.selections,
  };
}
