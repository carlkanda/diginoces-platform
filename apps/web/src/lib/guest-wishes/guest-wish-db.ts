import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildGuestBookCanvaCsv,
  buildGuestBookCanvaRows,
  parsePostEventFeedbackPayload,
  parsePublicGuestMessagePayload,
  type GuestBookCanvaRow,
  type GuestMessage,
  type GuestMessageStatus,
} from "@/lib/guest-wishes/guest-wish-service";

type AnySupabase = SupabaseClient;
type BaseRow = Record<string, unknown>;
type FeedbackRpcResponse = BaseRow & {
  id: string;
  project_id: string;
  review_status: string;
};
type GuestMessageRpcResponse = BaseRow & {
  id: string;
  project_id: string;
  status: string;
};

export type GuestMessageListRow = GuestMessage & {
  coupleNames: string | null;
  eventName: string | null;
};

export type GuestBookExportRow = {
  excludedCount: number;
  filename: string;
  generatedAt: string;
  id: string;
  isActive: boolean;
  rowCount: number;
  status: string;
  storagePath: string | null;
  version: number;
};

export type CoupleGuestMessageRow = {
  approvedText: string | null;
  coupleComment: string | null;
  currentText: string | null;
  guestDisplayName: string;
  id: string;
  status: GuestMessageStatus;
  submittedAt: string;
};

export type PostEventFeedbackRow = {
  feedbackText: string;
  id: string;
  improvementSuggestions: string | null;
  invitationCommunicationRating: number | null;
  overallRating: number;
  publicDisplayName: string | null;
  reviewStatus: string;
  serviceQualityRating: number | null;
  submittedAt: string;
  testimonialPermissionGranted: boolean;
  testimonialText: string | null;
};

export type PublicGuestMessageResponse =
  | {
      status:
        | "deadline_passed"
        | "invalid"
        | "invalid_message_text"
        | "manual_printed_only"
        | "not_invited"
        | "payment_gate_locked";
    }
  | {
      messageId: string;
      mode: "created" | "updated";
      status: "saved";
    };

async function listRows<T extends BaseRow>(
  query: PromiseLike<{ data: T[] | null; error: unknown }>,
) {
  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data ?? [];
}

function table(supabase: AnySupabase, name: string) {
  return supabase.from(name);
}

