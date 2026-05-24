import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { RoleAssignment } from "@/lib/security/permissions";
import {
  buildBulkTableInputs,
  buildTableCardCsv,
  buildTableCardCsvRows,
  buildVisualSeatingMapPlaceholder,
  calculateSeatingPlan,
  canAssignGuestSide,
  canPerformSeatingAction,
  filterUnassignedGuests,
  getGuestOccupancyUnits,
  getSprint8SeatingStatus,
  isGuestActiveForSeating,
  parseBulkCreateTablesPayload,
  parseEventTablePayload,
  seatingChangeCanAffectGeneratedInvitation,
  validateSeatingAssignmentCompatibility,
  type EventTable,
  type SeatingGuest,
} from "@/lib/seating/seating-service";

const projectId = "11111111-1111-4111-8111-111111111111";
const eventId = "22222222-2222-4222-8222-222222222222";

const tables: EventTable[] = [
  {
    assignmentMode: "table_level",
    capacity: 3,
    description: "Main family table",
    displayOrder: 1,
    eventId,
    id: "table-1",
    notes: null,
    positionX: null,
    positionY: null,
    projectId,
    status: "active",
    tableCode: "T1",
    tableName: "Table 1",
  },
  {
    assignmentMode: "mixed",
    capacity: 2,
    description: null,
    displayOrder: 2,
    eventId,
    id: "table-2",
    notes: null,
    positionX: 260,
    positionY: 140,
    projectId,
    status: "active",
    tableCode: "T2",
    tableName: "Protocol",
  },
];

function guest(
  id: string,
  overrides: Partial<SeatingGuest> = {},
): SeatingGuest {
  return {
    assignment: null,
    displayName: `Guest ${id}`,
    guestCount: 1,
    guestSide: "bride",
    id,
    isPrintedOnly: false,
    isVipProtocol: false,
    rsvpStatus: "yes",
    tagNames: [],
    ...overrides,
  };
}

const migrationRoot = resolve(
  process.cwd(),
  "..",
  "..",
  "supabase",
  "migrations",
);

function sprint8Migration() {
  const migrationName = readdirSync(migrationRoot).find((name) =>
    name.endsWith("_sprint_8_tables_seating_print_materials.sql"),
  );

  if (!migrationName) {
    throw new Error("Sprint 8 migration was not found.");
  }

  return readFileSync(join(migrationRoot, migrationName), "utf8");
}

