import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  applyApprovedImportRowsForFoundation,
  buildImportPreview,
  canPerformGuestImportAction,
  getGuestImportAuditActions,
  getSprint4ImportStatus,
  MAX_GUEST_IMPORT_CSV_BYTES,
  parseGuestImportCsv,
  suggestColumnMappings,
  type GuestImportPreviewRow,
  type ImportColumnMapping,
} from "@/lib/guest-imports/guest-import-service";
import {
  parseReviewGuestImportRowsPayload,
  parseStartGuestImportPayload,
} from "@/lib/guest-imports/guest-import-db";
import type { GuestFoundationRecord } from "@/lib/guests/guest-service";
import type { RoleAssignment } from "@/lib/security/permissions";

const projectId = "11111111-1111-4111-8111-111111111111";
const brideEventId = "22222222-2222-4222-8222-222222222222";
const guestTitleTypeId = "33333333-3333-4333-8333-333333333333";
const familyTagId = "44444444-4444-4444-8444-444444444444";

const mapping: ImportColumnMapping = {
  displayName: "Nom complet",
  eventNames: "Evenements",
  guestSide: "Cote",
  guestTitleType: "Titre",
  internalNotes: "Commentaires",
  isPrintedOnly: "Invitation",
  preferredLanguage: "Langue",
  tagNames: "Tags",
  whatsappNumber: "WhatsApp",
};

const context = {
  defaultSide: "bride" as const,
  events: [{ id: brideEventId, name: "Reception" }],
  existingGuests: [] as GuestFoundationRecord[],
  projectId,
  tags: [{ id: familyTagId, name: "Family", slug: "family" }],
  titleTypes: [{ id: guestTitleTypeId, label: "Mr.", slug: "mr" }],
};

function approvedRow(row: GuestImportPreviewRow): GuestImportPreviewRow {
  return {
    ...row,
    approvalStatus: "approved",
  };
}

