import { parse } from "csv-parse/sync";
import { hasScopedPermission } from "@/lib/projects/project-permissions";
import {
  canManageGuestSide,
  normalizeGuestName,
  type CreateGuestInput,
  type GuestFoundationRecord,
  type GuestSide,
} from "@/lib/guests/guest-service";
import type {
  PermissionSlug,
  RoleAssignment,
} from "@/lib/security/permissions";

export class GuestImportValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GuestImportValidationError";
  }
}

export type ImportColumnTarget =
  | "displayName"
  | "eventNames"
  | "guestSide"
  | "guestTitleType"
  | "internalNotes"
  | "isPrintedOnly"
  | "preferredLanguage"
  | "tagNames"
  | "whatsappNumber";

export const importColumnTargets = [
  "displayName",
  "guestTitleType",
  "whatsappNumber",
  "guestSide",
  "preferredLanguage",
  "isPrintedOnly",
  "tagNames",
  "eventNames",
  "internalNotes",
] as const satisfies ImportColumnTarget[];

export type ImportColumnMapping = Partial<Record<ImportColumnTarget, string>>;

export type GuestImportSessionStatus =
  | "draft"
  | "mapping_saved"
  | "previewed"
  | "validation_failed"
  | "ready_for_review"
  | "partially_approved"
  | "approved"
  | "rejected"
  | "applied"
  | "cancelled"
  | "failed";

export type GuestImportRowValidationStatus =
  | "blocked"
  | "pending"
  | "valid"
  | "warning";
export type GuestImportDuplicateSeverity =
  | "blocked"
  | "clear"
  | "needs_review"
  | "warning";
export type GuestImportRowApprovalStatus =
  | "applied"
  | "approved"
  | "held"
  | "pending"
  | "rejected";

export type GuestImportSession = {
  id: string;
  importSide: GuestSide;
  projectId: string;
  sourceFileType: "csv";
  sourceFilename: string;
  status: GuestImportSessionStatus;
};

export type GuestImportRow = {
  approvalStatus: GuestImportRowApprovalStatus;
  id: string;
  importSessionId: string;
  linkedGuestId: string | null;
  rowNumber: number;
  validationStatus: GuestImportRowValidationStatus;
};

export type GuestImportMapping = {
  headers: string[];
  importSessionId: string;
  mapping: ImportColumnMapping;
  projectId: string;
};

export type ParsedGuestImportRow = {
  raw: string[];
  rowNumber: number;
  values: Record<string, string>;
};

export type ParsedGuestImportCsv = {
  headers: string[];
  rows: ParsedGuestImportRow[];
};

export type ImportValidationIssue = {
  code:
    | "invalid_side"
    | "missing_display_name"
    | "missing_event_assignment"
    | "missing_title_type"
    | "missing_whatsapp_for_digital"
    | "unknown_event"
    | "unknown_tag"
    | "unknown_title_type";
  message: string;
  requirementIds: string[];
};

export type ImportDuplicateWarning = {
  matchedGuestId?: string;
  matchedRowNumber?: number;
  message: string;
  reason: "normalized_name" | "title_and_name" | "whatsapp_number";
  requirementIds: string[];
  severity: GuestImportDuplicateSeverity;
};

export type GuestImportMappedFields = {
  displayName: string;
  eventIds: string[];
  guestSide: GuestSide;
  guestTitleTypeId: string | null;
  internalNotes: string | null;
  isPrintedOnly: boolean;
  preferredLanguage: string | null;
  tagIds: string[];
  whatsappNumber: string | null;
};

export type GuestImportPreviewRow = {
  approvalStatus: GuestImportRowApprovalStatus;
  duplicateSeverity: GuestImportDuplicateSeverity;
  duplicateWarnings: ImportDuplicateWarning[];
  linkedGuestId: string | null;
  mappedFields: GuestImportMappedFields;
  rawRow: Record<string, string>;
  rowNumber: number;
  validationErrors: ImportValidationIssue[];
  validationStatus: GuestImportRowValidationStatus;
};

export type GuestImportPreview = {
  rows: GuestImportPreviewRow[];
  summary: {
    duplicateWarnings: number;
    invalidRows: number;
    totalRows: number;
    validRows: number;
  };
};

export type GuestImportReferenceContext = {
  defaultSide: GuestSide;
  events: Array<{ id: string; name: string }>;
  existingGuests: GuestFoundationRecord[];
  projectId: string;
  tags: Array<{ id: string; name: string; slug: string }>;
  titleTypes: Array<{ id: string; label: string; slug: string }>;
};

