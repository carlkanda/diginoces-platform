import type { SupabaseClient } from "@supabase/supabase-js";
import {
  jsonError,
  ProjectAccessError,
  requireGlobalPermission,
  requireProjectPermission,
  type ProjectApiContext,
} from "@/lib/projects/project-api";
import { CommercialValidationError } from "@/lib/contracts/contract-service";
import type { PermissionSlug } from "@/lib/security/permissions";

export async function hasCommercialProjectPermission(
  context: ProjectApiContext,
  projectId: string,
  permission: PermissionSlug,
) {
  const { data, error } = await context.supabase.rpc(
    "current_user_can_access_project",
    {
      p_permission: permission,
      p_project_id: projectId,
    },
  );

  if (error) {
    throw error;
  }

  return Boolean(data);
}

export async function hasCommercialGlobalPermission(
  context: ProjectApiContext,
  permission: PermissionSlug,
) {
  const { data, error } = await context.supabase.rpc(
    "current_user_has_permission",
    {
      p_permission: permission,
      p_scope: "global",
    },
  );

  if (error) {
    throw error;
  }

  return Boolean(data);
}

export async function requirePackageManagePermission(
  context: ProjectApiContext,
) {
  await requireGlobalPermission(context, "service_packages.manage");
}

export async function requirePackageReadPermission(context: ProjectApiContext) {
  const canRead =
    (await hasCommercialGlobalPermission(context, "service_packages.read")) ||
    (await hasCommercialGlobalPermission(context, "service_packages.manage"));

  if (!canRead) {
    throw new ProjectAccessError("Service package access denied.", 403);
  }
}

export async function requireCommercialProjectPermission(
  context: ProjectApiContext,
  projectId: string,
  permission: PermissionSlug,
) {
  await requireProjectPermission(context, projectId, permission);
}

export async function hasAnyCommercialReadPermission(
  context: ProjectApiContext,
  projectId: string,
) {
  const { data, error } = await (context.supabase as SupabaseClient).rpc(
    "current_user_has_any_commercial_read",
    {
      p_project_id: projectId,
    },
  );

  if (error) {
    throw error;
  }

  return Boolean(data);
}

export async function requireAnyCommercialReadPermission(
  context: ProjectApiContext,
  projectId: string,
) {
  const canRead = await hasAnyCommercialReadPermission(context, projectId);

  if (!canRead) {
    throw new ProjectAccessError("Commercial access denied.", 403);
  }
}

export async function getCommercialActionCapabilities(
  context: ProjectApiContext,
  projectId: string,
) {
  const [
    canManagePackages,
    canReadPackagesGlobal,
    canReadPricing,
    canManagePricing,
    canCalculatePricing,
    canReadContracts,
    canGenerateContracts,
    canApproveContracts,
    canManageAddendums,
    canReadPaymentSummary,
    canReadPayments,
    canRecordPayments,
    canConfirmPayments,
    canManageExceptions,
    canManageGestures,
    canReadRevenue,
  ] = await Promise.all([
    hasCommercialGlobalPermission(context, "service_packages.manage"),
    hasCommercialGlobalPermission(context, "service_packages.read"),
    hasCommercialProjectPermission(context, projectId, "pricing.read"),
    hasCommercialProjectPermission(context, projectId, "pricing.manage"),
    hasCommercialProjectPermission(context, projectId, "pricing.calculate"),
    hasCommercialProjectPermission(context, projectId, "contracts.read"),
    hasCommercialProjectPermission(context, projectId, "contracts.generate"),
    hasCommercialProjectPermission(context, projectId, "contracts.approve"),
    hasCommercialProjectPermission(
      context,
      projectId,
      "contracts.manage_addendums",
    ),
    hasCommercialProjectPermission(context, projectId, "payments.summary.read"),
    hasCommercialProjectPermission(context, projectId, "payments.read"),
    hasCommercialProjectPermission(context, projectId, "payments.record"),
    hasCommercialProjectPermission(context, projectId, "payments.confirm"),
    hasCommercialProjectPermission(
      context,
      projectId,
      "payment_exceptions.manage",
    ),
    hasCommercialProjectPermission(
      context,
      projectId,
      "commercial_gestures.manage",
    ),
    hasCommercialProjectPermission(context, projectId, "revenue.read"),
  ]);

  return {
    canApproveContracts,
    canCalculatePricing,
    canConfirmPayments,
    canGenerateContracts,
    canManageAddendums,
    canManageExceptions,
    canManageGestures,
    canManagePackages,
    canManagePricing,
    canReadContracts,
    canReadPackages: canReadPackagesGlobal || canManagePackages,
    canReadPayments,
    canReadPaymentSummary,
    canReadPricing,
    canReadRevenue,
    canRecordPayments,
  };
}

export function handleCommercialApiError(error: unknown) {
  if (error instanceof CommercialValidationError) {
    return jsonError(400, "invalid_commercial_request", error.message);
  }

  throw error;
}
