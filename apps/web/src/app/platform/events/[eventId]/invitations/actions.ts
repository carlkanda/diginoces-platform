"use server";

import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/auth-service";
import {
  approveInvitationTemplatePreview,
  enqueueInvitationGenerationJob,
  getInvitationTemplateDetails,
  markInvitationTemplatePreviewGenerated,
  registerInvitationTemplate,
  saveInvitationTemplateFields,
} from "@/lib/invitations/invitation-db";
import {
  requireInvitationEventPermission,
  requireInvitationProjectPermission,
} from "@/lib/invitations/invitation-api";
import {
  InvitationValidationError,
  PDF_ENGINE_IDENTIFIER,
} from "@/lib/invitations/invitation-service";
import type { InvitationFieldAlignment } from "@/lib/invitations/invitation-service";
import { getEventDetails } from "@/lib/projects/project-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);

  if (value === null) {
    return undefined;
  }

  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : undefined;
}

function requiredFormValue(formData: FormData, key: string) {
  const value = formValue(formData, key);

  if (!value) {
    throw new InvitationValidationError(`${key} is required.`);
  }

  return value;
}

function parseNumber(value: FormDataEntryValue | null, fieldName: string) {
  const normalized = String(value ?? "").trim();
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    throw new InvitationValidationError(`${fieldName} must be a number.`);
  }

  return parsed;
}

function parseAlignment(
  value: string | undefined,
): InvitationFieldAlignment | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === "left" || value === "center" || value === "right") {
    return value;
  }

  throw new InvitationValidationError(
    "alignment must be left, center, or right.",
  );
}

async function getActionContext() {
  const authContext = await getAuthContext();

  if (authContext.status === "anonymous") {
    throw new Error("Authentication is required.");
  }

  if (authContext.status === "not_configured") {
    throw new Error("Supabase is not configured.");
  }

  return {
    supabase: await createSupabaseServerClient(),
    user: authContext.user,
  };
}

async function requireEventDetails(eventId: string) {
  const context = await getActionContext();
  await requireInvitationEventPermission(
    context,
    eventId,
    "invitation_templates.read",
  );

  const details = await getEventDetails(context.supabase, eventId);

  if (!details) {
    throw new InvitationValidationError("Event was not found.");
  }

  return { context, details };
}

async function requireTemplateDetailsForEvent(
  context: Awaited<ReturnType<typeof getActionContext>>,
  eventId: string,
  templateId: string,
) {
  const details = await getInvitationTemplateDetails(
    context.supabase,
    templateId,
  );

  if (!details || details.template.event_id !== eventId) {
    throw new InvitationValidationError("Invitation template was not found.");
  }

  return details;
}

export async function registerInvitationTemplateAction(
  eventId: string,
  formData: FormData,
) {
  const { context, details } = await requireEventDetails(eventId);
  await requireInvitationProjectPermission(
    context,
    details.project.id,
    "invitation_templates.create",
  );

  const file = formData.get("templateFile");

  if (!(file instanceof File) || file.size === 0) {
    throw new InvitationValidationError("Upload a Canva-exported PDF file.");
  }

  const template = await registerInvitationTemplate(
    context.supabase,
    details.project.id,
    {
      eventId,
      fileSizeBytes: file.size,
      mimeType: file.type || "application/pdf",
      sourceFilename: file.name,
      templateName: requiredFormValue(formData, "templateName"),
    },
    context.user.id,
  );

  redirect(`/platform/events/${eventId}/invitations/${template.id}`);
}

export async function saveInvitationTemplateFieldsAction(
  eventId: string,
  templateId: string,
  formData: FormData,
) {
  const { context } = await requireEventDetails(eventId);
  await requireInvitationEventPermission(
    context,
    eventId,
    "invitation_templates.update",
  );

  const details = await requireTemplateDetailsForEvent(
    context,
    eventId,
    templateId,
  );

  const fieldKeys = formData.getAll("fieldKey").map((value) => String(value));
  const fields = fieldKeys
    .map((key, index) => ({
      alignment: parseAlignment(formValue(formData, `alignment:${index}`)),
      fontFamily: formValue(formData, `fontFamily:${index}`) ?? null,
      fontSize:
        formValue(formData, `fontSize:${index}`) === undefined
          ? null
          : parseNumber(formData.get(`fontSize:${index}`), "fontSize"),
      key,
      label: requiredFormValue(formData, `label:${index}`),
      pageNumber: parseNumber(
        formData.get(`pageNumber:${index}`),
        "pageNumber",
      ),
      position: {
        height: parseNumber(formData.get(`height:${index}`), "height"),
        width: parseNumber(formData.get(`width:${index}`), "width"),
        x: parseNumber(formData.get(`x:${index}`), "x"),
        y: parseNumber(formData.get(`y:${index}`), "y"),
      },
    }))
    .filter((field) => field.key.length > 0);

  await saveInvitationTemplateFields(
    context.supabase,
    details.template,
    fields,
    context.user.id,
  );

  redirect(`/platform/events/${eventId}/invitations/${templateId}`);
}

export async function generateInvitationPreviewAction(
  eventId: string,
  templateId: string,
) {
  const { context } = await requireEventDetails(eventId);
  await requireInvitationEventPermission(
    context,
    eventId,
    "invitation_templates.update",
  );
  await requireTemplateDetailsForEvent(context, eventId, templateId);

  await markInvitationTemplatePreviewGenerated(context.supabase, templateId, {
    engine: PDF_ENGINE_IDENTIFIER,
    scope: "technical_preview",
  });

  redirect(`/platform/events/${eventId}/invitations/${templateId}`);
}

export async function approveInvitationPreviewAction(
  eventId: string,
  templateId: string,
) {
  const { context } = await requireEventDetails(eventId);
  await requireInvitationEventPermission(
    context,
    eventId,
    "invitation_templates.approve",
  );
  await requireTemplateDetailsForEvent(context, eventId, templateId);

  await approveInvitationTemplatePreview(context.supabase, templateId);

  redirect(`/platform/events/${eventId}/invitations/${templateId}`);
}

export async function enqueueInvitationGenerationAction(
  eventId: string,
  templateId: string,
) {
  const { context } = await requireEventDetails(eventId);
  await requireInvitationEventPermission(
    context,
    eventId,
    "invitations.generate",
  );
  await requireTemplateDetailsForEvent(context, eventId, templateId);

  await enqueueInvitationGenerationJob(context.supabase, templateId, "event");

  redirect(`/platform/events/${eventId}/invitations/${templateId}`);
}
