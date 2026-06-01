import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  buildCanvaExportMetadata,
  buildFileAuditActions,
  canPerformFileAction,
  computeRetentionStatus,
  createNextFileVersion,
  fileCategories,
  getLatestGuestFacingFile,
  parseFileRegistrationPayload,
  planFileArchive,
  validateGuestFileDownload,
  type ProjectFileRecord,
} from "@/lib/files/file-service";
import {
  roleDefinitions,
  type PermissionSlug,
} from "@/lib/security/permissions";

const here = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = join(here, "..", "..", "..", "..", "..");
const migrationDir = join(repoRoot, "supabase", "migrations");

function readSprint14Migration() {
  const matches = readdirSync(migrationDir).filter((entry) =>
    entry.endsWith("_sprint_14_files_storage_retention_archive.sql"),
  );

  if (matches.length !== 1) {
    throw new Error(
      `Expected exactly one Sprint 14 migration file, found ${matches.length}.`,
    );
  }

  return readFileSync(join(migrationDir, matches[0]), "utf8");
}

function fileRecord(
  overrides: Partial<ProjectFileRecord> = {},
): ProjectFileRecord {
  return {
    bucket: "project-files",
    category: "generated_invitation",
    eventId: "event-1",
    fileSizeBytes: 1024,
    filename: "guest-a.pdf",
    guestId: "guest-a",
    id: "file-1",
    invitationId: "invitation-a",
    isActive: true,
    isLatest: true,
    mimeType: "application/pdf",
    projectId: "project-1",
    retentionExpiresAt: null,
    status: "active",
    storagePath: "projects/project-1/events/event-1/invitations/guest-a.pdf",
    version: 1,
    versionGroupId: "group-1",
    visibility: "guest_visible",
    ...overrides,
  };
}