function requireRpcRow<T extends BaseRow>(
  value: unknown,
  operation: string,
  requiredStringKeys: string[],
) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${operation} returned an invalid response.`);
  }

  const row = value as BaseRow;

  for (const key of requiredStringKeys) {
    if (typeof row[key] !== "string") {
      throw new Error(`${operation} returned an invalid response.`);
    }
  }

  return row as T;
}

function stringOrNull(value: unknown) {
  return typeof value === "string" ? value : null;
}

function statusOrPending(value: unknown): GuestMessageStatus {
  if (
    value === "admin_approved" ||
    value === "admin_edited" ||
    value === "archived" ||
    value === "couple_approved" ||
    value === "couple_correction_requested" ||
    value === "excluded" ||
    value === "exported" ||
    value === "flagged" ||
    value === "pending_review"
  ) {
    return value;
  }

  return "pending_review";
}

function mapGuestMessageRow(
  row: BaseRow,
  guestsById: Map<string, BaseRow>,
  eventsById: Map<string, BaseRow>,
  coupleNames: string | null,
  projectCode: string,
): GuestMessageListRow {
  const guestId = String(row.guest_id);
  const eventId = stringOrNull(row.event_id);
  const guest = guestsById.get(guestId);
  const event = eventId ? eventsById.get(eventId) : undefined;

  return {
    approvedText: stringOrNull(row.approved_text),
    coupleComment: stringOrNull(row.couple_comment),
    coupleReviewedAt: stringOrNull(row.couple_reviewed_at),
    coupleNames,
    currentText: String(row.current_text ?? ""),
    eventId,
    eventName: event ? String(event.name ?? "") : null,
    exportedAt: stringOrNull(row.exported_at),
    guestDisplayName: String(guest?.display_name ?? "Unknown guest"),
    guestId,
    id: String(row.id),
    internalModerationNote: stringOrNull(row.internal_moderation_note),
    language: String(row.submitted_language ?? "fr"),
    originalText: String(row.original_text ?? ""),
    projectCode,
    projectId: String(row.project_id),
    status: statusOrPending(row.status),
    submittedAt: String(row.submitted_at),
  };
}

export async function listProjectGuestMessages(
  supabase: AnySupabase,
  projectId: string,
  options: {
    status?: GuestMessageStatus;
  } = {},
) {
  let messageQuery = table(supabase, "guest_messages")
    .select("*")
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });

  if (options.status) {
    messageQuery = messageQuery.eq("status", options.status);
  }

  const [projectRows, messageRows, guestRows, eventRows] = await Promise.all([
    listRows<BaseRow>(
      table(supabase, "wedding_projects")
        .select("bride_name, groom_name, project_code")
        .eq("id", projectId)
        .limit(1),
    ),
    listRows<BaseRow>(messageQuery),
    listRows<BaseRow>(
      table(supabase, "guests")
        .select("id, display_name")
        .eq("project_id", projectId),
    ),
    listRows<BaseRow>(
      table(supabase, "events").select("id, name").eq("project_id", projectId),
    ),
  ]);
  const project = projectRows[0];
  const projectCode = String(project?.project_code ?? "");
  const brideName = stringOrNull(project?.bride_name);
  const groomName = stringOrNull(project?.groom_name);
  const coupleNames =
    brideName && groomName
      ? `${brideName} & ${groomName}`
      : (brideName ?? groomName);
  const guestsById = new Map(guestRows.map((row) => [String(row.id), row]));
  const eventsById = new Map(eventRows.map((row) => [String(row.id), row]));

  return messageRows.map((row) =>
    mapGuestMessageRow(row, guestsById, eventsById, coupleNames, projectCode),
  );
}

export async function listCoupleGuestMessages(
  supabase: AnySupabase,
  projectId: string,
) {
  const { data, error } = await supabase.rpc("list_couple_guest_messages", {
    p_project_id: projectId,
  });

  if (error) {
    throw error;
  }

  const rows = Array.isArray(data) ? (data as BaseRow[]) : [];

  return rows.map(
    (row): CoupleGuestMessageRow => ({
      approvedText: stringOrNull(row.approved_text),
      coupleComment: stringOrNull(row.couple_comment),
      currentText: null,
      guestDisplayName: String(row.guest_display_name ?? "Unknown guest"),
      id: String(row.id),
      status: statusOrPending(row.status),
      submittedAt: String(row.submitted_at ?? ""),
    }),
  );
}

export async function listGuestMessagesForPermissions(
  supabase: AnySupabase,
  projectId: string,
  permissions: {
    canModerateMessages: boolean;
    canReviewAsCouple: boolean;
  },
) {
  if (permissions.canModerateMessages) {
    return listProjectGuestMessages(supabase, projectId);
  }

  if (permissions.canReviewAsCouple) {
    return listCoupleGuestMessages(supabase, projectId);
  }

  return [];
}

export async function listGuestBookExports(
  supabase: AnySupabase,
  projectId: string,
) {
  const rows = await listRows<BaseRow>(
    table(supabase, "guest_book_exports")
      .select("*")
      .eq("project_id", projectId)
      .order("version", { ascending: false }),
  );

  return rows.map(
    (row): GuestBookExportRow => ({
      excludedCount: Number(row.excluded_count ?? 0),
      filename: String(row.filename ?? ""),
      generatedAt: String(row.generated_at ?? row.created_at ?? ""),
      id: String(row.id),
      isActive: row.is_active === true,
      rowCount: Number(row.row_count ?? 0),
      status: String(row.status ?? "generated"),
      storagePath: stringOrNull(row.storage_path),
      version: Number(row.version ?? 0),
    }),
  );
}

export async function listPostEventFeedback(
  supabase: AnySupabase,
  projectId: string,
) {
  const rows = await listRows<BaseRow>(
    table(supabase, "post_event_feedback")
      .select("*")
      .eq("project_id", projectId)
      .order("submitted_at", { ascending: false }),
  );

  return rows.map(
    (row): PostEventFeedbackRow => ({
      feedbackText: String(row.feedback_text ?? ""),
      id: String(row.id),
      improvementSuggestions: stringOrNull(row.improvement_suggestions),
      invitationCommunicationRating:
        typeof row.invitation_communication_rating === "number"
          ? row.invitation_communication_rating
          : null,
      overallRating: Number(row.overall_rating ?? 0),
      publicDisplayName: stringOrNull(row.public_display_name),
      reviewStatus: String(row.review_status ?? "pending"),
      serviceQualityRating:
        typeof row.service_quality_rating === "number"
          ? row.service_quality_rating
          : null,
      submittedAt: String(row.submitted_at ?? ""),
      testimonialPermissionGranted: row.testimonial_permission_granted === true,
      testimonialText: stringOrNull(row.testimonial_text),
    }),
  );
}

function isPublicGuestMessageResponse(
  value: unknown,
): value is PublicGuestMessageResponse {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const row = value as Record<string, unknown>;

  if (row.status === "saved") {
    return (
      typeof row.messageId === "string" &&
      (row.mode === "created" || row.mode === "updated")
    );
  }

  return [
    "deadline_passed",
    "invalid",
    "invalid_message_text",
    "manual_printed_only",
    "not_invited",
    "payment_gate_locked",
  ].includes(String(row.status));
}

export async function submitPublicGuestMessage(
  supabase: AnySupabase,
  token: string,
  value: unknown,
) {
  const input = parsePublicGuestMessagePayload(value);
  const { data, error } = await supabase.rpc("submit_public_guest_message", {
    p_event_id: null,
    p_language: input.language,
    p_message_text: input.messageText,
    p_token: token,
  });

  if (error) {
    throw error;
  }

  if (!isPublicGuestMessageResponse(data)) {
    throw new Error("Invalid public guest message response returned.");
  }

  return data;
}

export async function reviewGuestMessage(
  supabase: AnySupabase,
  input: {
    action: string;
    approvedText?: string | null;
    internalNote?: string | null;
    messageId: string;
  },
) {
  const { data, error } = await supabase.rpc("review_guest_message", {
    p_action: input.action,
    p_approved_text: input.approvedText ?? null,
    p_internal_note: input.internalNote ?? null,
    p_message_id: input.messageId,
  });

  if (error) {
    throw error;
  }

  return requireRpcRow<GuestMessageRpcResponse>(data, "review_guest_message", [
    "id",
    "project_id",
    "status",
  ]);
}

export async function coupleReviewGuestMessageRecord(
  supabase: AnySupabase,
  input: {
    action: string;
    comment?: string | null;
    messageId: string;
  },
) {
  const { data, error } = await supabase.rpc("couple_review_guest_message", {
    p_action: input.action,
    p_comment: input.comment ?? null,
    p_message_id: input.messageId,
  });

  if (error) {
    throw error;
  }

  return requireRpcRow<GuestMessageRpcResponse>(
    data,
    "couple_review_guest_message",
    ["id", "project_id", "status"],
  );
}

export async function generateGuestBookExport(
  supabase: AnySupabase,
  projectId: string,
) {
  const messages = await listProjectGuestMessages(supabase, projectId, {
    status: "couple_approved",
  });
  const rows: GuestBookCanvaRow[] = buildGuestBookCanvaRows(messages);
  const csv = buildGuestBookCanvaCsv(rows);
  const { data, error } = await supabase.rpc("create_guest_book_export", {
    p_project_id: projectId,
  });

  if (error) {
    throw error;
  }

  const exportRecord = data as BaseRow | null;

  if (!exportRecord) {
    throw new Error("Guest book export creation returned no record.");
  }

  const databaseRowCount = Number(exportRecord.row_count);

  return {
    csv,
    exportRecord,
    filename:
      typeof exportRecord?.filename === "string"
        ? String(exportRecord.filename)
        : "guest-book-messages.csv",
    rowCount: Number.isFinite(databaseRowCount)
      ? databaseRowCount
      : rows.length,
  };
}

export async function submitPostEventFeedback(
  supabase: AnySupabase,
  projectId: string,
  value: unknown,
) {
  const input = parsePostEventFeedbackPayload(value);
  const { data, error } = await supabase.rpc("submit_post_event_feedback", {
    p_feedback_text: input.feedbackText,
    p_improvement_suggestions: input.improvementSuggestions,
    p_invitation_communication_rating: input.invitationCommunicationRating,
    p_overall_rating: input.overallRating,
    p_project_id: projectId,
    p_public_display_name: input.publicDisplayName,
    p_service_quality_rating: input.serviceQualityRating,
    p_testimonial_permission_granted: input.testimonialPermissionGranted,
    p_testimonial_text: input.testimonialText,
  });

  if (error) {
    throw error;
  }

  return requireRpcRow<FeedbackRpcResponse>(
    data,
    "submit_post_event_feedback",
    ["id", "project_id", "review_status"],
  );
}

export async function reviewPostEventFeedback(
  supabase: AnySupabase,
  input: {
    feedbackId: string;
    internalReviewNote?: string | null;
    reviewStatus: string;
  },
) {
  const { data, error } = await supabase.rpc("review_post_event_feedback", {
    p_feedback_id: input.feedbackId,
    p_internal_review_note: input.internalReviewNote ?? null,
    p_review_status: input.reviewStatus,
  });

  if (error) {
    throw error;
  }

  return requireRpcRow<FeedbackRpcResponse>(
    data,
    "review_post_event_feedback",
    ["id", "project_id", "review_status"],
  );
}
