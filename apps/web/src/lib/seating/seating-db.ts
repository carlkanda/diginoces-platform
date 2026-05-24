import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildBulkTableInputs,
  buildTableCardCsv,
  buildTableCardCsvRows,
  calculateSeatingPlan,
  createExportStoragePath,
  createGeneratedExportFileName,
  parseBulkCreateTablesPayload,
  parseEventTablePayload,
  parseRemoveSeatingAssignmentPayload,
  parseSeatingAssignmentPayload,
  SeatingValidationError,
  type BulkCreateTablesInput,
  type EventTable,
  type EventTableInput,
  type PrintedInvitationStatus,
  type RsvpSeatingStatus,
  type SeatingAssignment,
  type SeatingAssignmentInput,
  type SeatingGuest,
  type SeatingPlanSummary,
} from "@/lib/seating/seating-service";

export type SeatingEventRow = {
  event_code: string;
  event_date: string | null;
  id: string;
  name: string;
  project_id: string;
};

export type SeatingProjectRow = {
  bride_name: string;
  groom_name: string;
  id: string;
  project_code: string;
};

export type EventTableRow = {
  assignment_mode: EventTable["assignmentMode"];
  capacity: number;
  description: string | null;
  display_order: number;
  event_id: string;
  id: string;
  notes: string | null;
  position_x: number | null;
  position_y: number | null;
  project_id: string;
  status: EventTable["status"];
  table_code: string;
  table_name: string;
};

export type GuestTableAssignmentRow = {
  event_id: string;
  guest_count_at_assignment: number | null;
  guest_id: string;
  id: string;
  seat_id: string | null;
  seating_notes: string | null;
  status: SeatingAssignment["status"];
  table_id: string;
  vip_protocol_notes: string | null;
};

export type SeatingExportFileRow = {
  created_at: string;
  created_by: string | null;
  csv_content: string | null;
  event_id: string;
  export_type: "table_cards_csv";
  filename: string;
  id: string;
  metadata: Record<string, unknown>;
  mime_type: "text/csv";
  project_id: string;
  row_count: number;
  status: "archived" | "failed" | "generated";
  storage_bucket: string;
  storage_path: string;
  updated_at: string;
  version: number;
};

export type EventSeatingOverview = {
  event: SeatingEventRow;
  exports: SeatingExportFileRow[];
  guests: SeatingGuest[];
  project: SeatingProjectRow;
  summary: SeatingPlanSummary;
  tables: EventTable[];
};

function toEventTable(row: EventTableRow): EventTable {
  return {
    assignmentMode: row.assignment_mode,
    capacity: row.capacity,
    description: row.description,
    displayOrder: row.display_order,
    eventId: row.event_id,
    id: row.id,
    notes: row.notes,
    positionX: row.position_x === null ? null : Number(row.position_x),
    positionY: row.position_y === null ? null : Number(row.position_y),
    projectId: row.project_id,
    status: row.status,
    tableCode: row.table_code,
    tableName: row.table_name,
  };
}

function toSeatingAssignment(row: GuestTableAssignmentRow): SeatingAssignment {
  return {
    eventId: row.event_id,
    guestCountAtAssignment: row.guest_count_at_assignment,
    guestId: row.guest_id,
    id: row.id,
    seatId: row.seat_id,
    seatingNotes: row.seating_notes,
    status: row.status,
    tableId: row.table_id,
    vipProtocolNotes: row.vip_protocol_notes,
  };
}

function requireRecord<T>(record: T | null, message: string): T {
  if (!record) {
    throw new SeatingValidationError(message);
  }

  return record;
}

function buildCoupleNames(project: SeatingProjectRow) {
  return `${project.bride_name} & ${project.groom_name}`;
}

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

export async function getSeatingEventContext(
  supabase: SupabaseClient,
  eventId: string,
) {
  const event = await maybeSingle<SeatingEventRow>(
    supabase
      .from("events")
      .select("id, project_id, name, event_code, event_date")
      .eq("id", eventId)
      .maybeSingle(),
  );

  return requireRecord(event, "Event was not found.");
}

async function listEventTables(
  supabase: SupabaseClient,
  projectId: string,
  eventId: string,
) {
  const rows = await fetchRows<EventTableRow>(
    supabase
      .from("event_tables")
      .select("*")
      .eq("project_id", projectId)
      .eq("event_id", eventId)
      .neq("status", "archived")
      .order("display_order", { ascending: true })
      .order("table_code", { ascending: true }),
  );

  return rows.map(toEventTable);
}

async function listActiveAssignments(
  supabase: SupabaseClient,
  projectId: string,
  eventId: string,
) {
  const rows = await fetchRows<GuestTableAssignmentRow>(
    supabase
      .from("guest_table_assignments")
      .select("*")
      .eq("project_id", projectId)
      .eq("event_id", eventId)
      .eq("status", "active"),
  );

  return rows.map(toSeatingAssignment);
}

