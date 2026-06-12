import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  redactGuestDetailsForApi,
  redactGuestForApi,
  resolveReadableGuestFilters,
} from "@/lib/guests/guest-api";
import {
  canCreateGuestSide,
  canManageGuestSide,
  detectGuestDuplicateCandidates,
  filterGuests,
  getGuestSideFilterValues,
  getSprint3FoundationStatus,
  guestUpdateRequiresDeactivationPermission,
  parseCreateGuestPayload,
  parseGuestListSideFilter,
  parseUpdateGuestPayload,
  validateGuestForFoundation,
} from "@/lib/guests/guest-service";
import {
  ProjectAccessError,
  type ProjectApiContext,
} from "@/lib/projects/project-api";
import type { RoleAssignment } from "@/lib/security/permissions";

const projectId = "11111111-1111-4111-8111-111111111111";
const eventId = "22222222-2222-4222-8222-222222222222";
const webRoot = process.cwd();

function guestApiContextWithPermissions(
  permissions: readonly string[],
): ProjectApiContext {
  const granted = new Set(permissions);

  return {
    supabase: {
      rpc: async (_functionName: string, args: Record<string, unknown>) => ({
        data: granted.has(String(args.p_permission)),
        error: null,
      }),
    },
    user: { id: "user-1" },
  } as unknown as ProjectApiContext;
}

const guestTitleType = {
  defaultGuestCount: 1,
  id: "33333333-3333-4333-8333-333333333333",
  label: "Mr.",
  slug: "mr",
};

const baseGuest = {
  displayName: "Ada Kanda",
  guestSide: "bride" as const,
  guestTitleTypeId: guestTitleType.id,
  eventAssignments: [],
  id: "44444444-4444-4444-8444-444444444444",
  isActive: true,
  isPrintedOnly: false,
  normalizedName: "ada kanda",
  projectId,
  whatsappNumber: "+243 810 000 001",
};

