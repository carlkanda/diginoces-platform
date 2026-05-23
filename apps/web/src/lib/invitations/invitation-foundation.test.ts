import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  approveTechnicalPreview,
  buildFutureCheckInTokenPlaceholder,
  buildInvitationAuditActions,
  buildPublicGuestPageQrFieldValue,
  canPerformInvitationAction,
  createInvitationFileVersion,
  fitInvitationText,
  getSprint6InvitationStatus,
  invitationFieldTargets,
  InvitationValidationError,
  parseTemplateRegistrationPayload,
  planInvitationBatchGeneration,
  renderInvitationPdfWithWorkerAbstraction,
  validateInvitationFieldConfiguration,
  validateInvitationGuestReadiness,
  type InvitationGenerationGuest,
  type InvitationTemplateFoundation,
  type InvitationTemplateFieldInput,
} from "@/lib/invitations/invitation-service";
import type { RoleAssignment } from "@/lib/security/permissions";

const projectId = "11111111-1111-4111-8111-111111111111";
const eventId = "22222222-2222-4222-8222-222222222222";
const guestId = "33333333-3333-4333-8333-333333333333";
const templateId = "44444444-4444-4444-8444-444444444444";
const tokenId = "55555555-5555-4555-8555-555555555555";

const baseTemplate: InvitationTemplateFoundation = {
  approvedAt: null,
  approvedBy: null,
  eventId,
  id: templateId,
  projectId,
  status: "configured",
  templateVersion: 1,
};

const readyGuest: InvitationGenerationGuest = {
  displayName: "Ada Kanda",
  eventAssignments: [{ eventId, invited: true }],
  guestId,
  guestTitleTypeId: "66666666-6666-4666-8666-666666666666",
  isActive: true,
  isPrintedOnly: false,
  projectId,
  publicGuestPageTokenId: tokenId,
  publicGuestPageUrl: "https://example.test/g/public-token",
  whatsappNumber: "+243810000001",
};

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

function readSprint6Migration() {
  const repoRoot = process.cwd().endsWith(join("apps", "web"))
    ? resolve(process.cwd(), "../..")
    : process.cwd();
  const migrationDir = join(repoRoot, "supabase", "migrations");
  const filename = readdirSync(migrationDir).find((entry) =>
    entry.endsWith("_sprint_6_invitation_template_pdf_generation.sql"),
  );

  if (!filename) {
    throw new Error("Expected Sprint 6 invitation migration file.");
  }

  return readFileSync(join(migrationDir, filename), "utf8");
}

