"use server";

import { redirect } from "next/navigation";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import {
  assignGlobalRoleByEmail,
  parseAssignGlobalRolePayload,
  revokeGlobalRoleAssignment,
} from "@/lib/projects/project-access-service";
import {
  ProjectAccessError,
  requireGlobalPermission,
} from "@/lib/projects/project-api";
import { ProjectValidationError } from "@/lib/projects/project-service";
import { serverLogger } from "@/lib/logging";

function formObject(formData: FormData) {
  return Object.fromEntries(
    Array.from(formData.entries()).filter(
      ([, value]) => typeof value === "string",
    ),
  );
}

function accessPath(params: Record<string, string>, hash?: string) {
  const query = new URLSearchParams(params).toString();

  return `/platform/access?${query}${hash ? `#${hash}` : ""}`;
}

async function getActionContext() {
  const authContext = await getAuthContext();

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath("/platform/access"));
  }

  if (authContext.status === "not_configured") {
    redirect(accessPath({ accessError: "supabase_not_configured" }));
  }

  return {
    supabase: authContext.supabase,
    user: authContext.user,
  };
}

function accessErrorCode(error: unknown) {
  if (error instanceof ProjectAccessError) {
    return "permission_denied";
  }

  if (error instanceof ProjectValidationError) {
    return "invalid_access_request";
  }

  return "access_action_failed";
}

export async function assignGlobalRoleAction(formData: FormData) {
  const context = await getActionContext();

  try {
    await requireGlobalPermission(context, "roles.manage");
    const input = parseAssignGlobalRolePayload(formObject(formData));
    await assignGlobalRoleByEmail(context.supabase, input);
  } catch (error) {
    serverLogger.error("Global role assignment action failed.", {
      action: "assign_global_role",
      error,
      errorCode: accessErrorCode(error),
      userId: context.user.id,
    });
    redirect(
      accessPath({ accessError: accessErrorCode(error) }, "assign-global-role"),
    );
  }

  redirect(
    accessPath({ accessStatus: "global_role_assigned" }, "assign-global-role"),
  );
}

export async function revokeGlobalRoleAction(assignmentId: string) {
  const context = await getActionContext();

  try {
    await requireGlobalPermission(context, "roles.manage");
    await revokeGlobalRoleAssignment(context.supabase, assignmentId);
  } catch (error) {
    serverLogger.error("Global role revoke action failed.", {
      action: "revoke_global_role",
      assignmentId,
      error,
      errorCode: accessErrorCode(error),
      userId: context.user.id,
    });
    redirect(
      accessPath(
        { accessError: accessErrorCode(error) },
        "global-role-assignments",
      ),
    );
  }

  redirect(
    accessPath(
      { accessStatus: "global_role_revoked" },
      "global-role-assignments",
    ),
  );
}
