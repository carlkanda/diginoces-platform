"use server";

import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/auth-service";
import {
  requireDiginocesAdminFileSoftDeletePermission,
  requireProjectFileArchivePermission,
  requireProjectFileRegisterPermission,
  requireProjectFileVersionPermission,
  requireProjectRetentionPermission,
} from "@/lib/files/file-api";
import { serverLogger } from "@/lib/logging";
import { ProjectAccessError } from "@/lib/projects/project-api";
import {
  archiveProjectFile,
  createProjectFileVersion,
  registerProjectFile,
  updateProjectArchiveLifecycle,
} from "@/lib/files/file-db";
import {
  fileMetadataFromForm,
  formValue,
  requiredFormValue,
} from "@/lib/files/file-form";
import { FileValidationError } from "@/lib/files/file-service";

type ProjectArchiveLifecycleAction =
  | "archive"
  | "cancel_pending_deletion"
  | "extend_retention"
  | "mark_completed"
  | "mark_pending_deletion";

const projectArchiveLifecycleActions = new Set<ProjectArchiveLifecycleAction>([
  "archive",
  "cancel_pending_deletion",
  "extend_retention",
  "mark_completed",
  "mark_pending_deletion",
]);

function fileLibraryPath(projectId: string, params: Record<string, string>) {
  return `/platform/projects/${projectId}/files?${new URLSearchParams(
    params,
  ).toString()}`;
}

function fileDetailPath(
  projectId: string,
  fileId: string,
  params: Record<string, string>,
) {
  return `/platform/projects/${projectId}/files/${fileId}?${new URLSearchParams(
    params,
  ).toString()}`;
}

function parseProjectArchiveLifecycleAction(
  value: string | undefined,
): ProjectArchiveLifecycleAction {
  if (!value) {
    return "mark_completed";
  }

  if (
    projectArchiveLifecycleActions.has(value as ProjectArchiveLifecycleAction)
  ) {
    return value as ProjectArchiveLifecycleAction;
  }

  throw new FileValidationError("Project archive action is invalid.");
}

function isPermissionFailure(error: unknown) {
  return (
    error instanceof ProjectAccessError ||
    (error instanceof Error &&
      /access denied|permission denied|not authorized|forbidden/i.test(
        error.message,
      ))
  );
}

function failureStatus(error: unknown, fallback: string) {
  return isPermissionFailure(error) ? "permission_denied" : fallback;
}

function logFileActionFailure(
  message: string,
  context: Record<string, unknown>,
) {
  serverLogger.error(message, context);
}

async function getActionContext() {
  const authContext = await getAuthContext();

  if (authContext.status === "anonymous") {
    throw new FileValidationError("Authentication is required.");
  }

  if (authContext.status === "not_configured") {
    throw new FileValidationError("Supabase is not configured.");
  }

  return {
    supabase: authContext.supabase,
    user: authContext.user,
  };
}

export async function registerProjectFileAction(
  projectId: string,
  formData: FormData,
) {
  let status = "file_registered";

  try {
    const context = await getActionContext();
    await requireProjectFileRegisterPermission(context, projectId);
    await registerProjectFile(
      context.supabase,
      projectId,
      fileMetadataFromForm(formData),
      {
        eventId: formValue(formData, "eventId") ?? null,
        guestId: formValue(formData, "guestId") ?? null,
        invitationId: formValue(formData, "invitationId") ?? null,
        metadata: {
          source: "project_file_library",
          storageUploadPending: true,
        },
      },
    );
  } catch (error) {
    status = failureStatus(error, "file_register_failed");
    logFileActionFailure("Project file registration failed.", {
      error,
      projectId,
    });
  }

  redirect(fileLibraryPath(projectId, { fileStatus: status }));
}

export async function createFileVersionAction(
  projectId: string,
  fileId: string,
  formData: FormData,
) {
  let status = "file_version_created";

  try {
    const context = await getActionContext();
    await requireProjectFileVersionPermission(context, projectId);
    await createProjectFileVersion(
      context.supabase,
      fileId,
      fileMetadataFromForm(formData),
      formValue(formData, "reason") ?? null,
      {
        source: "project_file_version_form",
      },
    );
  } catch (error) {
    status = failureStatus(error, "file_version_failed");
    logFileActionFailure("Project file version creation failed.", {
      error,
      fileId,
      projectId,
    });
  }

  redirect(fileDetailPath(projectId, fileId, { fileStatus: status }));
}

export async function archiveProjectFileAction(
  projectId: string,
  fileId: string,
  formData: FormData,
) {
  let status = "file_archived";

  try {
    const context = await getActionContext();
    await requireProjectFileArchivePermission(context, projectId);
    const action: "archive" | "soft_delete" =
      formValue(formData, "action") === "soft_delete"
        ? "soft_delete"
        : "archive";
    if (action === "soft_delete") {
      await requireDiginocesAdminFileSoftDeletePermission(context);
    }

    await archiveProjectFile(
      context.supabase,
      fileId,
      action,
      requiredFormValue(formData, "reason"),
    );
  } catch (error) {
    status = failureStatus(error, "file_archive_failed");
    logFileActionFailure("Project file archive action failed.", {
      error,
      fileId,
      projectId,
    });
  }

  redirect(fileDetailPath(projectId, fileId, { fileStatus: status }));
}

export async function updateProjectArchiveLifecycleAction(
  projectId: string,
  formData: FormData,
) {
  let status = "retention_updated";

  try {
    const context = await getActionContext();
    await requireProjectRetentionPermission(context, projectId);
    const action = parseProjectArchiveLifecycleAction(
      formValue(formData, "action"),
    );
    const extendedUntil =
      action === "extend_retention"
        ? requiredFormValue(formData, "extendedUntil")
        : null;
    await updateProjectArchiveLifecycle(
      context.supabase,
      projectId,
      action,
      requiredFormValue(formData, "reason"),
      extendedUntil,
    );
  } catch (error) {
    status = failureStatus(error, "retention_update_failed");
    logFileActionFailure("Project archive lifecycle update failed.", {
      error,
      projectId,
    });
  }

  redirect(fileLibraryPath(projectId, { fileStatus: status }));
}
