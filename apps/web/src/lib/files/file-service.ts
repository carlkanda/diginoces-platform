import { randomUUID } from "node:crypto";
import { hasScopedPermission } from "@/lib/projects/project-permissions";
import type {
  PermissionSlug,
  RoleAssignment,
} from "@/lib/security/permissions";

export const fileCategories = [
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
] as const;

export type FileCategory = (typeof fileCategories)[number];

export const fileVisibilities = [
  "couple_visible",
  "guest_visible",
  "internal",
  "partner_visible",
] as const;

export type FileVisibility = (typeof fileVisibilities)[number];

export const fileStatuses = [
  "active",
  "archived",
  "deleted",
  "failed",
  "generated",
  "pending_cleanup",
  "superseded",
] as const;

export type FileStatus = (typeof fileStatuses)[number];

export type RetentionStatus =
  | "active"
  | "archived"
  | "completed"
  | "deleted"
  | "pending_deletion"
  | "retention_active"
  | "retention_due"
  | "retention_extended";

export type FileAction =
  | "archive"
  | "download"
  | "read"
  | "register"
  | "retention.manage"
  | "version.manage";

export type FileRegistrationInput = {
  category: FileCategory;
  extension: string;
  fileSizeBytes: number;
  filename: string;
  mimeType: string;
  visibility: FileVisibility;
};

export type ProjectFileRecord = {
  bucket: string;
  category: FileCategory;
  eventId: string | null;
  fileSizeBytes: number;
  filename: string;
  guestId: string | null;
  id: string;
  invitationId: string | null;
  isActive: boolean;
  isLatest: boolean;
  mimeType: string;
  projectId: string;
  retentionExpiresAt: string | null;
  status: FileStatus;
  storagePath: string;
  version: number;
  versionGroupId: string;
  visibility: FileVisibility;
};

export type NewFileVersionInput = Omit<
  ProjectFileRecord,
  "id" | "isActive" | "isLatest" | "retentionExpiresAt" | "status" | "version"
>;

export type GuestFileDownloadDecision =
  | {
      allowed: true;
    }
  | {
      allowed: false;
      reason:
        | "guest_page_locked"
        | "inactive_or_not_latest"
        | "not_file_owner"
        | "not_guest_visible";
    };

export type RetentionComputationInput = {
  archivedAt?: string | null;
  completedAt?: string | null;
  extendedUntil?: string | null;
  now?: string | null;
};

export type RetentionComputationResult = {
  retentionEndAt: string | null;
  retentionStartAt: string | null;
  status: RetentionStatus;
};

export type FileArchivePlan = {
  action: "archive" | "soft_delete";
  actorPermissions: ReadonlySet<PermissionSlug>;
  file: ProjectFileRecord;
  reason: string;
};

export class FileValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FileValidationError";
  }
}

const categorySet = new Set<string>(fileCategories);
const maxProjectFileBytes = 50 * 1024 * 1024;
const dangerousExtensionSet = new Set([
  "app",
  "asp",
  "aspx",
  "bat",
  "cmd",
  "com",
  "dll",
  "exe",
  "jar",
  "js",
  "jsp",
  "mjs",
  "msi",
  "php",
  "ps1",
  "py",
  "rb",
  "scr",
  "sh",
  "vbs",
  "wsf",
]);
const secretFilenameSet = new Set([
  ".env",
  ".env.local",
  ".env.production",
  "id_rsa",
  "id_dsa",
  "id_ed25519",
]);
const extensionMimeMap = new Map([
  ["csv", new Set(["text/csv", "application/csv"])],
  ["jpg", new Set(["image/jpeg"])],
  ["jpeg", new Set(["image/jpeg"])],
  ["md", new Set(["text/markdown", "text/plain"])],
  ["pdf", new Set(["application/pdf"])],
  ["png", new Set(["image/png"])],
  ["txt", new Set(["text/plain"])],
  ["webp", new Set(["image/webp"])],
  [
    "xlsx",
    new Set([
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ]),
  ],
]);

const fileActionPermissions: Record<FileAction, PermissionSlug> = {
  archive: "files.archive",
  download: "files.download",
  read: "files.read",
  register: "files.write",
  "retention.manage": "files.retention.manage",
  "version.manage": "files.version.manage",
};

const fileAuditActions = [
  "files.registered",
  "files.uploaded",
  "files.download_requested",
  "files.download_denied",
  "files.guest_signed_url_created",
  "files.version_created",
  "files.latest_changed",
  "files.archived",
  "files.soft_deleted",
  "files.retention_extended",
  "file_retention_policies.created",
  "file_retention_policies.updated",
  "projects.completed",
  "projects.archived",
  "projects.retention_extended",
  "projects.marked_pending_deletion",
  "projects.cancelled_pending_deletion",
  "projects.retention_updated",
] as const;

function assertIsRecord(
  payload: unknown,
): asserts payload is Record<string, unknown> {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new FileValidationError("Request body must be a JSON object.");
  }
}

function requiredText(value: unknown, fieldName: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new FileValidationError(`${fieldName} is required.`);
  }

  return value.trim();
}

