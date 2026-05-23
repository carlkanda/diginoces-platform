import { randomUUID } from "node:crypto";
import { hasScopedPermission } from "@/lib/projects/project-permissions";
import type {
  PermissionSlug,
  RoleAssignment,
} from "@/lib/security/permissions";

export class InvitationValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvitationValidationError";
  }
}

export const MAX_INVITATION_TEMPLATE_PDF_BYTES = 20 * 1024 * 1024;
export const PDF_ENGINE_IDENTIFIER = "tested_pdf_worker_abstraction";

export type InvitationTemplateStatus =
  | "active"
  | "archived"
  | "configured"
  | "draft"
  | "failed"
  | "preview_generated"
  | "technical_preview_approved"
  | "uploaded";

export type InvitationTemplateFileType = "canva_pdf";

export type InvitationFieldTarget =
  | "couple.names"
  | "event.date"
  | "event.name"
  | "event.venue"
  | "guest.display_name"
  | "guest.full_invitation_name"
  | "guest.title"
  | "invitation.id"
  | "public_guest_page_qr"
  | "public_guest_page_url"
  | "table.code"
  | "table.name";

export type InvitationFieldAlignment = "center" | "left" | "right";

export type InvitationFieldPosition = {
  height: number;
  width: number;
  x: number;
  y: number;
};

export type InvitationTemplateFieldInput = {
  alignment?: InvitationFieldAlignment;
  fontFamily?: string | null;
  fontSize?: number | null;
  key: string;
  label: string;
  pageNumber: number;
  position: InvitationFieldPosition;
};

export type InvitationTemplateField = InvitationTemplateFieldInput & {
  key: InvitationFieldTarget;
};

export type InvitationTemplateRegistrationInput = {
  eventId: string;
  fileSizeBytes: number;
  fileType: InvitationTemplateFileType;
  mimeType: "application/pdf";
  sourceFilename: string;
  templateName: string;
};

export type InvitationTemplateFoundation = {
  approvedAt: string | null;
  approvedBy: string | null;
  eventId: string;
  id: string;
  projectId: string;
  status: InvitationTemplateStatus;
  templateVersion: number;
};

export type InvitationGenerationMode =
  | "event"
  | "regenerate_selected"
  | "selected_guests"
  | "technical_preview";

export type InvitationGenerationGuest = {
  displayName: string;
  eventAssignments: Array<{
    eventId: string;
    invited: boolean;
  }>;
  guestId: string;
  guestTitleTypeId: string | null;
  isActive: boolean;
  isPrintedOnly: boolean;
  projectId: string;
  publicGuestPageTokenId: string | null;
  publicGuestPageUrl: string | null;
  whatsappNumber: string | null;
};

export type InvitationValidationIssue = {
  code:
    | "guest_not_active"
    | "guest_not_assigned_to_event"
    | "missing_display_name"
    | "missing_guest_title_type"
    | "missing_public_guest_page_token";
  message: string;
  requirementIds: string[];
};

export type InvitationBatchPlan = {
  blockedGuests: Array<{
    guestId: string;
    issues: InvitationValidationIssue[];
  }>;
  mode: InvitationGenerationMode;
  readyGuestIds: string[];
  skippedGuestIds: string[];
  templateId: string;
};

export type InvitationFileVersion = {
  fileSizeBytes: number;
  generationJobId: string;
  id: string;
  invitationId: string;
  isActive: boolean;
  mimeType: "application/pdf";
  storagePath: string;
  version: number;
};

export type InvitationTextFitInput = {
  maxFontSize: number;
  minFontSize: number;
  text: string;
  widthPoints: number;
};

export type InvitationTextFitResult = {
  estimatedWidthPoints: number;
  fontSize: number;
  overflow: boolean;
  strategy: "fit" | "overflow" | "shrink";
};