export type GuestImportAction =
  | "apply"
  | "create"
  | "read"
  | "review"
  | "submit";

const importAuditActions = [
  "guest_imports.created",
  "guest_imports.file_parsed",
  "guest_imports.mapping_saved",
  "guest_imports.validation_completed",
  "guest_imports.submitted",
  "guest_imports.reviewed",
  "guest_imports.applied",
  "guest_import_rows.staged",
  "guest_import_rows.reviewed",
  "guest_import_rows.applied",
] as const;

const headerMatchers: Record<ImportColumnTarget, string[]> = {
  displayName: ["nom", "nomcomplet", "fullname", "name", "prenomnom"],
  eventNames: ["evenement", "evenements", "event", "events", "ceremonie"],
  guestSide: ["cote", "side", "bridegroom", "brideorgroom"],
  guestTitleType: ["titre", "title", "type", "civilite"],
  internalNotes: [
    "commentaire",
    "commentaires",
    "comment",
    "comments",
    "note",
    "notes",
  ],
  isPrintedOnly: ["invitation", "format", "printed", "print"],
  preferredLanguage: ["langue", "language"],
  tagNames: ["tag", "tags", "categorie", "categories"],
  whatsappNumber: ["whatsapp", "telephone", "phone", "tel", "numero"],
};

