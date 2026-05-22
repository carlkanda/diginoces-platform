import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildImportPreview,
  importColumnTargets,
  parseGuestImportCsv,
  suggestColumnMappings,
  type GuestImportPreview,
  type GuestImportReferenceContext,
  type GuestImportRowApprovalStatus,
  type ImportColumnMapping,
} from "@/lib/guest-imports/guest-import-service";
import { GuestImportValidationError } from "@/lib/guest-imports/guest-import-service";
import {
  listGuestTags,
  listGuestTitleTypes,
  listProjectGuests,
  normalizeGuestName,
  type GuestFoundationRecord,
  type GuestSide,
} from "@/lib/guests/guest-service";
import { listProjectEvents } from "@/lib/projects/project-service";
import type { Database, Json } from "@/types/database";

export type GuestImportSessionRow =
  Database["public"]["Tables"]["guest_import_sessions"]["Row"];
export type GuestImportRowRow =
  Database["public"]["Tables"]["guest_import_rows"]["Row"];
export type GuestImportMappingRow =
  Database["public"]["Tables"]["guest_import_mappings"]["Row"];

export type GuestImportDetails = {
  mapping: GuestImportMappingRow | null;
  rows: GuestImportRowRow[];
  session: GuestImportSessionRow;
};

export type StartGuestImportInput = {
  csvContent: string;
  importSide: GuestSide;
  sourceFilename: string;
};

export type ReviewGuestImportRowsInput = {
  approvedRowIds: string[];
  heldRowIds: string[];
  rejectedRowIds: string[];
  reviewNotes?: string | null;
};

const guestSides = new Set<GuestSide>(["bride", "groom", "both"]);

function asRecord(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new GuestImportValidationError("Request body must be a JSON object.");
  }

  return payload as Record<string, unknown>;
}

function requiredText(value: unknown, fieldName: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new GuestImportValidationError(`${fieldName} is required.`);
  }

  return value.trim();
}

function optionalText(value: unknown) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new GuestImportValidationError(
      "Optional text fields must be strings.",
    );
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseGuestSide(value: unknown) {
  if (typeof value !== "string" || !guestSides.has(value as GuestSide)) {
    throw new GuestImportValidationError("importSide is not supported.");
  }

  return value as GuestSide;
}

function stringArray(value: unknown, fieldName: string) {
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new GuestImportValidationError(
      `${fieldName} must be an array of strings.`,
    );
  }

  return [...new Set(value.map((item) => item.trim()).filter(Boolean))];
}

function asJson(value: unknown): Json {
  return value as Json;
}

function jsonRecord(value: Json | null): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, String(item ?? "")]),
  );
}

function jsonStringArray(value: Json | null): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => String(item)).filter(Boolean);
}

function parseMappingJson(value: Json | null): ImportColumnMapping {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const mapping: ImportColumnMapping = {};
  for (const target of importColumnTargets) {
    const header = value[target];
    if (typeof header === "string" && header.length > 0) {
      mapping[target] = header;
    }
  }

  return mapping;
}

function makeFilename(value: string) {
  const filename = value.trim();
  return filename.length > 0 ? filename : "guest-import.csv";
}

function assertCsvSource(input: StartGuestImportInput) {
  if (input.csvContent.trim().length === 0) {
    throw new GuestImportValidationError("CSV content is required.");
  }

  const filename = makeFilename(input.sourceFilename);
  if (!filename.toLowerCase().endsWith(".csv")) {
    throw new GuestImportValidationError("Sprint 4 supports CSV files only.");
  }

  return filename;
}

function rowsToParsedCsv(headers: string[], rows: GuestImportRowRow[]) {
  return {
    headers,
    rows: rows.map((row) => {
      const values = jsonRecord(row.raw_row_data);

      return {
        raw: headers.map((header) => values[header] ?? ""),
        rowNumber: row.row_number,
        values,
      };
    }),
  };
}

function toExistingGuestFoundationRecord(
  guest: Database["public"]["Tables"]["guests"]["Row"],
): GuestFoundationRecord {
  return {
    displayName: guest.display_name,
    eventAssignments: [],
    guestSide: guest.guest_side,
    guestTitleTypeId: guest.guest_title_type_id,
    id: guest.id,
    isActive: guest.is_active,
    isPrintedOnly: guest.is_printed_only,
    normalizedName:
      guest.normalized_name ?? normalizeGuestName(guest.display_name),
    projectId: guest.project_id,
    whatsappNumber: guest.whatsapp_number,
  };
}

