"use server";

import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/auth-service";
import {
  createMessageTemplate,
  markGuidedManualMessageStatus,
  prepareProjectMessage,
} from "@/lib/messages/message-db";
import { MessageValidationError } from "@/lib/messages/message-service";
import type { MessageDeliveryStatus } from "@/lib/messages/message-service";
import { requireProjectPermission } from "@/lib/projects/project-api";
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

function messageDetailPath(
  projectId: string,
  messageLogId: string,
  params: Record<string, string>,
) {
  return withSearchParams(
    `/platform/projects/${projectId}/communications/${messageLogId}`,
    params,
  );
}

function withSearchParams(path: string, params: Record<string, string>) {
  const searchParams = new URLSearchParams(params);

  return `${path}?${searchParams.toString()}`;
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

  await requireProjectPermission(context, projectId, permission);

  return context;
}

export async function createMessageTemplateAction(
  projectId: string,
  formData: FormData,
) {
  try {
    const context = await getActionContext(
      projectId,
      "message_templates.manage",
    );

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
  } catch (error) {
    redirect(
      withSearchParams(
        `/platform/projects/${projectId}/communications/templates`,
        {
          messageError:
            error instanceof MessageValidationError
              ? error.message
              : "Unable to create message template.",
        },
      ),
    );
  }

  redirect(
    withSearchParams(
      `/platform/projects/${projectId}/communications/templates`,
      {
        messageStatus: "template_created",
      },
    ),
  );
}

export async function prepareProjectMessageAction(
  projectId: string,
  formData: FormData,
) {
  let messageLogId = "";

  try {
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

    messageLogId = messageLog.id;
  } catch (error) {
    redirect(
      withSearchParams(`/platform/projects/${projectId}/communications/queue`, {
        messageError:
          error instanceof MessageValidationError
            ? error.message
            : "Unable to prepare message.",
      }),
    );
  }

  redirect(`/platform/projects/${projectId}/communications/${messageLogId}`);
}

export async function markProjectMessageStatusAction(
  projectId: string,
  messageLogId: string,
  status: MessageDeliveryStatus,
  formData: FormData,
) {
  try {
    const reason = formValue(formData, "reason");

    if ((status === "failed" || status === "skipped") && !reason) {
      throw new MessageValidationError("Reason is required for this status.");
    }

    const context = await getActionContext(projectId, "messages.send");

    await markGuidedManualMessageStatus(
      context.supabase,
      messageLogId,
      status,
      reason ?? null,
    );
  } catch (error) {
    redirect(
      messageDetailPath(projectId, messageLogId, {
        messageError:
          error instanceof MessageValidationError
            ? error.message
            : "Unable to update message status.",
      }),
    );
  }

  redirect(
    messageDetailPath(projectId, messageLogId, {
      messageStatus: status,
    }),
  );
}