export type InvitationPdfWorkerResult = {
  bytes: Uint8Array;
  engine: "tested_pdf_worker_abstraction";
  metadata: {
    fieldCount: number;
    generated: true;
    guestId: string;
    qrTokenType: "guest_public_page";
    templateId: string;
  };
  mimeType: "application/pdf";
};

export type InvitationAction =
  | "files.read"
  | "invitations.generate"
  | "invitations.read"
  | "templates.approve"
  | "templates.create"
  | "templates.read"
  | "templates.update";

export const invitationFieldTargets = [
  "guest.title",
  "guest.display_name",
  "guest.full_invitation_name",
  "event.name",
  "event.date",
  "event.venue",
  "couple.names",
  "table.name",
  "table.code",
  "public_guest_page_qr",
  "public_guest_page_url",
  "invitation.id",
] as const satisfies readonly InvitationFieldTarget[];

export const invitationAuditActions = [
  "invitation_templates.created",
  "invitation_templates.updated",
  "invitation_templates.preview_generated",
  "invitation_templates.preview_approved",
  "invitation_generation_jobs.created",
  "invitation_generation_jobs.updated",
  "invitations.created",
  "invitations.generated",
  "invitations.regeneration_required",
  "invitation_files.versioned",
] as const;

const invitationActionPermissions: Record<InvitationAction, PermissionSlug> = {
  "files.read": "invitation_files.read",
  "invitations.generate": "invitations.generate",
  "invitations.read": "invitations.read",
  "templates.approve": "invitation_templates.approve",
  "templates.create": "invitation_templates.create",
  "templates.read": "invitation_templates.read",
  "templates.update": "invitation_templates.update",
};

const fieldTargetSet = new Set<string>(invitationFieldTargets);

function asRecord(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new InvitationValidationError("Request body must be a JSON object.");
  }

  return payload as Record<string, unknown>;
}

function requiredText(value: unknown, fieldName: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new InvitationValidationError(`${fieldName} is required.`);
  }

  return value.trim();
}

function requiredPositiveNumber(value: unknown, fieldName: string) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new InvitationValidationError(
      `${fieldName} must be a positive number.`,
    );
  }

  return value;
}

function requiredNonNegativeNumber(value: unknown, fieldName: string) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new InvitationValidationError(
      `${fieldName} must be a non-negative number.`,
    );
  }

  return value;
}

function optionalPositiveNumber(value: unknown, fieldName: string) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return requiredPositiveNumber(value, fieldName);
}

function parsePdfFilename(value: unknown) {
  const filename = requiredText(value, "sourceFilename");

  if (!filename.toLowerCase().endsWith(".pdf")) {
    throw new InvitationValidationError(
      "Invitation templates must be Canva-exported PDF files.",
    );
  }

  return filename;
}

export function parseTemplateRegistrationPayload(
  payload: unknown,
): InvitationTemplateRegistrationInput {
  const body = asRecord(payload);
  const fileSizeBytes = requiredPositiveNumber(
    body.fileSizeBytes,
    "fileSizeBytes",
  );

  if (fileSizeBytes > MAX_INVITATION_TEMPLATE_PDF_BYTES) {
    throw new InvitationValidationError(
      "Invitation template PDF must be 20 MB or smaller.",
    );
  }

  if (body.mimeType !== "application/pdf") {
    throw new InvitationValidationError(
      "Invitation template upload supports PDF files only.",
    );
  }

  return {
    eventId: requiredText(body.eventId, "eventId"),
    fileSizeBytes,
    fileType: "canva_pdf",
    mimeType: "application/pdf",
    sourceFilename: parsePdfFilename(body.sourceFilename),
    templateName: requiredText(body.templateName, "templateName"),
  };
}

function parseAlignment(value: unknown): InvitationFieldAlignment | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (value === "left" || value === "center" || value === "right") {
    return value;
  }

  throw new InvitationValidationError(
    "Field alignment must be left, center, or right.",
  );
}

