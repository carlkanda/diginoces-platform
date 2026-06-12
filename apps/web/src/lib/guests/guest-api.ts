import {
  jsonError,
  ProjectAccessError,
  type ProjectApiContext,
} from "@/lib/projects/project-api";
import {
  GuestValidationError,
  type GuestEventAssignmentRow,
  type GuestListFilters,
  type GuestSide,
  type GuestRow,
  type GuestTagAssignmentRow,
  type GuestTagRow,
  type GuestTitleTypeRow,
} from "@/lib/guests/guest-service";
import type { PermissionSlug } from "@/lib/security/permissions";
import { isUuid } from "@/lib/validation/uuid";

export type ApiGuest = Omit<
  GuestRow,
  | "created_by"
  | "internal_notes"
  | "normalized_name"
  | "normalized_whatsapp"
  | "updated_by"
>;

export type ApiGuestEventAssignment = Omit<
  GuestEventAssignmentRow,
  "created_by" | "updated_by"
>;

export type ApiGuestTagAssignment = Omit<GuestTagAssignmentRow, "created_by">;

export type ApiGuestTitleType = Omit<GuestTitleTypeRow, "created_by">;

export type ApiGuestTag = Omit<GuestTagRow, "created_by">;

export type ApiGuestDetails = {
  eventAssignments: ApiGuestEventAssignment[];
  guest: ApiGuest;
  tagAssignments: ApiGuestTagAssignment[];
  titleType: ApiGuestTitleType | null;
};

export function redactGuestForApi(guest: GuestRow): ApiGuest {
  const apiGuest = { ...guest } as ApiGuest & Record<string, unknown>;

  delete apiGuest.created_by;
  delete apiGuest.internal_notes;
  delete apiGuest.normalized_name;
  delete apiGuest.normalized_whatsapp;
  delete apiGuest.updated_by;

  return apiGuest;
}

export function redactGuestEventAssignmentForApi(
  assignment: GuestEventAssignmentRow,
): ApiGuestEventAssignment {
  const apiAssignment = {
    ...assignment,
  } as ApiGuestEventAssignment & Record<string, unknown>;

  delete apiAssignment.created_by;
  delete apiAssignment.updated_by;

  return apiAssignment;
}

export function redactGuestTagAssignmentForApi(
  assignment: GuestTagAssignmentRow,
): ApiGuestTagAssignment {
  const apiAssignment = {
    ...assignment,
  } as ApiGuestTagAssignment & Record<string, unknown>;

  delete apiAssignment.created_by;

  return apiAssignment;
}

export function redactGuestTitleTypeForApi(
  titleType: GuestTitleTypeRow,
): ApiGuestTitleType {
  const apiTitleType = {
    ...titleType,
  } as ApiGuestTitleType & Record<string, unknown>;

  delete apiTitleType.created_by;

  return apiTitleType;
}

export function redactGuestTagForApi(tag: GuestTagRow): ApiGuestTag {
  const apiTag = { ...tag } as ApiGuestTag & Record<string, unknown>;

  delete apiTag.created_by;

  return apiTag;
}

export function redactGuestDetailsForApi(details: {
  eventAssignments: GuestEventAssignmentRow[];
  guest: GuestRow;
  tagAssignments: GuestTagAssignmentRow[];
  titleType: GuestTitleTypeRow | null;
}): ApiGuestDetails {
  return {
    eventAssignments: details.eventAssignments.map(
      redactGuestEventAssignmentForApi,
    ),
    guest: redactGuestForApi(details.guest),
    tagAssignments: details.tagAssignments.map(redactGuestTagAssignmentForApi),
    titleType: details.titleType
      ? redactGuestTitleTypeForApi(details.titleType)
      : null,
  };
}

async function hasProjectPermission(
  context: ProjectApiContext,
  projectId: string,
  permission: PermissionSlug,
) {
  if (!isUuid(projectId)) {
    return false;
  }

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

export async function resolveReadableGuestFilters(
  context: ProjectApiContext,
  projectId: string,
  filters: GuestListFilters,
): Promise<GuestListFilters> {
  const [canReadAnyGuestSide, canManageBrideSide, canManageGroomSide] =
    await Promise.all([
      Promise.all([
        hasProjectPermission(context, projectId, "guests.create"),
        hasProjectPermission(context, projectId, "guests.update"),
        hasProjectPermission(context, projectId, "guests.deactivate"),
      ]).then((results) => results.some(Boolean)),
      hasProjectPermission(context, projectId, "guests.manage_bride_side"),
      hasProjectPermission(context, projectId, "guests.manage_groom_side"),
    ]);

  if (
    canReadAnyGuestSide ||
    (canManageBrideSide && canManageGroomSide) ||
    (!canManageBrideSide && !canManageGroomSide)
  ) {
    return filters;
  }

  if (canManageBrideSide) {
    if (filters.side === "groom") {
      throw new ProjectAccessError("Guest side access denied.", 403);
    }

    return {
      ...filters,
      side: filters.side === "both" ? "both" : "bride",
    };
  }

  if (filters.side === "bride") {
    throw new ProjectAccessError("Guest side access denied.", 403);
  }

  return {
    ...filters,
    side: filters.side === "both" ? "both" : "groom",
  };
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
  const permissionResults = await Promise.all([
    hasProjectPermission(context, projectId, "guests.create"),
    hasProjectPermission(context, projectId, "guests.update"),
    hasProjectPermission(context, projectId, "guests.manage_bride_side"),
    hasProjectPermission(context, projectId, "guests.manage_groom_side"),
  ]);

  if (permissionResults.some(Boolean)) {
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