describe("Sprint 14 file foundation", () => {
  it("defines the documented file categories with stable slugs", () => {
    expect(fileCategories).toEqual([
      "contract",
      "contract_addendum",
      "payment_proof",
      "invitation_template",
      "generated_invitation",
      "qr_asset",
      "import_file",
      "canva_csv_export",
      "table_card_export",
      "guest_book_export",
      "report_export",
      "check_in_export",
      "partner_document",
      "project_archive",
      "other",
    ]);
  });

  it("validates file metadata and rejects dangerous uploads", () => {
    expect(
      parseFileRegistrationPayload({
        category: "generated_invitation",
        fileSizeBytes: 0,
        filename: "guest-invitation.pdf",
        mimeType: "application/pdf",
        visibility: "guest_visible",
      }),
    ).toMatchObject({
      category: "generated_invitation",
      extension: "pdf",
      fileSizeBytes: 0,
      mimeType: "application/pdf",
      visibility: "guest_visible",
    });

    expect(() =>
      parseFileRegistrationPayload({
        category: "generated_invitation",
        fileSizeBytes: 2048,
        filename: ".env",
        mimeType: "text/plain",
      }),
    ).toThrow("Environment and secret files cannot be uploaded.");

    expect(() =>
      parseFileRegistrationPayload({
        category: "other",
        fileSizeBytes: 2048,
        filename: "cleanup.php",
        mimeType: "text/plain",
      }),
    ).toThrow("Executable or script files cannot be uploaded.");

    expect(() =>
      parseFileRegistrationPayload({
        category: "other",
        fileSizeBytes: -1,
        filename: "notes.txt",
        mimeType: "text/plain",
      }),
    ).toThrow("fileSizeBytes must be a non-negative integer.");

    expect(() =>
      parseFileRegistrationPayload({
        category: "generated_invitation",
        fileSizeBytes: 2048,
        filename: "guest-invitation.pdf",
        mimeType: "text/csv",
      }),
    ).toThrow("File extension and MIME type do not match.");
  });

  it("creates a new file version without destroying previous versions", () => {
    const versions = createNextFileVersion(
      [
        fileRecord({ id: "file-1", isLatest: true, version: 1 }),
        fileRecord({ id: "file-other", versionGroupId: "group-other" }),
      ],
      {
        bucket: "project-files",
        category: "generated_invitation",
        eventId: "event-1",
        fileSizeBytes: 2048,
        filename: "guest-a-v2.pdf",
        guestId: "guest-a",
        invitationId: "invitation-a",
        mimeType: "application/pdf",
        projectId: "project-1",
        storagePath:
          "projects/project-1/events/event-1/invitations/guest-a-v2.pdf",
        versionGroupId: "group-1",
        visibility: "guest_visible",
      },
    );

    expect(
      versions.filter((version) => version.versionGroupId === "group-1"),
    ).toHaveLength(2);
    expect(
      versions.filter(
        (version) => version.versionGroupId === "group-1" && version.isLatest,
      ),
    ).toHaveLength(1);
    expect(versions.find((version) => version.id === "file-1")).toMatchObject({
      isLatest: false,
      status: "superseded",
    });
    expect(versions.at(-1)).toMatchObject({
      isActive: true,
      isLatest: true,
      status: "active",
      version: 2,
    });
  });

  it("allows guests to download only their own latest active guest-facing file", () => {
    const files = [
      fileRecord({ id: "old", isLatest: false, status: "superseded" }),
      fileRecord({ id: "latest" }),
      fileRecord({
        guestId: "guest-b",
        id: "other-guest",
        versionGroupId: "group-2",
      }),
    ];

    expect(
      getLatestGuestFacingFile(files, {
        category: "generated_invitation",
        guestId: "guest-a",
      })?.id,
    ).toBe("latest");

    expect(
      validateGuestFileDownload({
        file: files[1],
        guestId: "guest-a",
        projectGateOpen: true,
      }),
    ).toEqual({ allowed: true });

    expect(
      validateGuestFileDownload({
        file: files[2],
        guestId: "guest-a",
        projectGateOpen: true,
      }),
    ).toMatchObject({ allowed: false, reason: "not_file_owner" });

    expect(
      validateGuestFileDownload({
        file: fileRecord({ isActive: false, status: "archived" }),
        guestId: "guest-a",
        projectGateOpen: true,
      }),
    ).toMatchObject({ allowed: false, reason: "inactive_or_not_latest" });
  });

  it("keeps internal, couple, partner, and archive permissions distinct", () => {
    expect(
      canPerformFileAction(
        [{ role: "diginoces_admin", scope: "global" }],
        "project-1",
        "retention.manage",
      ),
    ).toBe(true);
    expect(
      canPerformFileAction(
        [{ role: "bride", scope: "project", scopeId: "project-1" }],
        "project-1",
        "archive",
      ),
    ).toBe(false);
    expect(
      canPerformFileAction(
        [
          {
            role: "partner_project_operator",
            scope: "project",
            scopeId: "project-1",
          },
        ],
        "project-1",
        "download",
      ),
    ).toBe(true);
  });

  it("keeps file download grants traceable to file requirements", () => {
    for (const role of ["bride", "couple", "groom"] as const) {
      expect(roleDefinitions[role].grants).toContain("files.download");
      expect(roleDefinitions[role].requirementIds).toContain("FILE-006");
    }

    expect(roleDefinitions.partner_project_operator.grants).toContain(
      "files.download",
    );
    expect(roleDefinitions.partner_project_operator.requirementIds).toEqual(
      expect.arrayContaining(["FILE-004", "FILE-006"]),
    );
  });

  it("computes the one-year retention foundation without automatic deletion", () => {
    expect(
      computeRetentionStatus({
        archivedAt: null,
        completedAt: "2026-01-10T00:00:00.000Z",
        now: "2026-03-01T00:00:00.000Z",
      }),
    ).toMatchObject({
      retentionEndAt: "2027-01-10T00:00:00.000Z",
      status: "retention_active",
    });

    expect(
      computeRetentionStatus({
        archivedAt: "2026-01-10T00:00:00.000Z",
        completedAt: "2026-01-10T00:00:00.000Z",
        now: "2027-02-01T00:00:00.000Z",
      }),
    ).toMatchObject({
      status: "retention_due",
    });

    expect(
      computeRetentionStatus({
        archivedAt: "2026-01-10T00:00:00.000Z",
        completedAt: "2026-01-10T00:00:00.000Z",
        extendedUntil: "2027-06-01T00:00:00.000Z",
        now: "2027-07-01T00:00:00.000Z",
      }),
    ).toMatchObject({
      retentionEndAt: "2027-06-01T00:00:00.000Z",
      status: "retention_due",
    });

    expect(() =>
      computeRetentionStatus({
        archivedAt: "2026-01-10T00:00:00.000Z",
        completedAt: null,
        extendedUntil: "not-a-date",
      }),
    ).toThrow("Retention extension date is invalid.");
  });

  it("requires admin-level archive permission and reason before archive or soft delete", () => {
    expect(() =>
      planFileArchive({
        action: "archive",
        actorPermissions: new Set<PermissionSlug>(["files.read"]),
        file: fileRecord(),
        reason: "cleanup",
      }),
    ).toThrow("File archive requires files.archive permission.");

    expect(() =>
      planFileArchive({
        action: "soft_delete",
        actorPermissions: new Set<PermissionSlug>(["files.archive"]),
        file: fileRecord(),
        reason: "",
      }),
    ).toThrow("A reason is required.");

    expect(
      planFileArchive({
        action: "archive",
        actorPermissions: new Set<PermissionSlug>(["files.archive"]),
        file: fileRecord(),
        reason: "Retain in archive after project close.",
      }),
    ).toMatchObject({
      nextStatus: "archived",
      reason: "Retain in archive after project close.",
    });
  });

  it("stores Canva/export metadata without raw storage credentials", () => {
    expect(
      buildCanvaExportMetadata({
        excludedCount: 2,
        exportType: "guest_book_export",
        includedCount: 14,
        rowCount: 16,
        sourceModule: "guest_book",
      }),
    ).toEqual({
      excludedCount: 2,
      exportType: "guest_book_export",
      includedCount: 14,
      rowCount: 16,
      sourceModule: "guest_book",
    });
  });

  it("registers file/storage/archive audit action names", () => {
    expect(buildFileAuditActions()).toEqual(
      expect.arrayContaining([
        "files.registered",
        "files.download_requested",
        "files.guest_signed_url_created",
        "files.version_created",
        "files.latest_changed",
        "files.archived",
        "files.soft_deleted",
        "files.retention_extended",
        "projects.archived",
        "projects.retention_extended",
        "projects.marked_pending_deletion",
        "projects.cancelled_pending_deletion",
        "file_retention_policies.updated",
      ]),
    );
  });

  it("adds the expected Sprint 14 database objects and fail-closed policies", () => {
    const migration = readSprint14Migration();

    expect(migration).toContain("create type public.file_category");
    expect(migration).toContain(
      "create table if not exists public.file_categories",
    );
    expect(migration).toContain(
      "create table if not exists public.file_access_events",
    );
    expect(migration).toContain(
      "create table if not exists public.file_retention_policies",
    );
    expect(migration).toContain("file_size_unknown boolean");
    expect(migration).toContain(
      "files_size_non_negative check (file_size_bytes >= 0)",
    );
    expect(migration).toContain("p_file_size_bytes < 0");
    expect(migration).toContain(
      "Diginoces admin role is required for file soft deletion.",
    );
    expect(migration).toContain("projects.retention_extended");
    expect(migration).toContain("projects.marked_pending_deletion");
    expect(migration).toContain("projects.cancelled_pending_deletion");
    expect(migration).toContain("v_previous.storage_path || '.v'");
    expect(migration).toContain(
      "create table if not exists public.project_archive_events",
    );
    expect(migration).toContain(
      "create table if not exists public.file_archive_events",
    );
    expect(migration).toContain(
      "create table if not exists public.file_download_tokens",
    );
    expect(migration).toContain(
      "create or replace function public.register_project_file",
    );
    expect(migration).toContain(
      "create or replace function public.create_file_version",
    );
    expect(migration).toContain(
      "create or replace function public.resolve_guest_file_download",
    );
    expect(migration).toContain("app_private.user_can_access_file");
    expect(migration).toContain("status <> 'deleted'");
    expect(migration).toContain("current_user_can_access_project_permissions");
    expect(migration).toContain("insert into storage.buckets");
    expect(migration).not.toContain("delete from storage.objects");
  });
});
