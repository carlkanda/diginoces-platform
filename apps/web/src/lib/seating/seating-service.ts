import { randomUUID } from "node:crypto";
import { hasScopedPermission } from "@/lib/projects/project-permissions";
import type {
  PermissionSlug,
  RoleAssignment,
} from "@/lib/security/permissions";

export class SeatingValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SeatingValidationError";
  }
}

export type SeatingAssignmentMode = "mixed" | "seat_level" | "table_level";
export type EventTableStatus = "active" | "archived" | "draft" | "locked";
export type GuestTableAssignmentStatus = "active" | "removed";
export type RsvpSeatingStatus =
  | "locked"
  | "manual_review"
  | "maybe"
  | "no"
  | "pending"
  | "yes";
export type GuestSide = "both" | "bride" | "groom";
export type PrintedInvitationStatus =
  | "cancelled"
  | "delivered"
  | "not_required"
  | "pending_print"
  | "printed"
  | "ready_for_print";

export type EventTableInput = {
  assignmentMode?: SeatingAssignmentMode;
  capacity: number;
  description?: string | null;
  displayOrder?: number;
  notes?: string | null;
  positionX?: number | null;
  positionY?: number | null;
  status?: EventTableStatus;
  tableCode: string;
  tableName: string;
};

export type BulkCreateTablesInput = {
  assignmentMode?: SeatingAssignmentMode;
  capacity: number;
  count: number;
  startNumber?: number;
  tableCodePrefix?: string;
  tableNamePrefix?: string;
};

export type SeatingAssignmentInput = {
  guestId: string;
  seatId?: string | null;
  seatingNotes?: string | null;
  tableId: string;
  vipProtocolNotes?: string | null;
};

export type EventTable = {
  assignmentMode: SeatingAssignmentMode;
  capacity: number;
  description: string | null;
  displayOrder: number;
  eventId: string;
  id: string;
  notes: string | null;
  positionX: number | null;
  positionY: number | null;
  projectId: string;
  status: EventTableStatus;
  tableCode: string;
  tableName: string;
};

export type SeatingAssignment = {
  eventId: string;
  guestCountAtAssignment: number | null;
  guestId: string;
  id: string;
  seatId: string | null;
  seatingNotes: string | null;
  status: GuestTableAssignmentStatus;
  tableId: string;
  vipProtocolNotes: string | null;
};

export type SeatingGuest = {
  assignment?: SeatingAssignment | null;
  displayName: string;
  guestCount: number | null;
  guestSide: GuestSide;
  id: string;
  isPrintedOnly: boolean;
  isVipProtocol: boolean;
  printedInvitationStatus?: PrintedInvitationStatus;
  rsvpStatus: RsvpSeatingStatus;
  specialSeatingNotes?: string | null;
  tagNames: string[];
};

export type TableOccupancySummary = {
  activeGuestCount: number;
  assignedGuestCount: number;
  assignedGuests: SeatingGuest[];
  capacity: number;
  isFull: boolean;
  isOverCapacity: boolean;
  overCapacityBy: number;
  remainingCapacity: number;
  table: EventTable;
};

export type SeatingPlanSummary = {
  capacity: number;
  eventId: string;
  overCapacityTables: number;
  projectId: string;
  tableSummaries: TableOccupancySummary[];
  totalActiveOccupancy: number;
  unassignedGuests: SeatingGuest[];
  warnings: string[];
};

export type TableCardCsvRow = {
  activeGuestCount: number;
  capacity: number;
  coupleNames: string;
  eventDate: string;
  eventName: string;
  guestDisplayNames: string;
  projectCode: string;
  tableCode: string;
  tableDescription: string;
  tableName: string;
  vipProtocolMarker: string;
};

export type SeatingAction = "assign" | "export" | "read" | "tables.manage";

const seatingActionPermissions: Record<SeatingAction, PermissionSlug> = {
  assign: "seating.assign",
  export: "seating.export",
  read: "seating.read",
  "tables.manage": "seating.tables.manage",
};

