import type { SupabaseClient } from "@supabase/supabase-js";
import {
  MessageValidationError,
  parseCreateMessageTemplatePayload,
  parsePrepareMessagePayload,
  prepareCommunicationMessage,
  type MessageDeliveryStatus,
  type MessagePreparationInput,
  type MessageTemplate,
  type MessageType,
  type PrepareMessagePayload,
} from "@/lib/messages/message-service";

export type MessageTemplateRow = {
  approved_at: string | null;
  approved_by: string | null;
  body: string;
  created_at: string;
  created_by: string | null;
  id: string;
  language: "en" | "fr";
  message_type: MessageType;
  project_id: string;
  status: "active" | "archived" | "draft" | "inactive";
  template_version: number;
  title: string;
  updated_at: string;
  updated_by: string | null;
  variables: string[];
};

export type MessageLogRow = {
  channel: "whatsapp";
  created_at: string;
  event_id: string | null;
  failure_reason: string | null;
  guest_display_name?: string | null;
  guest_id: string | null;
  id: string;
  invitation_id: string | null;
  language: "en" | "fr";
  manual_whatsapp_url: string | null;
  message_type: MessageType;
  metadata: Record<string, unknown>;
  opened_at: string | null;
  opened_by: string | null;
  prepared_by: string | null;
  previous_message_log_id: string | null;
  project_id: string;
  rendered_body: string;
  sending_mode: "api_ready" | "api_sent" | "guided_manual";
  sent_at: string | null;
  sent_confirmed_by: string | null;
  skipped_reason: string | null;
  status: MessageDeliveryStatus;
  target_whatsapp_number: string | null;
  template_id: string | null;
  template_version: number | null;
  updated_at: string;
};

export type MessageQueueItemRow = {
  attempts: number;
  created_at: string;
  created_by: string | null;
  event_id: string | null;
  guest_display_name?: string | null;
  guest_id: string | null;
  id: string;
  last_error: string | null;
  message_log_id: string;
  message_type: MessageType;
  project_id: string;
  scheduled_for: string | null;
  sending_mode: "api_ready" | "api_sent" | "guided_manual";
  status: MessageDeliveryStatus;
  updated_at: string;
};

export type MessageInvitationOption = {
  event_id: string;
  guest_display_name: string;
  guest_id: string;
  id: string;
  status: string;
};

type MessageInvitationStatus =
  | "failed"
  | "generated"
  | "needs_regeneration"
  | "resent"
  | "sent";

export type MarkGuidedManualMessageStatusResult = {
  messageLogId: string;
  projectId: string;
  status: MessageDeliveryStatus;
};

export type ProjectMessageOverview = {
  logs: MessageLogRow[];
  queueItems: MessageQueueItemRow[];
  templates: MessageTemplateRow[];
};

function toMessageTemplate(row: MessageTemplateRow): MessageTemplate {
  return {
    body: row.body,
    id: row.id,
    language: row.language,
    messageType: row.message_type,
    projectId: row.project_id,
    status: row.status,
    title: row.title,
    variables: row.variables,
    version: row.template_version,
  };
}

function asRecord(value: unknown, name: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new MessageValidationError(`${name} was not found.`);
  }

  return value as Record<string, unknown>;
}

function nullableString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function requireString(record: Record<string, unknown>, fieldName: string) {
  const value = record[fieldName];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new MessageValidationError(`${fieldName} is required.`);
  }

  return value;
}

async function fetchGuestDisplayNameMap(
  supabase: SupabaseClient,
  guestIds: string[],
) {
  const uniqueGuestIds = Array.from(new Set(guestIds));

  if (uniqueGuestIds.length === 0) {
    return new Map<string, string>();
  }

  const { data, error } = await supabase
    .from("guests")
    .select("id, display_name")
    .in("id", uniqueGuestIds);

  if (error) {
    throw error;
  }

  return new Map(
    (data ?? []).map((guest) => [
      guest.id as string,
      guest.display_name as string,
    ]),
  );
}

