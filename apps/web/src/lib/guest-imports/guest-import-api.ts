import {
  jsonError,
  ProjectAccessError,
  requireProjectPermission,
  type ProjectApiContext,
} from "@/lib/projects/project-api";
import { GuestImportValidationError } from "@/lib/guest-imports/guest-import-service";
import type { GuestSide } from "@/lib/guests/guest-service";
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

export async function requireGuestImportSidePermission(
  context: ProjectApiContext,
  projectId: string,
  side: GuestSide,
  permission: "guest_imports.create" | "guest_imports.submit",
) {
  const hasImportPermission = await hasProjectPermission(
    context,
    projectId,
    permission,
  );

  if (!hasImportPermission) {
    throw new ProjectAccessError("Guest import access denied.", 403);
  }

  const { data, error } = await context.supabase.rpc(
    "current_user_can_manage_guest_side",
    {
      p_guest_side: side,
      p_project_id: projectId,
    },
  );

  if (error) {
    throw error;
  }

  if (!data) {
    throw new ProjectAccessError("Guest import side access denied.", 403);
  }
}

export async function requireGuestImportReviewPermission(
  context: ProjectApiContext,
  projectId: string,
) {
  await requireProjectPermission(context, projectId, "guest_imports.review");
}

export async function requireGuestImportApplyPermission(
  context: ProjectApiContext,
  projectId: string,
) {
  await requireProjectPermission(context, projectId, "guest_imports.apply");
}

export function handleGuestImportApiError(error: unknown) {
  if (error instanceof GuestImportValidationError) {
    return jsonError(400, "invalid_guest_import_request", error.message);
  }

  throw error;
}