describe("Sprint 6 invitation template and PDF generation foundation", () => {
  it("maps the implemented scope to EPIC-INV, issue 12, and approved backlog IDs", () => {
    const status = getSprint6InvitationStatus();

    expect(status.issue).toBe(12);
    expect(status.epic).toBe("EPIC-INV");
    expect(status.features).toEqual([
      "FEAT-INV-001",
      "FEAT-INV-002",
      "FEAT-INV-003",
      "FEAT-INV-004",
    ]);
    expect(status.stories).toEqual([
      "STORY-INV-001",
      "STORY-INV-002",
      "STORY-INV-003",
      "STORY-INV-004",
    ]);
    expect(status.requirementIds).toEqual(
      expect.arrayContaining([
        "INV-001",
        "INV-002",
        "INV-003",
        "INV-004",
        "INV-005",
        "INV-006",
        "INV-007",
        "INV-008",
        "INV-009",
        "INV-010",
        "INV-011",
        "INV-012",
        "INV-013",
        "INV-014",
        "INV-015",
        "TECH-006",
      ]),
    );
    expect(status.outOfScope.join(" ")).toMatch(/WhatsApp sending/);
  });

  it("accepts Canva-exported PDF template metadata and rejects non-PDF or oversized files", () => {
    expect(
      parseTemplateRegistrationPayload({
        eventId,
        fileSizeBytes: 512_000,
        mimeType: "application/pdf",
        sourceFilename: "Canva export.pdf",
        templateName: "Reception template",
      }),
    ).toMatchObject({
      eventId,
      fileType: "canva_pdf",
      mimeType: "application/pdf",
      sourceFilename: "Canva export.pdf",
      templateName: "Reception template",
    });

    expect(() =>
      parseTemplateRegistrationPayload({
        eventId,
        fileSizeBytes: 512_000,
        mimeType: "image/png",
        sourceFilename: "template.png",
        templateName: "Wrong file",
      }),
    ).toThrow(/PDF/i);
    expect(() =>
      parseTemplateRegistrationPayload({
        eventId,
        fileSizeBytes: 21 * 1024 * 1024,
        mimeType: "application/pdf",
        sourceFilename: "huge.pdf",
        templateName: "Huge file",
      }),
    ).toThrow(/20 MB/i);
  });

  it("validates coordinate editor field configuration and supported dynamic fields", () => {
    const fields: InvitationTemplateFieldInput[] = [
      {
        alignment: "center",
        fontFamily: "Inter",
        fontSize: 18,
        key: "guest.display_name",
        label: "Guest name",
        pageNumber: 1,
        position: { height: 0.08, width: 0.45, x: 0.25, y: 0.42 },
      },
      {
        key: "public_guest_page_qr",
        label: "Guest QR",
        pageNumber: 1,
        position: { height: 0.16, width: 0.16, x: 0, y: 0.7 },
      },
    ];

    const result = validateInvitationFieldConfiguration(fields);

    expect(result).toHaveLength(2);
    expect(result[0].key).toBe("guest.display_name");
    expect(invitationFieldTargets).toContain("public_guest_page_qr");
    expect(() =>
      validateInvitationFieldConfiguration([
        {
          key: "unsupported.field",
          label: "Unsupported",
          pageNumber: 1,
          position: { height: 0.1, width: 0.1, x: 0.1, y: 0.1 },
        },
      ]),
    ).toThrow(InvitationValidationError);
    expect(() =>
      validateInvitationFieldConfiguration([
        {
          key: "guest.display_name",
          label: "Out of bounds",
          pageNumber: 1,
          position: { height: 0.2, width: 0.2, x: 0.9, y: 0.9 },
        },
      ]),
    ).toThrow(/within the page/i);
  });

  it("requires a generated technical preview before approval and generation", () => {
    expect(() =>
      approveTechnicalPreview(baseTemplate, {
        approvedAt: "2026-05-23T10:00:00.000Z",
        approvedBy: "user-1",
      }),
    ).toThrow(/preview/i);

    const approved = approveTechnicalPreview(
      {
        ...baseTemplate,
        status: "preview_generated",
      },
      {
        approvedAt: "2026-05-23T10:00:00.000Z",
        approvedBy: "user-1",
      },
    );

    expect(approved).toMatchObject({
      approvedAt: "2026-05-23T10:00:00.000Z",
      approvedBy: "user-1",
      status: "technical_preview_approved",
    });
  });

  it("keeps public guest page QR/link fields separate from future check-in tokens", () => {
    expect(
      buildPublicGuestPageQrFieldValue({
        guestId,
        publicGuestPageTokenId: tokenId,
        publicGuestPageUrl: "https://diginoces.test/g/abc",
      }),
    ).toMatchObject({
      fieldKey: "public_guest_page_qr",
      tokenType: "guest_public_page",
      value: "https://diginoces.test/g/abc",
    });

    expect(buildFutureCheckInTokenPlaceholder()).toMatchObject({
      active: false,
      tokenType: "check_in",
    });
  });

  it("validates generation readiness without requiring WhatsApp for printed-only guests", () => {
    expect(validateInvitationGuestReadiness(readyGuest)).toEqual([]);
    expect(
      validateInvitationGuestReadiness({
        ...readyGuest,
        guestTitleTypeId: null,
        publicGuestPageTokenId: null,
        publicGuestPageUrl: null,
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "missing_guest_title_type" }),
        expect.objectContaining({ code: "missing_public_guest_page_token" }),
      ]),
    );
    expect(
      validateInvitationGuestReadiness({
        ...readyGuest,
        isPrintedOnly: true,
        whatsappNumber: null,
      }),
    ).toEqual([]);
  });

  it("plans batch generation only for event-assigned ready guests after preview approval", () => {
    const plan = planInvitationBatchGeneration({
      eventId,
      guests: [
        readyGuest,
        {
          ...readyGuest,
          displayName: "No event",
          eventAssignments: [{ eventId: "other-event", invited: true }],
          guestId: "77777777-7777-4777-8777-777777777777",
        },
        {
          ...readyGuest,
          displayName: "",
          guestId: "88888888-8888-4888-8888-888888888888",
        },
      ],
      mode: "event",
      template: {
        ...baseTemplate,
        approvedAt: "2026-05-23T10:00:00.000Z",
        approvedBy: "user-1",
        status: "technical_preview_approved",
      },
    });

    expect(plan.readyGuestIds).toEqual([guestId]);
    expect(plan.blockedGuests).toHaveLength(1);
    expect(plan.skippedGuestIds).toEqual([
      "77777777-7777-4777-8777-777777777777",
    ]);
  });

  it("blocks batch generation until technical preview is approved", () => {
    expect(() =>
      planInvitationBatchGeneration({
        eventId,
        guests: [readyGuest],
        mode: "event",
        template: baseTemplate,
      }),
    ).toThrow(/approved/i);
  });

  it("versions generated invitation files and keeps only the latest active", () => {
    const first = createInvitationFileVersion([], {
      fileSizeBytes: 2048,
      generationJobId: "job-1",
      invitationId: "invitation-1",
      mimeType: "application/pdf",
      storagePath: "invitations/event/guest-v1.pdf",
    });
    const second = createInvitationFileVersion(first, {
      fileSizeBytes: 4096,
      generationJobId: "job-2",
      invitationId: "invitation-1",
      mimeType: "application/pdf",
      storagePath: "invitations/event/guest-v2.pdf",
    });

    expect(second).toHaveLength(2);
    expect(second[0].isActive).toBe(false);
    expect(second[1]).toMatchObject({
      isActive: true,
      storagePath: "invitations/event/guest-v2.pdf",
      version: 2,
    });
  });

  it("shrinks long guest names to fit configured text boxes before marking overflow", () => {
    expect(
      fitInvitationText({
        maxFontSize: 24,
        minFontSize: 12,
        text: "Ada Kanda",
        widthPoints: 220,
      }).fontSize,
    ).toBe(24);
    expect(
      fitInvitationText({
        maxFontSize: 24,
        minFontSize: 12,
        text: "Dr. The Very Long Family Name That Needs Fitting",
        widthPoints: 220,
      }),
    ).toMatchObject({
      overflow: false,
      strategy: "shrink",
    });
    expect(
      fitInvitationText({
        maxFontSize: 18,
        minFontSize: 14,
        text: "An extraordinarily long invitation line that cannot fit",
        widthPoints: 80,
      }).overflow,
    ).toBe(true);
  });

  it("renders a tested PDF worker abstraction for preview/generation foundations", () => {
    const result = renderInvitationPdfWithWorkerAbstraction({
      fields: [
        {
          key: "guest.display_name",
          label: "Guest",
          pageNumber: 1,
          position: { height: 0.08, width: 0.45, x: 0.25, y: 0.42 },
        },
      ],
      guest: readyGuest,
      template: {
        ...baseTemplate,
        status: "technical_preview_approved",
      },
    });

    expect(result.engine).toBe("tested_pdf_worker_abstraction");
    expect(result.mimeType).toBe("application/pdf");
    expect(result.bytes[0]).toBe(0x25);
    expect(result.metadata).toMatchObject({
      generated: true,
      qrTokenType: "guest_public_page",
    });
  });

  it("gates template approval and generation to internal operations roles", () => {
    const admin: RoleAssignment[] = [
      { role: "diginoces_admin", scope: "global" },
    ];
    const operations: RoleAssignment[] = [
      { role: "operations_manager", scope: "global" },
    ];
    const bride: RoleAssignment[] = [
      { role: "bride", scope: "project", scopeId: projectId },
    ];

    expect(
      canPerformInvitationAction(admin, projectId, "templates.approve"),
    ).toBe(true);
    expect(
      canPerformInvitationAction(operations, projectId, "invitations.generate"),
    ).toBe(true);
    expect(
      canPerformInvitationAction(bride, projectId, "templates.approve"),
    ).toBe(false);
    expect(
      canPerformInvitationAction(bride, projectId, "invitations.generate"),
    ).toBe(false);
  });

  it("exposes audit actions for template and generation operations", () => {
    expect(buildInvitationAuditActions()).toEqual(
      expect.arrayContaining([
        "invitation_templates.created",
        "invitation_templates.updated",
        "invitation_templates.preview_generated",
        "invitation_templates.preview_approved",
        "invitation_generation_jobs.created",
        "invitations.generated",
        "invitation_files.versioned",
      ]),
    );
  });

  it("contains Sprint 6 migration, RLS, permissions, and completion report evidence", () => {
    const migration = readSprint6Migration();

    expect(migration).toContain(
      "create table if not exists public.invitation_templates",
    );
    expect(migration).toContain(
      "alter table public.invitation_templates enable row level security",
    );
    expect(migration).toContain("invitation_templates.approve");
    expect(migration).toContain("invitations.generate");
    expect(migration).toContain("guest_public_page");
    expect(migration).toContain("check_in");

    expect(
      readRepoFile("docs/planning/sprint-6-completion-report.md"),
    ).toContain("Sprint 6");
  });
});
