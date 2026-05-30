import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildOfflinePreloadDataset,
  calculateCheckInDashboardMetrics,
  CheckInValidationError,
  detectOfflineSyncConflicts,
  hashCheckInToken,
  parseCheckInDevicePayload,
  parseCheckInSettingsPayload,
  parsePerformCheckInPayload,
  parseUnexpectedGuestRequestPayload,
  parseUnexpectedGuestReviewPayload,
  searchCheckInGuests,
  tokenPreview,
  type CheckInDeviceInput,
  type CheckInGuest,
  type CheckInRecordLike,
  type CheckInSearchFilters,
  type CheckInSettingsInput,
  type CheckInSyncStatus,
  type OfflineCheckInPayload,
  type RsvpCheckInStatus,
  type UnexpectedGuestRequestLike,
} from "@/lib/check-in/check-in-service";

export type CheckInEventRow = {
  event_code: string;
  event_date: string | null;
  id: string;
  name: string;
  project_id: string;
  starts_at: string | null;
  venue_name: string | null;
};

export type CheckInProjectRow = {
  bride_name: string;
  groom_name: string;
  id: string;
  project_code: string;
};

export type CheckInSettingsRow = {
  allowed_methods: string[];
  enabled: boolean;
  ends_at: string | null;
  event_id: string;
  id: string;
  offline_preload_enabled: boolean;
  project_id: string;
  starts_at: string | null;
  status: "active" | "inactive";
  supervisor_approval_required: boolean;
  timezone: string;
  unexpected_guest_mode:
    | "disabled"
    | "manual_recording_only"
    | "supervisor_approval_required";
};

export type CheckInDeviceRow = {
  activity_count: number;
  assigned_staff_user_id: string | null;
  device_label: string | null;
  event_id: string;
  id: string;
  last_activity_at: string | null;
  mode: string;
  preload_status: "expired" | "failed" | "not_preloaded" | "preloaded";
  project_id: string;
  station_name: string;
  status: "active" | "inactive";
  sync_status: CheckInSyncStatus;
};

export type CheckInRecordRow = {
  arrival_count: number;
  attendance_after: number;
  attendance_before: number;
  checked_in_at: string;
  device_id: string | null;
  event_id: string;
  guest_id: string | null;
  id: string;
  is_duplicate_scan: boolean;
  method: CheckInRecordLike["method"];
  project_id: string;
  staff_user_id: string;
  sync_status: CheckInSyncStatus;
  total_expected_count: number;
  welcome_message_action: string;
};

export type UnexpectedGuestRequestRow = {
  approval_mode: "in_app" | "manual_external" | null;
  approved_arrival_count: number | null;
  created_at: string;
  decision_at: string | null;
  decision_reason: string | null;
  device_id: string | null;
  event_id: string;
  guest_side: "both" | "bride" | "groom" | null;
  id: string;
  project_id: string;
  reason: string | null;
  requested_by: string;
  requested_name: string;
  status: UnexpectedGuestRequestLike["status"];
  supervisor_user_id: string | null;
};

export type CheckInTokenCreationResult = {
  event_id: string;
  guest_id: string;
  project_id: string;
  token: string;
  token_id: string;
  token_preview: string;
};

export type CheckInOverview = {
  devices: CheckInDeviceRow[];
  event: CheckInEventRow;
  guests: CheckInGuest[];
  metrics: ReturnType<typeof calculateCheckInDashboardMetrics>;
  project: CheckInProjectRow;
  records: CheckInRecordRow[];
  settings: CheckInSettingsRow | null;
  syncConflictCount: number;
  unexpectedRequests: UnexpectedGuestRequestRow[];
};

type GuestRow = {
  display_name: string;
  guest_side: "both" | "bride" | "groom";
  guest_title_type_id: string | null;
  id: string;
  is_printed_only: boolean;
  whatsapp_number: string | null;
};

type InvitationRow = {
  guest_id: string;
  id: string;
  public_guest_token_id: string | null;
};

