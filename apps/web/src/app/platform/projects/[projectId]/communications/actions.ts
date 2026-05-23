"use server";

import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/auth-service";
import {
  createMessageTemplate,
  markGuidedManualMessageStatus,
  prepareProjectMessage,
} from "@/lib/messages/message-db";
import { requireMessageProjectPermission } from "@/lib/messages/message-api";
import { MessageValidationError } from "@/lib/messages/message-service";
import type { MessageDeliveryStatus } from "@/lib/messages/message-service";
import type { PermissionSlug } from "@/lib/security/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);

  if (value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new MessageValidationError(`${key} must be a text value.`);
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function requiredFormValue(formData: FormData, key: string) {
  const value = formValue(formData, key);

  if (!value) {
    throw new MessageValidationError(`${key} is required.`);
  }

  return value;
}

async function getActionContext(projectId: string, permission: PermissionSlug) {
  const authContext = await getAuthContext();

  if (authContext.status === "anonymous") {
    throw new MessageValidationError("Authentication is required.");
  }

  if (authContext.status === "not_configured") {
    throw new MessageValidationError("Supabase is not configured.");
  }

  const context = {
    supabase: await createSupabaseServerClient(),
    user: authContext.user,
  };

  await requireMessageProjectPermission(context, projectId, permission);

  return context;
}

export async function createMessageTemplateAction(
  projectId: string,
  formData: FormData,
) {
  const context = await getActionContext(projectId, "message_templates.manage");

  await createMessageTemplate(
    context.supabase,
    projectId,
    {
      body: requiredFormValue(formData, "body"),
      language: requiredFormValue(formData, "language"),
      messageType: requiredFormValue(formData, "messageType"),
      status: formValue(formData, "status") ?? "active",
      title: requiredFormValue(formData, "title"),
    },
    context.user.id,
  );

  redirect(`/platform/projects/${projectId}/communications/templates`);
}

export async function prepareProjectMessageAction(
  projectId: string,
  formData: FormData,
) {
  const context = await getActionContext(projectId, "messages.prepare");
  const messageLog = await prepareProjectMessage(
    context.supabase,
    projectId,
    {
      changeReason: formValue(formData, "changeReason"),
      eventId: requiredFormValue(formData, "eventId"),
      guestId: requiredFormValue(formData, "guestId"),
      invitationId: formValue(formData, "invitationId"),
      messageType: requiredFormValue(formData, "messageType"),
      publicGuestPageLink: formValue(formData, "publicGuestPageLink"),
    },
    context.user.id,
  );

  redirect(`/platform/projects/${projectId}/communications/${messageLog.id}`);
}

export async function markProjectMessageStatusAction(
  projectId: string,
  messageLogId: string,
  status: MessageDeliveryStatus,
  formData: FormData,
) {
  const context = await getActionContext(projectId, "messages.send");

  await markGuidedManualMessageStatus(
    context.supabase,
    messageLogId,
    status,
    formValue(formData, "reason") ?? null,
  );

  redirect(`/platform/projects/${projectId}/communications/${messageLogId}`);
}
