import {
  jsonError,
  ProjectAccessError,
  type ProjectApiContext,
} from "@/lib/projects/project-api";
import {
  GuestValidationError,
  type GuestSide,
} from "@/lib/guests/guest-service";
import type { PermissionSlug } from "@/lib/security/permissions";

async function hasProjectPermission(
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

export async function requireGuestSidePermission(
  context: ProjectApiContext,
  projectId: string,
  side: GuestSide,
) {
  if (await hasProjectPermission(context, projectId, "guests.update")) {
    return;
  }

  if (
    side === "bride" &&
    (await hasProjectPermission(context, projectId, "guests.manage_bride_side"))
  ) {
    return;
  }

  if (
    side === "groom" &&
    (await hasProjectPermission(context, projectId, "guests.manage_groom_side"))
  ) {
    return;
  }

  if (
    side === "both" &&
    (await hasProjectPermission(
      context,
      projectId,
      "guests.manage_bride_side",
    )) &&
    (await hasProjectPermission(context, projectId, "guests.manage_groom_side"))
  ) {
    return;
  }

  throw new ProjectAccessError("Guest side access denied.", 403);
}

export async function requireGuestCreatePermission(
  context: ProjectApiContext,
  projectId: string,
  side: GuestSide,
) {
  if (await hasProjectPermission(context, projectId, "guests.create")) {
    return;
  }

  await requireGuestSidePermission(context, projectId, side);
}

export async function requireAnyGuestCreatePermission(
  context: ProjectApiContext,
  projectId: string,
) {
  const hasCreateAccess =
    (await hasProjectPermission(context, projectId, "guests.create")) ||
    (await hasProjectPermission(context, projectId, "guests.update")) ||
    (await hasProjectPermission(
      context,
      projectId,
      "guests.manage_bride_side",
    )) ||
    (await hasProjectPermission(
      context,
      projectId,
      "guests.manage_groom_side",
    ));

  if (hasCreateAccess) {
    return;
  }

  throw new ProjectAccessError("Guest creation access denied.", 403);
}

export async function requireGuestDeactivationPermission(
  context: ProjectApiContext,
  projectId: string,
) {
  if (await hasProjectPermission(context, projectId, "guests.deactivate")) {
    return;
  }

  throw new ProjectAccessError("Guest deactivation access denied.", 403);
}

export function handleGuestApiError(error: unknown) {
  if (error instanceof GuestValidationError) {
    return jsonError(400, "invalid_guest_request", error.message);
  }

  throw error;
}
