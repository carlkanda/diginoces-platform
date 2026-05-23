import { InvalidJsonBodyError } from "@/lib/api/read-json";
import {
  jsonError,
  ProjectAccessError,
  requireProjectPermission,
  type ProjectApiContext,
} from "@/lib/projects/project-api";
import { MessageValidationError } from "@/lib/messages/message-service";
import { serverLogger } from "@/lib/logging";
import type { PermissionSlug } from "@/lib/security/permissions";

export async function requireMessageProjectPermission(
  context: ProjectApiContext,
  projectId: string,
  permission: PermissionSlug,
) {
  await requireProjectPermission(context, projectId, permission);
}

export function handleMessageApiError(error: unknown) {
  if (error instanceof InvalidJsonBodyError) {
    return jsonError(400, "invalid_json", error.message);
  }

  if (error instanceof MessageValidationError) {
    return jsonError(400, "invalid_message_request", error.message);
  }

  if (error instanceof ProjectAccessError) {
    return jsonError(error.status, "permission_denied", error.message);
  }

  if (error instanceof Error) {
    serverLogger.error("Message API error.", {
      error,
      handler: "handleMessageApiError",
    });
    return jsonError(500, "server_error", "Unexpected server error.");
  }

  serverLogger.error("Unexpected message API error.", {
    error,
    handler: "handleMessageApiError",
  });
  return jsonError(500, "server_error", "Unexpected server error.");
}