async function withGuestDisplayNames<T extends { guest_id: string | null }>(
  supabase: SupabaseClient,
  records: T[],
) {
  const guestNames = await fetchGuestDisplayNameMap(
    supabase,
    records
      .map((record) => record.guest_id)
      .filter((guestId): guestId is string => Boolean(guestId)),
  );

  return records.map((record) => ({
    ...record,
    guest_display_name: record.guest_id
      ? (guestNames.get(record.guest_id) ?? null)
      : null,
  }));
}

function parseInvitationStatus(value: string): MessageInvitationStatus {
  if (
    value === "failed" ||
    value === "generated" ||
    value === "needs_regeneration" ||
    value === "resent" ||
    value === "sent"
  ) {
    return value;
  }

  throw new MessageValidationError("Invitation status is not send-ready.");
}

function eventStartsAt(record: Record<string, unknown>) {
  const eventDate = nullableString(record.event_date);
  const startsAt = nullableString(record.starts_at);

  if (!eventDate) {
    return null;
  }

  return startsAt ? `${eventDate}T${startsAt}Z` : `${eventDate}T00:00:00Z`;
}

async function maybeSingleRecord<T>(
  promise: PromiseLike<{ data: T | null; error: unknown }>,
) {
  const { data, error } = await promise;

  if (error) {
    throw error;
  }

  return data;
}

export async function listProjectMessageInvitationOptions(
  supabase: SupabaseClient,
  projectId: string,
  limit = 100,
): Promise<MessageInvitationOption[]> {
  const { data, error } = await supabase
    .from("invitations")
    .select("id, guest_id, event_id, status")
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  const invitations = (data ?? []) as Array<
    Omit<MessageInvitationOption, "guest_display_name">
  >;
  const guestIds = Array.from(
    new Set(invitations.map((invitation) => invitation.guest_id)),
  );

  if (guestIds.length === 0) {
    return [];
  }

  const guestResult = await supabase
    .from("guests")
    .select("id, display_name")
    .eq("project_id", projectId)
    .in("id", guestIds);

  if (guestResult.error) {
    throw guestResult.error;
  }

  const guestNames = new Map(
    (
      (guestResult.data ?? []) as Array<{ display_name: string; id: string }>
    ).map((guest) => [guest.id, guest.display_name]),
  );

  return invitations.map((invitation) => ({
    ...invitation,
    guest_display_name:
      guestNames.get(invitation.guest_id) ?? invitation.guest_id,
  }));
}