function parsePosition(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new InvitationValidationError("Field position is required.");
  }

  const position = value as Record<string, unknown>;
  const parsed = {
    height: requiredPositiveNumber(position.height, "position.height"),
    width: requiredPositiveNumber(position.width, "position.width"),
    x: requiredNonNegativeNumber(position.x, "position.x"),
    y: requiredNonNegativeNumber(position.y, "position.y"),
  };

  if (
    parsed.x > 1 ||
    parsed.y > 1 ||
    parsed.width > 1 ||
    parsed.height > 1 ||
    parsed.x + parsed.width > 1 ||
    parsed.y + parsed.height > 1
  ) {
    throw new InvitationValidationError(
      "Field coordinates must stay within the page bounds.",
    );
  }

  return parsed;
}

export function validateInvitationFieldConfiguration(
  fields: InvitationTemplateFieldInput[],
): InvitationTemplateField[] {
  if (!Array.isArray(fields)) {
    throw new InvitationValidationError("fields must be an array.");
  }

  if (fields.length === 0) {
    throw new InvitationValidationError(
      "At least one dynamic invitation field is required.",
    );
  }

  return fields.map((field) => {
    const key = requiredText(field.key, "field.key");

    if (!fieldTargetSet.has(key)) {
      throw new InvitationValidationError(
        `Invitation field target ${key} is not supported.`,
      );
    }

    const pageNumber = requiredPositiveNumber(field.pageNumber, "pageNumber");

    if (!Number.isInteger(pageNumber)) {
      throw new InvitationValidationError("pageNumber must be an integer.");
    }

    return {
      alignment: parseAlignment(field.alignment),
      fontFamily:
        typeof field.fontFamily === "string" &&
        field.fontFamily.trim().length > 0
          ? field.fontFamily.trim()
          : null,
      fontSize: optionalPositiveNumber(field.fontSize, "fontSize"),
      key: key as InvitationFieldTarget,
      label: requiredText(field.label, "field.label"),
      pageNumber,
      position: parsePosition(field.position),
    };
  });
}

export function approveTechnicalPreview(
  template: InvitationTemplateFoundation,
  approval: { approvedAt: string; approvedBy: string },
): InvitationTemplateFoundation {
  if (template.status !== "preview_generated") {
    throw new InvitationValidationError(
      "A technical preview must be generated before approval.",
    );
  }

  return {
    ...template,
    approvedAt: requiredText(approval.approvedAt, "approvedAt"),
    approvedBy: requiredText(approval.approvedBy, "approvedBy"),
    status: "technical_preview_approved",
  };
}

export function buildPublicGuestPageQrFieldValue(input: {
  guestId: string;
  publicGuestPageTokenId: string;
  publicGuestPageUrl: string;
}) {
  return {
    fieldKey: "public_guest_page_qr" as const,
    guestId: requiredText(input.guestId, "guestId"),
    tokenId: requiredText(
      input.publicGuestPageTokenId,
      "publicGuestPageTokenId",
    ),
    tokenType: "guest_public_page" as const,
    value: requiredText(input.publicGuestPageUrl, "publicGuestPageUrl"),
  };
}

export function buildFutureCheckInTokenPlaceholder() {
  return {
    active: false,
    note: "Check-in token generation is reserved for the future check-in sprint.",
    tokenType: "check_in" as const,
  };
}