function optionalVisibility(value: unknown): FileVisibility {
  if (value === undefined || value === null || value === "") {
    return "internal";
  }

  if (
    value === "internal" ||
    value === "couple_visible" ||
    value === "partner_visible" ||
    value === "guest_visible"
  ) {
    return value;
  }

  throw new FileValidationError("File visibility is not supported.");
}

function requiredNonNegativeInteger(value: unknown, fieldName: string) {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    !Number.isFinite(value) ||
    value < 0
  ) {
    throw new FileValidationError(
      `${fieldName} must be a non-negative integer.`,
    );
  }

  return value;
}

function parseCategory(value: unknown): FileCategory {
  const category = requiredText(value, "category");

  if (!categorySet.has(category)) {
    throw new FileValidationError("File category is not supported.");
  }

  return category as FileCategory;
}

function parseExtension(filename: string) {
  const trimmed = filename.trim();
  const lower = trimmed.toLowerCase();
  const dotIndex = trimmed.lastIndexOf(".");

  if (secretFilenameSet.has(lower) || lower.startsWith(".env.")) {
    throw new FileValidationError(
      "Environment and secret files cannot be uploaded.",
    );
  }

  if (dotIndex <= 0 || dotIndex === trimmed.length - 1) {
    throw new FileValidationError("File extension is required.");
  }

  return trimmed.slice(dotIndex + 1).toLowerCase();
}

function assertSafeFilename(filename: string, extension: string) {
  const lower = filename.trim().toLowerCase();

  if (secretFilenameSet.has(lower) || lower.startsWith(".env.")) {
    throw new FileValidationError(
      "Environment and secret files cannot be uploaded.",
    );
  }

  if (
    lower.includes("service-role") ||
    lower.includes("service_role") ||
    lower.includes("private-key") ||
    lower.includes("private_key")
  ) {
    throw new FileValidationError(
      "Credential and private-key files cannot be uploaded.",
    );
  }

  if (dangerousExtensionSet.has(extension)) {
    throw new FileValidationError(
      "Executable or script files cannot be uploaded.",
    );
  }
}

function assertMimeMatchesExtension(extension: string, mimeType: string) {
  const allowedMimes = extensionMimeMap.get(extension);

  if (!allowedMimes) {
    throw new FileValidationError("File extension is not allowed.");
  }

  if (!allowedMimes.has(mimeType)) {
    throw new FileValidationError("File extension and MIME type do not match.");
  }
}

export function parseFileRegistrationPayload(
  payload: unknown,
): FileRegistrationInput {
  assertIsRecord(payload);
  const filename = requiredText(payload.filename, "filename");
  const extension = parseExtension(filename);
  const mimeType = requiredText(payload.mimeType, "mimeType").toLowerCase();
  const fileSizeBytes = requiredNonNegativeInteger(
    payload.fileSizeBytes,
    "fileSizeBytes",
  );

  if (fileSizeBytes > maxProjectFileBytes) {
    throw new FileValidationError("Project files must be 50 MB or smaller.");
  }

  assertSafeFilename(filename, extension);
  assertMimeMatchesExtension(extension, mimeType);

  return {
    category: parseCategory(payload.category),
    extension,
    fileSizeBytes,
    filename,
    mimeType,
    visibility: optionalVisibility(payload.visibility),
  };
}

export function createNextFileVersion(
  existingVersions: ProjectFileRecord[],
  input: NewFileVersionInput,
) {
  const nextVersion =
    existingVersions
      .filter((file) => file.versionGroupId === input.versionGroupId)
      .reduce((max, file) => Math.max(max, file.version), 0) + 1;

  return [
    ...existingVersions.map((file) =>
      file.versionGroupId === input.versionGroupId
        ? {
            ...file,
            isActive: false,
            isLatest: false,
            status:
              file.status === "active" || file.status === "generated"
                ? ("superseded" as const)
                : file.status,
          }
        : file,
    ),
    {
      ...input,
      id: randomUUID(),
      isActive: true,
      isLatest: true,
      retentionExpiresAt: null,
      status: "active" as const,
      version: nextVersion,
    },
  ];
}

export function getLatestGuestFacingFile(
  files: ProjectFileRecord[],
  input: {
    category: FileCategory;
    guestId: string;
  },
) {
  return files.find(
    (file) =>
      file.category === input.category &&
      file.guestId === input.guestId &&
      file.visibility === "guest_visible" &&
      file.isActive &&
      file.isLatest &&
      file.status === "active",
  );
}

export function validateGuestFileDownload(input: {
  file: ProjectFileRecord;
  guestId: string;
  projectGateOpen: boolean;
}): GuestFileDownloadDecision {
  if (!input.projectGateOpen) {
    return { allowed: false, reason: "guest_page_locked" };
  }

  if (input.file.guestId !== input.guestId) {
    return { allowed: false, reason: "not_file_owner" };
  }

  if (input.file.visibility !== "guest_visible") {
    return { allowed: false, reason: "not_guest_visible" };
  }

  if (
    !input.file.isActive ||
    !input.file.isLatest ||
    input.file.status !== "active"
  ) {
    return { allowed: false, reason: "inactive_or_not_latest" };
  }

  return { allowed: true };
}