const assignmentModes = new Set<SeatingAssignmentMode>([
  "mixed",
  "seat_level",
  "table_level",
]);
const tableStatuses = new Set<EventTableStatus>([
  "active",
  "archived",
  "draft",
  "locked",
]);
const guestSides = new Set<GuestSide>(["both", "bride", "groom"]);

function asRecord(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new SeatingValidationError("Request body must be a JSON object.");
  }

  return payload as Record<string, unknown>;
}

function requiredText(value: unknown, fieldName: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new SeatingValidationError(`${fieldName} is required.`);
  }

  return value.trim();
}

function optionalText(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new SeatingValidationError("Optional text fields must be strings.");
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function requiredPositiveInteger(value: unknown, fieldName: string) {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new SeatingValidationError(
      `${fieldName} must be a positive integer.`,
    );
  }

  return value;
}

function optionalNonNegativeInteger(value: unknown, fieldName: string) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new SeatingValidationError(
      `${fieldName} must be a non-negative integer.`,
    );
  }

  return value;
}

function optionalPositiveInteger(value: unknown, fieldName: string) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  return requiredPositiveInteger(value, fieldName);
}

function optionalNumber(value: unknown, fieldName: string) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new SeatingValidationError(`${fieldName} must be a number.`);
  }

  return value;
}

function optionalAssignmentMode(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (
    typeof value === "string" &&
    assignmentModes.has(value as SeatingAssignmentMode)
  ) {
    return value as SeatingAssignmentMode;
  }

  throw new SeatingValidationError("assignmentMode is not supported.");
}

function optionalTableStatus(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (
    typeof value === "string" &&
    tableStatuses.has(value as EventTableStatus)
  ) {
    return value as EventTableStatus;
  }

  throw new SeatingValidationError("status is not supported.");
}

export function parseEventTablePayload(payload: unknown): EventTableInput {
  const body = asRecord(payload);

  return {
    assignmentMode: optionalAssignmentMode(body.assignmentMode),
    capacity: requiredPositiveInteger(body.capacity, "capacity"),
    description: optionalText(body.description),
    displayOrder: optionalNonNegativeInteger(body.displayOrder, "displayOrder"),
    notes: optionalText(body.notes),
    positionX: optionalNumber(body.positionX, "positionX"),
    positionY: optionalNumber(body.positionY, "positionY"),
    status: optionalTableStatus(body.status),
    tableCode: requiredText(body.tableCode, "tableCode"),
    tableName: requiredText(body.tableName, "tableName"),
  };
}

export function parseBulkCreateTablesPayload(
  payload: unknown,
): BulkCreateTablesInput {
  const body = asRecord(payload);

  return {
    assignmentMode: optionalAssignmentMode(body.assignmentMode),
    capacity: requiredPositiveInteger(body.capacity, "capacity"),
    count: requiredPositiveInteger(body.count, "count"),
    startNumber: optionalPositiveInteger(body.startNumber, "startNumber"),
    tableCodePrefix:
      optionalText(body.tableCodePrefix) ??
      optionalText(body.tablePrefix) ??
      undefined,
    tableNamePrefix: optionalText(body.tableNamePrefix) ?? undefined,
  };
}

export function parseSeatingAssignmentPayload(
  payload: unknown,
): SeatingAssignmentInput {
  const body = asRecord(payload);

  return {
    guestId: requiredText(body.guestId, "guestId"),
    seatId: optionalText(body.seatId),
    seatingNotes: optionalText(body.seatingNotes),
    tableId: requiredText(body.tableId, "tableId"),
    vipProtocolNotes: optionalText(body.vipProtocolNotes),
  };
}

export function parseRemoveSeatingAssignmentPayload(payload: unknown) {
  const body = asRecord(payload);

  return {
    guestId: requiredText(body.guestId, "guestId"),
    reason: optionalText(body.reason),
  };
}