type TableAssignmentRow = {
  guest_id: string;
  table_id: string;
  vip_protocol_notes: string | null;
};

type EventTableRow = {
  id: string;
  table_code: string;
  table_name: string;
};

type GuestTagAssignmentRow = {
  guest_id: string;
  tag_id: string;
};

async function fetchRows<T>(
  promise: PromiseLike<{ data: T[] | null; error: unknown }>,
) {
  const { data, error } = await promise;

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function maybeSingle<T>(
  promise: PromiseLike<{ data: T | null; error: unknown }>,
) {
  const { data, error } = await promise;

  if (error) {
    throw error;
  }

  return data;
}

function requireRecord<T>(record: T | null, message: string): T {
  if (!record) {
    throw new Error(message);
  }

  return record;
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function asSettingsRow(row: CheckInSettingsRow): CheckInSettingsRow {
  return {
    ...row,
    allowed_methods: Array.isArray(row.allowed_methods)
      ? row.allowed_methods
      : [],
  };
}

export async function getCheckInEventContext(
  supabase: SupabaseClient,
  eventId: string,
) {
  const event = await maybeSingle<CheckInEventRow>(
    supabase
      .from("events")
      .select(
        "id, project_id, name, event_code, event_date, starts_at, venue_name",
      )
      .eq("id", eventId)
      .maybeSingle(),
  );

  return requireRecord(event, "Event was not found.");
}

async function listGuestRows(
  supabase: SupabaseClient,
  projectId: string,
  guestIds: string[],
) {
  if (guestIds.length === 0) {
    return [];
  }

  return (
    await Promise.all(
      chunkArray(guestIds, 500).map((ids) =>
        fetchRows<GuestRow>(
          supabase
            .from("guests")
            .select(
              "id, display_name, guest_side, guest_title_type_id, is_printed_only, whatsapp_number",
            )
            .eq("project_id", projectId)
            .eq("is_active", true)
            .in("id", ids),
        ),
      ),
    )
  ).flat();
}

async function listGuestTagAssignments(
  supabase: SupabaseClient,
  projectId: string,
  guestIds: string[],
) {
  if (guestIds.length === 0) {
    return [];
  }

  return (
    await Promise.all(
      chunkArray(guestIds, 500).map((ids) =>
        fetchRows<GuestTagAssignmentRow>(
          supabase
            .from("guest_tag_assignments")
            .select("guest_id, tag_id")
            .eq("project_id", projectId)
            .in("guest_id", ids),
        ),
      ),
    )
  ).flat();
}

function toRecordLike(row: CheckInRecordRow): CheckInRecordLike {
  return {
    arrivalCount: row.arrival_count,
    deviceId: row.device_id,
    guestId: row.guest_id,
    isDuplicateScan: row.is_duplicate_scan,
    method: row.method,
    staffUserId: row.staff_user_id,
    syncStatus: row.sync_status,
  };
}

export async function getCheckInOverview(
  supabase: SupabaseClient,
  eventId: string,
): Promise<CheckInOverview> {
  const event = await getCheckInEventContext(supabase, eventId);
  const projectId = event.project_id;

  const [
    project,
    settings,
    devices,
    guestAssignments,
    titleTypes,
    rsvps,
    invitations,
    activeTableAssignments,
    eventTables,
    tags,
    records,
    unexpectedRequests,
    syncConflicts,
  ] = await Promise.all([
    maybeSingle<CheckInProjectRow>(
      supabase
        .from("wedding_projects")
        .select("id, project_code, bride_name, groom_name")
        .eq("id", projectId)
        .maybeSingle(),
    ),
    maybeSingle<CheckInSettingsRow>(
      supabase
        .from("check_in_settings")
        .select("*")
        .eq("project_id", projectId)
        .eq("event_id", eventId)
        .maybeSingle(),
    ),
    fetchRows<CheckInDeviceRow>(
      supabase
        .from("check_in_devices")
        .select("*")
        .eq("project_id", projectId)
        .eq("event_id", eventId)
        .order("station_name", { ascending: true }),
    ),
    fetchRows<{ guest_id: string }>(
      supabase
        .from("guest_event_assignments")
        .select("guest_id")
        .eq("project_id", projectId)
        .eq("event_id", eventId)
        .eq("invited", true)
        .eq("status", "assigned"),
    ),
    fetchRows<{
      default_guest_count: number;
      id: string;
    }>(
      supabase
        .from("guest_title_types")
        .select("id, default_guest_count")
        .eq("project_id", projectId),
    ),
    fetchRows<{
      guest_id: string;
      status: RsvpCheckInStatus;
    }>(
      supabase
        .from("rsvp_records")
        .select("guest_id, status")
        .eq("project_id", projectId)
        .eq("event_id", eventId)
        .order("updated_at", { ascending: true }),
    ),
    fetchRows<InvitationRow>(
      supabase
        .from("invitations")
        .select("id, guest_id, public_guest_token_id")
        .eq("project_id", projectId)
        .eq("event_id", eventId),
    ),
    fetchRows<TableAssignmentRow>(
      supabase
        .from("guest_table_assignments")
        .select("guest_id, table_id, vip_protocol_notes")
        .eq("project_id", projectId)
        .eq("event_id", eventId)
        .eq("status", "active"),
    ),
    fetchRows<EventTableRow>(
      supabase
        .from("event_tables")
        .select("id, table_code, table_name")
        .eq("project_id", projectId)
        .eq("event_id", eventId)
        .neq("status", "archived"),
    ),
    fetchRows<{
      id: string;
      name: string;
      slug: string;
    }>(
      supabase
        .from("guest_tags")
        .select("id, name, slug")
        .eq("project_id", projectId),
    ),
    fetchRows<CheckInRecordRow>(
      supabase
        .from("check_in_records")
        .select("*")
        .eq("project_id", projectId)
        .eq("event_id", eventId)
        .order("checked_in_at", { ascending: false }),
    ),
    fetchRows<UnexpectedGuestRequestRow>(
      supabase
        .from("unexpected_guest_requests")
        .select("*")
        .eq("project_id", projectId)
        .eq("event_id", eventId)
        .order("created_at", { ascending: false }),
    ),
    fetchRows<{ id: string }>(
      supabase
        .from("check_in_sync_conflicts")
        .select("id")
        .eq("project_id", projectId)
        .eq("event_id", eventId)
        .eq("status", "open"),
    ),
  ]);

  const guestIds = guestAssignments.map((assignment) => assignment.guest_id);
  const [guestRows, tagAssignments] = await Promise.all([
    listGuestRows(supabase, projectId, guestIds),
    listGuestTagAssignments(supabase, projectId, guestIds),
  ]);
  const titleTypeCountById = new Map(
    titleTypes.map((titleType) => [
      titleType.id,
      Math.max(titleType.default_guest_count, 1),
    ]),
  );
  const rsvpByGuestId = new Map(
    rsvps.map((rsvp) => [rsvp.guest_id, rsvp.status]),
  );
  const invitationByGuestId = new Map(
    invitations.map((invitation) => [invitation.guest_id, invitation]),
  );
  const tableById = new Map(eventTables.map((table) => [table.id, table]));
  const assignmentByGuestId = new Map(
    activeTableAssignments.map((assignment) => [
      assignment.guest_id,
      assignment,
    ]),
  );
  const tagsById = new Map(tags.map((tag) => [tag.id, tag]));
  const tagNamesByGuestId = new Map<string, string[]>();

  for (const assignment of tagAssignments) {
    const tag = tagsById.get(assignment.tag_id);

    if (!tag) {
      continue;
    }

    const current = tagNamesByGuestId.get(assignment.guest_id) ?? [];
    current.push(tag.name || tag.slug);
    tagNamesByGuestId.set(assignment.guest_id, current);
  }

  const arrivalsByGuestId = new Map<string, number>();

  for (const record of records) {
    if (!record.guest_id || record.is_duplicate_scan) {
      continue;
    }

    arrivalsByGuestId.set(
      record.guest_id,
      (arrivalsByGuestId.get(record.guest_id) ?? 0) + record.arrival_count,
    );
  }

  const guests: CheckInGuest[] = guestRows
    .map((guest) => {
      const tableAssignment = assignmentByGuestId.get(guest.id) ?? null;
      const table = tableAssignment
        ? (tableById.get(tableAssignment.table_id) ?? null)
        : null;
      const tagNames = tagNamesByGuestId.get(guest.id) ?? [];
      const invitation = invitationByGuestId.get(guest.id) ?? null;
      const expectedCount = guest.guest_title_type_id
        ? (titleTypeCountById.get(guest.guest_title_type_id) ?? 1)
        : 1;
      const isVipProtocol =
        tagNames.some((tagName) => /vip|protocol/i.test(tagName)) ||
        Boolean(tableAssignment?.vip_protocol_notes);

      return {
        arrivedCount: arrivalsByGuestId.get(guest.id) ?? 0,
        displayName: guest.display_name,
        expectedCount,
        guestId: guest.id,
        guestSide: guest.guest_side,
        invitationId: invitation?.id ?? null,
        invitationPublicId: invitation?.public_guest_token_id ?? null,
        isPrintedOnly: guest.is_printed_only,
        isVipProtocol,
        phoneNumber: guest.whatsapp_number,
        rsvpStatus: rsvpByGuestId.get(guest.id) ?? "pending",
        specialInstruction: tableAssignment?.vip_protocol_notes ?? null,
        tableCode: table?.table_code ?? null,
        tableId: table?.id ?? null,
        tableName: table?.table_name ?? null,
        tags: tagNames,
      };
    })
    .sort((left, right) => left.displayName.localeCompare(right.displayName));

  const currentProject = requireRecord(project, "Project was not found.");
  const metrics = calculateCheckInDashboardMetrics({
    devices: devices.map((device) => ({
      id: device.id,
      stationName: device.station_name,
    })),
    guests,
    records: records.map(toRecordLike),
    syncConflictCount: syncConflicts.length,
    unexpectedRequests,
  });

  return {
    devices,
    event,
    guests,
    metrics,
    project: currentProject,
    records,
    settings: settings ? asSettingsRow(settings) : null,
    syncConflictCount: syncConflicts.length,
    unexpectedRequests,
  };
}

export async function upsertCheckInSettings(
  supabase: SupabaseClient,
  eventId: string,
  payload: unknown,
  actorUserId: string,
) {
  const event = await getCheckInEventContext(supabase, eventId);
  const input: CheckInSettingsInput = parseCheckInSettingsPayload(payload);
  const { data, error } = await supabase
    .from("check_in_settings")
    .upsert(
      {
        allowed_methods: input.allowedMethods ?? undefined,
        enabled: input.enabled ?? false,
        ends_at: input.endsAt ?? null,
        event_id: eventId,
        offline_preload_enabled: input.offlinePreloadEnabled ?? false,
        project_id: event.project_id,
        starts_at: input.startsAt ?? null,
        status: input.status ?? "active",
        supervisor_approval_required: input.supervisorApprovalRequired ?? true,
        timezone: input.timezone ?? "UTC",
        unexpected_guest_mode:
          input.unexpectedGuestMode ?? "supervisor_approval_required",
        updated_by: actorUserId,
      },
      { onConflict: "event_id" },
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as CheckInSettingsRow;
}

export async function upsertCheckInDevice(
  supabase: SupabaseClient,
  eventId: string,
  payload: unknown,
  actorUserId: string,
) {
  const event = await getCheckInEventContext(supabase, eventId);
  const body = payload && typeof payload === "object" ? payload : {};
  const input: CheckInDeviceInput = parseCheckInDevicePayload(payload);
  const deviceId =
    "deviceId" in body && typeof body.deviceId === "string"
      ? body.deviceId
      : null;
  const values = {
    assigned_staff_user_id: input.assignedStaffUserId ?? null,
    device_label: input.deviceLabel ?? null,
    event_id: eventId,
    mode: input.mode ?? "entrance",
    preload_status: input.preloadStatus ?? "not_preloaded",
    project_id: event.project_id,
    station_name: input.stationName,
    status: input.status ?? "active",
    sync_status: input.syncStatus ?? "online_synced",
    updated_by: actorUserId,
  };
  const query = deviceId
    ? supabase
        .from("check_in_devices")
        .update(values)
        .eq("id", deviceId)
        .eq("event_id", eventId)
    : supabase
        .from("check_in_devices")
        .insert({ ...values, created_by: actorUserId });
  const { data, error } = await query.select("*").single();

  if (error) {
    throw error;
  }

  return data as CheckInDeviceRow;
}

export async function createCheckInToken(
  supabase: SupabaseClient,
  eventId: string,
  guestId: string,
  invitationId?: string | null,
) {
  const { data, error } = await supabase.rpc("create_check_in_token", {
    p_event_id: eventId,
    p_guest_id: guestId,
    p_invitation_id: invitationId ?? null,
  });

  if (error) {
    throw error;
  }

  const rows = data as CheckInTokenCreationResult[];
  return rows[0] ?? null;
}

export async function resolveCheckInToken(
  supabase: SupabaseClient,
  eventId: string,
  token: string,
) {
  const { data, error } = await supabase.rpc("resolve_check_in_token", {
    p_event_id: eventId,
    p_token: token,
  });

  if (error) {
    throw error;
  }

  return data as Record<string, unknown>;
}

export async function performGuestCheckIn(
  supabase: SupabaseClient,
  eventId: string,
  payload: unknown,
) {
  const input = parsePerformCheckInPayload(payload);
  const { data, error } = await supabase.rpc("perform_guest_check_in", {
    p_arrival_count: input.arrivalCount,
    p_checked_in_at: input.checkedInAt ?? new Date().toISOString(),
    p_device_id: input.deviceId ?? null,
    p_event_id: eventId,
    p_guest_id: input.guestId,
    p_invitation_id: input.invitationId ?? null,
    p_method: input.method,
    p_notes: input.notes ?? null,
    p_source_offline_record_id: input.sourceOfflineRecordId ?? null,
    p_supervisor_override: input.supervisorOverride ?? false,
    p_sync_status: input.syncStatus,
    p_token_id: input.tokenId ?? null,
  });

  if (error) {
    throw error;
  }

  return data as Record<string, unknown>;
}

export async function searchEventCheckInGuests(
  supabase: SupabaseClient,
  eventId: string,
  filters: CheckInSearchFilters,
) {
  const overview = await getCheckInOverview(supabase, eventId);
  return searchCheckInGuests(overview.guests, filters);
}

export async function createUnexpectedGuestRequest(
  supabase: SupabaseClient,
  eventId: string,
  payload: unknown,
) {
  const input = parseUnexpectedGuestRequestPayload(payload);
  const { data, error } = await supabase.rpc(
    "create_unexpected_guest_request",
    {
      p_device_id: input.deviceId ?? null,
      p_event_id: eventId,
      p_guest_side: input.guestSide,
      p_reason: input.reason ?? null,
      p_requested_name: input.requestedName,
    },
  );

  if (error) {
    throw error;
  }

  return data as Record<string, unknown>;
}

export async function reviewUnexpectedGuestRequest(
  supabase: SupabaseClient,
  payload: unknown,
) {
  const input = parseUnexpectedGuestReviewPayload(payload);
  const { data, error } = await supabase.rpc(
    "review_unexpected_guest_request",
    {
      p_approval_mode: input.approvalMode,
      p_approved_arrival_count: input.approvedArrivalCount ?? null,
      p_decision_reason: input.decisionReason ?? null,
      p_next_status: input.status,
      p_request_id: input.requestId,
    },
  );

  if (error) {
    throw error;
  }

  return data as Record<string, unknown>;
}

export async function createPreloadSnapshot(
  supabase: SupabaseClient,
  eventId: string,
  payload: { deviceId?: string | null; expiresAt?: string | null } | undefined,
  actorUserId: string,
) {
  const overview = await getCheckInOverview(supabase, eventId);

  if (!overview.settings?.offline_preload_enabled) {
    throw new CheckInValidationError(
      "Offline preload is disabled for this event.",
    );
  }

  const generatedAt = new Date().toISOString();
  const dataset = buildOfflinePreloadDataset({
    eventId,
    generatedAt,
    guests: overview.guests,
    projectId: overview.project.id,
  });
  const payloadHash = hashCheckInToken(JSON.stringify(dataset));
  const { data, error } = await supabase
    .from("check_in_preload_snapshots")
    .insert({
      device_id: payload?.deviceId ?? null,
      event_id: eventId,
      expires_at: payload?.expiresAt ?? null,
      generated_by: actorUserId,
      guest_count: overview.guests.length,
      payload_hash: payloadHash,
      project_id: overview.project.id,
      token_count: 0,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return {
    dataset,
    snapshot: data,
  };
}

export async function submitOfflineSyncBatch(
  supabase: SupabaseClient,
  eventId: string,
  payload: {
    deviceId?: string | null;
    offlineRecords: OfflineCheckInPayload[];
  },
  actorUserId: string,
) {
  const mismatchedRecord = payload.offlineRecords.find(
    (record) => record.eventId !== eventId,
  );

  if (mismatchedRecord) {
    throw new CheckInValidationError(
      "Offline check-in records must match the sync batch event.",
    );
  }

  const overview = await getCheckInOverview(supabase, eventId);

  if (!overview.settings?.offline_preload_enabled) {
    throw new CheckInValidationError(
      "Offline sync is disabled for this event.",
    );
  }

  const existingArrivalsByGuestId = new Map(
    overview.guests.map((guest) => [guest.guestId, guest.arrivedCount]),
  );
  const totalExpectedByGuestId = new Map(
    overview.guests.map((guest) => [guest.guestId, guest.expectedCount]),
  );
  const conflicts = detectOfflineSyncConflicts({
    existingArrivalsByGuestId,
    offlineRecords: payload.offlineRecords,
    totalExpectedByGuestId,
  });
  const status = conflicts.length > 0 ? "partial_conflict" : "processed";
  const { data: batch, error: batchError } = await supabase.rpc(
    "submit_offline_check_in_sync_batch",
    {
      p_conflicts: conflicts.map((conflict) => ({
        conflictType: conflict.conflictType,
        guestId: conflict.guestId,
        offlineRecordId: conflict.offlineRecordId,
        reason: conflict.reason,
      })),
      p_device_id: payload.deviceId ?? null,
      p_event_id: eventId,
      p_metadata: {
        offlineRecordIds: payload.offlineRecords.map(
          (record) => record.offlineRecordId,
        ),
        submittedBy: actorUserId,
      },
      p_offline_records: payload.offlineRecords,
      p_status: status,
    },
  );

  if (batchError) {
    throw batchError;
  }

  const appliedRecords =
    batch &&
    typeof batch === "object" &&
    "appliedRecords" in batch &&
    Array.isArray(batch.appliedRecords)
      ? batch.appliedRecords
      : [];

  return {
    appliedRecords,
    batch,
    conflicts,
  };
}

export function buildManualCheckInTokenInsert(input: {
  eventId: string;
  guestId: string;
  invitationId?: string | null;
  projectId: string;
  token: string;
}) {
  return {
    event_id: input.eventId,
    guest_id: input.guestId,
    invitation_id: input.invitationId ?? null,
    project_id: input.projectId,
    token_hash: hashCheckInToken(input.token),
    token_preview: tokenPreview(input.token),
  };
}
