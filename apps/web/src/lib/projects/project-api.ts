import type { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/auth-service";
import { ProjectValidationError } from "@/lib/projects/project-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PermissionSlug } from "@/lib/security/permissions";

export type ProjectApiContext = {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  user: User;
};

export class ProjectAccessError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ProjectAccessError";
  }
}

export function jsonError(status: number, code: string, message: string) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
      },
    },
    { status },
  );
}

export async function getProjectApiContext() {
  const authContext = await getAuthContext();

  if (authContext.status === "not_configured") {
    return jsonError(
      503,
      "supabase_not_configured",
      `Missing Supabase configuration: ${authContext.missingSupabaseVariables.join(", ")}`,
    );
  }

  if (authContext.status === "anonymous") {
    return jsonError(401, "unauthenticated", "Authentication is required.");
  }

  return {
    supabase: await createSupabaseServerClient(),
    user: authContext.user,
  };
}

export function isProjectApiContext(
  value: ProjectApiContext | NextResponse,
): value is ProjectApiContext {
  return !(value instanceof NextResponse);
}

export async function requireGlobalPermission(
  context: ProjectApiContext,
  permission: PermissionSlug,
) {
  const { data, error } = await context.supabase.rpc(
    "current_user_has_permission",
    {
      p_permission: permission,
      p_scope: "global",
      p_scope_id: null,
    },
  );

  if (error) {
    throw error;
  }

  if (!data) {
    throw new ProjectAccessError("Permission denied.", 403);
  }
}

export async function requireProjectPermission(
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

  if (!data) {
    throw new ProjectAccessError("Project access denied.", 403);
  }
}

export async function requireEventPermission(
  context: ProjectApiContext,
  eventId: string,
  permission: PermissionSlug,
) {
  const { data, error } = await context.supabase.rpc(
    "current_user_can_access_event",
    {
      p_event_id: eventId,
      p_permission: permission,
    },
  );

  if (error) {
    throw error;
  }

  if (!data) {
    throw new ProjectAccessError("Event access denied.", 403);
  }
}

export function handleProjectApiError(error: unknown) {
  if (error instanceof ProjectAccessError) {
    return jsonError(error.status, "permission_denied", error.message);
  }

  if (error instanceof ProjectValidationError) {
    return jsonError(400, "invalid_request", error.message);
  }

  if (error instanceof Error) {
    return jsonError(500, "server_error", error.message);
  }

  return jsonError(500, "server_error", "Unexpected server error.");
}