export async function listProjectMessageTemplates(
  supabase: SupabaseClient,
  projectId: string,
): Promise<MessageTemplateRow[]> {
  const { data, error } = await supabase
    .from("message_templates")
    .select("*")
    .eq("project_id", projectId)
    .order("message_type", { ascending: true })
    .order("language", { ascending: true })
    .order("template_version", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as MessageTemplateRow[];
}

export async function createMessageTemplate(
  supabase: SupabaseClient,
  projectId: string,
  payload: unknown,
  actorUserId: string,
) {
  const input = parseCreateMessageTemplatePayload(payload);
  const status = input.status ?? "active";

  const { data, error } = await supabase
    .from("message_templates")
    .insert({
      approved_at: status === "active" ? new Date().toISOString() : null,
      approved_by: status === "active" ? actorUserId : null,
      body: input.body,
      created_by: actorUserId,
      language: input.language,
      message_type: input.messageType,
      project_id: projectId,
      status,
      title: input.title,
      updated_by: actorUserId,
      variables: input.variables ?? [],
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as MessageTemplateRow;
}

export async function listProjectMessageLogs(
  supabase: SupabaseClient,
  projectId: string,
  limit = 50,
): Promise<MessageLogRow[]> {
  const { data, error } = await supabase
    .from("message_logs")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return withGuestDisplayNames(supabase, (data ?? []) as MessageLogRow[]);
}

export async function listProjectMessageQueue(
  supabase: SupabaseClient,
  projectId: string,
  limit = 50,
): Promise<MessageQueueItemRow[]> {
  const { data, error } = await supabase
    .from("message_queue_items")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return withGuestDisplayNames(supabase, (data ?? []) as MessageQueueItemRow[]);
}

export async function getProjectMessageOverview(
  supabase: SupabaseClient,
  projectId: string,
): Promise<ProjectMessageOverview> {
  const [templates, logs, queueItems] = await Promise.all([
    listProjectMessageTemplates(supabase, projectId),
    listProjectMessageLogs(supabase, projectId, 25),
    listProjectMessageQueue(supabase, projectId, 25),
  ]);

  return { logs, queueItems, templates };
}

export async function getMessageLogDetails(
  supabase: SupabaseClient,
  projectId: string,
  messageLogId: string,
): Promise<MessageLogRow | null> {
  return maybeSingleRecord(
    supabase
      .from("message_logs")
      .select("*")
      .eq("project_id", projectId)
      .eq("id", messageLogId)
      .maybeSingle(),
  ) as Promise<MessageLogRow | null>;
}

async function getPreparationInput(
  supabase: SupabaseClient,
  projectId: string,
  payload: PrepareMessagePayload,
  actorUserId: string,
): Promise<MessagePreparationInput> {
  const [
    project,
    event,
    guest,
    templates,
    invitation,
    assignmentsResult,
    latestFileResult,
  ] = await Promise.all([
    maybeSingleRecord(
      supabase
        .from("wedding_projects")
        .select(
          "id, bride_name, groom_name, preferred_language, guest_page_access_status",
        )
        .eq("id", projectId)
        .maybeSingle(),
    ),
    maybeSingleRecord(
      supabase
        .from("events")
        .select("id, name, event_date, starts_at, venue_name, rsvp_deadline_at")
        .eq("project_id", projectId)
        .eq("id", payload.eventId)
        .maybeSingle(),
    ),
    maybeSingleRecord(
      supabase
        .from("guests")
        .select(
          "id, project_id, display_name, preferred_language, whatsapp_number, is_printed_only, is_active",
        )
        .eq("project_id", projectId)
        .eq("id", payload.guestId)
        .maybeSingle(),
    ),
    listProjectMessageTemplates(supabase, projectId),
    payload.invitationId
      ? maybeSingleRecord(
          supabase
            .from("invitations")
            .select("id, status")
            .eq("project_id", projectId)
            .eq("id", payload.invitationId)
            .maybeSingle(),
        )
      : Promise.resolve(null),
    supabase
      .from("guest_event_assignments")
      .select("event_id, invited")
      .eq("project_id", projectId)
      .eq("guest_id", payload.guestId),
    payload.invitationId
      ? supabase
          .from("invitation_files")
          .select("id")
          .eq("project_id", projectId)
          .eq("invitation_id", payload.invitationId)
          .eq("is_active", true)
          .order("version", { ascending: false })
          .limit(1)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const projectRecord = asRecord(project, "Project");
  const eventRecord = asRecord(event, "Event");
  const guestRecord = asRecord(guest, "Guest");

  if (assignmentsResult.error) {
    throw assignmentsResult.error;
  }

  if (latestFileResult.error) {
    throw latestFileResult.error;
  }

  const invitationRecord = invitation
    ? asRecord(invitation, "Invitation")
    : null;
  const latestFile = latestFileResult.data?.[0] as
    | { id?: string | null }
    | undefined;
  const projectName =
    [
      nullableString(projectRecord.bride_name),
      nullableString(projectRecord.groom_name),
    ]
      .map((name) => name?.trim())
      .filter((name): name is string => Boolean(name))
      .join(" & ") || "Unnamed Project";

  return {
    changeReason: payload.changeReason,
    event: {
      id: requireString(eventRecord, "id"),
      name: requireString(eventRecord, "name"),
      rsvpDeadlineAt: nullableString(eventRecord.rsvp_deadline_at),
      startsAt: eventStartsAt(eventRecord),
      venueName: nullableString(eventRecord.venue_name),
    },
    guest: {
      displayName: requireString(guestRecord, "display_name"),
      eventAssignments: (assignmentsResult.data ?? []).map((assignment) => ({
        eventId: assignment.event_id,
        invited: Boolean(assignment.invited),
      })),
      id: requireString(guestRecord, "id"),
      isActive: Boolean(guestRecord.is_active),
      isPrintedOnly: Boolean(guestRecord.is_printed_only),
      preferredLanguage: nullableString(guestRecord.preferred_language),
      projectId: requireString(guestRecord, "project_id"),
      whatsappNumber: nullableString(guestRecord.whatsapp_number),
    },
    invitation: invitationRecord
      ? {
          id: requireString(invitationRecord, "id"),
          latestActiveFileId: latestFile?.id ?? null,
          publicGuestPageLink: payload.publicGuestPageLink ?? null,
          status: parseInvitationStatus(
            requireString(invitationRecord, "status"),
          ),
        }
      : null,
    messageType: payload.messageType,
    paymentGate:
      projectRecord.guest_page_access_status === "locked"
        ? "locked"
        : "unlocked",
    preparedAt: new Date().toISOString(),
    preparedBy: actorUserId,
    project: {
      defaultLanguage: nullableString(projectRecord.preferred_language),
      id: requireString(projectRecord, "id"),
      name: projectName,
    },
    templates: templates.map(toMessageTemplate),
  };
}

export async function prepareProjectMessage(
  supabase: SupabaseClient,
  projectId: string,
  payload: unknown,
  actorUserId: string,
) {
  const input = await getPreparationInput(
    supabase,
    projectId,
    parsePrepareMessagePayload(payload),
    actorUserId,
  );
  const prepared = prepareCommunicationMessage(input);

  const { data, error } = await supabase.rpc("prepare_message_log_with_queue", {
    p_channel: prepared.channel,
    p_event_id: prepared.eventId,
    p_failure_reason: prepared.failureReason,
    p_guest_id: prepared.guestId,
    p_id: prepared.id,
    p_invitation_id: prepared.invitationId,
    p_language: prepared.language,
    p_manual_whatsapp_url: prepared.manualWhatsappUrl,
    p_message_type: prepared.messageType,
    p_metadata: { auditActions: prepared.auditActions },
    p_previous_message_log_id: prepared.previousMessageLogId,
    p_project_id: prepared.projectId,
    p_rendered_body: prepared.renderedBody,
    p_sending_mode: prepared.sendingMode,
    p_status: prepared.status,
    p_target_whatsapp_number: prepared.targetWhatsappNumber,
    p_template_id: prepared.templateId,
    p_template_version: prepared.templateVersion,
  });

  if (error) {
    throw error;
  }

  if (!data) {
    throw new MessageValidationError("Message log was not created.");
  }

  return data as MessageLogRow;
}

export async function markGuidedManualMessageStatus(
  supabase: SupabaseClient,
  projectId: string,
  messageLogId: string,
  status: MessageDeliveryStatus,
  reason?: string | null,
): Promise<MarkGuidedManualMessageStatusResult> {
  const messageLog = await getMessageLogDetails(
    supabase,
    projectId,
    messageLogId,
  );

  if (!messageLog) {
    throw new MessageValidationError("Message log was not found for project.");
  }

  const { data, error } = await supabase.rpc(
    "mark_guided_manual_message_status",
    {
      p_message_log_id: messageLogId,
      p_reason: reason ?? null,
      p_status: status,
    },
  );

  if (error) {
    throw error;
  }

  const result = data as MarkGuidedManualMessageStatusResult;

  if (result.projectId !== projectId) {
    throw new MessageValidationError("Message log project mismatch.");
  }

  return result;
}
