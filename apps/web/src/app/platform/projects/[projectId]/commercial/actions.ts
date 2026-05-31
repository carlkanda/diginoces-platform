"use server";

import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/auth-service";
import {
  requireCommercialProjectPermission,
  requirePackageManagePermission,
} from "@/lib/contracts/contract-api";
import {
  applyCommercialGesture,
  approveProjectCommercialContract,
  calculateAndStoreProjectPricing,
  confirmProjectPayment,
  createContractAddendum,
  createProjectPaymentException,
  createServicePackage,
  createServicePackageAddon,
  generateProjectCommercialContract,
  recordProjectPayment,
  saveEventPackageSelection,
} from "@/lib/contracts/contract-db";
import { CommercialValidationError } from "@/lib/contracts/contract-service";
import type { PermissionSlug } from "@/lib/security/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);

  if (value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new CommercialValidationError(`${key} must be a text value.`);
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function requiredFormValue(formData: FormData, key: string) {
  const value = formValue(formData, key);

  if (!value) {
    throw new CommercialValidationError(`${key} is required.`);
  }

  return value;
}

function formCheckbox(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function selectedAddonIds(formData: FormData) {
  return formData
    .getAll("addonIds")
    .filter((value): value is string => typeof value === "string");
}

function commercialPath(projectId: string, params: Record<string, string>) {
  const searchParams = new URLSearchParams(params);

  return `/platform/projects/${projectId}/commercial?${searchParams.toString()}`;
}

async function getActionContext(
  projectId: string,
  permission?: PermissionSlug,
) {
  const authContext = await getAuthContext();

  if (authContext.status === "anonymous") {
    throw new CommercialValidationError("Authentication is required.");
  }

  if (authContext.status === "not_configured") {
    throw new CommercialValidationError("Supabase is not configured.");
  }

  const context = {
    supabase: await createSupabaseServerClient(),
    user: authContext.user,
  };

  if (permission) {
    await requireCommercialProjectPermission(context, projectId, permission);
  }

  return context;
}

async function runCommercialAction(
  projectId: string,
  action: () => Promise<string>,
) {
  let status: string;

  try {
    status = await action();
  } catch (error) {
    redirect(
      commercialPath(projectId, {
        commercialError:
          error instanceof CommercialValidationError
            ? "invalid_commercial_request"
            : "commercial_action_failed",
      }),
    );
  }

  redirect(commercialPath(projectId, { commercialStatus: status }));
}

export async function createPackageAction(
  projectId: string,
  formData: FormData,
) {
  await runCommercialAction(projectId, async () => {
    const context = await getActionContext(projectId);

    await requirePackageManagePermission(context);
    await createServicePackage(
      context.supabase,
      {
        basePriceCents: requiredFormValue(formData, "basePriceCents"),
        description: formValue(formData, "description"),
        includedGuestCount: formValue(formData, "includedGuestCount") ?? "0",
        name: requiredFormValue(formData, "name"),
        packageCode: requiredFormValue(formData, "packageCode"),
        pricePerAdditionalGuestCents:
          formValue(formData, "pricePerAdditionalGuestCents") ?? "0",
        pricingMode: requiredFormValue(formData, "pricingMode"),
      },
      context.user.id,
    );

    return "package_created";
  });
}

export async function createAddonAction(projectId: string, formData: FormData) {
  await runCommercialAction(projectId, async () => {
    const context = await getActionContext(projectId);

    await requirePackageManagePermission(context);
    await createServicePackageAddon(
      context.supabase,
      {
        addonCode: requiredFormValue(formData, "addonCode"),
        description: formValue(formData, "description"),
        name: requiredFormValue(formData, "name"),
        priceCents: requiredFormValue(formData, "priceCents"),
        pricingMode: requiredFormValue(formData, "pricingMode"),
      },
      context.user.id,
    );

    return "addon_created";
  });
}

export async function selectEventPackageAction(
  projectId: string,
  formData: FormData,
) {
  await runCommercialAction(projectId, async () => {
    const context = await getActionContext(projectId, "pricing.manage");

    await saveEventPackageSelection(
      context.supabase,
      projectId,
      {
        addonIds: selectedAddonIds(formData),
        eventId: requiredFormValue(formData, "eventId"),
        plannedGuestCount: requiredFormValue(formData, "plannedGuestCount"),
        servicePackageId: requiredFormValue(formData, "servicePackageId"),
      },
      context.user.id,
    );

    return "event_package_selected";
  });
}

export async function calculatePricingAction(projectId: string) {
  await runCommercialAction(projectId, async () => {
    const context = await getActionContext(projectId, "pricing.calculate");

    await calculateAndStoreProjectPricing(
      context.supabase,
      projectId,
      context.user.id,
    );

    return "pricing_calculated";
  });
}

export async function generateContractAction(projectId: string) {
  await runCommercialAction(projectId, async () => {
    const context = await getActionContext(projectId, "contracts.generate");

    await generateProjectCommercialContract(
      context.supabase,
      projectId,
      context.user.id,
    );

    return "contract_generated";
  });
}

export async function approveContractAction(
  projectId: string,
  contractId: string,
  formData: FormData,
) {
  await runCommercialAction(projectId, async () => {
    const context = await getActionContext(projectId, "contracts.approve");

    await approveProjectCommercialContract(
      context.supabase,
      contractId,
      requiredFormValue(formData, "confirmationText"),
      formCheckbox(formData, "approvalChecked"),
    );

    return "contract_approved";
  });
}

export async function recordPaymentAction(
  projectId: string,
  formData: FormData,
) {
  await runCommercialAction(projectId, async () => {
    const confirmNow = formCheckbox(formData, "confirmNow");
    const context = await getActionContext(projectId, "payments.record");

    if (confirmNow) {
      await requireCommercialProjectPermission(
        context,
        projectId,
        "payments.confirm",
      );
    }

    await recordProjectPayment(
      context.supabase,
      projectId,
      {
        contractId: formValue(formData, "contractId"),
        expectedAmountCents: formValue(formData, "expectedAmountCents") ?? "0",
        paidAmountCents: requiredFormValue(formData, "paidAmountCents"),
        paymentDate: formValue(formData, "paymentDate"),
        paymentMethod: requiredFormValue(formData, "paymentMethod"),
        referenceNote: formValue(formData, "referenceNote"),
        status: confirmNow ? "confirmed" : "recorded",
      },
      context.user.id,
    );

    return "payment_recorded";
  });
}

export async function confirmPaymentAction(
  projectId: string,
  paymentId: string,
) {
  await runCommercialAction(projectId, async () => {
    const context = await getActionContext(projectId, "payments.confirm");

    await confirmProjectPayment(
      context.supabase,
      projectId,
      paymentId,
      context.user.id,
    );

    return "payment_confirmed";
  });
}

export async function createPaymentExceptionAction(
  projectId: string,
  formData: FormData,
) {
  await runCommercialAction(projectId, async () => {
    const context = await getActionContext(
      projectId,
      "payment_exceptions.manage",
    );

    await createProjectPaymentException(
      context.supabase,
      projectId,
      {
        conditions: formValue(formData, "conditions"),
        expiresAt: formValue(formData, "expiresAt"),
        reason: requiredFormValue(formData, "reason"),
      },
      context.user.id,
    );

    return "payment_exception_created";
  });
}

export async function applyCommercialGestureAction(
  projectId: string,
  formData: FormData,
) {
  await runCommercialAction(projectId, async () => {
    const context = await getActionContext(
      projectId,
      "commercial_gestures.manage",
    );

    await applyCommercialGesture(
      context.supabase,
      projectId,
      {
        amountCents: formValue(formData, "amountCents"),
        gestureType: requiredFormValue(formData, "gestureType"),
        percentageBps: formValue(formData, "percentageBps"),
        reason: requiredFormValue(formData, "reason"),
      },
      context.user.id,
    );

    return "commercial_gesture_applied";
  });
}

export async function createAddendumAction(
  projectId: string,
  formData: FormData,
) {
  await runCommercialAction(projectId, async () => {
    const context = await getActionContext(
      projectId,
      "contracts.manage_addendums",
    );

    await createContractAddendum(
      context.supabase,
      projectId,
      {
        additionalAmountCents: requiredFormValue(
          formData,
          "additionalAmountCents",
        ),
        contractId: requiredFormValue(formData, "contractId"),
        projectCode: requiredFormValue(formData, "projectCode"),
        reason: requiredFormValue(formData, "reason"),
      },
      context.user.id,
    );

    return "addendum_created";
  });
}
