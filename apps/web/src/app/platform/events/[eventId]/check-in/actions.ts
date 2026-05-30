"use server";

import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/auth-service";
import {
  createCheckInToken,
  createPreloadSnapshot,
  createUnexpectedGuestRequest,
  performGuestCheckIn,
  resolveCheckInToken,
  reviewUnexpectedGuestRequest,
  submitOfflineSyncBatch,
  upsertCheckInDevice,
  upsertCheckInSettings,
} from "@/lib/check-in/check-in-db";
import { CheckInValidationError } from "@/lib/check-in/check-in-service";
import {
  ProjectAccessError,
  requireEventPermission,
} from "@/lib/projects/project-api";
import type { PermissionSlug } from "@/lib/security/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);

  if (value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new CheckInValidationError(`${key} must be a text value.`);
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function numberValue(formData: FormData, key: string) {
  const value = formValue(formData, key);

  if (value === undefined) {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new CheckInValidationError(`${key} must be a number.`);
  }

  return parsed;
}

function booleanValue(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function requiredFormValue(formData: FormData, key: string) {
  const value = formValue(formData, key);

  if (value === undefined) {
    throw new CheckInValidationError(`${key} is required.`);
  }

  return value;
}

function checkInPath(eventId: string, params: Record<string, string>) {
  const searchParams = new URLSearchParams(params);

  return `/platform/events/${eventId}/check-in?${searchParams.toString()}`;
}

function scanPath(eventId: string, params: Record<string, string>) {
  const searchParams = new URLSearchParams(params);

  return `/platform/events/${eventId}/check-in/scan?${searchParams.toString()}`;
}

async function getActionContext(eventId: string, permission: PermissionSlug) {
  const authContext = await getAuthContext();

  if (authContext.status === "anonymous") {
    throw new ProjectAccessError("Authentication is required.", 401);
  }

  if (authContext.status === "not_configured") {
    throw new ProjectAccessError("Supabase is not configured.", 503);
  }

  const context = {
    supabase: await createSupabaseServerClient(),
    user: authContext.user,
  };

  await requireEventPermission(context, eventId, permission);

  return context;
}

function checkInError(error: unknown, fallback: string) {
  return error instanceof CheckInValidationError ? error.message : fallback;
}

export async function updateCheckInSettingsAction(
  eventId: string,
  formData: FormData,
) {
  try {
    const context = await getActionContext(eventId, "check_in.settings.manage");

    await upsertCheckInSettings(
      context.supabase,
      eventId,
      {
        allowedMethods: formData.getAll("allowedMethods"),
        enabled: booleanValue(formData, "enabled"),
        endsAt: formValue(formData, "endsAt"),
        offlinePreloadEnabled: booleanValue(formData, "offlinePreloadEnabled"),
        startsAt: formValue(formData, "startsAt"),
        status: formValue(formData, "status"),
        supervisorApprovalRequired: booleanValue(
          formData,
          "supervisorApprovalRequired",
        ),
        timezone: formValue(formData, "timezone"),
        unexpectedGuestMode: formValue(formData, "unexpectedGuestMode"),
      },
      context.user.id,
    );
  } catch (error) {
    redirect(
      checkInPath(eventId, {
        checkInError: checkInError(
          error,
          "Unable to update check-in settings.",
        ),
      }),
    );
  }

  redirect(checkInPath(eventId, { checkInStatus: "settings_updated" }));
}

export async function upsertCheckInDeviceAction(
  eventId: string,
  formData: FormData,
) {
  try {
    const context = await getActionContext(eventId, "check_in.devices.manage");

    await upsertCheckInDevice(
      context.supabase,
      eventId,
      {
        assignedStaffUserId: formValue(formData, "assignedStaffUserId"),
        deviceId: formValue(formData, "deviceId"),
        deviceLabel: formValue(formData, "deviceLabel"),
        mode: formValue(formData, "mode"),
        preloadStatus: formValue(formData, "preloadStatus"),
        stationName: formValue(formData, "stationName"),
        status: formValue(formData, "status"),
        syncStatus: formValue(formData, "syncStatus"),
      },
      context.user.id,
    );
  } catch (error) {
    redirect(
      checkInPath(eventId, {
        checkInError: checkInError(error, "Unable to save check-in device."),
      }),
    );
  }

  redirect(checkInPath(eventId, { checkInStatus: "device_saved" }));
}

export async function createCheckInTokenAction(
  eventId: string,
  formData: FormData,
) {
  let createdTokenPreview = "";

  try {
    const context = await getActionContext(eventId, "check_in.tokens.manage");
    const token = await createCheckInToken(
      context.supabase,
      eventId,
      requiredFormValue(formData, "guestId"),
      formValue(formData, "invitationId"),
    );
    createdTokenPreview = token?.token_preview ?? "";
  } catch (error) {
    redirect(
      checkInPath(eventId, {
        checkInError: checkInError(error, "Unable to create check-in token."),
      }),
    );
  }

  redirect(
    checkInPath(eventId, {
      checkInStatus: "token_created",
      tokenPreview: createdTokenPreview,
    }),
  );
}

export async function performManualCheckInAction(
  eventId: string,
  guestId: string,
  formData: FormData,
) {
  try {
    const context = await getActionContext(eventId, "check_in.perform");

    await performGuestCheckIn(context.supabase, eventId, {
      arrivalCount: numberValue(formData, "arrivalCount") ?? 1,
      deviceId: formValue(formData, "deviceId"),
      guestId,
      invitationId: formValue(formData, "invitationId"),
      method: formValue(formData, "method") ?? "manual_name_search",
      notes: formValue(formData, "notes"),
      supervisorOverride: booleanValue(formData, "supervisorOverride"),
    });
  } catch (error) {
    redirect(
      checkInPath(eventId, {
        checkInError: checkInError(error, "Unable to check in guest."),
      }),
    );
  }

  redirect(checkInPath(eventId, { checkInStatus: "guest_checked_in" }));
}

export async function resolveTokenForScanAction(
  eventId: string,
  formData: FormData,
) {
  const token = requiredFormValue(formData, "token");
  redirect(scanPath(eventId, { token }));
}

export async function checkInByTokenAction(
  eventId: string,
  formData: FormData,
) {
  try {
    const context = await getActionContext(eventId, "check_in.perform");
    const tokenValue = requiredFormValue(formData, "token");
    const resolved = await resolveCheckInToken(
      context.supabase,
      eventId,
      tokenValue,
    );

    if (resolved.status !== "ok" || typeof resolved.guestId !== "string") {
      throw new CheckInValidationError("Check-in token could not be resolved.");
    }

    await performGuestCheckIn(context.supabase, eventId, {
      arrivalCount: numberValue(formData, "arrivalCount") ?? 1,
      deviceId: formValue(formData, "deviceId"),
      guestId: resolved.guestId,
      invitationId:
        typeof resolved.invitationId === "string"
          ? resolved.invitationId
          : undefined,
      method: "qr_scan",
      tokenId:
        typeof resolved.tokenId === "string" ? resolved.tokenId : undefined,
    });
  } catch (error) {
    redirect(
      scanPath(eventId, {
        scanError: checkInError(error, "Unable to check in scanned guest."),
      }),
    );
  }

  redirect(checkInPath(eventId, { checkInStatus: "guest_checked_in" }));
}

export async function createUnexpectedGuestRequestAction(
  eventId: string,
  formData: FormData,
) {
  try {
    const context = await getActionContext(
      eventId,
      "check_in.unexpected_guests.create",
    );

    await createUnexpectedGuestRequest(
      context.supabase,
      eventId,
      {
        deviceId: formValue(formData, "deviceId"),
        guestSide: formValue(formData, "guestSide"),
        reason: formValue(formData, "reason"),
        requestedName: formValue(formData, "requestedName"),
      },
      context.user.id,
    );
  } catch (error) {
    redirect(
      checkInPath(eventId, {
        checkInError: checkInError(
          error,
          "Unable to create unexpected guest request.",
        ),
      }),
    );
  }

  redirect(
    checkInPath(eventId, { checkInStatus: "unexpected_request_created" }),
  );
}

export async function reviewUnexpectedGuestRequestAction(
  eventId: string,
  requestId: string,
  status: "approved" | "manual_approved" | "rejected",
  formData: FormData,
) {
  try {
    const context = await getActionContext(
      eventId,
      "check_in.unexpected_guests.review",
    );

    await reviewUnexpectedGuestRequest(context.supabase, {
      approvalMode: formValue(formData, "approvalMode") ?? "in_app",
      approvedArrivalCount: numberValue(formData, "approvedArrivalCount"),
      decisionReason: formValue(formData, "decisionReason"),
      requestId,
      status,
    });
  } catch (error) {
    redirect(
      checkInPath(eventId, {
        checkInError: checkInError(
          error,
          "Unable to review unexpected guest request.",
        ),
      }),
    );
  }

  redirect(checkInPath(eventId, { checkInStatus: "unexpected_reviewed" }));
}

export async function createPreloadSnapshotAction(
  eventId: string,
  formData: FormData,
) {
  try {
    const context = await getActionContext(eventId, "check_in.offline_sync");

    await createPreloadSnapshot(
      context.supabase,
      eventId,
      {
        deviceId: formValue(formData, "deviceId"),
        expiresAt: formValue(formData, "expiresAt"),
      },
      context.user.id,
    );
  } catch (error) {
    redirect(
      checkInPath(eventId, {
        checkInError: checkInError(error, "Unable to create preload snapshot."),
      }),
    );
  }

  redirect(checkInPath(eventId, { checkInStatus: "preload_created" }));
}

export async function submitOfflineSyncBatchAction(
  eventId: string,
  formData: FormData,
) {
  try {
    const context = await getActionContext(eventId, "check_in.offline_sync");
    const guestId = requiredFormValue(formData, "guestId");

    await submitOfflineSyncBatch(
      context.supabase,
      eventId,
      {
        deviceId: formValue(formData, "deviceId"),
        offlineRecords: [
          {
            arrivedAt:
              formValue(formData, "arrivedAt") ?? new Date().toISOString(),
            arrivalCount: numberValue(formData, "arrivalCount") ?? 1,
            eventId,
            guestId,
            offlineRecordId:
              formValue(formData, "offlineRecordId") ?? `offline-${Date.now()}`,
          },
        ],
      },
      context.user.id,
    );
  } catch (error) {
    redirect(
      checkInPath(eventId, {
        checkInError: checkInError(error, "Unable to submit offline sync."),
      }),
    );
  }

  redirect(checkInPath(eventId, { checkInStatus: "offline_sync_submitted" }));
}
