import { describe, expect, it } from "vitest";
import {
  getAuditFoundationSummary,
  recordAuditEvent,
} from "@/lib/audit/audit-log";
import {
  getPlatformEntryActionVisibility,
  getPlatformFoundationStatus,
} from "@/lib/platform/foundation";
import {
  hasPermission,
  sensitiveRolesRequireMfa,
  type RoleAssignment,
} from "@/lib/security/permissions";
import {
  createStorageAdapter,
  StorageNotConfiguredError,
} from "@/lib/storage/storage-provider";

describe("Sprint 1 platform foundation smoke test", () => {
  it("maps foundation modules back to documented Sprint 1 requirements", () => {
    const foundation = getPlatformFoundationStatus();

    expect(foundation.issue).toBe(1);
    expect(foundation.requirementIds).toEqual(
      expect.arrayContaining(["PV-001", "ROLE-001", "REP-006", "FILE-001"]),
    );
    expect(foundation.modules).toHaveLength(5);
  });

  it("hides platform entry links that require unavailable permissions", () => {
    expect(
      getPlatformEntryActionVisibility({
        canOpenPartnerDashboard: false,
        canReadGlobalDashboard: false,
        canReadReports: false,
      }),
    ).toEqual({
      showGlobalDashboard: false,
      showPartnerDashboard: false,
      showPartners: true,
      showProjects: true,
      showReports: false,
    });

    expect(
      getPlatformEntryActionVisibility({
        canOpenPartnerDashboard: true,
        canReadGlobalDashboard: true,
        canReadReports: true,
      }),
    ).toMatchObject({
      showGlobalDashboard: true,
      showPartnerDashboard: true,
      showReports: true,
    });
  });

  it("grants admin foundation permissions and marks sensitive roles for MFA", () => {
    const assignments: RoleAssignment[] = [
      {
        role: "diginoces_admin",
        scope: "global",
      },
    ];

    expect(hasPermission(assignments, "roles.manage")).toBe(true);
    expect(sensitiveRolesRequireMfa(assignments)).toBe(true);
  });

  it("fails closed for malformed role assignments", () => {
    const assignments = [
      {
        role: "couple",
        scope: "project",
      },
      {
        role: "event_staff",
        scope: "project",
        scopeId: "project-a",
      },
      {
        role: "unknown_role",
        scope: "global",
      },
    ] as unknown as RoleAssignment[];

    expect(hasPermission(assignments, "projects.read")).toBe(false);
    expect(sensitiveRolesRequireMfa(assignments)).toBe(false);
  });

  it("keeps storage fail-closed until a real provider is configured", async () => {
    const storage = createStorageAdapter();

    await expect(
      storage.getSignedReadUrl({
        bucket: "project-files",
        expiresInSeconds: 60,
        path: "project/file.pdf",
      }),
    ).rejects.toBeInstanceOf(StorageNotConfiguredError);
  });

  it("records audit events through the configured writer interface", async () => {
    const events: unknown[] = [];

    await recordAuditEvent(
      {
        async record(event) {
          events.push(event);
        },
      },
      {
        action: "system.foundation_health_checked",
        objectType: "platform_foundation",
        source: "system",
      },
    );

    expect(events).toHaveLength(1);
  });

  it("keeps later sprint audit domains in the foundation summary", async () => {
    const events: unknown[] = [];

    expect(getAuditFoundationSummary().sensitiveActionsTracked).toContain(
      "guest_imports",
    );
    expect(getAuditFoundationSummary().sensitiveActionsTracked).toContain(
      "guest_import_rows",
    );

    await recordAuditEvent(
      {
        async record(event) {
          events.push(event);
        },
      },
      {
        action: "guest_import_rows.validation_updated",
        objectType: "guest_import_row",
        source: "api",
      },
    );

    expect(events).toHaveLength(1);
  });
});