export function validateInvitationGuestReadiness(
  guest: InvitationGenerationGuest,
  eventId?: string,
) {
  const issues: InvitationValidationIssue[] = [];

  if (!guest.isActive) {
    issues.push({
      code: "guest_not_active",
      message: "Guest must be active before invitation generation.",
      requirementIds: ["INV-011", "GM-007"],
    });
  }

  if (guest.displayName.trim().length === 0) {
    issues.push({
      code: "missing_display_name",
      message: "Guest display name is required for invitation generation.",
      requirementIds: ["INV-011", "GM-005"],
    });
  }

  if (!guest.guestTitleTypeId) {
    issues.push({
      code: "missing_guest_title_type",
      message: "Guest title/type is required for invitation generation.",
      requirementIds: ["INV-011", "GM-002"],
    });
  }

  if (!guest.publicGuestPageTokenId || !guest.publicGuestPageUrl) {
    issues.push({
      code: "missing_public_guest_page_token",
      message:
        "Public guest page token and link are required for invitation QR fields.",
      requirementIds: ["INV-009", "RSVP-001", "TECH-010"],
    });
  }

  if (
    eventId &&
    !guest.eventAssignments.some(
      (assignment) => assignment.eventId === eventId && assignment.invited,
    )
  ) {
    issues.push({
      code: "guest_not_assigned_to_event",
      message:
        "Guest must be assigned to the selected event before generation.",
      requirementIds: ["INV-011", "GM-004"],
    });
  }

  return issues;
}

function assertTemplateCanGenerate(template: InvitationTemplateFoundation) {
  if (
    template.status !== "technical_preview_approved" &&
    template.status !== "active"
  ) {
    throw new InvitationValidationError(
      "Invitation generation requires an approved technical preview.",
    );
  }
}

export function planInvitationBatchGeneration(input: {
  eventId: string;
  guests: InvitationGenerationGuest[];
  mode: InvitationGenerationMode;
  template: InvitationTemplateFoundation;
}): InvitationBatchPlan {
  assertTemplateCanGenerate(input.template);

  const readyGuestIds: string[] = [];
  const skippedGuestIds: string[] = [];
  const blockedGuests: InvitationBatchPlan["blockedGuests"] = [];

  for (const guest of input.guests) {
    const isAssignedToEvent = guest.eventAssignments.some(
      (assignment) =>
        assignment.eventId === input.eventId && assignment.invited,
    );

    if (!isAssignedToEvent) {
      skippedGuestIds.push(guest.guestId);
      continue;
    }

    const issues = validateInvitationGuestReadiness(guest, input.eventId);

    if (issues.length > 0) {
      blockedGuests.push({ guestId: guest.guestId, issues });
      continue;
    }

    readyGuestIds.push(guest.guestId);
  }

  return {
    blockedGuests,
    mode: input.mode,
    readyGuestIds,
    skippedGuestIds,
    templateId: input.template.id,
  };
}

export function createInvitationFileVersion(
  existingVersions: InvitationFileVersion[],
  input: Omit<InvitationFileVersion, "id" | "isActive" | "version">,
) {
  const nextVersion =
    existingVersions
      .filter((version) => version.invitationId === input.invitationId)
      .reduce((max, version) => Math.max(max, version.version), 0) + 1;

  return [
    ...existingVersions.map((version) =>
      version.invitationId === input.invitationId
        ? { ...version, isActive: false }
        : version,
    ),
    {
      ...input,
      id: randomUUID(),
      isActive: true,
      version: nextVersion,
    },
  ];
}

function estimatedTextWidth(text: string, fontSize: number) {
  return text.length * fontSize * 0.34;
}

export function fitInvitationText(
  input: InvitationTextFitInput,
): InvitationTextFitResult {
  if (input.maxFontSize < input.minFontSize) {
    throw new InvitationValidationError(
      "maxFontSize must be greater than or equal to minFontSize.",
    );
  }

  if (input.widthPoints <= 0) {
    throw new InvitationValidationError("widthPoints must be positive.");
  }

  const trimmedText = input.text.trim();
  let fontSize = input.maxFontSize;

  while (
    fontSize > input.minFontSize &&
    estimatedTextWidth(trimmedText, fontSize) > input.widthPoints
  ) {
    fontSize -= 1;
  }

  const estimatedWidthPoints = estimatedTextWidth(trimmedText, fontSize);
  const overflow = estimatedWidthPoints > input.widthPoints;

  return {
    estimatedWidthPoints,
    fontSize,
    overflow,
    strategy: overflow
      ? "overflow"
      : fontSize === input.maxFontSize
        ? "fit"
        : "shrink",
  };
}