function addUtcYears(value: Date, years: number) {
  const next = new Date(value.getTime());
  next.setUTCFullYear(next.getUTCFullYear() + years);
  return next;
}

export function computeRetentionStatus(
  input: RetentionComputationInput,
): RetentionComputationResult {
  const retentionStartAt = input.archivedAt ?? input.completedAt ?? null;

  if (!retentionStartAt) {
    return {
      retentionEndAt: null,
      retentionStartAt: null,
      status: "active",
    };
  }

  const start = new Date(retentionStartAt);

  if (Number.isNaN(start.getTime())) {
    throw new FileValidationError("Retention start date is invalid.");
  }

  const defaultEnd = addUtcYears(start, 1);
  const extendedUntil = input.extendedUntil
    ? new Date(input.extendedUntil)
    : null;

  if (extendedUntil && Number.isNaN(extendedUntil.getTime())) {
    throw new FileValidationError("Retention extension date is invalid.");
  }

  const retentionEnd =
    extendedUntil && extendedUntil > defaultEnd ? extendedUntil : defaultEnd;
  const now = input.now ? new Date(input.now) : new Date();

  if (Number.isNaN(now.getTime())) {
    throw new FileValidationError("Current retention date is invalid.");
  }

  const status: RetentionStatus =
    now > retentionEnd
      ? "retention_due"
      : extendedUntil && extendedUntil > defaultEnd
        ? "retention_extended"
        : "retention_active";

  return {
    retentionEndAt: retentionEnd.toISOString(),
    retentionStartAt: start.toISOString(),
    status,
  };
}

export function planFileArchive(input: FileArchivePlan) {
  const reason = input.reason.trim();

  if (!input.actorPermissions.has("files.archive")) {
    throw new FileValidationError(
      "File archive requires files.archive permission.",
    );
  }

  if (reason.length === 0) {
    throw new FileValidationError("A reason is required.");
  }

  if (input.action === "soft_delete" && input.file.isLatest) {
    throw new FileValidationError(
      "Latest active files must be archived before soft deletion.",
    );
  }

  return {
    fileId: input.file.id,
    nextStatus: input.action === "archive" ? "archived" : "deleted",
    reason,
  };
}

export function buildCanvaExportMetadata(input: {
  excludedCount: number;
  exportType: Extract<
    FileCategory,
    | "canva_csv_export"
    | "guest_book_export"
    | "report_export"
    | "table_card_export"
  >;
  includedCount: number;
  rowCount: number;
  sourceModule: "guest_book" | "reports" | "seating" | "template_exports";
}) {
  return {
    excludedCount: input.excludedCount,
    exportType: input.exportType,
    includedCount: input.includedCount,
    rowCount: input.rowCount,
    sourceModule: input.sourceModule,
  };
}

export function canPerformFileAction(
  assignments: RoleAssignment[],
  projectId: string,
  action: FileAction,
) {
  return hasScopedPermission(assignments, fileActionPermissions[action], {
    projectId,
    scope: "project",
  });
}

export function buildFileAuditActions() {
  return [...fileAuditActions];
}

export function getSprint14FilesStatus() {
  return {
    epic: "EPIC-FILE",
    features: [
      "FEAT-FILE-001",
      "FEAT-FILE-002",
      "FEAT-FILE-003",
      "FEAT-FILE-004",
      "FEAT-FILE-005",
      "FEAT-FILE-006",
      "FEAT-FILE-007",
      "FEAT-FILE-008",
      "FEAT-FILE-009",
      "FEAT-FILE-010",
    ],
    issue: 30,
    requirementIds: [
      "FILE-001",
      "FILE-002",
      "FILE-003",
      "FILE-004",
      "FILE-005",
      "FILE-006",
      "FILE-007",
      "FILE-008",
      "FILE-009",
      "PV-006",
      "REP-005",
      "REP-006",
      "ROLE-001",
      "ROLE-002",
      "ROLE-003",
      "ROLE-004",
      "ROLE-009",
      "TECH-004",
    ],
    modules: [
      {
        description:
          "Project, event, guest, invitation, report, export, contract, and partner file categories with retention metadata.",
        name: "File library and categories",
        requirementIds: ["FILE-001", "FILE-002", "FILE-005"],
      },
      {
        description:
          "Validated registration, version/latest tracking, secure signed-download routing, and public guest file access checks.",
        name: "Storage and download controls",
        requirementIds: ["FILE-003", "FILE-004", "FILE-006", "TECH-004"],
      },
      {
        description:
          "Retention review, archive lifecycle, soft-delete/revoke controls, access events, and audit-log redaction.",
        name: "Retention, archive, and audit",
        requirementIds: ["FILE-007", "FILE-008", "FILE-009", "REP-006"],
      },
    ],
    sprint: "Sprint 14 - Files, Storage, Retention & Archive",
    stories: ["STORY-FILE-001"],
  };
}
