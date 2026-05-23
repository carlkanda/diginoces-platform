import { InvalidJsonBodyError } from "@/lib/api/read-json";
import {
  jsonError,
  ProjectAccessError,
  requireEventPermission,
  requireProjectPermission,
  type ProjectApiContext,
} from "@/lib/projects/project-api";
import { InvitationValidationError } from "@/lib/invitations/invitation-service";
import { serverLogger } from "@/lib/logging";
import type { PermissionSlug } from "@/lib/security/permissions";

// Invitation routes use these aliases so Sprint 6 permission checks read in
// domain language while delegating to the shared project/event guards.
export async function requireInvitationEventPermission(
  context: ProjectApiContext,
  eventId: string,
  permission: PermissionSlug,
) {
  await requireEventPermission(context, eventId, permission);
}

export async function requireInvitationProjectPermission(
  context: ProjectApiContext,
  projectId: string,
  permission: PermissionSlug,
) {
  await requireProjectPermission(context, projectId, permission);
}

export function handleInvitationApiError(error: unknown) {
  if (error instanceof InvalidJsonBodyError) {
    return jsonError(400, "invalid_json", error.message);
  }

  if (error instanceof InvitationValidationError) {
    return jsonError(400, "invalid_invitation_request", error.message);
  }

  if (error instanceof ProjectAccessError) {
    return jsonError(error.status, "permission_denied", error.message);
  }

  if (error instanceof Error) {
    serverLogger.error("Invitation API error.", {
      error,
      handler: "handleInvitationApiError",
    });
    return jsonError(500, "server_error", "Unexpected server error.");
  }

  serverLogger.error("Unexpected invitation API error.", {
    error,
    handler: "handleInvitationApiError",
  });
  return jsonError(500, "server_error", "Unexpected server error.");
}