describe("Sprint 3 guest-management foundation", () => {
  it("maps the implemented scope to EPIC-GM and approved requirement IDs", () => {
    const foundation = getSprint3FoundationStatus();

    expect(foundation.issue).toBe(5);
    expect(foundation.epic).toBe("EPIC-GM");
    expect(foundation.features).toEqual([
      "FEAT-GM-001",
      "FEAT-GM-002",
      "FEAT-GM-003",
      "FEAT-GM-005",
      "FEAT-GM-006",
    ]);
    expect(
      foundation.modules.flatMap((module) => module.requirementIds),
    ).toEqual(
      expect.arrayContaining([
        "GM-001",
        "GM-002",
        "GM-003",
        "GM-006",
        "GM-007",
        "GM-008",
        "GM-009",
        "GM-011",
        "GM-013",
        "GM-015",
        "PROJ-005",
        "ROLE-005",
        "REP-006",
        "TECH-004",
      ]),
    );
    expect(foundation.outOfScope.join(" ")).toMatch(/CSV\/Excel import/);
  });

  it("validates manual guest creation payloads and allows printed-only guests without WhatsApp", () => {
    expect(
      parseCreateGuestPayload({
        displayName: "  Ada Kanda  ",
        guestSide: "bride",
        guestTitleTypeId: guestTitleType.id,
        isPrintedOnly: true,
      }),
    ).toMatchObject({
      displayName: "Ada Kanda",
      guestSide: "bride",
      guestTitleTypeId: guestTitleType.id,
      isPrintedOnly: true,
    });

    expect(() =>
      parseCreateGuestPayload({
        displayName: "",
        guestSide: "groom",
        guestTitleTypeId: guestTitleType.id,
      }),
    ).toThrow(/displayName is required/);
    expect(() =>
      parseCreateGuestPayload({
        displayName: "Ada Kanda",
        guestSide: "other",
        guestTitleTypeId: guestTitleType.id,
      }),
    ).toThrow(/guestSide is not supported/);
  });

  it("keeps PATCH guest payloads explicit so nullable fields can be cleared", () => {
    expect(
      parseUpdateGuestPayload({
        internalNotes: null,
        tagIds: [],
        whatsappNumber: null,
      }),
    ).toStrictEqual({
      internalNotes: null,
      tagIds: [],
      whatsappNumber: null,
    });
  });

  it("filters project guests by side and event assignment", () => {
    const guests = [
      {
        ...baseGuest,
        eventAssignments: [{ eventId, guestId: baseGuest.id, invited: true }],
      },
      {
        ...baseGuest,
        guestSide: "groom" as const,
        id: "55555555-5555-4555-8555-555555555555",
        normalizedName: "nico kanda",
        whatsappNumber: "+243 810 000 002",
        eventAssignments: [],
      },
      {
        ...baseGuest,
        guestSide: "both" as const,
        id: "66666666-6666-4666-8666-666666666666",
        normalizedName: "mona kanda",
        whatsappNumber: null,
        eventAssignments: [
          {
            eventId,
            guestId: "66666666-6666-4666-8666-666666666666",
            invited: true,
          },
        ],
      },
    ];

    expect(filterGuests(guests, { side: "bride" })).toHaveLength(2);
    expect(filterGuests(guests, { side: "both" })).toHaveLength(1);
    expect(filterGuests(guests, { eventId })).toHaveLength(2);
    expect(filterGuests(guests, { eventId, side: "groom" })).toHaveLength(1);
  });

  it("keeps database side filter values consistent with bride/groom/both list rules", () => {
    expect(getGuestSideFilterValues("bride")).toStrictEqual(["bride", "both"]);
    expect(getGuestSideFilterValues("groom")).toStrictEqual(["groom", "both"]);
    expect(getGuestSideFilterValues("both")).toStrictEqual(["both"]);
    expect(getGuestSideFilterValues("all")).toBeUndefined();
  });

  it("rejects unsupported guest list side filters instead of broadening access", () => {
    expect(parseGuestListSideFilter(undefined)).toBe("all");
    expect(parseGuestListSideFilter("all")).toBe("all");
    expect(parseGuestListSideFilter("bride")).toBe("bride");
    expect(parseGuestListSideFilter("groom")).toBe("groom");
    expect(parseGuestListSideFilter("both")).toBe("both");
    expect(() => parseGuestListSideFilter("unsupported")).toThrow(
      /side must be one of: bride, groom, both, all/,
    );
  });

  it("resolves readable guest filters to the actor's own side", async () => {
    const brideContext = guestApiContextWithPermissions([
      "guests.manage_bride_side",
    ]);
    const groomContext = guestApiContextWithPermissions([
      "guests.manage_groom_side",
    ]);
    const adminContext = guestApiContextWithPermissions(["guests.update"]);
    const readOnlyContext = guestApiContextWithPermissions(["guests.read"]);

    await expect(
      resolveReadableGuestFilters(brideContext, projectId, { side: "all" }),
    ).resolves.toMatchObject({ side: "bride" });
    await expect(
      resolveReadableGuestFilters(brideContext, projectId, { side: "both" }),
    ).resolves.toMatchObject({ side: "both" });
    await expect(
      resolveReadableGuestFilters(brideContext, projectId, { side: "groom" }),
    ).rejects.toBeInstanceOf(ProjectAccessError);

    await expect(
      resolveReadableGuestFilters(groomContext, projectId, { side: "all" }),
    ).resolves.toMatchObject({ side: "groom" });
    await expect(
      resolveReadableGuestFilters(groomContext, projectId, { side: "bride" }),
    ).rejects.toBeInstanceOf(ProjectAccessError);

    await expect(
      resolveReadableGuestFilters(adminContext, projectId, { side: "all" }),
    ).resolves.toMatchObject({ side: "all" });
    await expect(
      resolveReadableGuestFilters(readOnlyContext, projectId, { side: "all" }),
    ).resolves.toMatchObject({ side: "all" });
    await expect(
      resolveReadableGuestFilters(readOnlyContext, projectId, {
        side: "bride",
      }),
    ).resolves.toMatchObject({ side: "bride" });
    await expect(
      resolveReadableGuestFilters(readOnlyContext, projectId, {
        side: "groom",
      }),
    ).resolves.toMatchObject({ side: "groom" });
    await expect(
      resolveReadableGuestFilters(readOnlyContext, projectId, {
        side: "both",
      }),
    ).resolves.toMatchObject({ side: "both" });
  });

  it("redacts internal guest fields from API payloads", () => {
    const guest = {
      created_at: "2026-06-01T00:00:00.000Z",
      created_by: "actor-1",
      display_name: "Ada Kanda",
      guest_side: "bride",
      guest_title_type_id: guestTitleType.id,
      id: baseGuest.id,
      internal_notes: "internal guest note",
      is_active: true,
      is_printed_only: false,
      normalized_name: "ada kanda",
      normalized_whatsapp: "243810000001",
      preferred_language: "fr",
      project_id: projectId,
      updated_at: "2026-06-01T00:00:00.000Z",
      updated_by: "actor-2",
      whatsapp_number: "+243 810 000 001",
    } as never;
    const eventAssignment = {
      created_at: "2026-06-01T00:00:00.000Z",
      created_by: "actor-1",
      event_id: eventId,
      guest_id: baseGuest.id,
      id: "55555555-5555-4555-8555-555555555555",
      invited: true,
      project_id: projectId,
      status: "invited",
      updated_at: "2026-06-01T00:00:00.000Z",
      updated_by: "actor-2",
    } as never;
    const tagAssignment = {
      created_at: "2026-06-01T00:00:00.000Z",
      created_by: "actor-1",
      guest_id: baseGuest.id,
      id: "66666666-6666-4666-8666-666666666666",
      project_id: projectId,
      tag_id: "77777777-7777-4777-8777-777777777777",
    } as never;
    const rawTitleType = {
      created_at: "2026-06-01T00:00:00.000Z",
      created_by: "actor-1",
      default_guest_count: 1,
      id: guestTitleType.id,
      is_system_default: true,
      label: "Mr.",
      project_id: projectId,
      requires_admin_approval: false,
      slug: "mr",
      sort_order: 1,
      updated_at: "2026-06-01T00:00:00.000Z",
    } as never;

    const apiGuest = redactGuestForApi(guest);
    const apiDetails = redactGuestDetailsForApi({
      eventAssignments: [eventAssignment],
      guest,
      tagAssignments: [tagAssignment],
      titleType: rawTitleType,
    });

    expect(apiGuest).toMatchObject({
      display_name: "Ada Kanda",
      guest_side: "bride",
      whatsapp_number: "+243 810 000 001",
    });
    expect(apiGuest).not.toHaveProperty("internal_notes");
    expect(apiGuest).not.toHaveProperty("normalized_name");
    expect(apiGuest).not.toHaveProperty("normalized_whatsapp");
    expect(apiGuest).not.toHaveProperty("created_by");
    expect(apiGuest).not.toHaveProperty("updated_by");
    expect(apiDetails.guest).not.toHaveProperty("internal_notes");
    expect(apiDetails.eventAssignments[0]).not.toHaveProperty("created_by");
    expect(apiDetails.eventAssignments[0]).not.toHaveProperty("updated_by");
    expect(apiDetails.tagAssignments[0]).not.toHaveProperty("created_by");
    expect(apiDetails.titleType).not.toHaveProperty("created_by");
  });

  it("detects duplicate candidates by normalized name and WhatsApp within one project", () => {
    const candidates = detectGuestDuplicateCandidates(
      {
        ...baseGuest,
        displayName: "ADA KANDA",
        id: "77777777-7777-4777-8777-777777777777",
      },
      [
        baseGuest,
        {
          ...baseGuest,
          id: "88888888-8888-4888-8888-888888888888",
          normalizedName: "different guest",
        },
        {
          ...baseGuest,
          id: "99999999-9999-4999-8999-999999999999",
          projectId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        },
      ],
    );

    expect(candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ reason: "normalized_name" }),
        expect.objectContaining({ reason: "title_and_name" }),
        expect.objectContaining({ reason: "whatsapp_number" }),
      ]),
    );
    expect(candidates).toHaveLength(4);
  });

  it("represents bride/groom own-side edit restrictions", () => {
    const brideAssignments: RoleAssignment[] = [
      { role: "bride", scope: "project", scopeId: projectId },
    ];
    const groomAssignments: RoleAssignment[] = [
      { role: "groom", scope: "project", scopeId: projectId },
    ];
    const adminAssignments: RoleAssignment[] = [
      { role: "diginoces_admin", scope: "global" },
    ];

    expect(canManageGuestSide(brideAssignments, "bride", projectId)).toBe(true);
    expect(canManageGuestSide(brideAssignments, "groom", projectId)).toBe(
      false,
    );
    expect(canManageGuestSide(groomAssignments, "groom", projectId)).toBe(true);
    expect(canManageGuestSide(groomAssignments, "bride", projectId)).toBe(
      false,
    );
    expect(canManageGuestSide(adminAssignments, "both", projectId)).toBe(true);
    expect(canCreateGuestSide(brideAssignments, "bride", projectId)).toBe(true);
    expect(canCreateGuestSide(brideAssignments, "groom", projectId)).toBe(
      false,
    );
    expect(canCreateGuestSide(groomAssignments, "groom", projectId)).toBe(true);
    expect(canCreateGuestSide(groomAssignments, "bride", projectId)).toBe(
      false,
    );
    expect(canCreateGuestSide(adminAssignments, "groom", projectId)).toBe(true);
    expect(canCreateGuestSide(adminAssignments, "both", projectId)).toBe(true);
  });

  it("requires the explicit deactivation permission only for active-to-inactive updates", () => {
    expect(
      guestUpdateRequiresDeactivationPermission(
        { is_active: true },
        { isActive: false },
      ),
    ).toBe(true);
    expect(
      guestUpdateRequiresDeactivationPermission(
        { is_active: true },
        { isActive: true },
      ),
    ).toBe(false);
    expect(
      guestUpdateRequiresDeactivationPermission(
        { is_active: false },
        { isActive: false },
      ),
    ).toBe(false);
    expect(
      guestUpdateRequiresDeactivationPermission({ is_active: true }, {}),
    ).toBe(false);
    expect(
      guestUpdateRequiresDeactivationPermission(
        { is_active: false },
        { isActive: true },
      ),
    ).toBe(false);
  });

  it("keeps guest API mutations behind the same contract gate as server-rendered forms", () => {
    const projectGuestRoute = readFileSync(
      join(webRoot, "src/app/api/projects/[projectId]/guests/route.ts"),
      "utf8",
    );
    const guestRoute = readFileSync(
      join(webRoot, "src/app/api/guests/[guestId]/route.ts"),
      "utf8",
    );

    expect(projectGuestRoute).toContain("requireGuestListContractGateOpen");
    expect(projectGuestRoute).toMatch(
      /await requireGuestCreatePermission[\s\S]*await requireGuestListContractGateOpen/,
    );
    expect(guestRoute).toContain("requireGuestListContractGateOpen");
    expect(guestRoute).toMatch(
      /await requireGuestSidePermission[\s\S]*await requireGuestListContractGateOpen/,
    );
  });

  it("validates records for later invitation workflows without implementing invitations", () => {
    expect(
      validateGuestForFoundation({
        ...baseGuest,
        eventAssignments: [{ eventId, guestId: baseGuest.id, invited: true }],
        titleType: guestTitleType,
      }),
    ).toStrictEqual([]);

    expect(
      validateGuestForFoundation({
        ...baseGuest,
        eventAssignments: [],
        guestTitleTypeId: null,
        titleType: null,
        whatsappNumber: null,
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "missing_title_type" }),
        expect.objectContaining({ code: "missing_event_assignment" }),
      ]),
    );
  });
});
