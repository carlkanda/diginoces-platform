"use server";

import { redirect } from "next/navigation";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import {
  assignEventMemberByEmail,
  parseAssignMemberPayload,
  parseMemberStatusPayload,
  updateEventMemberStatus,
} from "@/lib/projects/project-access-service";
import { requireEventPermission } from "@/lib/projects/project-api";
import {
  parseUpdateEventFormPayload,
  updateEvent,
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
  eventId: string,
  params: Record<string, string>,
  hash?: string,
) {
  const query = new URLSearchParams(params).toString();

  return `/platform/events/${eventId}/settings?${query}${hash ? `#${hash}` : ""}`;
}

async function getActionContext(eventId: string, nextPath: string) {
  const authContext = await getAuthContext();

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath(nextPath));
  }

  if (authContext.status === "not_configured") {
    redirect(
      settingsPath(eventId, {
        setupError: "supabase_not_configured",
      }),
    );
  }

  return {
    supabase: authContext.supabase,
    user: authContext.user,
  };
}

function logEventSettingsActionFailure(
  action: string,
  eventId: string,
  error: unknown,
  userId: string,
  metadata: Record<string, string> = {},
) {
  logSettingsActionFailure({
    action,
    area: "Event",
    error,
    metadata,
    scopeId: eventId,
    scopeKey: "eventId",
    userId,
  });
}

export async function updateEventSettingsAction(
  eventId: string,
  formData: FormData,
) {
  const nextPath = `/platform/events/${eventId}/settings`;
  const context = await getActionContext(eventId, nextPath);

  try {
    await requireEventPermission(context, eventId, "events.update");
    const input = parseUpdateEventFormPayload(formObject(formData));
    await updateEvent(context.supabase, eventId, input, context.user.id);
  } catch (error) {
    logEventSettingsActionFailure(
      "update_event_settings",
      eventId,
      error,
      context.user.id,
    );
    redirect(
      settingsPath(
        eventId,
        { setupError: setupErrorCode(error) },
        "event-details",
      ),
    );
  }

  redirect(
    settingsPath(eventId, { setupStatus: "event_updated" }, "event-details"),
  );
}

export async function assignEventMemberAction(
  eventId: string,
  formData: FormData,
) {
  const nextPath = `/platform/events/${eventId}/settings`;
  const context = await getActionContext(eventId, nextPath);

  try {
    await requireEventPermission(context, eventId, "event_members.manage");
    const input = parseAssignMemberPayload(formObject(formData));
    await assignEventMemberByEmail(context.supabase, eventId, input);
  } catch (error) {
    logEventSettingsActionFailure(
      "assign_event_member",
      eventId,
      error,
      context.user.id,
    );
    redirect(
      settingsPath(
        eventId,
        { setupError: setupErrorCode(error) },
        "event-access",
      ),
    );
  }

  redirect(
    settingsPath(
      eventId,
      { setupStatus: "event_member_assigned" },
      "event-access",
    ),
  );
}

export async function updateEventMemberStatusAction(
  eventId: string,
  memberId: string,
  formData: FormData,
) {
  const nextPath = `/platform/events/${eventId}/settings`;
  const context = await getActionContext(eventId, nextPath);

  try {
    await requireEventPermission(context, eventId, "event_members.manage");
    const input = parseMemberStatusPayload(formObject(formData));
    await updateEventMemberStatus(context.supabase, memberId, input.status);
  } catch (error) {
    logEventSettingsActionFailure(
      "update_event_member_status",
      eventId,
      error,
      context.user.id,
      { memberId },
    );
    redirect(
      settingsPath(
        eventId,
        { setupError: setupErrorCode(error) },
        "event-access",
      ),
    );
  }

  redirect(
    settingsPath(
      eventId,
      { setupStatus: "event_member_updated" },
      "event-access",
    ),
  );
}