export function buildBulkTableInputs(input: BulkCreateTablesInput) {
  const startNumber = input.startNumber ?? 1;
  const codePrefix = input.tableCodePrefix ?? "T";
  const namePrefix = input.tableNamePrefix ?? "Table";

  return Array.from({ length: input.count }, (_, index): EventTableInput => {
    const tableNumber = startNumber + index;

    return {
      assignmentMode: input.assignmentMode ?? "table_level",
      capacity: input.capacity,
      displayOrder: index,
      tableCode: `${codePrefix}${tableNumber}`,
      tableName: `${namePrefix} ${tableNumber}`,
    };
  });
}

export function isGuestActiveForSeating(status: RsvpSeatingStatus) {
  return status !== "no";
}

export function getGuestOccupancyUnits(guest: SeatingGuest) {
  if (guest.guestCount === null || guest.guestCount <= 0) {
    return {
      units: 1,
      warning: "Guest count was missing or invalid; defaulted to 1.",
    };
  }

  return {
    units: guest.guestCount,
    warning: null,
  };
}

export function calculateSeatingPlan(input: {
  eventId: string;
  guests: SeatingGuest[];
  projectId: string;
  tables: EventTable[];
}): SeatingPlanSummary {
  const guestsByTable = new Map<string, SeatingGuest[]>();
  const unassignedGuests: SeatingGuest[] = [];
  const warnings = input.guests.flatMap((guest) => {
    const { warning } = getGuestOccupancyUnits(guest);

    return warning ? [`${guest.displayName}: ${warning}`] : [];
  });

  for (const guest of input.guests) {
    if (guest.assignment?.status === "active") {
      const current = guestsByTable.get(guest.assignment.tableId) ?? [];
      current.push(guest);
      guestsByTable.set(guest.assignment.tableId, current);
    } else {
      unassignedGuests.push(guest);
    }
  }

  const tableSummaries = input.tables.map((table) => {
    const assignedGuests = guestsByTable.get(table.id) ?? [];
    const activeGuestCount = assignedGuests
      .filter((guest) => isGuestActiveForSeating(guest.rsvpStatus))
      .reduce((total, guest) => total + getGuestOccupancyUnits(guest).units, 0);
    const assignedGuestCount = assignedGuests.reduce(
      (total, guest) => total + getGuestOccupancyUnits(guest).units,
      0,
    );
    const remainingCapacity = table.capacity - activeGuestCount;
    const overCapacityBy = Math.max(activeGuestCount - table.capacity, 0);

    return {
      activeGuestCount,
      assignedGuestCount,
      assignedGuests,
      capacity: table.capacity,
      isFull: remainingCapacity <= 0,
      isOverCapacity: overCapacityBy > 0,
      overCapacityBy,
      remainingCapacity,
      table,
    };
  });

  return {
    capacity: input.tables.reduce((total, table) => total + table.capacity, 0),
    eventId: input.eventId,
    overCapacityTables: tableSummaries.filter(
      (summary) => summary.overCapacityBy > 0,
    ).length,
    projectId: input.projectId,
    tableSummaries,
    totalActiveOccupancy: tableSummaries.reduce(
      (total, summary) => total + summary.activeGuestCount,
      0,
    ),
    unassignedGuests: unassignedGuests.filter((guest) =>
      isGuestActiveForSeating(guest.rsvpStatus),
    ),
    warnings,
  };
}

export function filterUnassignedGuests(
  guests: SeatingGuest[],
  filters: {
    guestSide?: GuestSide | "all";
    printedOnly?: boolean;
    rsvpStatus?: RsvpSeatingStatus | "all";
    vipOnly?: boolean;
  } = {},
) {
  return guests.filter((guest) => {
    if (guest.assignment?.status === "active") {
      return false;
    }

    if (!isGuestActiveForSeating(guest.rsvpStatus)) {
      return false;
    }

    if (filters.vipOnly && !guest.isVipProtocol) {
      return false;
    }

    if (
      filters.guestSide &&
      filters.guestSide !== "all" &&
      guest.guestSide !== filters.guestSide
    ) {
      return false;
    }

    if (
      filters.rsvpStatus &&
      filters.rsvpStatus !== "all" &&
      guest.rsvpStatus !== filters.rsvpStatus
    ) {
      return false;
    }

    if (
      filters.printedOnly !== undefined &&
      guest.isPrintedOnly !== filters.printedOnly
    ) {
      return false;
    }

    return true;
  });
}