describe("Sprint 8 seating foundation", () => {
  it("parses table and bulk table payloads with positive capacity", () => {
    expect(
      parseEventTablePayload({
        assignmentMode: "mixed",
        capacity: 10,
        tableCode: "A1",
        tableName: "Family",
      }),
    ).toMatchObject({
      assignmentMode: "mixed",
      capacity: 10,
      tableCode: "A1",
    });

    expect(() =>
      parseEventTablePayload({
        capacity: 0,
        tableCode: "A1",
        tableName: "Family",
      }),
    ).toThrow("capacity must be a positive integer");

    expect(
      buildBulkTableInputs(
        parseBulkCreateTablesPayload({
          capacity: 8,
          count: 3,
          startNumber: 4,
          tableCodePrefix: "VIP-",
          tableNamePrefix: "VIP Table",
        }),
      ).map((table) => [table.tableCode, table.tableName, table.capacity]),
    ).toEqual([
      ["VIP-4", "VIP Table 4", 8],
      ["VIP-5", "VIP Table 5", 8],
      ["VIP-6", "VIP Table 6", 8],
    ]);
  });

  it("calculates RSVP-aware occupancy and excludes RSVP No from active counts", () => {
    const summary = calculateSeatingPlan({
      eventId,
      projectId,
      tables,
      guests: [
        guest("yes", {
          assignment: {
            eventId,
            guestCountAtAssignment: 1,
            guestId: "yes",
            id: "a1",
            seatId: null,
            seatingNotes: null,
            status: "active",
            tableId: "table-1",
            vipProtocolNotes: null,
          },
          guestCount: 1,
          rsvpStatus: "yes",
        }),
        guest("couple", {
          assignment: {
            eventId,
            guestCountAtAssignment: 2,
            guestId: "couple",
            id: "a2",
            seatId: null,
            seatingNotes: null,
            status: "active",
            tableId: "table-1",
            vipProtocolNotes: null,
          },
          guestCount: 2,
          rsvpStatus: "maybe",
        }),
        guest("declined", {
          assignment: {
            eventId,
            guestCountAtAssignment: 1,
            guestId: "declined",
            id: "a3",
            seatId: null,
            seatingNotes: null,
            status: "active",
            tableId: "table-1",
            vipProtocolNotes: null,
          },
          rsvpStatus: "no",
        }),
      ],
    });

    expect(summary.tableSummaries[0]?.assignedGuestCount).toBe(4);
    expect(summary.tableSummaries[0]?.activeGuestCount).toBe(3);
    expect(summary.tableSummaries[0]?.remainingCapacity).toBe(0);
    expect(isGuestActiveForSeating("no")).toBe(false);
    expect(isGuestActiveForSeating("maybe")).toBe(true);
  });

  it("reports over-capacity warnings and active unassigned guests", () => {
    const unassigned = guest("unassigned", { rsvpStatus: "pending" });
    const declinedUnassigned = guest("declined-unassigned", {
      rsvpStatus: "no",
    });
    const summary = calculateSeatingPlan({
      eventId,
      projectId,
      tables,
      guests: [
        guest("a", {
          assignment: {
            eventId,
            guestCountAtAssignment: 2,
            guestId: "a",
            id: "a",
            seatId: null,
            seatingNotes: null,
            status: "active",
            tableId: "table-2",
            vipProtocolNotes: null,
          },
          guestCount: 2,
        }),
        guest("b", {
          assignment: {
            eventId,
            guestCountAtAssignment: 1,
            guestId: "b",
            id: "b",
            seatId: null,
            seatingNotes: null,
            status: "active",
            tableId: "table-2",
            vipProtocolNotes: null,
          },
          guestCount: 1,
        }),
        unassigned,
        declinedUnassigned,
      ],
    });

    expect(summary.overCapacityTables).toBe(1);
    expect(summary.tableSummaries[1]?.overCapacityBy).toBe(1);
    expect(summary.unassignedGuests.map((item) => item.id)).toEqual([
      "unassigned",
    ]);
    expect(
      filterUnassignedGuests([unassigned], { guestSide: "bride" }),
    ).toHaveLength(1);
  });

  it("preserves VIP/protocol markers in table-card CSV exports", () => {
    const summary = calculateSeatingPlan({
      eventId,
      projectId,
      tables,
      guests: [
        guest("vip", {
          assignment: {
            eventId,
            guestCountAtAssignment: 1,
            guestId: "vip",
            id: "vip-assignment",
            seatId: null,
            seatingNotes: null,
            status: "active",
            tableId: "table-2",
            vipProtocolNotes: "Protocol entrance",
          },
          displayName: "VIP Guest",
          isVipProtocol: true,
          tagNames: ["VIP"],
        }),
      ],
    });
    const rows = buildTableCardCsvRows({
      coupleNames: "Ada & Ben",
      eventDate: "2026-08-01",
      eventName: "Reception",
      projectCode: "ADA-BEN-2026",
      summary,
    });
    const csv = buildTableCardCsv(rows);

    expect(csv).toContain("project_code,event_name,event_date");
    expect(csv).toContain("VIP Guest");
    expect(csv).toContain("VIP/Protocol");
  });

  it("enforces side-aware seating permissions in pure helpers", () => {
    const brideAssignments: RoleAssignment[] = [
      { role: "bride", scope: "project", scopeId: projectId },
    ];
    const groomAssignments: RoleAssignment[] = [
      { role: "groom", scope: "project", scopeId: projectId },
    ];
    const operationsAssignments: RoleAssignment[] = [
      { role: "operations_manager", scope: "global" },
    ];

    expect(canPerformSeatingAction(brideAssignments, projectId, "assign")).toBe(
      true,
    );
    expect(canAssignGuestSide(brideAssignments, projectId, "bride")).toBe(true);
    expect(canAssignGuestSide(brideAssignments, projectId, "groom")).toBe(
      false,
    );
    expect(canAssignGuestSide(groomAssignments, projectId, "groom")).toBe(true);
    expect(canAssignGuestSide(groomAssignments, projectId, "bride")).toBe(
      false,
    );
    expect(canAssignGuestSide(operationsAssignments, projectId, "both")).toBe(
      true,
    );
  });

  it("validates event invitation compatibility and safe guest counts", () => {
    expect(() =>
      validateSeatingAssignmentCompatibility({
        eventGuestIds: ["guest-1"],
        guestId: "guest-2",
        table: tables[0]!,
      }),
    ).toThrow("Guest must be invited");

    expect(
      getGuestOccupancyUnits(guest("missing-count", { guestCount: null })),
    ).toEqual({
      units: 1,
      warning: "Guest count was missing or invalid; defaulted to 1.",
    });
  });

  it("detects invitation regeneration awareness without automatic PDF regeneration", () => {
    expect(
      seatingChangeCanAffectGeneratedInvitation({
        assignmentChanged: true,
        invitationStatus: "sent",
        templateUsesTableFields: true,
      }),
    ).toBe(true);
    expect(
      seatingChangeCanAffectGeneratedInvitation({
        assignmentChanged: true,
        invitationStatus: "sent",
        templateUsesTableFields: false,
      }),
    ).toBe(false);
  });

  it("represents the visual map as a placeholder, not advanced drag-and-drop", () => {
    expect(buildVisualSeatingMapPlaceholder(tables)).toEqual([
      {
        id: "table-1",
        label: "Table 1",
        positionX: 0,
        positionY: 0,
      },
      {
        id: "table-2",
        label: "Protocol",
        positionX: 260,
        positionY: 140,
      },
    ]);
  });

  it("documents Sprint 8 traceability and excludes future modules", () => {
    const status = getSprint8SeatingStatus();

    expect(status.issue).toBe(23);
    expect(status.epic).toBe("EPIC-SEAT");
    expect(status.features).toEqual([
      "FEAT-SEAT-001",
      "FEAT-SEAT-002",
      "FEAT-SEAT-003",
    ]);
    expect(status.requirementIds).toContain("SEAT-011");
    expect(status.outOfScope).toContain("check-in");
    expect(status.outOfScope).toContain("WhatsApp sending");
  });

  it("adds Sprint 8 database, permission, audit, and RLS foundations only", () => {
    const migration = sprint8Migration();

    expect(migration).toContain(
      "create table if not exists public.event_tables",
    );
    expect(migration).toContain(
      "create table if not exists public.guest_table_assignments",
    );
    expect(migration).toContain(
      "create table if not exists public.seating_export_files",
    );
    expect(migration).toContain("assign_guest_to_event_table");
    expect(migration).toContain("remove_guest_from_event_table");
    expect(migration).toContain("app_private.audit_seating_change");
    expect(migration).toContain("seating.read");
    expect(migration).toContain("seating.tables.manage");
    expect(migration).toContain("seating.assign");
    expect(migration).toContain("seating.export");
    expect(migration).toContain("enable row level security");
    expect(migration).not.toContain(
      "create table if not exists public.check_in",
    );
    expect(migration).not.toContain(
      "create table if not exists public.payments",
    );
    expect(migration).not.toContain("whatsapp_api");
  });
});
