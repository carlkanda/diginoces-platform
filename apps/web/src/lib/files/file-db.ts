import type { SupabaseClient } from "@supabase/supabase-js";
import {
  fileCategories,
  fileStatuses,
  fileVisibilities,
  parseFileRegistrationPayload,
  type FileCategory,
  type FileStatus,
  type FileVisibility,
} from "@/lib/files/file-service";
import type { ProjectRow } from "@/lib/projects/project-service";

type AnySupabase = SupabaseClient;
type BaseRow = Record<string, unknown>;

const fileStatusSet = new Set<FileStatus>(fileStatuses);
const fileVisibilitySet = new Set<FileVisibility>(fileVisibilities);

const fileScopeTypes = new Set<ProjectFileRow["scope_type"]>([
  "event",
  "guest",
  "invitation",
  "platform",
  "project",
]);

export type ProjectFileRow = {
  archive_reason: string | null;
  archived_at: string | null;
  archived_by: string | null;
  bucket: string;
  category: FileCategory;
  created_at: string;
  created_by: string | null;
  event_id: string | null;
  file_size_bytes: number;
  filename: string;
  guest_id: string | null;
  id: string;
  invitation_id: string | null;
  is_active: boolean;
  is_latest: boolean;
  metadata: Record<string, unknown>;
  mime_type: string;
  project_id: string | null;
  retention_expires_at: string | null;
  retention_status: string;
  revoked_at: string | null;
  scope_id: string | null;
  scope_type: "event" | "guest" | "invitation" | "platform" | "project";
  soft_deleted_at: string | null;
  status: FileStatus;
  storage_path: string;
  updated_at: string;
  version: number;
  version_group_id: string;
  visibility: FileVisibility;
};

export type FileCategoryRow = {
  allowed_mime_types: string[];
  description: string;
  guest_visible_allowed: boolean;
  max_size_bytes: number;
  name: string;
  requirement_ids: string[];
  slug: FileCategory;
};

export type FileAccessEventRow = {
  access_action: string;
  access_context: string;
  allowed: boolean;
  actor_user_id: string | null;
  created_at: string;
  denial_reason: string | null;
  event_id: string | null;
  file_id: string;
  guest_id: string | null;
  id: string;
  invitation_id: string | null;
  metadata: Record<string, unknown> | null;
  project_id: string | null;
  public_token_id: string | null;
  signed_url_expires_at: string | null;
};

export type FileArchiveEventRow = {
  action: string;
  created_at: string;
  id: string;
  next_status: FileStatus;
  previous_status: FileStatus;
  reason: string;
};

export type FileRetentionPolicyRow = {
  decision: string | null;
  decision_reason: string | null;
  extended_until: string | null;
  id: string;
  notice_status: string;
  project_id: string;
  retention_end_at: string | null;
  retention_start_at: string | null;
  status: string;
  updated_at: string;
};

export type ProjectArchiveEventRow = {
  action: string;
  created_at: string;
  id: string;
  next_retention_status: string | null;
  next_status: string | null;
  reason: string;
  retention_end_at: string | null;
};

export type ProjectFileFilters = {
  activeOnly?: boolean;
  category?: FileCategory | null;
  eventId?: string | null;
  guestId?: string | null;
  latestOnly?: boolean;
};

export type ProjectFileDetails = {
  accessEvents: FileAccessEventRow[];
  archiveEvents: FileArchiveEventRow[];
  file: ProjectFileRow;
  versions: ProjectFileRow[];
};

function table(supabase: AnySupabase, name: string) {
  return supabase.from(name);
}

// Sprint 14 introduces these RPCs before the generated Supabase types are refreshed.
// Keep the untyped boundary isolated here so callers still receive normalized rows.
function rpcClient(supabase: AnySupabase) {
  return supabase as unknown as {
    rpc(
      fn: string,
      args: Record<string, unknown>,
    ): Promise<{
      data: unknown;
      error: Error | null;
    }>;
  };
}

