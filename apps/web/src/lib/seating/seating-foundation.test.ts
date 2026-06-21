import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
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
  formatEventTableCode,
  formatEventTableName,
  formatEventTableReference,
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

const here = fileURLToPath(new URL(".", import.meta.url));

function findMigrationRoot(startDirectory: string) {
  let currentDirectory = startDirectory;

  while (currentDirectory !== dirname(currentDirectory)) {
    const candidate = join(currentDirectory, "supabase", "migrations");

    if (existsSync(candidate)) {
      return candidate;
    }

    currentDirectory = dirname(currentDirectory);
  }

  throw new Error("Supabase migrations directory was not found.");
}

const migrationRoot = findMigrationRoot(here);

function sprint8Migration() {
  const migrationMatches = readdirSync(migrationRoot).filter(
    (name) =>
      name.includes("sprint_8_tables_seating_print_materials") &&
      name.endsWith(".sql"),
  );

  if (migrationMatches.length === 0) {
    throw new Error("Sprint 8 migration was not found.");
  }

  if (migrationMatches.length > 1) {
    throw new Error("Multiple Sprint 8 migrations were found.");
  }

  const migrationName = migrationMatches[0]!;

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

    expect(() =>
      parseBulkCreateTablesPayload({
        capacity: 8,
        count: 1,
        startNumber: 0,
      }),
    ).toThrow("startNumber must be a positive integer");
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
    expect(csv).toContain("active_guest_count");
    expect(csv).toContain("VIP Guest");
    expect(csv).toContain("VIP/Protocol");
  });

  it("uses only active seating guests in table-card CSV export names and VIP flags", () => {
    const summary = calculateSeatingPlan({
      eventId,
      projectId,
      tables,
      guests: [
        guest("active", {
          assignment: {
            eventId,
            guestCountAtAssignment: 1,
            guestId: "active",
            id: "active-assignment",
            seatId: null,
            seatingNotes: null,
            status: "active",
            tableId: "table-1",
            vipProtocolNotes: null,
          },
          displayName: "Active Guest",
        }),
        guest("declined-vip", {
          assignment: {
            eventId,
            guestCountAtAssignment: 1,
            guestId: "declined-vip",
            id: "declined-assignment",
            seatId: null,
            seatingNotes: null,
            status: "active",
            tableId: "table-1",
            vipProtocolNotes: "Declined protocol",
          },
          displayName: "Declined VIP",
          isVipProtocol: true,
          rsvpStatus: "no",
        }),
      ],
    });

    const csv = buildTableCardCsv(
      buildTableCardCsvRows({
        coupleNames: "Ada & Ben",
        eventDate: "2026-08-01",
        eventName: "Reception",
        projectCode: "ADA-BEN-2026",
        summary,
      }),
    );

    expect(csv).toContain("Active Guest");
    expect(csv).not.toContain("Declined VIP");
    expect(csv).not.toContain("VIP/Protocol");
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

    const warningSummary = calculateSeatingPlan({
      eventId,
      projectId,
      tables,
      guests: [guest("missing-count", { guestCount: null })],
    });
    expect(warningSummary.warnings).toEqual([
      "Guest missing-count: Guest count was missing or invalid; defaulted to 1.",
    ]);
  });

  it("neutralizes table-card CSV spreadsheet formulas and preserves literal backslashes", () => {
    const csv = buildTableCardCsv([
      {
        activeGuestCount: 1,
        capacity: 1,
        coupleNames: "Ada & Ben",
        eventDate: "2026-08-01",
        eventName: "\t=Reception",
        guestDisplayNames: "Guest \\ Name",
        projectCode: "ADA-BEN-2026",
        tableCode: "T1",
        tableDescription: "Front row",
        tableName: "Protocol",
        vipProtocolMarker: "",
      },
      {
        activeGuestCount: 1,
        capacity: 1,
        coupleNames: "Ada & Ben",
        eventDate: "2026-08-01",
        eventName: "=Reception",
        guestDisplayNames: "Plain Formula",
        projectCode: "ADA-BEN-2026",
        tableCode: "T2",
        tableDescription: "Second row",
        tableName: "Family",
        vipProtocolMarker: "",
      },
      {
        activeGuestCount: 1,
        capacity: 1,
        coupleNames: "Ada & Ben",
        eventDate: "2026-08-01",
        eventName: "\n=Reception",
        guestDisplayNames: "Newline Formula",
        projectCode: "ADA-BEN-2026",
        tableCode: "T3",
        tableDescription: "Third row",
        tableName: "Friends",
        vipProtocolMarker: "",
      },
    ]);

    expect(csv).toContain('"\t\'=Reception"');
    expect(csv).toContain('"\'=Reception"');
    expect(csv).toContain('"\n\'=Reception"');
    expect(csv).toContain("Guest \\ Name");
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

  it("masks internal QA-style table labels from user-facing seating views", () => {
    expect(formatEventTableCode("QA110901", 0)).toBe("T1");
    expect(formatEventTableName("QA110901 - Table 1", 0)).toBe("Table 1");
    expect(
      formatEventTableReference(
        {
          tableCode: "QA110901",
          tableName: "QA110901 - Table 1",
        },
        0,
      ),
    ).toBe("T1 - Table 1");
    expect(
      formatEventTableReference(
        {
          tableCode: "VIP",
          tableName: "Family table",
        },
        1,
      ),
    ).toBe("VIP - Family table");
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
    expect(migration).toContain("create_seating_export_file");
    expect(migration).toContain("pg_advisory_xact_lock");
    expect(migration).toContain("app_private.audit_seating_change");
    expect(migration).toContain("seating.read");
    expect(migration).toContain("seating.tables.manage");
    expect(migration).toContain("seating.assign");
    expect(migration).toContain("seating.export");
    expect(migration).toContain("('couple', 'seating.read')");
    expect(migration).toContain("on delete set null");
    expect(migration).toContain("on delete set null (seat_id)");
    expect(migration).toContain("insert into storage.buckets");
    expect(migration).toContain("seating_export_files_storage_lookup_idx");
    expect(migration).toContain("table_cards_csv:");
    expect(migration).toContain("assign_guest:");
    expect(migration).toContain(
      "Seating export objects uploaded by seating exporters",
    );
    expect(migration).toContain(
      "Seating export objects deleted by seating exporters",
    );
    expect(migration).toContain("'storageUploadPending', true");
    expect(migration).toContain("'storageDeletionPending', true");
    expect(migration).toContain("'storageDeletionSqlState'");
    expect(migration).toContain(
      "release_event_table_seats_before_guest_delete",
    );
    expect(migration).toContain("- 'seating_notes'");
    expect(migration).toContain("- 'vip_protocol_notes'");
    expect(migration).toContain("Unsupported seating audit operation");
    expect(migration).toContain("assigned_guest_id = p_guest_id");
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