function normalizeLookup(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function splitMultiValue(value: string | null | undefined) {
  if (!value) {
    return [];
  }

  return value
    .split(/[;,|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeWhatsapp(value: string | null | undefined) {
  const normalized = value?.replace(/\D+/g, "") ?? "";
  return normalized.length > 0 ? normalized : null;
}

function readMappedValue(
  row: ParsedGuestImportRow,
  mapping: ImportColumnMapping,
  target: ImportColumnTarget,
) {
  const header = mapping[target];

  if (!header) {
    return null;
  }

  const value = row.values[header];
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function parseBoolean(value: string | null) {
  if (!value) {
    return false;
  }

  const normalized = normalizeLookup(value);
  return [
    "1",
    "imprime",
    "oui",
    "papier",
    "physical",
    "print",
    "printed",
    "printedonly",
    "true",
    "yes",
  ].includes(normalized);
}

function parseGuestSide(value: string | null, defaultSide: GuestSide) {
  if (!value) {
    return defaultSide;
  }

  const normalized = normalizeLookup(value);

  if (
    [
      "bride",
      "brideside",
      "coteepouse",
      "cotemariee",
      "epouse",
      "mariee",
    ].includes(normalized)
  ) {
    return "bride";
  }

  if (
    ["coteepoux", "cotemarie", "epoux", "groom", "groomside", "marie"].includes(
      normalized,
    )
  ) {
    return "groom";
  }

  if (["both", "bridegroom", "lesdeux"].includes(normalized)) {
    return "both";
  }

  return null;
}

function findByNameOrSlug<
  T extends { label?: string; name?: string; slug: string },
>(records: T[], value: string | null) {
  if (!value) {
    return null;
  }

  const normalized = normalizeLookup(value);
  return (
    records.find((record) =>
      [record.slug, record.label, record.name]
        .filter((candidate): candidate is string => Boolean(candidate))
        .some((candidate) => normalizeLookup(candidate) === normalized),
    ) ?? null
  );
}

function validateMappedFields(
  mappedFields: GuestImportMappedFields,
  row: ParsedGuestImportRow,
  mapping: ImportColumnMapping,
  context: GuestImportReferenceContext,
) {
  const validationErrors: ImportValidationIssue[] = [];
  const rawSide = readMappedValue(row, mapping, "guestSide");
  const rawTitleType = readMappedValue(row, mapping, "guestTitleType");
  const rawEvents = splitMultiValue(
    readMappedValue(row, mapping, "eventNames"),
  );
  const rawTags = splitMultiValue(readMappedValue(row, mapping, "tagNames"));

  if (!mappedFields.displayName) {
    validationErrors.push({
      code: "missing_display_name",
      message: "Guest display name is required.",
      requirementIds: ["GM-004", "GM-006"],
    });
  }

  if (rawSide && parseGuestSide(rawSide, context.defaultSide) === null) {
    validationErrors.push({
      code: "invalid_side",
      message: "Guest side must be bride, groom, or both.",
      requirementIds: ["GM-004", "ROLE-005"],
    });
  }

  if (!rawTitleType) {
    validationErrors.push({
      code: "missing_title_type",
      message: "Guest title/type is required.",
      requirementIds: ["GM-004", "GM-006"],
    });
  } else if (!mappedFields.guestTitleTypeId) {
    validationErrors.push({
      code: "unknown_title_type",
      message: `Guest title/type "${rawTitleType}" is not configured for this project.`,
      requirementIds: ["GM-004", "GM-006"],
    });
  }

  if (mapping.eventNames && rawEvents.length === 0) {
    validationErrors.push({
      code: "missing_event_assignment",
      message: "At least one event assignment is required for import rows.",
      requirementIds: ["GM-004", "GM-006"],
    });
  }

  if (
    rawEvents.length > 0 &&
    mappedFields.eventIds.length !== rawEvents.length
  ) {
    validationErrors.push({
      code: "unknown_event",
      message: "One or more imported events do not belong to this project.",
      requirementIds: ["GM-004", "TECH-004"],
    });
  }

  if (rawTags.length > 0 && mappedFields.tagIds.length !== rawTags.length) {
    validationErrors.push({
      code: "unknown_tag",
      message: "One or more imported tags do not belong to this project.",
      requirementIds: ["GM-004", "TECH-004"],
    });
  }

  if (!mappedFields.isPrintedOnly && !mappedFields.whatsappNumber) {
    validationErrors.push({
      code: "missing_whatsapp_for_digital",
      message: "Digital guests require a WhatsApp number.",
      requirementIds: ["GM-004", "GM-006", "GM-015"],
    });
  }

  return validationErrors;
}

function mapRow(
  row: ParsedGuestImportRow,
  mapping: ImportColumnMapping,
  context: GuestImportReferenceContext,
) {
  const rawSide = readMappedValue(row, mapping, "guestSide");
  const parsedSide = parseGuestSide(rawSide, context.defaultSide);
  const titleType = findByNameOrSlug(
    context.titleTypes,
    readMappedValue(row, mapping, "guestTitleType"),
  );
  const eventIds = splitMultiValue(readMappedValue(row, mapping, "eventNames"))
    .map(
      (eventName) =>
        findByNameOrSlug(
          context.events.map((event) => ({ ...event, slug: event.name })),
          eventName,
        )?.id,
    )
    .filter((eventId): eventId is string => Boolean(eventId));
  const tagIds = splitMultiValue(readMappedValue(row, mapping, "tagNames"))
    .map((tagName) => findByNameOrSlug(context.tags, tagName)?.id)
    .filter((tagId): tagId is string => Boolean(tagId));

  const mappedFields: GuestImportMappedFields = {
    displayName: readMappedValue(row, mapping, "displayName") ?? "",
    eventIds,
    guestSide: parsedSide ?? context.defaultSide,
    guestTitleTypeId: titleType?.id ?? null,
    internalNotes: readMappedValue(row, mapping, "internalNotes"),
    isPrintedOnly: parseBoolean(readMappedValue(row, mapping, "isPrintedOnly")),
    preferredLanguage: readMappedValue(row, mapping, "preferredLanguage"),
    tagIds,
    whatsappNumber: readMappedValue(row, mapping, "whatsappNumber"),
  };

  return mappedFields;
}

function appendDuplicateWarnings(
  rows: GuestImportPreviewRow[],
  context: GuestImportReferenceContext,
) {
  const seenByName = new Map<string, GuestImportPreviewRow>();
  const seenByTitleAndName = new Map<string, GuestImportPreviewRow>();
  const seenByWhatsapp = new Map<string, GuestImportPreviewRow>();

  for (const row of rows) {
    const normalizedName = row.mappedFields.displayName
      ? normalizeGuestName(row.mappedFields.displayName)
      : null;
    const normalizedWhatsapp = normalizeWhatsapp(
      row.mappedFields.whatsappNumber,
    );
    const titleAndName =
      normalizedName && row.mappedFields.guestTitleTypeId
        ? `${row.mappedFields.guestTitleTypeId}:${normalizedName}`
        : null;

    const warnings: ImportDuplicateWarning[] = [];

    if (normalizedName && seenByName.has(normalizedName)) {
      warnings.push({
        matchedRowNumber: seenByName.get(normalizedName)?.rowNumber,
        message: "Another imported row has the same normalized display name.",
        reason: "normalized_name",
        requirementIds: ["GM-008"],
        severity: "warning",
      });
    }

    if (titleAndName && seenByTitleAndName.has(titleAndName)) {
      warnings.push({
        matchedRowNumber: seenByTitleAndName.get(titleAndName)?.rowNumber,
        message:
          "Another imported row has the same title/type and normalized display name.",
        reason: "title_and_name",
        requirementIds: ["GM-008"],
        severity: "warning",
      });
    }

    if (normalizedWhatsapp && seenByWhatsapp.has(normalizedWhatsapp)) {
      warnings.push({
        matchedRowNumber: seenByWhatsapp.get(normalizedWhatsapp)?.rowNumber,
        message: "Another imported row has the same WhatsApp number.",
        reason: "whatsapp_number",
        requirementIds: ["GM-008"],
        severity: "warning",
      });
    }

    for (const existingGuest of context.existingGuests) {
      if (existingGuest.projectId !== context.projectId) {
        continue;
      }

      if (normalizedName && normalizedName === existingGuest.normalizedName) {
        warnings.push({
          matchedGuestId: existingGuest.id,
          message:
            "An active project guest has the same normalized display name.",
          reason: "normalized_name",
          requirementIds: ["GM-008"],
          severity: "warning",
        });
      }

      if (
        normalizedWhatsapp &&
        normalizedWhatsapp === normalizeWhatsapp(existingGuest.whatsappNumber)
      ) {
        warnings.push({
          matchedGuestId: existingGuest.id,
          message: "An active project guest has the same WhatsApp number.",
          reason: "whatsapp_number",
          requirementIds: ["GM-008"],
          severity: "warning",
        });
      }
    }

    row.duplicateWarnings = warnings;
    row.duplicateSeverity = warnings.length > 0 ? "warning" : "clear";

    if (row.validationErrors.length === 0 && warnings.length > 0) {
      row.validationStatus = "warning";
    }

    if (normalizedName && !seenByName.has(normalizedName)) {
      seenByName.set(normalizedName, row);
    }
    if (titleAndName && !seenByTitleAndName.has(titleAndName)) {
      seenByTitleAndName.set(titleAndName, row);
    }
    if (normalizedWhatsapp && !seenByWhatsapp.has(normalizedWhatsapp)) {
      seenByWhatsapp.set(normalizedWhatsapp, row);
    }
  }
}

export function parseGuestImportCsv(csvContent: string): ParsedGuestImportCsv {
  let records: string[][];

  try {
    records = parse(csvContent, {
      bom: true,
      relax_column_count: true,
      skip_empty_lines: false,
    }) as string[][];
  } catch (error) {
    const message =
      error instanceof Error && error.message.length > 0
        ? `CSV content is invalid: ${error.message}`
        : "CSV content is invalid.";

    throw new GuestImportValidationError(message);
  }

  const [rawHeaders, ...rawRows] = records;

  if (!rawHeaders || rawHeaders.every((header) => header.trim().length === 0)) {
    throw new GuestImportValidationError("CSV must include a header row.");
  }

  const headers = rawHeaders.map((header) => header.trim());
  const seenHeaders = new Set<string>();
  const duplicateHeaders = new Set<string>();

  for (const header of headers) {
    const normalizedHeader = normalizeLookup(header);

    if (normalizedHeader.length === 0) {
      continue;
    }

    if (seenHeaders.has(normalizedHeader)) {
      duplicateHeaders.add(header);
      continue;
    }

    seenHeaders.add(normalizedHeader);
  }

  if (duplicateHeaders.size > 0) {
    throw new GuestImportValidationError(
      `CSV contains duplicate headers: ${[...duplicateHeaders].join(", ")}`,
    );
  }

  const rows = rawRows.flatMap((rawRow, index) => {
    const values = Object.fromEntries(
      headers.map((header, headerIndex) => [
        header,
        (rawRow[headerIndex] ?? "").trim(),
      ]),
    );
    const hasValues = Object.values(values).some((value) => value.length > 0);

    if (!hasValues) {
      return [];
    }

    return [
      {
        raw: rawRow,
        rowNumber: index + 2,
        values,
      },
    ];
  });

  return {
    headers,
    rows,
  };
}

export function suggestColumnMappings(headers: string[]): ImportColumnMapping {
  const normalizedHeaders = headers.map((header) => ({
    header,
    normalized: normalizeLookup(header),
  }));
  const mapping: ImportColumnMapping = {};

  for (const [target, candidates] of Object.entries(headerMatchers) as Array<
    [ImportColumnTarget, string[]]
  >) {
    mapping[target] = normalizedHeaders.find(({ normalized }) =>
      candidates.some((candidate) => normalized.includes(candidate)),
    )?.header;
  }

  return mapping;
}

export function buildImportPreview(
  parsedCsv: ParsedGuestImportCsv,
  mapping: ImportColumnMapping,
  context: GuestImportReferenceContext,
): GuestImportPreview {
  const rows: GuestImportPreviewRow[] = parsedCsv.rows.map((row) => {
    const mappedFields = mapRow(row, mapping, context);
    const validationErrors = validateMappedFields(
      mappedFields,
      row,
      mapping,
      context,
    );

    return {
      approvalStatus: "pending",
      duplicateSeverity: "clear",
      duplicateWarnings: [],
      linkedGuestId: null,
      mappedFields,
      rawRow: row.values,
      rowNumber: row.rowNumber,
      validationErrors,
      validationStatus: validationErrors.length > 0 ? "blocked" : "valid",
    };
  });

  appendDuplicateWarnings(rows, context);

  return {
    rows,
    summary: {
      duplicateWarnings: rows.filter((row) => row.duplicateWarnings.length > 0)
        .length,
      invalidRows: rows.filter((row) => row.validationStatus === "blocked")
        .length,
      totalRows: rows.length,
      validRows: rows.filter((row) => row.validationStatus === "valid").length,
    },
  };
}

export function applyApprovedImportRowsForFoundation(
  rows: GuestImportPreviewRow[],
): CreateGuestInput[] {
  return rows
    .filter(
      (row) =>
        row.approvalStatus === "approved" &&
        row.validationStatus !== "blocked" &&
        row.linkedGuestId === null,
    )
    .map((row) => ({
      displayName: row.mappedFields.displayName,
      eventIds: row.mappedFields.eventIds,
      guestSide: row.mappedFields.guestSide,
      guestTitleTypeId: row.mappedFields.guestTitleTypeId ?? "",
      internalNotes: row.mappedFields.internalNotes,
      isPrintedOnly: row.mappedFields.isPrintedOnly,
      preferredLanguage: row.mappedFields.preferredLanguage,
      tagIds: row.mappedFields.tagIds,
      whatsappNumber: row.mappedFields.whatsappNumber,
    }));
}

export function canPerformGuestImportAction(
  assignments: RoleAssignment[],
  action: GuestImportAction,
  side: GuestSide,
  projectId: string,
) {
  const permissionByAction: Record<GuestImportAction, PermissionSlug> = {
    apply: "guest_imports.apply",
    create: "guest_imports.create",
    read: "guest_imports.read",
    review: "guest_imports.review",
    submit: "guest_imports.submit",
  };
  const target = {
    projectId,
    scope: "project" as const,
  };

  if (!hasScopedPermission(assignments, permissionByAction[action], target)) {
    return false;
  }

  if (action === "review" || action === "apply" || action === "read") {
    return true;
  }

  return canManageGuestSide(assignments, side, projectId);
}

export function getGuestImportAuditActions() {
  return [...importAuditActions];
}

export function getSprint4ImportStatus() {
  return {
    epic: "EPIC-GM",
    features: ["FEAT-GM-004"],
    issue: 7,
    modules: [
      {
        name: "CSV import parsing and column mapping",
        requirementIds: ["GM-004"],
      },
      {
        name: "Import preview, validation, and duplicate warnings",
        requirementIds: ["GM-004", "GM-006", "GM-008", "GM-015"],
      },
      {
        name: "Import approval workflow and staged guest creation",
        requirementIds: ["GM-005", "ROLE-001", "ROLE-005", "TECH-004"],
      },
      {
        name: "Import history and audit trail",
        requirementIds: ["GM-004", "GM-005", "REP-006"],
      },
    ],
    outOfScope: [
      "XLSX import",
      "RSVP",
      "public guest page",
      "invitation generation",
      "PDF generation",
      "QR generation",
      "WhatsApp",
      "seating",
      "check-in",
      "contracts",
      "pricing",
      "payments",
      "partner project creation",
      "automatic duplicate merging",
    ],
    requirementIds: [
      "GM-004",
      "GM-005",
      "GM-006",
      "GM-008",
      "GM-013",
      "GM-014",
      "GM-015",
      "ROLE-001",
      "ROLE-005",
      "REP-006",
      "TECH-004",
    ],
    sprint: "Sprint 4 - Guest Import & Approval Workflow",
    stories: ["STORY-GM-004", "STORY-GM-005"],
  };
}
