import { describe, expect, it } from "vitest";
import {
  formatEventCode,
  formatProjectCode,
} from "@/lib/projects/project-codes";
import {
  defaultEventWorkflowTasks,
  defaultProjectWorkflowTasks,
  getSprint2FoundationStatus,
} from "@/lib/projects/project-foundation";
import { hasScopedPermission } from "@/lib/projects/project-permissions";
import {
  parseCreateEventPayload,
  parseCreateProjectPayload,
  ProjectValidationError,
} from "@/lib/projects/project-service";
import type { RoleAssignment } from "@/lib/security/permissions";

describe("Sprint 2 projects and events foundation", () => {
  it("maps the implemented scope to EPIC-PROJ and the approved feature IDs", () => {
    const foundation = getSprint2FoundationStatus();

    expect(foundation.issue).toBe(3);
    expect(foundation.epic).toBe("EPIC-PROJ");
    expect(foundation.features).toEqual([
      "FEAT-PROJ-001",
      "FEAT-PROJ-002",
      "FEAT-PROJ-003",
    ]);
    expect(
      foundation.modules.flatMap((module) => module.requirementIds),
    ).toEqual(
      expect.arrayContaining([
        "PROJ-001",
        "PROJ-002",
        "PROJ-003",
        "PROJ-004",
        "PROJ-007",
      ]),
    );
  });

  it("generates readable project and event code candidates", () => {
    const projectCode = formatProjectCode({
      brideName: "Carlie",
      groomName: "Kanda",
      year: 2026,
    });

    expect(projectCode).toBe("CAR-2026-001");
    expect(
      formatEventCode({
        eventType: "reception",
        projectCode,
      }),
    ).toBe("CAR-2026-001-REC");
    expect(
      formatEventCode({
        eventType: "reception",
        projectCode,
        sequence: 2,
      }),
    ).toBe("CAR-2026-001-REC-02");
  });

  it("keeps project and event permissions scoped to assigned records", () => {
    const assignments: RoleAssignment[] = [
      {
        role: "couple",
        scope: "project",
        scopeId: "project-a",
      },
      {
        role: "event_staff",
        scope: "event",
        scopeId: "event-b",
      },
    ];

    expect(
      hasScopedPermission(assignments, "projects.read", {
        projectId: "project-a",
        scope: "project",
      }),
    ).toBe(true);
    expect(
      hasScopedPermission(assignments, "projects.read", {
        projectId: "project-z",
        scope: "project",
      }),
    ).toBe(false);
    expect(
      hasScopedPermission(assignments, "events.read", {
        eventId: "event-a",
        projectId: "project-a",
        scope: "event",
      }),
    ).toBe(true);
    expect(
      hasScopedPermission(assignments, "events.read", {
        eventId: "event-b",
        scope: "event",
      }),
    ).toBe(true);
  });

  it("validates create payloads before API handlers write to Supabase", () => {
    expect(
      parseCreateProjectPayload({
        brideName: "Ada",
        groomName: "Nico",
        preferredLanguage: "fr",
        projectYear: 2026,
      }),
    ).toMatchObject({
      brideName: "Ada",
      groomName: "Nico",
      preferredLanguage: "fr",
      projectYear: 2026,
    });

    expect(
      parseCreateEventPayload({
        eventType: "civil",
        name: "Civil ceremony",
      }),
    ).toMatchObject({
      eventType: "civil",
      name: "Civil ceremony",
    });

    expect(() => parseCreateProjectPayload({ brideName: "Ada" })).toThrow(
      ProjectValidationError,
    );
    expect(() =>
      parseCreateEventPayload({ eventType: "banquet", name: "Banquet" }),
    ).toThrow(ProjectValidationError);
  });

  it("limits generated workflow templates to project and event setup tasks", () => {
    const taskKeys = [
      ...defaultProjectWorkflowTasks,
      ...defaultEventWorkflowTasks,
    ].map((task) => task.taskKey);

    expect(taskKeys).toEqual(
      expect.arrayContaining([
        "project.profile_review",
        "project.event_plan",
        "event.details_review",
      ]),
    );
    expect(taskKeys.join(" ")).not.toMatch(
      /guest|rsvp|invitation|whatsapp|payment|contract|check/i,
    );
  });
});
