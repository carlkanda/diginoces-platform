import { InvalidJsonBodyError } from "@/lib/api/read-json";
import { CheckInValidationError } from "@/lib/check-in/check-in-service";
import { serverLogger } from "@/lib/logging";
import { jsonError, ProjectAccessError } from "@/lib/projects/project-api";

export function handleCheckInApiError(error: unknown) {
  if (error instanceof InvalidJsonBodyError) {
    return jsonError(400, "invalid_json", error.message);
  }

  if (error instanceof CheckInValidationError) {
    return jsonError(400, "invalid_check_in_request", error.message);
  }

  if (error instanceof ProjectAccessError) {
    return jsonError(error.status, "permission_denied", error.message);
  }

  if (error instanceof Error) {
    serverLogger.error("Check-in API error.", {
      error,
      handler: "handleCheckInApiError",
    });
    return jsonError(500, "server_error", "Unexpected server error.");
  }

  serverLogger.error("Unexpected check-in API error.", {
    error,
    handler: "handleCheckInApiError",
  });
  return jsonError(500, "server_error", "Unexpected server error.");
}
