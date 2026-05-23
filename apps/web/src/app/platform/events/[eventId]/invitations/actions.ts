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
import { requireInvitationEventPermission } from "@/lib/invitations/invitation-api";
import {
  InvitationValidationError,
  MAX_INVITATION_TEMPLATE_PDF_BYTES,
  PDF_ENGINE_IDENTIFIER,
} from "@/lib/invitations/invitation-service";
import type { PermissionSlug } from "@/lib/security/permissions";
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

function parsePageNumber(value: FormDataEntryValue | null) {
  const parsed = parseNumber(value, "pageNumber");

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new InvitationValidationError(
      "pageNumber must be a positive integer.",
    );
  }

  return parsed;
}

function parseCoordinate(value: FormDataEntryValue | null, fieldName: string) {
  const parsed = parseNumber(value, fieldName);

  if (parsed < 0 || parsed > 1) {
    throw new InvitationValidationError(
      `${fieldName} must be between 0 and 1.`,
    );
  }

  return parsed;
}

function parseDimension(value: FormDataEntryValue | null, fieldName: string) {
  const parsed = parseCoordinate(value, fieldName);

  if (parsed === 0) {
    throw new InvitationValidationError(`${fieldName} must be greater than 0.`);
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

async function fileLooksLikePdf(file: File) {
  if (file.type === "application/pdf") {
    return true;
  }

  const header = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  return (
    header[0] === 0x25 &&
    header[1] === 0x50 &&
    header[2] === 0x44 &&
    header[3] === 0x46
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

async function requireEventDetails(
  eventId: string,
  permission: PermissionSlug = "invitation_templates.read",
) {
  const context = await getActionContext();
  await requireInvitationEventPermission(context, eventId, permission);

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
  const { context, details } = await requireEventDetails(
    eventId,
    "invitation_templates.create",
  );

  const file = formData.get("templateFile");

  if (!(file instanceof File) || file.size === 0) {
    throw new InvitationValidationError("Upload a Canva-exported PDF file.");
  }

  if (file.size > MAX_INVITATION_TEMPLATE_PDF_BYTES) {
    throw new InvitationValidationError(
      "Invitation template PDF must be 20 MB or smaller.",
    );
  }

  if (!(await fileLooksLikePdf(file))) {
    throw new InvitationValidationError("Upload a Canva-exported PDF file.");
  }

  // Sprint 6 registers PDF metadata only; source-file bytes are persisted when
  // the storage-provider integration replaces the current placeholder.
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
  const { context } = await requireEventDetails(
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
      pageNumber: parsePageNumber(formData.get(`pageNumber:${index}`)),
      position: {
        height: parseDimension(formData.get(`height:${index}`), "height"),
        width: parseDimension(formData.get(`width:${index}`), "width"),
        x: parseCoordinate(formData.get(`x:${index}`), "x"),
        y: parseCoordinate(formData.get(`y:${index}`), "y"),
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
  const { context } = await requireEventDetails(
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
  const { context } = await requireEventDetails(
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
  const { context } = await requireEventDetails(
    eventId,
    "invitations.generate",
  );
  await requireTemplateDetailsForEvent(context, eventId, templateId);

  await enqueueInvitationGenerationJob(context.supabase, templateId, "event");

  redirect(`/platform/events/${eventId}/invitations/${templateId}`);
}