async function buildReferenceContext(
  supabase: SupabaseClient<Database>,
  projectId: string,
  defaultSide: GuestSide,
): Promise<GuestImportReferenceContext> {
  const [events, existingGuests, tags, titleTypes] = await Promise.all([
    listProjectEvents(supabase, projectId),
    listProjectGuests(supabase, projectId),
    listGuestTags(supabase, projectId),
    listGuestTitleTypes(supabase, projectId),
  ]);

  return {
    defaultSide,
    events: events.map((event) => ({
      id: event.id,
      name: event.name,
    })),
    existingGuests: existingGuests.map(toExistingGuestFoundationRecord),
    projectId,
    tags: tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
    })),
    titleTypes: titleTypes.map((titleType) => ({
      id: titleType.id,
      label: titleType.label,
      slug: titleType.slug,
    })),
  };
}

export function parseStartGuestImportPayload(
  payload: unknown,
): StartGuestImportInput {
  const body = asRecord(payload);

  return {
    csvContent: requiredText(body.csvContent, "csvContent"),
    importSide: parseGuestSide(body.importSide),
    sourceFilename: requiredText(body.sourceFilename, "sourceFilename"),
  };
}

export function parseImportMappingPayload(
  payload: unknown,
): ImportColumnMapping {
  const body = asRecord(payload);
  const mapping: ImportColumnMapping = {};

  for (const target of importColumnTargets) {
    const value = optionalText(body[target]);
    if (value) {
      mapping[target] = value;
    }
  }

  return mapping;
}

export function parseReviewGuestImportRowsPayload(
  payload: unknown,
): ReviewGuestImportRowsInput {
  const body = asRecord(payload);

  return {
    approvedRowIds: stringArray(body.approvedRowIds, "approvedRowIds"),
    heldRowIds: stringArray(body.heldRowIds, "heldRowIds"),
    rejectedRowIds: stringArray(body.rejectedRowIds, "rejectedRowIds"),
    reviewNotes: optionalText(body.reviewNotes),
  };
}

