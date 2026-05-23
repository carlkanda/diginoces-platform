import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  parseTemplateRegistrationPayload,
  validateInvitationFieldConfiguration,
  type InvitationGenerationMode,
  type InvitationTemplateFieldInput,
  type InvitationTemplateStatus,
} from "@/lib/invitations/invitation-service";

export type InvitationTemplateRow = {
  created_at: string;
  created_by: string | null;
  event_id: string;
  file_size_bytes: number;
  file_type: "canva_pdf";
  id: string;
  mime_type: "application/pdf";
  name: string;
  project_id: string;
  source_filename: string;
  status: InvitationTemplateStatus;
  storage_bucket: string;
  storage_path: string;
  technical_preview_approved_at: string | null;
  technical_preview_approved_by: string | null;
  technical_preview_generated_at: string | null;
  technical_preview_metadata: Record<string, unknown>;
  template_version: number;
  updated_at: string;
  updated_by: string | null;
};

export type InvitationTemplateFieldRow = {
  alignment: "center" | "left" | "right" | null;
  created_at: string;
  created_by: string | null;
  event_id: string;
  field_key: string;
  font_family: string | null;
  font_size: number | null;
  id: string;
  label: string;
  page_number: number;
  position: Record<string, number>;
  project_id: string;
  sort_order: number;
  template_id: string;
  updated_at: string;
  updated_by: string | null;
};

export type InvitationGenerationJobRow = {
  blocked_count: number;
  completed_at: string | null;
  created_at: string;
  created_by: string | null;
  event_id: string;
  failed_count: number;
  generated_count: number;
  id: string;
  mode: InvitationGenerationMode;
  project_id: string;
  ready_count: number;
  status: "cancelled" | "completed" | "failed" | "queued" | "running";
  template_id: string;
  total_guests: number;
  updated_at: string;
};

export type InvitationRow = {
  event_id: string;
  guest_id: string;
  id: string;
  last_generated_at: string | null;
  project_id: string;
  status:
    | "failed"
    | "generated"
    | "needs_regeneration"
    | "not_generated"
    | "preview_generated";
  template_id: string;
  updated_at: string;
};

export type InvitationTemplateDetails = {
  fields: InvitationTemplateFieldRow[];
  invitations: InvitationRow[];
  jobs: InvitationGenerationJobRow[];
  template: InvitationTemplateRow;
};

export type EnqueueInvitationGenerationResult = {
  eventId: string;
  generationJobId: string;
  readyCount: number;
  status: "queued";
  templateId: string;
};