export function renderInvitationPdfWithWorkerAbstraction(input: {
  fields: InvitationTemplateFieldInput[];
  guest: InvitationGenerationGuest;
  template: InvitationTemplateFoundation;
}): InvitationPdfWorkerResult {
  assertTemplateCanGenerate(input.template);

  const fields = validateInvitationFieldConfiguration(input.fields);
  const readinessIssues = validateInvitationGuestReadiness(input.guest);

  if (readinessIssues.length > 0) {
    throw new InvitationValidationError(
      "Invitation PDF worker cannot render a guest with validation issues.",
    );
  }

  const pdfBody = [
    "%PDF-1.4",
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Count 0 >> endobj",
    `% Sprint 6 worker abstraction template=${input.template.id} guest=${input.guest.guestId} fields=${fields.length}`,
    "%%EOF",
  ].join("\n");

  return {
    bytes: new TextEncoder().encode(pdfBody),
    engine: PDF_ENGINE_IDENTIFIER,
    metadata: {
      fieldCount: fields.length,
      generated: true,
      guestId: input.guest.guestId,
      qrTokenType: "guest_public_page",
      templateId: input.template.id,
    },
    mimeType: "application/pdf",
  };
}

export function canPerformInvitationAction(
  assignments: RoleAssignment[],
  projectId: string,
  action: InvitationAction,
) {
  return hasScopedPermission(assignments, invitationActionPermissions[action], {
    projectId,
    scope: "project",
  });
}

export function buildInvitationAuditActions() {
  return [...invitationAuditActions];
}

export function getSprint6InvitationStatus() {
  return {
    epic: "EPIC-INV",
    features: ["FEAT-INV-001", "FEAT-INV-002", "FEAT-INV-003", "FEAT-INV-004"],
    issue: 12,
    modules: [
      {
        name: "Event-level invitation template upload and registration",
        requirementIds: ["INV-001", "INV-002", "FILE-001", "FILE-004"],
      },
      {
        name: "Dynamic field and coordinate editor foundation",
        requirementIds: ["INV-003", "INV-004", "INV-013"],
      },
      {
        name: "Technical preview and approval workflow",
        requirementIds: ["INV-005", "INV-006", "INV-014", "REP-006"],
      },
      {
        name: "Invitation records, file versions, and batch generation jobs",
        requirementIds: ["INV-007", "INV-008", "INV-011", "INV-012"],
      },
      {
        name: "Public guest page QR/link dynamic field separation",
        requirementIds: ["INV-009", "INV-010", "RSVP-001", "TECH-010"],
      },
      {
        name: "PDF worker abstraction and long-name fitting foundation",
        requirementIds: ["INV-013", "INV-014", "TECH-006"],
      },
      {
        name: "Permission checks and audit logging",
        requirementIds: ["INV-015", "ROLE-001", "ROLE-007", "REP-006"],
      },
    ],
    outOfScope: [
      "WhatsApp sending",
      "invitation sending workflow",
      "seating",
      "check-in",
      "contracts",
      "pricing",
      "payments",
      "partner project creation",
      "full Canva API integration",
    ],
    requirementIds: [
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
      "FILE-001",
      "FILE-004",
      "FILE-005",
      "FILE-006",
      "FILE-009",
      "ROLE-001",
      "ROLE-007",
      "REP-006",
      "RSVP-001",
      "TECH-006",
      "TECH-010",
    ],
    sprint: "Sprint 6 - Invitation Template & PDF Generation",
    stories: [
      "STORY-INV-001",
      "STORY-INV-002",
      "STORY-INV-003",
      "STORY-INV-004",
    ],
  };
}
