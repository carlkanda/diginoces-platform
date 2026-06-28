"use server";

import { redirect } from "next/navigation";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import {
  assignProjectMemberByEmail,
  parseAssignMemberPayload,
  parseMemberStatusPayload,
  updateProjectMemberStatus,
} from "@/lib/projects/project-access-service";
import { requireProjectPermission } from "@/lib/projects/project-api";
import {
  createEvent,
  parseCreateEventFormPayload,
  parseUpdateProjectFormPayload,
  updateProject,
} from "@/lib/projects/project-service";
import {
  logSettingsActionFailure,
  setupErrorCode,
} from "@/lib/projects/settings-action-logging";

function formObject(formData: FormData) {
  return Object.fromEntries(
    Array.from(formData.entries()).filter(
      ([, value]) => typeof value === "string",
    ),
  );
}

function settingsPath(
  projectId: string,
  params: Record<string, string>,
  hash?: string,
) {
  const query = new URLSearchParams(params).toString();

  return `/platform/projects/${projectId}/settings?${query}${hash ? `#${hash}` : ""}`;
}

async function getActionContext(projectId: string, nextPath: string) {
  const authContext = await getAuthContext();

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath(nextPath));
  }

  if (authContext.status === "not_configured") {
    redirect(
      settingsPath(projectId, {
        setupError: "supabase_not_configured",
      }),
    );
  }

  return {
    supabase: authContext.supabase,
    user: authContext.user,
  };
}

function logProjectSettingsActionFailure(
  action: string,
  projectId: string,
  error: unknown,
  userId: string,
  metadata: Record<string, string> = {},
) {
  logSettingsActionFailure({
    action,
    area: "Project",
    error,
    metadata,
    scopeId: projectId,
    scopeKey: "projectId",
    userId,
  });
}

export async function updateProjectSettingsAction(
  projectId: string,
  formData: FormData,
) {
  const nextPath = `/platform/projects/${projectId}/settings`;
  const context = await getActionContext(projectId, nextPath);

  try {
    await requireProjectPermission(context, projectId, "projects.update");
    const input = parseUpdateProjectFormPayload(formObject(formData));
    await updateProject(context.supabase, projectId, input, context.user.id);
  } catch (error) {
    logProjectSettingsActionFailure(
      "update_project_settings",
      projectId,
      error,
      context.user.id,
    );
    redirect(
      settingsPath(
        projectId,
        { setupError: setupErrorCode(error) },
        "wedding-identity",
      ),
    );
  }

  redirect(
    settingsPath(
      projectId,
      { setupStatus: "project_updated" },
      "wedding-identity",
    ),
  );
}

export async function createProjectEventAction(
  projectId: string,
  formData: FormData,
) {
  const nextPath = `/platform/projects/${projectId}/settings`;
  const context = await getActionContext(projectId, nextPath);
  let eventId: string;

  try {
    await requireProjectPermission(context, projectId, "events.create");
    const input = parseCreateEventFormPayload(formObject(formData));
    const event = await createEvent(
      context.supabase,
      projectId,
      input,
      context.user.id,
    );
    eventId = event.id;
  } catch (error) {
    logProjectSettingsActionFailure(
      "create_project_event",
      projectId,
      error,
      context.user.id,
    );
    redirect(
      settingsPath(
        projectId,
        { setupError: setupErrorCode(error) },
        "create-event",
      ),
    );
  }

  redirect(`/platform/events/${eventId}/settings?setupStatus=event_created`);
}

export async function assignProjectMemberAction(
  projectId: string,
  formData: FormData,
) {
  const nextPath = `/platform/projects/${projectId}/settings`;
  const context = await getActionContext(projectId, nextPath);

  try {
    await requireProjectPermission(
      context,
      projectId,
      "project_members.manage",
    );
    const input = parseAssignMemberPayload(formObject(formData));
    await assignProjectMemberByEmail(context.supabase, projectId, input);
  } catch (error) {
    logProjectSettingsActionFailure(
      "assign_project_member",
      projectId,
      error,
      context.user.id,
    );
    redirect(
      settingsPath(
        projectId,
        { setupError: setupErrorCode(error) },
        "project-access",
      ),
    );
  }

  redirect(
    settingsPath(
      projectId,
      { setupStatus: "project_member_assigned" },
      "project-access",
    ),
  );
}

export async function updateProjectMemberStatusAction(
  projectId: string,
  memberId: string,
  formData: FormData,
) {
  const nextPath = `/platform/projects/${projectId}/settings`;
  const context = await getActionContext(projectId, nextPath);

  try {
    await requireProjectPermission(
      context,
      projectId,
      "project_members.manage",
    );
    const input = parseMemberStatusPayload(formObject(formData));
    await updateProjectMemberStatus(context.supabase, memberId, input.status);
  } catch (error) {
    logProjectSettingsActionFailure(
      "update_project_member_status",
      projectId,
      error,
      context.user.id,
      { memberId },
    );
    redirect(
      settingsPath(
        projectId,
        { setupError: setupErrorCode(error) },
        "project-access",
      ),
    );
  }

  redirect(
    settingsPath(
      projectId,
      { setupStatus: "project_member_updated" },
      "project-access",
    ),
  );
}
