import type { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/auth-service";
import { ProjectValidationError } from "@/lib/projects/project-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/validation/uuid";
import type { PermissionSlug } from "@/lib/security/permissions";

export type ProjectApiContext = {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  user: User;
};

type UntypedRpcClient = {
  rpc(
    fn: string,
    args?: Record<string, unknown>,
  ): Promise<{
    data: unknown;
    error: Error | null;
  }>;
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
    {
      headers: {
        "Cache-Control": "no-store",
      },
      status,
    },
  );
}

export function methodNotAllowed(allowedMethods: string | string[]) {
  const response = jsonError(
    405,
    "method_not_allowed",
    "Method is not allowed.",
  );
  response.headers.set(
    "Allow",
    Array.isArray(allowedMethods) ? allowedMethods.join(", ") : allowedMethods,
  );

  return response;
}

export async function getProjectApiContext() {
  const authContext = await getAuthContext();

  if (authContext.status === "not_configured") {
    console.error(
      "Missing Supabase configuration:",
      authContext.missingSupabaseVariables,
    );
    return jsonError(
      503,
      "supabase_not_configured",
      "Service is temporarily unavailable.",
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
    },
  );

  if (error) {
    throw error;
  }

  if (!data) {
    throw new ProjectAccessError("Permission denied.", 403);
  }
}

export async function hasProjectPermission(
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

export async function hasProjectPermissions(
  context: ProjectApiContext,
  projectId: string,
  permissions: PermissionSlug[],
) {
  if (!isUuid(projectId)) {
    return new Map(permissions.map((permission) => [permission, false]));
  }

  const { data, error } = await (
    context.supabase as unknown as UntypedRpcClient
  ).rpc("current_user_can_access_project_permissions", {
    p_permissions: permissions,
    p_project_id: projectId,
  });

  if (error) {
    throw error;
  }

  const values =
    data && typeof data === "object" && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : {};

  return new Map(
    permissions.map((permission) => [permission, values[permission] === true]),
  );
}

export async function requireProjectPermission(
  context: ProjectApiContext,
  projectId: string,
  permission: PermissionSlug,
) {
  if (!(await hasProjectPermission(context, projectId, permission))) {
    throw new ProjectAccessError("Project access denied.", 403);
  }
}

export async function requireEventPermission(
  context: ProjectApiContext,
  eventId: string,
  permission: PermissionSlug,
) {
  if (!(await hasEventPermission(context, eventId, permission))) {
    throw new ProjectAccessError("Event access denied.", 403);
  }
}

export async function hasEventPermission(
  context: ProjectApiContext,
  eventId: string,
  permission: PermissionSlug,
) {
  if (!isUuid(eventId)) {
    return false;
  }

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

  return Boolean(data);
}

export function handleProjectApiError(error: unknown) {
  if (error instanceof ProjectAccessError) {
    return jsonError(error.status, "permission_denied", error.message);
  }

  if (error instanceof ProjectValidationError) {
    return jsonError(400, "invalid_request", error.message);
  }

  if (error instanceof Error) {
    console.error("Project API error:", error);
    return jsonError(500, "server_error", "Unexpected server error.");
  }

  console.error("Unexpected server error:", error);
  return jsonError(500, "server_error", "Unexpected server error.");
}