function isRecord(value: unknown): value is BaseRow {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireTextField(row: BaseRow, field: string, source: string) {
  const value = row[field];

  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${source} returned invalid ${field}.`);
  }

  return value;
}

function requireBooleanField(row: BaseRow, field: string, source: string) {
  const value = row[field];

  if (typeof value !== "boolean") {
    throw new Error(`${source} returned invalid ${field}.`);
  }

  return value;
}

function requireIntegerField(row: BaseRow, field: string, source: string) {
  const raw = row[field];

  if (raw === null || raw === undefined) {
    throw new Error(`${source} returned invalid ${field}.`);
  }

  const value = Number(raw);

  if (!Number.isSafeInteger(value)) {
    throw new Error(`${source} returned invalid ${field}.`);
  }

  return value;
}

function requireNullableTextField(row: BaseRow, field: string, source: string) {
  const value = row[field];

  if (value !== null && typeof value !== "string") {
    throw new Error(`${source} returned invalid ${field}.`);
  }

  return value;
}

function requireNullableRecordField(
  row: BaseRow,
  field: string,
  source: string,
) {
  const value = row[field];

  if (value !== null && (typeof value !== "object" || Array.isArray(value))) {
    throw new Error(`${source} returned invalid ${field}.`);
  }

  return value;
}

function requireNonNegativeIntegerField(
  row: BaseRow,
  field: string,
  source: string,
  minimum = 0,
) {
  const value = requireIntegerField(row, field, source);

  if (value < minimum) {
    throw new Error(`${source} returned invalid ${field}.`);
  }

  return value;
}

function assertProjectFileRow(
  value: unknown,
  source: string,
): asserts value is BaseRow {
  if (!isRecord(value)) {
    throw new Error(`${source} returned an invalid file row.`);
  }

  const category = requireTextField(value, "category", source);
  const scopeType = requireTextField(value, "scope_type", source);
  const status = requireTextField(value, "status", source);
  const visibility = requireTextField(value, "visibility", source);

  for (const field of [
    "bucket",
    "created_at",
    "filename",
    "id",
    "mime_type",
    "storage_path",
    "updated_at",
    "version_group_id",
  ]) {
    requireTextField(value, field, source);
  }

  requireNonNegativeIntegerField(value, "file_size_bytes", source);
  requireNonNegativeIntegerField(value, "version", source, 1);
  requireBooleanField(value, "is_active", source);
  requireBooleanField(value, "is_latest", source);

  if (!fileCategories.includes(category as FileCategory)) {
    throw new Error(`${source} returned invalid category.`);
  }

  if (!fileScopeTypes.has(scopeType as ProjectFileRow["scope_type"])) {
    throw new Error(`${source} returned invalid scope_type.`);
  }

  if (!fileStatusSet.has(status as FileStatus)) {
    throw new Error(`${source} returned invalid status.`);
  }

  if (!fileVisibilitySet.has(visibility as FileVisibility)) {
    throw new Error(`${source} returned invalid visibility.`);
  }
}

function normalizeProjectFileRow(
  row: unknown,
  source = "File query",
): ProjectFileRow {
  assertProjectFileRow(row, source);

  return {
    archive_reason:
      typeof row.archive_reason === "string" ? row.archive_reason : null,
    archived_at: typeof row.archived_at === "string" ? row.archived_at : null,
    archived_by: typeof row.archived_by === "string" ? row.archived_by : null,
    bucket: String(row.bucket ?? ""),
    category: String(row.category ?? "other") as FileCategory,
    created_at: String(row.created_at ?? ""),
    created_by: typeof row.created_by === "string" ? row.created_by : null,
    event_id: typeof row.event_id === "string" ? row.event_id : null,
    file_size_bytes: Number(row.file_size_bytes),
    filename: String(row.filename ?? ""),
    guest_id: typeof row.guest_id === "string" ? row.guest_id : null,
    id: String(row.id ?? ""),
    invitation_id:
      typeof row.invitation_id === "string" ? row.invitation_id : null,
    is_active: row.is_active === true,
    is_latest: row.is_latest === true,
    metadata:
      row.metadata &&
      typeof row.metadata === "object" &&
      !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : {},
    mime_type: String(row.mime_type ?? ""),
    project_id: typeof row.project_id === "string" ? row.project_id : null,
    retention_expires_at:
      typeof row.retention_expires_at === "string"
        ? row.retention_expires_at
        : null,
    retention_status: String(row.retention_status ?? "active"),
    revoked_at: typeof row.revoked_at === "string" ? row.revoked_at : null,
    scope_id: typeof row.scope_id === "string" ? row.scope_id : null,
    scope_type: String(
      row.scope_type ?? "project",
    ) as ProjectFileRow["scope_type"],
    soft_deleted_at:
      typeof row.soft_deleted_at === "string" ? row.soft_deleted_at : null,
    status: String(row.status ?? "active") as FileStatus,
    storage_path: String(row.storage_path ?? ""),
    updated_at: String(row.updated_at ?? row.created_at ?? ""),
    version: Number(row.version),
    version_group_id: String(row.version_group_id ?? ""),
    visibility: String(row.visibility ?? "internal") as FileVisibility,
  };
}

function normalizeFileAccessEventRow(
  value: unknown,
  source = "File access-event RPC",
): FileAccessEventRow {
  if (!isRecord(value)) {
    throw new Error(`${source} returned an invalid access-event row.`);
  }

  for (const field of [
    "access_action",
    "access_context",
    "created_at",
    "file_id",
    "id",
  ]) {
    requireTextField(value, field, source);
  }

  requireBooleanField(value, "allowed", source);

  for (const field of [
    "actor_user_id",
    "denial_reason",
    "event_id",
    "guest_id",
    "invitation_id",
    "project_id",
    "public_token_id",
    "signed_url_expires_at",
  ]) {
    requireNullableTextField(value, field, source);
  }

  requireNullableRecordField(value, "metadata", source);

  return value as FileAccessEventRow;
}

function normalizeRpcObject(
  value: unknown,
  source: string,
): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error(`${source} returned an invalid response.`);
  }

  if (typeof value.status !== "string" || value.status.length === 0) {
    throw new Error(`${source} returned invalid status.`);
  }

  return value;
}

function normalizeProjectRow(value: unknown, source: string): ProjectRow {
  if (!isRecord(value)) {
    throw new Error(`${source} returned an invalid project row.`);
  }

  for (const field of [
    "bride_name",
    "created_at",
    "groom_name",
    "guest_page_access_status",
    "id",
    "project_code",
    "status",
    "updated_at",
  ]) {
    requireTextField(value, field, source);
  }

  for (const field of ["project_year", "workflow_template_version"]) {
    requireIntegerField(value, field, source);
  }

  for (const field of [
    "couple_photo_url",
    "created_by",
    "guest_page_access_unlocked_at",
    "guest_page_access_unlocked_by",
    "guest_page_payment_exception_reason",
    "internal_notes",
    "preferred_language",
    "primary_contact_email",
    "primary_contact_name",
    "primary_contact_phone",
    "timeline_notes",
    "updated_by",
  ]) {
    requireNullableTextField(value, field, source);
  }

  return value as ProjectRow;
}

function normalizeGuestFileDownloadResponse(value: unknown) {
  const result = normalizeRpcObject(value, "resolve_guest_file_download RPC");

  if (result.status !== "ok") {
    return result;
  }

  for (const field of ["bucket", "filename", "mimeType", "storagePath"]) {
    requireTextField(result, field, "resolve_guest_file_download RPC");
  }

  const expiresInSeconds = Number(result.expiresInSeconds);

  if (!Number.isSafeInteger(expiresInSeconds) || expiresInSeconds <= 0) {
    throw new Error(
      "resolve_guest_file_download RPC returned invalid expiresInSeconds.",
    );
  }

  return result;
}

function normalizeGuestFileDownloadListResponse(value: unknown) {
  const result = normalizeRpcObject(value, "list_guest_file_downloads RPC");

  if (result.status === "ok" && !Array.isArray(result.files)) {
    throw new Error("list_guest_file_downloads RPC returned invalid files.");
  }

  return result;
}

export async function listFileCategories(
  supabase: AnySupabase,
): Promise<FileCategoryRow[]> {
  const { data, error } = await table(supabase, "file_categories")
    .select("*")
    .order("slug", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as FileCategoryRow[];
}

export async function listProjectFiles(
  supabase: AnySupabase,
  projectId: string,
  filters: ProjectFileFilters = {},
): Promise<ProjectFileRow[]> {
  let query = table(supabase, "files")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (filters.category) {
    query = query.eq("category", filters.category);
  }

  if (filters.eventId) {
    query = query.eq("event_id", filters.eventId);
  }

  if (filters.guestId) {
    query = query.eq("guest_id", filters.guestId);
  }

  if (filters.activeOnly) {
    query = query.eq("is_active", true);
  }

  if (filters.latestOnly) {
    query = query.eq("is_latest", true);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => normalizeProjectFileRow(row));
}

export async function listEventFiles(
  supabase: AnySupabase,
  eventId: string,
): Promise<ProjectFileRow[]> {
  const { data, error } = await table(supabase, "files")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => normalizeProjectFileRow(row));
}

export async function getProjectFileDetails(
  supabase: AnySupabase,
  fileId: string,
): Promise<ProjectFileDetails | null> {
  const { data: file, error: fileError } = await table(supabase, "files")
    .select("*")
    .eq("id", fileId)
    .maybeSingle();

  if (fileError) {
    throw fileError;
  }

  if (!file) {
    return null;
  }

  const normalizedFile = normalizeProjectFileRow(file);
  const [versionsResult, accessResult, archiveResult] = await Promise.all([
    table(supabase, "files")
      .select("*")
      .eq("version_group_id", normalizedFile.version_group_id)
      .order("version", { ascending: false }),
    table(supabase, "file_access_events")
      .select(
        "id, file_id, project_id, event_id, guest_id, invitation_id, public_token_id, actor_user_id, access_action, access_context, allowed, denial_reason, signed_url_expires_at, metadata, created_at",
      )
      .eq("file_id", fileId)
      .order("created_at", { ascending: false })
      .limit(20),
    table(supabase, "file_archive_events")
      .select("id, action, previous_status, next_status, reason, created_at")
      .eq("file_id", fileId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (versionsResult.error) {
    throw versionsResult.error;
  }

  if (accessResult.error) {
    throw accessResult.error;
  }

  if (archiveResult.error) {
    throw archiveResult.error;
  }

  return {
    accessEvents: (accessResult.data ?? []) as FileAccessEventRow[],
    archiveEvents: (archiveResult.data ?? []) as FileArchiveEventRow[],
    file: normalizedFile,
    versions: (versionsResult.data ?? []).map((row) =>
      normalizeProjectFileRow(row),
    ),
  };
}

export async function registerProjectFile(
  supabase: AnySupabase,
  projectId: string,
  payload: unknown,
  options: {
    eventId?: string | null;
    guestId?: string | null;
    invitationId?: string | null;
    metadata?: Record<string, unknown>;
  } = {},
) {
  const input = parseFileRegistrationPayload(payload);
  const { data, error } = await rpcClient(supabase).rpc(
    "register_project_file",
    {
      p_category: input.category,
      p_event_id: options.eventId ?? null,
      p_file_size_bytes: input.fileSizeBytes,
      p_filename: input.filename,
      p_guest_id: options.guestId ?? null,
      p_invitation_id: options.invitationId ?? null,
      p_metadata: options.metadata ?? {},
      p_mime_type: input.mimeType,
      p_project_id: projectId,
      p_visibility: input.visibility,
    },
  );

  if (error) {
    throw error;
  }

  return normalizeProjectFileRow(data, "register_project_file RPC");
}

export async function createProjectFileVersion(
  supabase: AnySupabase,
  fileId: string,
  payload: unknown,
  reason?: string | null,
  metadata?: Record<string, unknown>,
) {
  const input = parseFileRegistrationPayload(payload);
  const { data, error } = await rpcClient(supabase).rpc("create_file_version", {
    p_file_size_bytes: input.fileSizeBytes,
    p_filename: input.filename,
    p_metadata: metadata ?? {},
    p_mime_type: input.mimeType,
    p_previous_file_id: fileId,
    p_reason: reason ?? null,
  });

  if (error) {
    throw error;
  }

  return normalizeProjectFileRow(data, "create_file_version RPC");
}

export async function archiveProjectFile(
  supabase: AnySupabase,
  fileId: string,
  action: "archive" | "soft_delete",
  reason: string,
) {
  const { data, error } = await rpcClient(supabase).rpc(
    "archive_project_file",
    {
      p_action: action,
      p_file_id: fileId,
      p_reason: reason,
    },
  );

  if (error) {
    throw error;
  }

  return normalizeProjectFileRow(data, "archive_project_file RPC");
}

export async function updateProjectArchiveLifecycle(
  supabase: AnySupabase,
  projectId: string,
  action:
    | "archive"
    | "cancel_pending_deletion"
    | "extend_retention"
    | "mark_completed"
    | "mark_pending_deletion",
  reason: string,
  extendedUntil?: string | null,
): Promise<ProjectRow> {
  const { data, error } = await rpcClient(supabase).rpc(
    "update_project_archive_lifecycle",
    {
      p_action: action,
      p_extended_until: extendedUntil ?? null,
      p_project_id: projectId,
      p_reason: reason,
    },
  );

  if (error) {
    throw error;
  }

  return normalizeProjectRow(data, "update_project_archive_lifecycle RPC");
}

export async function listProjectRetentionPolicies(
  supabase: AnySupabase,
  projectId?: string,
): Promise<FileRetentionPolicyRow[]> {
  let query = table(supabase, "file_retention_policies")
    .select("*")
    .order("retention_end_at", { ascending: true });

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as FileRetentionPolicyRow[];
}

export async function listProjectArchiveEvents(
  supabase: AnySupabase,
  projectId: string,
): Promise<ProjectArchiveEventRow[]> {
  const { data, error } = await table(supabase, "project_archive_events")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    throw error;
  }

  return (data ?? []) as ProjectArchiveEventRow[];
}

export async function recordFileAccessEvent(
  supabase: AnySupabase,
  fileId: string,
  input: {
    accessAction:
      | "download_denied"
      | "download_requested"
      | "guest_signed_url_created"
      | "signed_url_created";
    allowed: boolean;
    denialReason?: string | null;
    metadata?: Record<string, unknown>;
    signedUrlExpiresAt?: string | null;
  },
) {
  const { data, error } = await rpcClient(supabase).rpc(
    "record_file_access_event",
    {
      p_access_action: input.accessAction,
      p_allowed: input.allowed,
      p_denial_reason: input.denialReason ?? null,
      p_file_id: fileId,
      p_metadata: input.metadata ?? {},
      p_signed_url_expires_at: input.signedUrlExpiresAt ?? null,
    },
  );

  if (error) {
    throw error;
  }

  return normalizeFileAccessEventRow(data);
}

export async function resolveGuestFileDownload(
  supabase: AnySupabase,
  token: string,
  fileId: string,
) {
  const { data, error } = await rpcClient(supabase).rpc(
    "resolve_guest_file_download",
    {
      p_file_id: fileId,
      p_token: token,
    },
  );

  if (error) {
    throw error;
  }

  return normalizeGuestFileDownloadResponse(data);
}

export type GuestDownloadableFile = {
  category: string;
  fileId: string;
  filename: string;
  mimeType: string;
  version: number;
};

function isGuestDownloadableFile(
  value: unknown,
): value is GuestDownloadableFile {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    typeof (value as Record<string, unknown>).fileId === "string" &&
    typeof (value as Record<string, unknown>).filename === "string" &&
    typeof (value as Record<string, unknown>).category === "string" &&
    typeof (value as Record<string, unknown>).mimeType === "string" &&
    typeof (value as Record<string, unknown>).version === "number"
  );
}

export async function listGuestFileDownloads(
  supabase: AnySupabase,
  token: string,
): Promise<GuestDownloadableFile[]> {
  const { data, error } = await rpcClient(supabase).rpc(
    "list_guest_file_downloads",
    {
      p_token: token,
    },
  );

  if (error) {
    throw error;
  }

  const result = normalizeGuestFileDownloadListResponse(data);

  if (result.status !== "ok") {
    return [];
  }

  const files = result.files;
  return Array.isArray(files) ? files.filter(isGuestDownloadableFile) : [];
}
