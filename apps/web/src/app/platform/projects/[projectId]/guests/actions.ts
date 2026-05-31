"use server";

import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/auth-service";
import { requireGuestListContractGateOpen } from "@/lib/contracts/contract-gates";
import {
  requireGuestCreatePermission,
  requireGuestDeactivationPermission,
  requireGuestSidePermission,
} from "@/lib/guests/guest-api";
import {
  createGuest,
  getGuestDetails,
  guestUpdateRequiresDeactivationPermission,
  parseCreateGuestPayload,
  parseUpdateGuestPayload,
  updateGuest,
} from "@/lib/guests/guest-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getAll(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .map((value) => String(value))
    .filter(Boolean);
}

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);

  if (value === null) {
    return undefined;
  }

  const normalized = String(value);
  return normalized.length > 0 ? normalized : undefined;
}

async function getActionContext() {
  const authContext = await getAuthContext();

  if (authContext.status === "anonymous") {
    throw new Error("Authentication is required.");
  }

  if (authContext.status === "not_configured") {
    throw new Error("Supabase is not configured.");
  }

  return {
    supabase: await createSupabaseServerClient(),
    user: authContext.user,
  };
}

export async function createGuestAction(projectId: string, formData: FormData) {
  const context = await getActionContext();
  const input = parseCreateGuestPayload({
    displayName: formValue(formData, "displayName"),
    eventIds: getAll(formData, "eventIds"),
    guestSide: formValue(formData, "guestSide"),
    guestTitleTypeId: formValue(formData, "guestTitleTypeId"),
    internalNotes: formValue(formData, "internalNotes"),
    isPrintedOnly: formData.get("isPrintedOnly") === "on",
    preferredLanguage: formValue(formData, "preferredLanguage"),
    tagIds: getAll(formData, "tagIds"),
    whatsappNumber: formValue(formData, "whatsappNumber"),
  });

  await requireGuestCreatePermission(context, projectId, input.guestSide);
  await requireGuestListContractGateOpen(context, projectId);
  const guest = await createGuest(
    context.supabase,
    projectId,
    input,
    context.user.id,
  );

  redirect(`/platform/projects/${projectId}/guests/${guest.id}`);
}

export async function updateGuestAction(
  projectId: string,
  guestId: string,
  formData: FormData,
) {
  const context = await getActionContext();
  const details = await getGuestDetails(context.supabase, guestId);

  if (!details || details.guest.project_id !== projectId) {
    throw new Error("Guest was not found.");
  }

  await requireGuestSidePermission(
    context,
    projectId,
    details.guest.guest_side,
  );
  await requireGuestListContractGateOpen(context, projectId);

  const input = parseUpdateGuestPayload({
    displayName: formValue(formData, "displayName"),
    eventIds: getAll(formData, "eventIds"),
    guestSide: formValue(formData, "guestSide"),
    guestTitleTypeId: formValue(formData, "guestTitleTypeId"),
    internalNotes: formValue(formData, "internalNotes") ?? null,
    isActive: formData.get("isActive") === "on",
    isPrintedOnly: formData.get("isPrintedOnly") === "on",
    preferredLanguage: formValue(formData, "preferredLanguage"),
    tagIds: getAll(formData, "tagIds"),
    whatsappNumber: formValue(formData, "whatsappNumber") ?? null,
  });

  if (input.guestSide && input.guestSide !== details.guest.guest_side) {
    await requireGuestSidePermission(context, projectId, input.guestSide);
  }

  if (guestUpdateRequiresDeactivationPermission(details.guest, input)) {
    await requireGuestDeactivationPermission(context, projectId);
  }

  await updateGuest(context.supabase, guestId, input, context.user.id);

  redirect(`/platform/projects/${projectId}/guests/${guestId}`);
}