export function validateSeatingAssignmentCompatibility(input: {
  eventGuestIds: string[];
  guestId: string;
  table: EventTable;
}) {
  if (input.table.status === "archived") {
    throw new SeatingValidationError("Archived tables cannot receive guests.");
  }

  if (!input.eventGuestIds.includes(input.guestId)) {
    throw new SeatingValidationError(
      "Guest must be invited to the selected event before seating.",
    );
  }
}

export function canPerformSeatingAction(
  assignments: RoleAssignment[],
  projectId: string,
  action: SeatingAction,
) {
  return hasScopedPermission(assignments, seatingActionPermissions[action], {
    projectId,
    scope: "project",
  });
}

export function canAssignGuestSide(
  assignments: RoleAssignment[],
  projectId: string,
  side: GuestSide,
) {
  if (canPerformSeatingAction(assignments, projectId, "tables.manage")) {
    return true;
  }

  if (!canPerformSeatingAction(assignments, projectId, "assign")) {
    return false;
  }

  if (
    hasScopedPermission(assignments, "guests.update", {
      projectId,
      scope: "project",
    })
  ) {
    return true;
  }

  if (side === "bride") {
    return hasScopedPermission(assignments, "guests.manage_bride_side", {
      projectId,
      scope: "project",
    });
  }

  if (side === "groom") {
    return hasScopedPermission(assignments, "guests.manage_groom_side", {
      projectId,
      scope: "project",
    });
  }

  return (
    hasScopedPermission(assignments, "guests.manage_bride_side", {
      projectId,
      scope: "project",
    }) &&
    hasScopedPermission(assignments, "guests.manage_groom_side", {
      projectId,
      scope: "project",
    })
  );
}

