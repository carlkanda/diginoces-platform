import {
  jsonError,
  ProjectAccessError,
  requireProjectPermission,
  type ProjectApiContext,
} from "@/lib/projects/project-api";
import { GuestImportValidationError } from "@/lib/guest-imports/guest-import-service";
import type { GuestSide } from "@/lib/guests/guest-service";
import type { PermissionSlug } from "@/lib/security/permissions";

const importSides = [
  "bride",
  "groom",
  "both",
] as const satisfies readonly GuestSide[];

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

async function canManageImportSide(
  context: ProjectApiContext,
  projectId: string,
  side: GuestSide,
) {
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

  return Boolean(data);
}

export async function requireGuestImportProjectPermission(
  context: ProjectApiContext,
  projectId: string,
  permission: PermissionSlug,
) {
  if (!(await hasProjectPermission(context, projectId, permission))) {
    throw new ProjectAccessError("Guest import access denied.", 403);
  }
}

export async function requireGuestImportReadPermission(
  context: ProjectApiContext,
  projectId: string,
) {
  await requireGuestImportProjectPermission(
    context,
    projectId,
    "guest_imports.read",
  );
}

export async function requireAnyGuestImportCreatePermission(
  context: ProjectApiContext,
  projectId: string,
) {
  await requireGuestImportProjectPermission(
    context,
    projectId,
    "guest_imports.create",
  );

  const sideChecks = await Promise.all(
    importSides.map((side) => canManageImportSide(context, projectId, side)),
  );

  if (!sideChecks.some(Boolean)) {
    throw new ProjectAccessError("Guest import side access denied.", 403);
  }
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

  if (!(await canManageImportSide(context, projectId, side))) {
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

export async function getGuestImportActionCapabilities(
  context: ProjectApiContext,
  projectId: string,
  side: GuestSide,
  uploadedBy?: string | null,
) {
  const [
    hasCreatePermission,
    hasReadPermission,
    hasSubmitPermission,
    canReview,
    canApply,
    canManageSide,
  ] = await Promise.all([
    hasProjectPermission(context, projectId, "guest_imports.create"),
    hasProjectPermission(context, projectId, "guest_imports.read"),
    hasProjectPermission(context, projectId, "guest_imports.submit"),
    hasProjectPermission(context, projectId, "guest_imports.review"),
    hasProjectPermission(context, projectId, "guest_imports.apply"),
    canManageImportSide(context, projectId, side),
  ]);

  return {
    canApply,
    canEditMapping: hasCreatePermission && canManageSide,
    canRead:
      hasReadPermission &&
      (canManageSide ||
        canReview ||
        canApply ||
        uploadedBy === context.user.id),
    canReview,
    canSubmit: hasSubmitPermission && canManageSide,
  };
}

export function handleGuestImportApiError(error: unknown) {
  if (error instanceof GuestImportValidationError) {
    return jsonError(400, "invalid_guest_import_request", error.message);
  }

  throw error;
}