export async function getEventSeatingOverview(
  supabase: SupabaseClient,
  eventId: string,
): Promise<EventSeatingOverview> {
  const event = await getSeatingEventContext(supabase, eventId);
  const projectId = event.project_id;

  const [
    project,
    tables,
    assignments,
    guestAssignments,
    titleTypes,
    rsvps,
    tagAssignments,
    tags,
    invitations,
    exports,
  ] = await Promise.all([
    maybeSingle<SeatingProjectRow>(
      supabase
        .from("wedding_projects")
        .select("id, project_code, bride_name, groom_name")
        .eq("id", projectId)
        .maybeSingle(),
    ),
    listEventTables(supabase, projectId, eventId),
    listActiveAssignments(supabase, projectId, eventId),
    fetchRows<{
      guest_id: string;
    }>(
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
      label: string;
    }>(
      supabase
        .from("guest_title_types")
        .select("id, label, default_guest_count")
        .eq("project_id", projectId),
    ),
    fetchRows<{
      guest_id: string;
      status: RsvpSeatingStatus;
    }>(
      supabase
        .from("rsvp_records")
        .select("guest_id, status")
        .eq("project_id", projectId)
        .eq("event_id", eventId),
    ),
    fetchRows<{
      guest_id: string;
      tag_id: string;
    }>(
      supabase
        .from("guest_tag_assignments")
        .select("guest_id, tag_id")
        .eq("project_id", projectId),
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
    fetchRows<{
      guest_id: string;
      printed_invitation_status: PrintedInvitationStatus;
      status: string;
    }>(
      supabase
        .from("invitations")
        .select("guest_id, status, printed_invitation_status")
        .eq("project_id", projectId)
        .eq("event_id", eventId),
    ),
    fetchRows<SeatingExportFileRow>(
      supabase
        .from("seating_export_files")
        .select("*")
        .eq("project_id", projectId)
        .eq("event_id", eventId)
        .order("created_at", { ascending: false })
        .limit(10),
    ),
  ]);

  const guestIds = guestAssignments.map((assignment) => assignment.guest_id);
  const guestRows =
    guestIds.length === 0
      ? []
      : await fetchRows<{
          display_name: string;
          guest_side: SeatingGuest["guestSide"];
          guest_title_type_id: string | null;
          id: string;
          is_printed_only: boolean;
        }>(
          supabase
            .from("guests")
            .select(
              "id, display_name, guest_side, guest_title_type_id, is_printed_only",
            )
            .eq("project_id", projectId)
            .eq("is_active", true)
            .in("id", guestIds)
            .order("display_name", { ascending: true }),
        );

  const titleTypeCountById = new Map(
    titleTypes.map((titleType) => [
      titleType.id,
      Math.max(titleType.default_guest_count, 1),
    ]),
  );
  const assignmentByGuestId = new Map(
    assignments.map((assignment) => [assignment.guestId, assignment]),
  );
  const rsvpByGuestId = new Map(
    rsvps.map((rsvp) => [rsvp.guest_id, rsvp.status]),
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

  const printedInvitationStatusByGuestId = new Map(
    invitations.map((invitation) => [
      invitation.guest_id,
      invitation.printed_invitation_status ?? "not_required",
    ]),
  );

  const guests: SeatingGuest[] = guestRows.map((guest) => {
    const tagNames = tagNamesByGuestId.get(guest.id) ?? [];
    const vipProtocol = tagNames.some((tagName) =>
      /vip|protocol/i.test(tagName),
    );
    const assignment = assignmentByGuestId.get(guest.id) ?? null;

    return {
      assignment,
      displayName: guest.display_name,
      guestCount: guest.guest_title_type_id
        ? (titleTypeCountById.get(guest.guest_title_type_id) ?? null)
        : null,
      guestSide: guest.guest_side,
      id: guest.id,
      isPrintedOnly: guest.is_printed_only,
      isVipProtocol: vipProtocol || Boolean(assignment?.vipProtocolNotes),
      printedInvitationStatus: printedInvitationStatusByGuestId.get(guest.id),
      rsvpStatus: rsvpByGuestId.get(guest.id) ?? "pending",
      specialSeatingNotes: assignment?.vipProtocolNotes ?? null,
      tagNames,
    };
  });
  const currentProject = requireRecord(project, "Project was not found.");

  return {
    event,
    exports,
    guests,
    project: currentProject,
    summary: calculateSeatingPlan({
      eventId,
      guests,
      projectId,
      tables,
    }),
    tables,
  };
}

export async function createEventTable(
  supabase: SupabaseClient,
  eventId: string,
  payload: unknown,
  actorUserId: string,
) {
  const input = parseEventTablePayload(payload);
  const event = await getSeatingEventContext(supabase, eventId);

  const { data, error } = await supabase
    .from("event_tables")
    .insert({
      assignment_mode: input.assignmentMode ?? "table_level",
      capacity: input.capacity,
      created_by: actorUserId,
      description: input.description ?? null,
      display_order: input.displayOrder ?? 0,
      event_id: eventId,
      notes: input.notes ?? null,
      position_x: input.positionX ?? null,
      position_y: input.positionY ?? null,
      project_id: event.project_id,
      status: input.status ?? "active",
      table_code: input.tableCode,
      table_name: input.tableName,
      updated_by: actorUserId,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return toEventTable(data as EventTableRow);
}

export async function updateEventTable(
  supabase: SupabaseClient,
  eventId: string,
  tableId: string,
  payload: unknown,
  actorUserId: string,
) {
  const input = parseEventTablePayload(payload);
  const event = await getSeatingEventContext(supabase, eventId);

  const { data, error } = await supabase
    .from("event_tables")
    .update({
      assignment_mode: input.assignmentMode ?? "table_level",
      capacity: input.capacity,
      description: input.description ?? null,
      display_order: input.displayOrder ?? 0,
      notes: input.notes ?? null,
      position_x: input.positionX ?? null,
      position_y: input.positionY ?? null,
      status: input.status ?? "active",
      table_code: input.tableCode,
      table_name: input.tableName,
      updated_by: actorUserId,
    })
    .eq("id", tableId)
    .eq("project_id", event.project_id)
    .eq("event_id", eventId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return toEventTable(data as EventTableRow);
}

export async function bulkCreateEventTables(
  supabase: SupabaseClient,
  eventId: string,
  payload: unknown,
  actorUserId: string,
) {
  const input: BulkCreateTablesInput = parseBulkCreateTablesPayload(payload);
  const event = await getSeatingEventContext(supabase, eventId);
  const tableInputs = buildBulkTableInputs(input);

  const { data, error } = await supabase
    .from("event_tables")
    .insert(
      tableInputs.map((tableInput: EventTableInput, index) => ({
        assignment_mode: tableInput.assignmentMode ?? "table_level",
        capacity: tableInput.capacity,
        created_by: actorUserId,
        display_order: tableInput.displayOrder ?? index,
        event_id: eventId,
        project_id: event.project_id,
        status: tableInput.status ?? "active",
        table_code: tableInput.tableCode,
        table_name: tableInput.tableName,
        updated_by: actorUserId,
      })),
    )
    .select("*");

  if (error) {
    throw error;
  }

  return ((data ?? []) as EventTableRow[]).map(toEventTable);
}

export async function assignGuestToEventTable(
  supabase: SupabaseClient,
  eventId: string,
  payload: unknown,
) {
  const input: SeatingAssignmentInput = parseSeatingAssignmentPayload(payload);
  const event = await getSeatingEventContext(supabase, eventId);
  const { data, error } = await supabase.rpc("assign_guest_to_event_table", {
    p_event_id: eventId,
    p_guest_id: input.guestId,
    p_project_id: event.project_id,
    p_seat_id: input.seatId ?? null,
    p_seating_notes: input.seatingNotes ?? null,
    p_table_id: input.tableId,
    p_vip_protocol_notes: input.vipProtocolNotes ?? null,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function removeGuestFromEventTable(
  supabase: SupabaseClient,
  eventId: string,
  payload: unknown,
) {
  const input = parseRemoveSeatingAssignmentPayload(payload);
  const event = await getSeatingEventContext(supabase, eventId);
  const { data, error } = await supabase.rpc("remove_guest_from_event_table", {
    p_event_id: eventId,
    p_guest_id: input.guestId,
    p_project_id: event.project_id,
    p_reason: input.reason ?? null,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function generateTableCardCsvExport(
  supabase: SupabaseClient,
  eventId: string,
  actorUserId: string,
) {
  const overview = await getEventSeatingOverview(supabase, eventId);
  const version =
    overview.exports.reduce((max, exportFile) => {
      return exportFile.export_type === "table_cards_csv"
        ? Math.max(max, exportFile.version)
        : max;
    }, 0) + 1;
  const rows = buildTableCardCsvRows({
    coupleNames: buildCoupleNames(overview.project),
    eventDate: overview.event.event_date,
    eventName: overview.event.name,
    projectCode: overview.project.project_code,
    summary: overview.summary,
  });
  const csvContent = buildTableCardCsv(rows);
  const filename = createGeneratedExportFileName({
    eventCode: overview.event.event_code,
    projectCode: overview.project.project_code,
    version,
  });
  const storagePath = createExportStoragePath({
    eventId,
    projectId: overview.project.id,
    version,
  });

  const { data, error } = await supabase
    .from("seating_export_files")
    .insert({
      created_by: actorUserId,
      csv_content: csvContent,
      event_id: eventId,
      export_type: "table_cards_csv",
      filename,
      metadata: {
        requirementIds: ["SEAT-011", "FILE-008"],
        tableCount: overview.tables.length,
      },
      project_id: overview.project.id,
      row_count: rows.length,
      storage_path: storagePath,
      version,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as SeatingExportFileRow;
}