describe("Sprint 4 guest import foundation", () => {
  it("maps the implemented scope to EPIC-GM and issue 7", () => {
    const status = getSprint4ImportStatus();

    expect(status.issue).toBe(7);
    expect(status.epic).toBe("EPIC-GM");
    expect(status.features).toEqual(["FEAT-GM-004"]);
    expect(status.stories).toEqual(["STORY-GM-004", "STORY-GM-005"]);
    expect(status.requirementIds).toEqual(
      expect.arrayContaining([
        "GM-004",
        "GM-005",
        "GM-006",
        "GM-008",
        "GM-015",
        "ROLE-001",
        "ROLE-005",
        "REP-006",
        "TECH-004",
      ]),
    );
    expect(status.outOfScope.join(" ")).toMatch(/automatic duplicate merging/);
  });

  it("parses CSV headers, quoted fields, row numbers, and ignores blank rows", () => {
    const parsed = parseGuestImportCsv(
      [
        "Nom complet,Titre,WhatsApp,Commentaires",
        '"Kanda, Ada",Mr.,+243810000001,"VIP, protocol"',
        ",,,",
        "Nico Kanda,Mr.,+243810000002,",
      ].join("\n"),
    );

    expect(parsed.headers).toEqual([
      "Nom complet",
      "Titre",
      "WhatsApp",
      "Commentaires",
    ]);
    expect(parsed.rows).toHaveLength(2);
    expect(parsed.rows[0]).toMatchObject({
      rowNumber: 2,
      values: {
        Commentaires: "VIP, protocol",
        "Nom complet": "Kanda, Ada",
      },
    });
    expect(parsed.rows[1].rowNumber).toBe(4);
  });

  it("rejects duplicate normalized CSV headers before rows are mapped", () => {
    expect(() =>
      parseGuestImportCsv(
        ["Nom complet,Nom  complet,Titre", "Ada Kanda,Ada Override,Mr."].join(
          "\n",
        ),
      ),
    ).toThrow(/duplicate headers/i);
  });

  it("normalizes malformed CSV parser errors", () => {
    expect(() =>
      parseGuestImportCsv('Nom complet,Titre\n"Unclosed guest,Mr.'),
    ).toThrow(/CSV content is invalid/i);
  });

  it("suggests column mappings for common French and English headers", () => {
    expect(
      suggestColumnMappings([
        "Nom complet",
        "Titre",
        "Téléphone",
        "Côté",
        "Langue",
        "Invitation",
        "Commentaires",
      ]),
    ).toMatchObject({
      displayName: "Nom complet",
      guestSide: "Côté",
      guestTitleType: "Titre",
      internalNotes: "Commentaires",
      isPrintedOnly: "Invitation",
      preferredLanguage: "Langue",
      whatsappNumber: "Téléphone",
    });
  });

  it("maps rows, validates required fields, and resolves events and tags", () => {
    const preview = buildImportPreview(
      parseGuestImportCsv(
        [
          "Nom complet,Titre,WhatsApp,Cote,Langue,Invitation,Evenements,Tags,Commentaires",
          "Ada Kanda,Mr.,+243810000001,Bride,fr,digital,Reception,Family,Front row",
          ",Mr.,+243810000002,Bride,fr,digital,Reception,Family,",
          "Nico Kanda,Dr.,+243810000003,Bride,fr,digital,Reception,Family,",
          "Mona Kanda,Mr.,+243810000004,Guest,fr,digital,Reception,Family,",
          "Lea Kanda,Mr.,+243810000005,Bride,fr,digital,Unknown Event,Family,",
          "Iris Kanda,Mr.,+243810000006,Bride,fr,digital,Reception,Unknown Tag,",
        ].join("\n"),
      ),
      mapping,
      context,
    );

    expect(preview.rows[0]).toMatchObject({
      approvalStatus: "pending",
      mappedFields: {
        displayName: "Ada Kanda",
        eventIds: [brideEventId],
        guestSide: "bride",
        guestTitleTypeId,
        internalNotes: "Front row",
        isPrintedOnly: false,
        preferredLanguage: "fr",
        tagIds: [familyTagId],
      },
      validationStatus: "valid",
    });
    expect(preview.rows[1].validationErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "missing_display_name" }),
      ]),
    );
    expect(preview.rows[2].validationErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "unknown_title_type" }),
      ]),
    );
    expect(preview.rows[3].validationErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "invalid_side" }),
      ]),
    );
    expect(preview.rows[4].validationErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "unknown_event" }),
      ]),
    );
    expect(preview.rows[5].validationErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "unknown_tag" }),
      ]),
    );
    expect(preview.summary.invalidRows).toBe(5);
  });

  it("rejects review payloads that put a row in more than one outcome bucket", () => {
    expect(() =>
      parseReviewGuestImportRowsPayload({
        approvedRowIds: ["row-1", "row-2"],
        heldRowIds: ["row-3"],
        rejectedRowIds: ["row-2"],
      }),
    ).toThrow(/row-2/);
  });

  it("rejects API CSV payloads over the Sprint 4 size limit", () => {
    const maxCsvSizeMb = MAX_GUEST_IMPORT_CSV_BYTES / (1024 * 1024);

    expect(() =>
      parseStartGuestImportPayload({
        csvContent: "a".repeat(MAX_GUEST_IMPORT_CSV_BYTES + 1),
        importSide: "bride",
        sourceFilename: "guests.csv",
      }),
    ).toThrow(`CSV input must be ${maxCsvSizeMb} MB or smaller.`);
  });

  it("allows printed-only rows without WhatsApp but blocks digital rows without WhatsApp", () => {
    const preview = buildImportPreview(
      parseGuestImportCsv(
        [
          "Nom complet,Titre,WhatsApp,Cote,Invitation,Evenements",
          "Printed Guest,Mr.,,Bride,printed,Reception",
          "Digital Guest,Mr.,,Bride,digital,Reception",
        ].join("\n"),
      ),
      mapping,
      context,
    );

    expect(preview.rows[0]).toMatchObject({
      validationErrors: [],
      validationStatus: "valid",
    });
    expect(preview.rows[1].validationErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "missing_whatsapp_for_digital" }),
      ]),
    );
  });

  it("detects duplicates within an import and against existing project guests", () => {
    const existingGuest: GuestFoundationRecord = {
      displayName: "Existing Ada",
      eventAssignments: [],
      guestSide: "bride",
      guestTitleTypeId,
      id: "55555555-5555-4555-8555-555555555555",
      isActive: true,
      isPrintedOnly: false,
      normalizedName: "existing ada",
      projectId,
      whatsappNumber: "+243810999999",
    };

    const preview = buildImportPreview(
      parseGuestImportCsv(
        [
          "Nom complet,Titre,WhatsApp,Cote,Invitation,Evenements",
          "Ada Kanda,Mr.,+243810000001,Bride,digital,Reception",
          "ADA KANDA,Mr.,+243810000002,Bride,digital,Reception",
          "Phone Match,Mr.,+243810999999,Bride,digital,Reception",
        ].join("\n"),
      ),
      mapping,
      { ...context, existingGuests: [existingGuest] },
    );

    expect(preview.rows[1].duplicateWarnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          matchedRowNumber: 2,
          reason: "normalized_name",
        }),
      ]),
    );
    expect(preview.rows[2].duplicateWarnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          matchedGuestId: existingGuest.id,
          reason: "whatsapp_number",
        }),
      ]),
    );
    expect(preview.summary.duplicateWarnings).toBe(2);
  });

  it("keeps bride/groom imports staged until approved and applies only approved rows", () => {
    const preview = buildImportPreview(
      parseGuestImportCsv(
        [
          "Nom complet,Titre,WhatsApp,Cote,Invitation,Evenements",
          "Approved Guest,Mr.,+243810000001,Bride,digital,Reception",
          "Rejected Guest,Mr.,+243810000002,Bride,digital,Reception",
          "Held Guest,Mr.,+243810000003,Bride,digital,Reception",
        ].join("\n"),
      ),
      mapping,
      context,
    );

    const applied = applyApprovedImportRowsForFoundation([
      approvedRow(preview.rows[0]),
      { ...preview.rows[1], approvalStatus: "rejected" },
      { ...preview.rows[2], approvalStatus: "held" },
      {
        ...approvedRow(preview.rows[2]),
        linkedGuestId: "55555555-5555-4555-8555-555555555555",
      },
    ]);

    expect(preview.rows.every((row) => row.linkedGuestId === null)).toBe(true);
    expect(applied).toHaveLength(1);
    expect(applied[0]).toMatchObject({
      displayName: "Approved Guest",
      eventIds: [brideEventId],
      guestSide: "bride",
      guestTitleTypeId,
    });
  });

  it("enforces side-aware import permissions for couple submitters and internal reviewers", () => {
    const brideAssignments: RoleAssignment[] = [
      { role: "bride", scope: "project", scopeId: projectId },
    ];
    const groomAssignments: RoleAssignment[] = [
      { role: "groom", scope: "project", scopeId: projectId },
    ];
    const operationsAssignments: RoleAssignment[] = [
      { role: "operations_manager", scope: "global" },
    ];

    expect(
      canPerformGuestImportAction(
        brideAssignments,
        "create",
        "bride",
        projectId,
      ),
    ).toBe(true);
    expect(
      canPerformGuestImportAction(
        brideAssignments,
        "create",
        "groom",
        projectId,
      ),
    ).toBe(false);
    expect(
      canPerformGuestImportAction(brideAssignments, "read", "bride", projectId),
    ).toBe(true);
    expect(
      canPerformGuestImportAction(brideAssignments, "read", "groom", projectId),
    ).toBe(false);
    expect(
      canPerformGuestImportAction(groomAssignments, "read", "groom", projectId),
    ).toBe(true);
    expect(
      canPerformGuestImportAction(groomAssignments, "read", "bride", projectId),
    ).toBe(false);
    expect(
      canPerformGuestImportAction(
        groomAssignments,
        "read",
        "bride",
        projectId,
        {
          currentUserId: "groom-user",
          uploadedBy: "groom-user",
        },
      ),
    ).toBe(true);
    expect(
      canPerformGuestImportAction(
        brideAssignments,
        "submit",
        "bride",
        projectId,
      ),
    ).toBe(true);
    expect(
      canPerformGuestImportAction(
        brideAssignments,
        "submit",
        "groom",
        projectId,
      ),
    ).toBe(false);
    expect(
      canPerformGuestImportAction(
        brideAssignments,
        "review",
        "bride",
        projectId,
      ),
    ).toBe(false);
    expect(
      canPerformGuestImportAction(
        operationsAssignments,
        "review",
        "groom",
        projectId,
      ),
    ).toBe(true);
    expect(
      canPerformGuestImportAction(
        operationsAssignments,
        "read",
        "both",
        projectId,
      ),
    ).toBe(true);
    expect(
      canPerformGuestImportAction(
        operationsAssignments,
        "apply",
        "both",
        projectId,
      ),
    ).toBe(true);
  });

  it("documents the post-merge migration guards for RLS and workflow transitions", () => {
    // This it(...) intentionally locks migrationPath and content checks to the
    // generated Sprint 4 post-merge hardening migration; renaming or moving the
    // migration file should break this documentation guard.
    const migrationPath = new URL(
      "../../../../../supabase/migrations/20260522221804_sprint_4_post_merge_hardening.sql",
      import.meta.url,
    );

    expect(
      existsSync(migrationPath),
      "Expected Sprint 4 post-merge hardening migration to exist at its generated path.",
    ).toBe(true);

    const migration = readFileSync(migrationPath, "utf8");

    expect(migration).toContain("user_can_read_guest_import_session");
    expect(migration).toContain("for update");
    expect(migration).toContain(
      "Each guest import row can have only one review outcome.",
    );
    expect(migration).toContain(
      "One or more requested review rows do not belong to this import session.",
    );
    expect(migration).toContain(
      "Blocked or applied import rows cannot be approved.",
    );
    expect(migration).toContain("if v_session.status = 'applied' then");
    expect(migration).toContain(
      "^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$",
    );
  });

  it("documents audit actions for import lifecycle changes", () => {
    expect(getGuestImportAuditActions()).toEqual(
      expect.arrayContaining([
        "guest_imports.created",
        "guest_imports.mapping_saved",
        "guest_imports.validation_completed",
        "guest_imports.submitted",
        "guest_imports.reviewed",
        "guest_imports.applied",
        "guest_imports.updated",
        "guest_import_rows.staged",
        "guest_import_rows.reviewed",
        "guest_import_rows.applied",
        "guest_import_rows.validation_updated",
      ]),
    );
    expect(getGuestImportAuditActions()).not.toContain(
      "guest_imports.file_parsed",
    );
  });

  it("keeps the guest import audit trigger from reading row-only fields on sessions", () => {
    const migrationPath = new URL(
      "../../../../../supabase/migrations/20260604212303_mvp_guest_import_audit_trigger_fix.sql",
      import.meta.url,
    );

    expect(
      existsSync(migrationPath),
      "Expected MVP guest import audit trigger fix migration to exist at its generated path.",
    ).toBe(true);

    const migration = readFileSync(migrationPath, "utf8");
    const sessionBranchIndex = migration.indexOf(
      "if tg_table_name = 'guest_import_sessions' then",
    );
    const rowBranchIndex = migration.indexOf(
      "elsif tg_table_name = 'guest_import_rows' then",
    );
    const firstApprovalStatusIndex = migration.indexOf("new.approval_status");
    const actorFallbackIndex = migration.indexOf(
      "actor_user_id := coalesce(actor_user_id, (select auth.uid()))",
    );
    const parentSessionLookupIndex = migration.indexOf(
      "from public.guest_import_sessions gis",
    );

    expect(sessionBranchIndex).toBeGreaterThanOrEqual(0);
    expect(rowBranchIndex).toBeGreaterThan(sessionBranchIndex);
    expect(firstApprovalStatusIndex).toBeGreaterThan(rowBranchIndex);
    expect(parentSessionLookupIndex).toBeGreaterThan(rowBranchIndex);
    expect(actorFallbackIndex).toBeGreaterThan(parentSessionLookupIndex);
  });
});
