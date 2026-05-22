import { describe, expect, it } from "vitest";
import { recordAuditEvent } from "@/lib/audit/audit-log";
import { getPlatformFoundationStatus } from "@/lib/platform/foundation";
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
      storage.getSignedReadUrl("project/file.pdf"),
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
});
