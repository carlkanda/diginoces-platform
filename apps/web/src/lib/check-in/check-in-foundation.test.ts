import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { RoleAssignment } from "@/lib/security/permissions";
import {
  assertCheckInTokenIsSeparateFromPublicToken,
  buildCheckInQrPath,
  buildCheckInReadinessIssues,
  buildOfflinePreloadDataset,
  calculateArrivalState,
  calculateCheckInDashboardMetrics,
  canPerformCheckInAction,
  detectOfflineSyncConflicts,
  generateCheckInToken,
  getSprint9CheckInStatus,
  hashCheckInToken,
  parseCheckInDevicePayload,
  parseCheckInSettingsPayload,
  searchCheckInGuests,
  tokenPreview,
  type CheckInGuest,
} from "@/lib/check-in/check-in-service";

const projectId = "11111111-1111-4111-8111-111111111111";
const eventId = "22222222-2222-4222-8222-222222222222";
const otherEventId = "33333333-3333-4333-8333-333333333333";

function guest(overrides: Partial<CheckInGuest> = {}): CheckInGuest {
  return {
    arrivedCount: 0,
    displayName: "Guest One",
    expectedCount: 1,
    guestId: "guest-1",
    guestSide: "bride",
    invitationId: "invite-1",
    invitationPublicId: "INV-001",
    isPrintedOnly: false,
    isVipProtocol: false,
    phoneNumber: "+243 900 000 001",
    rsvpStatus: "yes",
    specialInstruction: null,
    tableCode: "T1",
    tableId: "table-1",
    tableName: "Table 1",
    tags: [],
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

function sprint9Migration() {
  const migrationRoot = findMigrationRoot(here);
  const matches = readdirSync(migrationRoot).filter(
    (name) =>
      name.includes("sprint_9_check_in_wedding_day_operations") &&
      name.endsWith(".sql"),
  );

  if (matches.length !== 1) {
    throw new Error("Sprint 9 migration was not found exactly once.");
  }

  return readFileSync(join(migrationRoot, matches[0]!), "utf8");
}

describe("Sprint 9 check-in foundation", () => {
  it("creates secure check-in tokens separate from public guest page tokens", () => {
    const token = generateCheckInToken();

    expect(token).toMatch(/^[a-f0-9]{36}$/);
    expect(hashCheckInToken(token)).toMatch(/^[a-f0-9]{64}$/);
    expect(tokenPreview(token)).toHaveLength(8);
    expect(buildCheckInQrPath({ eventId, token })).toContain(
      `/platform/events/${eventId}/check-in/scan?token=`,
    );
    expect(() =>
      assertCheckInTokenIsSeparateFromPublicToken({
        checkInToken: token,
        publicGuestToken: token,
      }),
    ).toThrow("separate from public guest page token");
  });

  it("parses event settings and device assignment payloads", () => {
    expect(
      parseCheckInSettingsPayload({
        allowedMethods: ["qr_scan", "manual_name_search"],
        enabled: true,
        offlinePreloadEnabled: true,
        supervisorApprovalRequired: true,
        timezone: "Africa/Kinshasa",
        unexpectedGuestMode: "supervisor_approval_required",
      }),
    ).toMatchObject({
      enabled: true,
      offlinePreloadEnabled: true,
      timezone: "Africa/Kinshasa",
    });

    expect(() =>
      parseCheckInSettingsPayload({ allowedMethods: ["whatsapp_auto"] }),
    ).toThrow("unsupported check-in method");

    expect(
      parseCheckInDevicePayload({
        deviceLabel: "Tablet 1",
        stationName: "Entrance A",
      }),
    ).toMatchObject({
      deviceLabel: "Tablet 1",
      stationName: "Entrance A",
    });
  });

  it("enforces event-scoped staff permissions", () => {
    const assignedStaff: RoleAssignment[] = [
      { role: "event_staff", scope: "event", scopeId: eventId },
    ];
    const unassignedStaff: RoleAssignment[] = [
      { role: "event_staff", scope: "event", scopeId: otherEventId },
    ];
    const supervisor: RoleAssignment[] = [
      { role: "check_in_supervisor", scope: "event", scopeId: eventId },
    ];

    expect(
      canPerformCheckInAction(assignedStaff, projectId, eventId, "perform"),
    ).toBe(true);
    expect(
      canPerformCheckInAction(unassignedStaff, projectId, eventId, "perform"),
    ).toBe(false);
    expect(
      canPerformCheckInAction(
        supervisor,
        projectId,
        eventId,
        "unexpected_guests.review",
      ),
    ).toBe(true);
    expect(
      canPerformCheckInAction(
        assignedStaff,
        projectId,
        eventId,
        "unexpected_guests.review",
      ),
    ).toBe(false);
  });

  it("supports manual search by invitation id, name, phone, side, table, and printed-only guests", () => {
    const guests = [
      guest(),
      guest({
        displayName: "Printed Aunt",
        guestId: "printed",
        guestSide: "groom",
        invitationPublicId: "INV-PRINT",
        isPrintedOnly: true,
        phoneNumber: null,
        tableCode: "P1",
        tableId: "table-p",
        tableName: "Protocol",
      }),
      guest({
        displayName: "Both Side VIP",
        guestId: "both",
        guestSide: "both",
        isVipProtocol: true,
        phoneNumber: "+243 900 999 999",
        tags: ["vip"],
      }),
    ];

    expect(searchCheckInGuests(guests, { query: "Guest One" })).toHaveLength(1);
    expect(searchCheckInGuests(guests, { query: "900000001" })).toHaveLength(1);
    expect(searchCheckInGuests(guests, { query: "INV-PRINT" })).toHaveLength(1);
    expect(searchCheckInGuests(guests, { query: "Protocol" })).toHaveLength(1);
    expect(
      searchCheckInGuests(guests, { side: "bride" }).map(
        (item) => item.guestId,
      ),
    ).toEqual(["guest-1", "both"]);
    expect(
      searchCheckInGuests(guests, { side: "both" }).map((item) => item.guestId),
    ).toEqual(["both"]);
  });

  it("tracks Couple partial arrivals and suppresses duplicate welcome messages", () => {
    expect(
      calculateArrivalState({
        currentArrivedCount: 0,
        requestedArrivalCount: 1,
        totalExpectedCount: 2,
      }),
    ).toMatchObject({
      attendanceAfter: 1,
      isComplete: false,
      welcomeMessageAction: "prepare",
    });

    expect(
      calculateArrivalState({
        currentArrivedCount: 1,
        requestedArrivalCount: 1,
        totalExpectedCount: 2,
      }),
    ).toMatchObject({
      attendanceAfter: 2,
      isComplete: true,
      welcomeMessageAction: "suppress_duplicate",
      welcomeMessageSuppressedReason: "not_first_arrival",
    });

    expect(
      calculateArrivalState({
        currentArrivedCount: 2,
        requestedArrivalCount: 1,
        totalExpectedCount: 2,
      }),
    ).toMatchObject({
      isDuplicateScan: true,
      requestedArrivalCount: 0,
      welcomeMessageSuppressedReason: "duplicate_scan",
    });

    expect(() =>
      calculateArrivalState({
        currentArrivedCount: 1,
        requestedArrivalCount: 2,
        totalExpectedCount: 2,
      }),
    ).toThrow("cannot exceed");
  });

  it("represents RSVP No warnings and VIP/protocol highlights for the check-in screen", () => {
    expect(
      buildCheckInReadinessIssues(
        guest({
          isVipProtocol: true,
          rsvpStatus: "no",
          tableId: null,
          tableName: null,
        }),
      ).map((issue) => issue.code),
    ).toEqual([
      "rsvp_no_warning",
      "table_missing_warning",
      "vip_protocol_highlight",
    ]);
  });

  it("builds offline preload datasets and detects sync conflicts", () => {
    const dataset = buildOfflinePreloadDataset({
      eventId,
      generatedAt: "2026-05-30T10:00:00.000Z",
      guests: [guest({ expectedCount: 2 })],
      projectId,
    });

    expect(dataset).toMatchObject({
      eventId,
      projectId,
      schemaVersion: 1,
    });
    expect(dataset.guests[0]).toMatchObject({
      expectedCount: 2,
      guestId: "guest-1",
    });

    const conflicts = detectOfflineSyncConflicts({
      existingArrivalsByGuestId: new Map([["guest-1", 1]]),
      offlineRecords: [
        {
          arrivedAt: "2026-05-30T10:02:00.000Z",
          arrivalCount: 1,
          eventId,
          guestId: "guest-1",
          offlineRecordId: "offline-1",
        },
        {
          arrivedAt: "2026-05-30T10:03:00.000Z",
          arrivalCount: 1,
          eventId,
          guestId: "guest-1",
          offlineRecordId: "offline-2",
        },
      ],
      totalExpectedByGuestId: new Map([["guest-1", 2]]),
    });

    expect(conflicts).toEqual([
      expect.objectContaining({
        conflictType: "arrival_count_conflict",
        offlineRecordId: "offline-2",
      }),
    ]);
  });

  it("calculates dashboard metrics by table, staff, device, method, and unexpected guest state", () => {
    const metrics = calculateCheckInDashboardMetrics({
      devices: [{ id: "device-1", stationName: "Entrance A" }],
      guests: [
        guest({ arrivedCount: 1, expectedCount: 2 }),
        guest({
          arrivedCount: 1,
          expectedCount: 1,
          guestId: "guest-2",
          tableId: "table-2",
          tableName: "Table 2",
        }),
      ],
      records: [
        {
          arrivalCount: 1,
          deviceId: "device-1",
          guestId: "guest-1",
          isDuplicateScan: false,
          method: "qr_scan",
          staffUserId: "staff-1",
          syncStatus: "online_synced",
        },
        {
          arrivalCount: 0,
          deviceId: "device-1",
          guestId: "guest-1",
          isDuplicateScan: true,
          method: "qr_scan",
          staffUserId: "staff-1",
          syncStatus: "online_synced",
        },
      ],
      syncConflictCount: 1,
      unexpectedRequests: [{ status: "pending" }, { status: "approved" }],
    });

    expect(metrics).toMatchObject({
      arrivedUnits: 2,
      duplicateScanCount: 1,
      expectedUnits: 3,
      partialArrivalCount: 1,
      remainingUnits: 1,
      syncConflictCount: 1,
      unexpectedApprovedCount: 1,
      unexpectedPendingCount: 1,
    });
    expect(metrics.byDevice).toEqual([
      { arrivedUnits: 1, deviceId: "device-1", label: "Entrance A" },
    ]);
  });

  it("documents Sprint 9 status, audit hooks, permissions, and out-of-scope boundaries", () => {
    const status = getSprint9CheckInStatus();
    const migration = sprint9Migration();

    expect(status.requirementIds).toEqual(
      expect.arrayContaining(["CHK-001", "CHK-014", "TECH-007", "TECH-010"]),
    );
    expect(migration).toContain(
      "create table if not exists public.check_in_settings",
    );
    expect(migration).toContain(
      "create table if not exists public.check_in_tokens",
    );
    expect(migration).toContain(
      "create table if not exists public.check_in_records",
    );
    expect(migration).toContain(
      "create table if not exists public.check_in_devices",
    );
    expect(migration).toContain(
      "create table if not exists public.unexpected_guest_requests",
    );
    expect(migration).toContain(
      "create table if not exists public.check_in_sync_conflicts",
    );
    expect(migration).toContain("'check_in.perform'");
    expect(migration).toContain("check_in_supervisor");
    expect(migration).toContain("audit_check_in_change");
    expect(migration).not.toContain(
      "create table if not exists public.contract",
    );
    expect(migration).not.toContain(
      "create table if not exists public.payment",
    );
  });
});