function csvEscape(value: string | number) {
  let text = String(value);
  const formulaMatch = /^([\t\r\n]*)([=+\-@])/.exec(text);
  const needsFormulaNeutralization = formulaMatch !== null;

  if (formulaMatch) {
    const leadingControlCharacters = formulaMatch[1] ?? "";
    text = `${leadingControlCharacters}'${text.slice(
      leadingControlCharacters.length,
    )}`;
  }

  if (!needsFormulaNeutralization && !/[",\n\r]/.test(text)) {
    return text;
  }

  return `"${text.replaceAll('"', '""')}"`;
}

export function buildTableCardCsvRows(input: {
  coupleNames: string;
  eventDate: string | null;
  eventName: string;
  projectCode: string;
  summary: SeatingPlanSummary;
}): TableCardCsvRow[] {
  return input.summary.tableSummaries.map((summary) => {
    const activeGuests = summary.assignedGuests.filter((guest) =>
      isGuestActiveForSeating(guest.rsvpStatus),
    );

    return {
      activeGuestCount: summary.activeGuestCount,
      capacity: summary.capacity,
      coupleNames: input.coupleNames,
      eventDate: input.eventDate ?? "",
      eventName: input.eventName,
      guestDisplayNames: activeGuests
        .map((guest) => guest.displayName)
        .join("; "),
      projectCode: input.projectCode,
      tableCode: summary.table.tableCode,
      tableDescription: summary.table.description ?? "",
      tableName: summary.table.tableName,
      vipProtocolMarker: activeGuests.some((guest) => guest.isVipProtocol)
        ? "VIP/Protocol"
        : "",
    };
  });
}

export function buildTableCardCsv(rows: TableCardCsvRow[]) {
  const headers = [
    "project_code",
    "event_name",
    "event_date",
    "couple_names",
    "table_code",
    "table_name",
    "table_description",
    "capacity",
    "active_guest_count",
    "guest_display_names",
    "vip_protocol_marker",
  ];

  const lines = rows.map((row) =>
    [
      row.projectCode,
      row.eventName,
      row.eventDate,
      row.coupleNames,
      row.tableCode,
      row.tableName,
      row.tableDescription,
      row.capacity,
      row.activeGuestCount,
      row.guestDisplayNames,
      row.vipProtocolMarker,
    ]
      .map(csvEscape)
      .join(","),
  );

  return [headers.join(","), ...lines].join("\n");
}

export function seatingChangeCanAffectGeneratedInvitation(input: {
  assignmentChanged: boolean;
  invitationStatus?: string | null;
  templateUsesTableFields: boolean;
}) {
  return (
    input.assignmentChanged &&
    input.templateUsesTableFields &&
    (input.invitationStatus === "generated" ||
      input.invitationStatus === "sent" ||
      input.invitationStatus === "resent")
  );
}

export function buildVisualSeatingMapPlaceholder(tables: EventTable[]) {
  return tables.map((table, index) => ({
    id: table.id,
    label: table.tableName,
    positionX: table.positionX ?? (index % 4) * 180,
    positionY: table.positionY ?? Math.floor(index / 4) * 140,
  }));
}

export function createGeneratedExportFileName(input: {
  eventCode: string;
  projectCode: string;
  version: number;
}) {
  const safeProjectCode = input.projectCode.replace(/[^a-zA-Z0-9_-]+/g, "-");
  const safeEventCode = input.eventCode.replace(/[^a-zA-Z0-9_-]+/g, "-");

  return `${safeProjectCode}-${safeEventCode}-table-cards-v${input.version}.csv`;
}

export function createExportStoragePath(input: {
  eventId: string;
  projectId: string;
  version: number;
}) {
  return `projects/${input.projectId}/events/${input.eventId}/seating/table-cards-v${input.version}-${randomUUID()}.csv`;
}

export function isGuestSide(value: string): value is GuestSide {
  return guestSides.has(value as GuestSide);
}

export function getSprint8SeatingStatus() {
  return {
    epic: "EPIC-SEAT",
    features: ["FEAT-SEAT-001", "FEAT-SEAT-002", "FEAT-SEAT-003"],
    issue: 23,
    modules: [
      {
        name: "Event-specific tables and capacity foundation",
        requirementIds: ["SEAT-001", "SEAT-002", "SEAT-003", "SEAT-004"],
      },
      {
        name: "Table-level seating assignments and RSVP-aware occupancy",
        requirementIds: ["SEAT-005", "SEAT-007", "SEAT-009", "RSVP-010"],
      },
      {
        name: "VIP/protocol seating and visual map placeholder",
        requirementIds: ["SEAT-006", "SEAT-010", "CHK-010"],
      },
      {
        name: "Canva table-card CSV export and print tracking foundation",
        requirementIds: ["SEAT-011", "SEAT-012", "FILE-008"],
      },
      {
        name: "Invitation regeneration awareness for seating changes",
        requirementIds: ["INV-014", "SEAT-008"],
      },
      {
        name: "Permission checks and audit logging",
        requirementIds: ["TECH-004", "REP-006"],
      },
    ],
    outOfScope: [
      "check-in",
      "WhatsApp sending",
      "contracts",
      "pricing",
      "payments",
      "partner project creation",
      "full print partner workflow",
      "direct Canva API integration",
      "automatic PDF regeneration",
    ],
    requirementIds: [
      "SEAT-001",
      "SEAT-002",
      "SEAT-003",
      "SEAT-004",
      "SEAT-005",
      "SEAT-006",
      "SEAT-007",
      "SEAT-008",
      "SEAT-009",
      "SEAT-010",
      "SEAT-011",
      "SEAT-012",
      "RSVP-010",
      "INV-014",
      "FILE-008",
      "REP-006",
      "TECH-004",
    ],
    sprint: "Sprint 8 - Tables, Seating & Print Materials",
    stories: ["STORY-SEAT-001", "STORY-SEAT-002"],
    tasks: ["TASK-SEAT-001"],
    tests: ["TEST-SEAT-001", "TEST-SEAT-002", "TEST-RSVP-004"],
  };
}
