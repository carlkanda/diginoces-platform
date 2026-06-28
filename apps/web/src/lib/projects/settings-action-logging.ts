import { serverLogger } from "@/lib/logging";
import { ProjectAccessError } from "@/lib/projects/project-api";
import { ProjectValidationError } from "@/lib/projects/project-service";

export type SetupErrorCode =
  | "invalid_setup_request"
  | "permission_denied"
  | "setup_action_failed";

type SettingsActionArea = "Event" | "Project";

type SettingsActionFailureInput = {
  action: string;
  area: SettingsActionArea;
  error: unknown;
  metadata?: Record<string, string>;
  scopeId: string;
  scopeKey: "eventId" | "projectId";
  userId: string;
};

export function setupErrorCode(error: unknown): SetupErrorCode {
  if (error instanceof ProjectAccessError) {
    return "permission_denied";
  }

  if (error instanceof ProjectValidationError) {
    return "invalid_setup_request";
  }

  return "setup_action_failed";
}

function redactedSetupErrorMessage(errorCode: SetupErrorCode) {
  switch (errorCode) {
    case "permission_denied":
      return "Permission denied.";
    case "invalid_setup_request":
      return "Invalid setup request.";
    case "setup_action_failed":
      return "Setup action failed.";
  }
}

function redactedSetupErrorName(error: unknown, errorCode: SetupErrorCode) {
  if (errorCode === "permission_denied") {
    return "ProjectAccessError";
  }

  if (errorCode === "invalid_setup_request") {
    return "ProjectValidationError";
  }

  return error instanceof Error ? "UnexpectedError" : "UnknownError";
}

function setupErrorDetails(error: unknown, errorCode: SetupErrorCode) {
  return {
    message: redactedSetupErrorMessage(errorCode),
    name: redactedSetupErrorName(error, errorCode),
  };
}

function setupExceptionDiagnostics(error: unknown) {
  if (!(error instanceof Error)) {
    return {
      kind: typeof error,
    };
  }

  return {
    kind: "error",
    messageLength: error.message.length,
    originalName: error.name,
    stackFrameCount: error.stack ? error.stack.split("\n").length : 0,
  };
}

export function logSettingsActionFailure({
  action,
  area,
  error,
  metadata = {},
  scopeId,
  scopeKey,
  userId,
}: SettingsActionFailureInput) {
  const errorCode = setupErrorCode(error);
  const payload = {
    action,
    errorCode,
    errorDetails: setupErrorDetails(error, errorCode),
    ...(errorCode === "setup_action_failed"
      ? { exceptionDiagnostics: setupExceptionDiagnostics(error) }
      : {}),
    [scopeKey]: scopeId,
    userId,
    ...metadata,
  };

  if (errorCode === "setup_action_failed") {
    serverLogger.error(`${area} settings action failed.`, payload);
    return;
  }

  serverLogger.info(`${area} settings action was rejected.`, payload);
}
