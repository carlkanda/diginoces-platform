import type { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/auth-service";
import {
  ProjectValidationError,
  type EventDetails,
  type EventRow,
  type ProjectDetails,
  type ProjectRow,
  type WorkflowTaskRow,
} from "@/lib/projects/project-service";
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

export type ApiProject = Omit<
  ProjectRow,
  | "created_by"
  | "guest_list_access_unlocked_by"
  | "guest_page_access_unlocked_by"
  | "guest_page_payment_exception_reason"
  | "internal_notes"
  | "latest_contract_id"
  | "updated_by"
>;

export type ApiEvent = Omit<EventRow, "created_by" | "updated_by">;

export type ApiWorkflowTask = Omit<
  WorkflowTaskRow,
  "created_by" | "updated_by"
>;

export type ApiProjectDetails = {
  events: ApiEvent[];
  project: ApiProject;
  workflowTasks: ApiWorkflowTask[];
};

export type ApiEventDetails = {
  event: ApiEvent;
  project: ApiProject;
  workflowTasks: ApiWorkflowTask[];
};

export function redactProjectForApi(project: ProjectRow): ApiProject {
  const runtimeProject = {
    ...project,
  } as ApiProject & Record<string, unknown>;

  delete runtimeProject.created_by;
  delete runtimeProject.guest_list_access_unlocked_by;
  delete runtimeProject.guest_page_access_unlocked_by;
  delete runtimeProject.guest_page_payment_exception_reason;
  delete runtimeProject.internal_notes;
  delete runtimeProject.latest_contract_id;
  delete runtimeProject.updated_by;

  return runtimeProject;
}

export function redactEventForApi(event: EventRow): ApiEvent {
  const apiEvent = { ...event } as ApiEvent & Record<string, unknown>;

  delete apiEvent.created_by;
  delete apiEvent.updated_by;

  return apiEvent;
}

export function redactWorkflowTaskForApi(
  task: WorkflowTaskRow,
): ApiWorkflowTask {
  const apiTask = { ...task } as ApiWorkflowTask & Record<string, unknown>;

  delete apiTask.created_by;
  delete apiTask.updated_by;

  return apiTask;
}

export function redactProjectDetailsForApi(
  details: ProjectDetails,
): ApiProjectDetails {
  return {
    events: details.events.map(redactEventForApi),
    project: redactProjectForApi(details.project),
    workflowTasks: details.workflowTasks.map(redactWorkflowTaskForApi),
  };
}

export function redactEventDetailsForApi(
  details: EventDetails,
): ApiEventDetails {
  return {
    event: redactEventForApi(details.event),
    project: redactProjectForApi(details.project),
    workflowTasks: details.workflowTasks.map(redactWorkflowTaskForApi),
  };
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