function safeFilename(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function templateStoragePath(
  projectId: string,
  eventId: string,
  filename: string,
) {
  return [
    "projects",
    projectId,
    "events",
    eventId,
    "templates",
    `${randomUUID()}-${safeFilename(filename)}`,
  ].join("/");
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

export async function listEventInvitationTemplates(
  supabase: SupabaseClient,
  eventId: string,
): Promise<InvitationTemplateRow[]> {
  const { data, error } = await supabase
    .from("invitation_templates")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as InvitationTemplateRow[];
}

export async function getInvitationTemplateDetails(
  supabase: SupabaseClient,
  templateId: string,
): Promise<InvitationTemplateDetails | null> {
  const { data: template, error: templateError } = await supabase
    .from("invitation_templates")
    .select("*")
    .eq("id", templateId)
    .maybeSingle();

  if (templateError) {
    throw templateError;
  }

  if (!template) {
    return null;
  }

  const typedTemplate = template as InvitationTemplateRow;
  const [fieldsResult, jobsResult, invitationsResult] = await Promise.all([
    supabase
      .from("invitation_template_fields")
      .select("*")
      .eq("template_id", templateId)
      .order("page_number", { ascending: true })
      .order("sort_order", { ascending: true }),
    supabase
      .from("invitation_generation_jobs")
      .select("*")
      .eq("template_id", templateId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("invitations")
      .select(
        "id, project_id, event_id, guest_id, template_id, status, last_generated_at, updated_at",
      )
      .eq("template_id", templateId)
      .order("updated_at", { ascending: false })
      .limit(25),
  ]);

  if (fieldsResult.error) {
    throw fieldsResult.error;
  }

  if (jobsResult.error) {
    throw jobsResult.error;
  }

  if (invitationsResult.error) {
    throw invitationsResult.error;
  }

  return {
    fields: (fieldsResult.data ?? []) as InvitationTemplateFieldRow[],
    invitations: (invitationsResult.data ?? []) as InvitationRow[],
    jobs: (jobsResult.data ?? []) as InvitationGenerationJobRow[],
    template: typedTemplate,
  };
}

export async function registerInvitationTemplate(
  supabase: SupabaseClient,
  projectId: string,
  payload: unknown,
  actorUserId?: string | null,
) {
  const input = parseTemplateRegistrationPayload(payload);

  const { data, error } = await supabase
    .from("invitation_templates")
    .insert({
      created_by: actorUserId ?? null,
      event_id: input.eventId,
      file_size_bytes: input.fileSizeBytes,
      file_type: input.fileType,
      mime_type: input.mimeType,
      name: input.templateName,
      project_id: projectId,
      source_filename: input.sourceFilename,
      status: "uploaded",
      storage_path: templateStoragePath(
        projectId,
        input.eventId,
        input.sourceFilename,
      ),
      updated_by: actorUserId ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as InvitationTemplateRow;
}

export async function saveInvitationTemplateFields(
  supabase: SupabaseClient,
  template: Pick<InvitationTemplateRow, "event_id" | "id" | "project_id">,
  fields: InvitationTemplateFieldInput[],
  actorUserId?: string | null,
) {
  const validatedFields = validateInvitationFieldConfiguration(fields);

  const { error: deleteError } = await supabase
    .from("invitation_template_fields")
    .delete()
    .eq("template_id", template.id);

  if (deleteError) {
    throw deleteError;
  }

  const rows = validatedFields.map((field, index) => ({
    alignment: field.alignment ?? null,
    created_by: actorUserId ?? null,
    event_id: template.event_id,
    field_key: field.key,
    font_family: field.fontFamily ?? null,
    font_size: field.fontSize ?? null,
    label: field.label,
    page_number: field.pageNumber,
    position: field.position,
    project_id: template.project_id,
    sort_order: index,
    template_id: template.id,
    updated_by: actorUserId ?? null,
  }));

  const { data, error } = await supabase
    .from("invitation_template_fields")
    .insert(rows)
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    throw error;
  }

  const { error: updateError } = await supabase
    .from("invitation_templates")
    .update({
      status: "configured",
      updated_by: actorUserId ?? null,
    })
    .eq("id", template.id);

  if (updateError) {
    throw updateError;
  }

  return (data ?? []) as InvitationTemplateFieldRow[];
}

export async function markInvitationTemplatePreviewGenerated(
  supabase: SupabaseClient,
  templateId: string,
  previewMetadata: Record<string, unknown> = {},
) {
  const { data, error } = await supabase.rpc(
    "mark_invitation_template_preview_generated",
    {
      p_preview_metadata: previewMetadata,
      p_template_id: templateId,
    },
  );

  if (error) {
    throw error;
  }

  return asRecord(data);
}

export async function approveInvitationTemplatePreview(
  supabase: SupabaseClient,
  templateId: string,
) {
  const { data, error } = await supabase.rpc(
    "approve_invitation_template_preview",
    {
      p_template_id: templateId,
    },
  );

  if (error) {
    throw error;
  }

  return asRecord(data);
}

export async function enqueueInvitationGenerationJob(
  supabase: SupabaseClient,
  templateId: string,
  mode: InvitationGenerationMode = "event",
  guestIds?: string[],
): Promise<EnqueueInvitationGenerationResult> {
  const { data, error } = await supabase.rpc(
    "enqueue_invitation_generation_job",
    {
      p_guest_ids: guestIds ?? null,
      p_mode: mode,
      p_template_id: templateId,
    },
  );

  if (error) {
    throw error;
  }

  const record = asRecord(data);

  return {
    eventId: String(record.eventId),
    generationJobId: String(record.generationJobId),
    readyCount: Number(record.readyCount ?? 0),
    status: "queued",
    templateId: String(record.templateId),
  };
}
