import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  formatEventCode,
  formatProjectCode,
} from "@/lib/projects/project-codes";
import {
  defaultEventWorkflowTasks,
  defaultProjectWorkflowTasks,
  formatProjectContactDisplay,
  formatProjectCoupleDisplayName,
  formatProjectDisplayReference,
  formatProjectEventDisplayName,
  formatProjectEventDisplayReference,
  formatProjectVenueDisplay,
  getSprint2FoundationStatus,
  isInternalProjectDisplayText,
} from "@/lib/projects/project-foundation";
import { hasScopedPermission } from "@/lib/projects/project-permissions";
import {
  parseCreateEventFormPayload,
  parseCreateEventPayload,
  parseCreateProjectFormPayload,
  parseCreateProjectPayload,
  parseUpdateEventFormPayload,
  parseUpdateEventPayload,
  parseUpdateProjectFormPayload,
  parseUpdateProjectPayload,
  ProjectValidationError,
} from "@/lib/projects/project-service";
import type { RoleAssignment } from "@/lib/security/permissions";

function readRepoFile(pathFromRoot: string) {
  const repoRoot = process.cwd().endsWith(join("apps", "web"))
    ? resolve(process.cwd(), "../..")
    : process.cwd();
  const fullPath = join(repoRoot, pathFromRoot);

  if (!existsSync(fullPath)) {
    throw new Error(`Expected repository file at ${fullPath}`);
  }

  return readFileSync(fullPath, "utf8");
}

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

  it("masks internal QA demo project labels for user-facing lists", () => {
    expect(
      formatProjectCoupleDisplayName(
        {
          bride_name: "QA Demo Bride",
          groom_name: "QA Demo Groom",
        },
        0,
      ),
    ).toBe("Wedding project 1");
    expect(
      formatProjectDisplayReference({ project_code: "QADEMO-2026-001" }, 0),
    ).toStrictEqual({
      isCode: false,
      label: "Project reference",
      value: "Project 1",
    });
    expect(
      formatProjectCoupleDisplayName(
        {
          bride_name: "Carlie",
          groom_name: "Kanda",
        },
        1,
      ),
    ).toBe("Carlie & Kanda");
    expect(
      formatProjectDisplayReference({ project_code: "CAR-2026-001" }, 1),
    ).toStrictEqual({
      isCode: true,
      label: "Project code",
      value: "CAR-2026-001",
    });
    expect(formatProjectContactDisplay("QA Demo Contact")).toBe("Not set");
    expect(isInternalProjectDisplayText("QA_PKG_110901")).toBe(true);
    expect(isInternalProjectDisplayText("Bonjour QA Bride Guest")).toBe(true);
    expect(isInternalProjectDisplayText("Event: QA Civil Ceremony")).toBe(true);
    expect(formatProjectContactDisplay("Ada Manager")).toBe("Ada Manager");
    expect(formatProjectEventDisplayName({ name: "QA Reception" }, 0)).toBe(
      "Event 1",
    );
    expect(
      formatProjectEventDisplayReference(
        { event_code: "QADEMO-2026-001-REC" },
        0,
      ),
    ).toStrictEqual({
      isCode: false,
      label: "Event reference",
      value: "Event 1",
    });
    expect(formatProjectVenueDisplay("QA Garden Venue")).toBe("Venue not set");
    expect(formatProjectEventDisplayName({ name: "Reception" }, 1)).toBe(
      "Reception",
    );
    expect(
      formatProjectEventDisplayReference({ event_code: "CAR-2026-001-REC" }, 1),
    ).toStrictEqual({
      isCode: true,
      label: "Event code",
      value: "CAR-2026-001-REC",
    });
    expect(formatProjectVenueDisplay("Villa Kanda")).toBe("Villa Kanda");
  });

  it("rejects invalid sequence values before formatting codes", () => {
    expect(() =>
      formatProjectCode({
        brideName: "Carlie",
        groomName: "Kanda",
        sequence: 0,
        year: 2026,
      }),
    ).toThrow(RangeError);
    expect(() =>
      formatEventCode({
        eventType: "civil",
        projectCode: "CAR-2026-001",
        sequence: 1.5,
      }),
    ).toThrow(RangeError);
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

  it("fails closed when event checks do not include a project id", () => {
    const assignments: RoleAssignment[] = [
      {
        role: "couple",
        scope: "project",
      },
    ];

    expect(
      hasScopedPermission(assignments, "events.read", {
        eventId: "event-a",
        scope: "event",
      }),
    ).toBe(false);
  });

  it("ignores role assignments whose scope conflicts with the role definition", () => {
    const assignments: RoleAssignment[] = [
      {
        role: "event_staff",
        scope: "global",
      },
      {
        role: "couple",
        scope: "event",
        scopeId: "event-a",
      },
    ];

    expect(
      hasScopedPermission(assignments, "events.read", {
        eventId: "event-a",
        scope: "event",
      }),
    ).toBe(false);
    expect(
      hasScopedPermission(assignments, "projects.read", {
        projectId: "project-a",
        scope: "project",
      }),
    ).toBe(false);
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
      parseCreateProjectFormPayload({
        brideName: "Ada",
        groomName: "Nico",
        preferredLanguage: "fr",
        projectYear: "2027",
      }),
    ).toMatchObject({
      brideName: "Ada",
      groomName: "Nico",
      preferredLanguage: "fr",
      projectYear: 2027,
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
      parseCreateProjectFormPayload({
        brideName: "Ada",
        groomName: "Nico",
        projectYear: "2019",
      }),
    ).toThrow(ProjectValidationError);
    expect(() =>
      parseCreateEventPayload({ eventType: "banquet", name: "Banquet" }),
    ).toThrow(ProjectValidationError);
  });

  it("keeps PATCH payloads explicit so nullable fields can be cleared", () => {
    expect(
      parseUpdateProjectPayload({
        primaryContactEmail: null,
        timelineNotes: null,
      }),
    ).toStrictEqual({
      primaryContactEmail: null,
      timelineNotes: null,
    });

    expect(
      parseUpdateEventPayload({
        eventDate: null,
        startsAt: "09:30",
        venueName: null,
      }),
    ).toStrictEqual({
      eventDate: null,
      startsAt: "09:30",
      venueName: null,
    });

    expect(
      parseUpdateProjectFormPayload({
        brideName: "Ada",
        groomName: "Nico",
        primaryContactEmail: "",
        projectYear: "2028",
        timelineNotes: "",
      }),
    ).toStrictEqual({
      brideName: "Ada",
      groomName: "Nico",
      primaryContactEmail: null,
      projectYear: 2028,
      timelineNotes: null,
    });

    expect(
      parseCreateEventFormPayload({
        endsAt: "",
        eventDate: "",
        eventType: "reception",
        name: "Reception",
        startsAt: "18:30",
        venueAddress: "",
        venueName: "",
      }),
    ).toStrictEqual({
      endsAt: undefined,
      eventDate: undefined,
      eventType: "reception",
      name: "Reception",
      startsAt: "18:30",
      venueAddress: undefined,
      venueName: undefined,
    });

    expect(
      parseUpdateEventFormPayload({
        eventDate: "",
        eventType: "civil",
        name: "Civil ceremony",
        startsAt: "",
        status: "scheduled",
      }),
    ).toStrictEqual({
      eventDate: null,
      eventType: "civil",
      name: "Civil ceremony",
      startsAt: null,
      status: "scheduled",
    });
  });

  it("rejects invalid event date and time payloads before database writes", () => {
    expect(() =>
      parseCreateEventPayload({
        eventDate: "2026-02-30",
        eventType: "civil",
        name: "Civil ceremony",
      }),
    ).toThrow(ProjectValidationError);

    expect(() => parseUpdateEventPayload({ startsAt: "25:00" })).toThrow(
      ProjectValidationError,
    );
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

  it("keeps database code generation bounded and validation errors explicit", () => {
    const migration = readRepoFile(
      "supabase/migrations/20260523063041_cross_sprint_integration_hardening.sql",
    );

    expect(migration).toContain("while sequence_number <= max_sequence loop");
    expect(migration).toContain(
      "Unable to generate a unique project code after",
    );
    expect(migration).toContain("Unable to generate a unique event code after");
    expect(migration).toContain("replace_guest_foundation_assignments");
    expect(migration).toContain("using errcode = '22023';");
    expect(migration).toContain("'guest_event_assignments.manage'");
    expect(migration).toContain("'guest_tags.manage'");
    expect(migration).toContain("public.guest_event_assignments.status");
  });

  it("adds permission-gated admin access-management functions for project and event members", () => {
    const migration = readRepoFile(
      "supabase/migrations/20260624150000_admin_access_management_ui.sql",
    );

    expect(migration).toContain("public.assign_project_member_by_email");
    expect(migration).toContain("public.assign_event_member_by_email");
    expect(migration).toContain("public.list_project_members_for_admin");
    expect(migration).toContain("public.list_event_members_for_admin");
    expect(migration).toContain("'project_members.manage'");
    expect(migration).toContain("'event_members.manage'");
    expect(migration).toContain("auth.users");
    expect(migration).toContain("audit_project_members_insert");
    expect(migration).toContain("audit_event_members_insert");
  });

  it("adds permission-gated global access-management functions for existing users", () => {
    const migration = readRepoFile(
      "supabase/migrations/20260624162000_global_access_management_ui.sql",
    );

    expect(migration).toContain(
      "public.list_global_role_assignments_for_admin",
    );
    expect(migration).toContain("public.assign_global_role_by_email");
    expect(migration).toContain(
      "public.revoke_global_role_assignment_for_admin",
    );
    expect(migration).toContain("'roles.manage'");
    expect(migration).toContain("auth.users");
    expect(migration).toContain("audit_role_assignments_insert");
    expect(migration).toContain("audit_role_assignments_update");
  });

  it("keeps the project list API aligned with page-level RLS visibility", () => {
    const route = readRepoFile("apps/web/src/app/api/projects/route.ts");
    const getHandlerPattern = new RegExp(
      "export async function GET\\(\\)[\\s\\S]*?(?=\\nexport async function \\w+\\(|\\s*$)",
    );
    const getHandlerMatch = route.match(getHandlerPattern);
    const getHandler = getHandlerMatch?.[0] ?? "";

    expect(getHandler).toContain("export async function GET()");
    expect(getHandler).toContain("listProjects(context.supabase)");
    expect(getHandler).not.toContain(
      'requireGlobalPermission(context, "projects.read")',
    );
  });
});