export async function listGuestImportSessions(
  supabase: SupabaseClient<Database>,
  projectId: string,
): Promise<GuestImportSessionRow[]> {
  const { data, error } = await supabase
    .from("guest_import_sessions")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

export async function getGuestImportDetails(
  supabase: SupabaseClient<Database>,
  projectId: string,
  importSessionId: string,
): Promise<GuestImportDetails | null> {
  const { data: session, error: sessionError } = await supabase
    .from("guest_import_sessions")
    .select("*")
    .eq("id", importSessionId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (sessionError) {
    throw sessionError;
  }

  if (!session) {
    return null;
  }

  const [mappingResult, rowsResult] = await Promise.all([
    supabase
      .from("guest_import_mappings")
      .select("*")
      .eq("import_session_id", importSessionId)
      .maybeSingle(),
    supabase
      .from("guest_import_rows")
      .select("*")
      .eq("import_session_id", importSessionId)
      .order("row_number", { ascending: true }),
  ]);

  if (mappingResult.error) {
    throw mappingResult.error;
  }

  if (rowsResult.error) {
    throw rowsResult.error;
  }

  return {
    mapping: mappingResult.data,
    rows: rowsResult.data,
    session,
  };
}

export async function createGuestImportSession(
  supabase: SupabaseClient<Database>,
  projectId: string,
  input: StartGuestImportInput,
  actorUserId: string,
): Promise<GuestImportSessionRow> {
  const filename = assertCsvSource(input);
  const parsedCsv = parseGuestImportCsv(input.csvContent);

  if (parsedCsv.rows.length === 0) {
    throw new GuestImportValidationError(
      "CSV must include at least one data row.",
    );
  }

  const { data: session, error: sessionError } = await supabase
    .from("guest_import_sessions")
    .insert({
      created_by: actorUserId,
      import_side: input.importSide,
      project_id: projectId,
      row_count: parsedCsv.rows.length,
      source_file_type: "csv",
      source_filename: filename,
      status: "draft",
      updated_by: actorUserId,
      uploaded_by: actorUserId,
    })
    .select("*")
    .single();

  if (sessionError) {
    throw sessionError;
  }

  const suggestedMapping = suggestColumnMappings(parsedCsv.headers);
  const { error: mappingError } = await supabase
    .from("guest_import_mappings")
    .insert({
      created_by: actorUserId,
      import_session_id: session.id,
      project_id: projectId,
      source_headers: asJson(parsedCsv.headers),
      target_mapping: asJson(suggestedMapping),
      updated_by: actorUserId,
    });

  if (mappingError) {
    throw mappingError;
  }

  const { error: rowsError } = await supabase.from("guest_import_rows").insert(
    parsedCsv.rows.map((row) => ({
      import_session_id: session.id,
      project_id: projectId,
      raw_row_data: asJson(row.values),
      row_number: row.rowNumber,
    })),
  );

  if (rowsError) {
    throw rowsError;
  }

  return session;
}

export async function validateGuestImportMapping(
  supabase: SupabaseClient<Database>,
  projectId: string,
  importSessionId: string,
  mapping: ImportColumnMapping,
  actorUserId: string,
): Promise<GuestImportPreview> {
  const details = await getGuestImportDetails(
    supabase,
    projectId,
    importSessionId,
  );

  if (!details) {
    throw new GuestImportValidationError("Guest import session was not found.");
  }

  const headers = details.mapping
    ? jsonStringArray(details.mapping.source_headers)
    : Object.keys(jsonRecord(details.rows[0]?.raw_row_data ?? null));
  const parsedCsv = rowsToParsedCsv(headers, details.rows);
  const context = await buildReferenceContext(
    supabase,
    projectId,
    details.session.import_side,
  );
  const preview = buildImportPreview(parsedCsv, mapping, context);

  const { error: mappingError } = await supabase
    .from("guest_import_mappings")
    .upsert(
      {
        import_session_id: importSessionId,
        project_id: projectId,
        source_headers: asJson(headers),
        target_mapping: asJson(mapping),
        updated_by: actorUserId,
      },
      { onConflict: "import_session_id" },
    );

  if (mappingError) {
    throw mappingError;
  }

  await Promise.all(
    preview.rows.map(async (row) => {
      const { error } = await supabase
        .from("guest_import_rows")
        .update({
          approval_status: "pending",
          duplicate_severity: row.duplicateSeverity,
          duplicate_warnings: asJson(row.duplicateWarnings),
          linked_guest_id: null,
          mapped_fields: asJson(row.mappedFields),
          validation_errors: asJson(row.validationErrors),
          validation_status: row.validationStatus,
        })
        .eq("import_session_id", importSessionId)
        .eq("row_number", row.rowNumber);

      if (error) {
        throw error;
      }
    }),
  );

  const { error: sessionError } = await supabase
    .from("guest_import_sessions")
    .update({
      duplicate_warning_count: preview.summary.duplicateWarnings,
      invalid_row_count: preview.summary.invalidRows,
      row_count: preview.summary.totalRows,
      status:
        preview.summary.invalidRows > 0 ? "validation_failed" : "previewed",
      updated_by: actorUserId,
      valid_row_count: preview.summary.validRows,
    })
    .eq("id", importSessionId)
    .eq("project_id", projectId);

  if (sessionError) {
    throw sessionError;
  }

  return preview;
}

export function getStoredImportMapping(details: GuestImportDetails) {
  return details.mapping
    ? parseMappingJson(details.mapping.target_mapping)
    : {};
}

export function getStoredImportHeaders(details: GuestImportDetails) {
  return details.mapping
    ? jsonStringArray(details.mapping.source_headers)
    : Object.keys(jsonRecord(details.rows[0]?.raw_row_data ?? null));
}

export function summarizeStoredImportRows(rows: GuestImportRowRow[]) {
  return {
    approvedRows: rows.filter((row) => row.approval_status === "approved")
      .length,
    blockedRows: rows.filter((row) => row.validation_status === "blocked")
      .length,
    heldRows: rows.filter((row) => row.approval_status === "held").length,
    rejectedRows: rows.filter((row) => row.approval_status === "rejected")
      .length,
    warningRows: rows.filter((row) => row.validation_status === "warning")
      .length,
  };
}

export function getImportRowDisplayName(row: GuestImportRowRow) {
  const mappedFields = row.mapped_fields;
  if (
    mappedFields &&
    typeof mappedFields === "object" &&
    !Array.isArray(mappedFields)
  ) {
    const displayName = mappedFields.displayName;
    if (typeof displayName === "string" && displayName.length > 0) {
      return displayName;
    }
  }

  return `Row ${row.row_number}`;
}

export function isReviewableStoredRow(row: GuestImportRowRow) {
  return (
    row.validation_status !== "blocked" && row.approval_status !== "applied"
  );
}

export async function submitGuestImportSession(
  supabase: SupabaseClient<Database>,
  importSessionId: string,
) {
  const { error } = await supabase.rpc("submit_guest_import_session", {
    p_import_session_id: importSessionId,
  });

  if (error) {
    throw error;
  }
}

export async function reviewGuestImportRows(
  supabase: SupabaseClient<Database>,
  importSessionId: string,
  input: ReviewGuestImportRowsInput,
) {
  const { error } = await supabase.rpc("review_guest_import_rows", {
    p_approved_row_ids: input.approvedRowIds,
    p_held_row_ids: input.heldRowIds,
    p_import_session_id: importSessionId,
    p_rejected_row_ids: input.rejectedRowIds,
    p_review_notes: input.reviewNotes ?? undefined,
  });

  if (error) {
    throw error;
  }
}

export async function applyGuestImportApprovedRows(
  supabase: SupabaseClient<Database>,
  importSessionId: string,
) {
  const { data, error } = await supabase.rpc(
    "apply_guest_import_approved_rows",
    {
      p_import_session_id: importSessionId,
    },
  );

  if (error) {
    throw error;
  }

  return data;
}

export function rowApprovalStatusFromForm(
  value: FormDataEntryValue | null,
): GuestImportRowApprovalStatus | null {
  if (value === "approved" || value === "rejected" || value === "held") {
    return value;
  }

  return null;
}
