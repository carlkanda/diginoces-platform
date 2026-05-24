import { InvalidJsonBodyError } from "@/lib/api/read-json";
import { jsonError, ProjectAccessError } from "@/lib/projects/project-api";
import { SeatingValidationError } from "@/lib/seating/seating-service";
import { serverLogger } from "@/lib/logging";

export function handleSeatingApiError(error: unknown) {
  if (error instanceof InvalidJsonBodyError) {
    return jsonError(400, "invalid_json", error.message);
  }

  if (error instanceof SeatingValidationError) {
    return jsonError(400, "invalid_seating_request", error.message);
  }

  if (error instanceof ProjectAccessError) {
    return jsonError(error.status, "permission_denied", error.message);
  }

  if (error instanceof Error) {
    serverLogger.error("Seating API error.", {
      error,
      handler: "handleSeatingApiError",
    });
    return jsonError(500, "server_error", "Unexpected server error.");
  }

  serverLogger.error("Unexpected seating API error.", {
    error,
    handler: "handleSeatingApiError",
  });
  return jsonError(500, "server_error", "Unexpected server error.");
}
