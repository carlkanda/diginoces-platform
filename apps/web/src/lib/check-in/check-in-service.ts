import { createHash, randomBytes } from "node:crypto";
import { hasScopedPermission } from "@/lib/projects/project-permissions";
import type {
  PermissionSlug,
  RoleAssignment,
} from "@/lib/security/permissions";

export class CheckInValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CheckInValidationError";
  }
}

export const CHECK_IN_TOKEN_BYTES = 18;

export type GuestSide = "both" | "bride" | "groom";
export type RsvpCheckInStatus =
  | "locked"
  | "manual_review"
  | "maybe"
  | "no"
  | "pending"
  | "yes";
export type CheckInSettingStatus = "active" | "inactive";
export type CheckInUnexpectedGuestMode =
  | "disabled"
  | "manual_recording_only"
  | "supervisor_approval_required";
export type CheckInTokenStatus = "active" | "expired" | "revoked";
export type CheckInMethod =
  | "manual_invitation_id"
  | "manual_name_search"
  | "manual_phone_search"
  | "manual_table_search"
  | "offline_sync"
  | "qr_scan"
  | "unexpected_guest_approval";
export type CheckInSyncStatus =
  | "offline_pending"
  | "online_synced"
  | "sync_conflict"
  | "sync_failed";
export type CheckInDeviceStatus = "active" | "inactive";
export type CheckInPreloadStatus =
  | "expired"
  | "failed"
  | "not_preloaded"
  | "preloaded";
export type UnexpectedGuestRequestStatus =
  | "approved"
  | "manual_approved"
  | "pending"
  | "rejected";
export type UnexpectedGuestApprovalMode = "in_app" | "manual_external";
export type CheckInConflictType =
  | "arrival_count_conflict"
  | "duplicate_check_in"
  | "feature_disabled"
  | "permission_denied"
  | "stale_guest_data"
  | "unexpected_guest_decision_conflict";
export type CheckInConflictStatus = "ignored" | "open" | "resolved";

export type CheckInSettingsInput = {
  allowedMethods?: CheckInMethod[];
  enabled?: boolean;
  endsAt?: string | null;
  offlinePreloadEnabled?: boolean;
  startsAt?: string | null;
  status?: CheckInSettingStatus;
  supervisorApprovalRequired?: boolean;
  timezone?: string;
  unexpectedGuestMode?: CheckInUnexpectedGuestMode;
};

export type CheckInDeviceInput = {
  assignedStaffUserId?: string | null;
  deviceLabel?: string | null;
  mode?: string;
  preloadStatus?: CheckInPreloadStatus;
  stationName: string;
  status?: CheckInDeviceStatus;
  syncStatus?: CheckInSyncStatus;
};

export type CheckInSearchFilters = {
  query?: string;
  rsvpStatus?: RsvpCheckInStatus | "all";
  side?: GuestSide | "all";
  tableId?: string | null;
  vipOnly?: boolean;
};

export type CheckInGuest = {
  arrivedCount: number;
  displayName: string;
  expectedCount: number;
  guestId: string;
  guestSide: GuestSide;
  invitationId: string | null;
  invitationPublicId: string | null;
  isPrintedOnly: boolean;
  isVipProtocol: boolean;
  phoneNumber: string | null;
  rsvpStatus: RsvpCheckInStatus;
  specialInstruction: string | null;
  tableCode: string | null;
  tableId: string | null;
  tableName: string | null;
  tags: string[];
};

export type ArrivalStateInput = {
  currentArrivedCount: number;
  requestedArrivalCount: number;
  supervisorOverride?: boolean;
  totalExpectedCount: number;
};

export type ArrivalState = {
  attendanceAfter: number;
  attendanceBefore: number;
  isComplete: boolean;
  isDuplicateScan: boolean;
  requestedArrivalCount: number;
  totalExpectedCount: number;
  welcomeMessageAction: "none" | "prepare" | "suppress_duplicate";
  welcomeMessageSuppressedReason: null | "duplicate_scan" | "not_first_arrival";
};

export type CheckInDashboardMetrics = {
  arrivedUnits: number;
  duplicateScanCount: number;
  expectedUnits: number;
  offlinePendingCount: number;
  partialArrivalCount: number;
  remainingUnits: number;
  syncConflictCount: number;
  unexpectedApprovedCount: number;
  unexpectedPendingCount: number;
  byDevice: Array<{ arrivedUnits: number; deviceId: string; label: string }>;
  byMethod: Array<{ arrivedUnits: number; method: CheckInMethod }>;
  byStaff: Array<{ arrivedUnits: number; staffUserId: string }>;
  byTable: Array<{
    arrivedUnits: number;
    expectedUnits: number;
    tableId: string;
    tableName: string;
  }>;
};

export type CheckInRecordLike = {
  arrivalCount: number;
  deviceId: string | null;
  guestId: string | null;
  isDuplicateScan: boolean;
  method: CheckInMethod;
  staffUserId: string;
  syncStatus: CheckInSyncStatus;
};

export type UnexpectedGuestRequestLike = {
  status: UnexpectedGuestRequestStatus;
};

export type OfflineCheckInPayload = {
  arrivedAt: string;
  arrivalCount: number;
  eventId: string;
  guestId: string;
  offlineRecordId: string;
};

export type OfflineSyncConflict = {
  conflictType: CheckInConflictType;
  guestId: string;
  offlineRecordId: string;
  reason: string;
};

export type CheckInAction =
  | "dashboard"
  | "devices.manage"
  | "offline_sync"
  | "perform"
  | "read"
  | "search"
  | "settings.manage"
  | "tokens.manage"
  | "unexpected_guests.create"
  | "unexpected_guests.review";

export const checkInMethods = [
  "qr_scan",
  "manual_name_search",
  "manual_invitation_id",
  "manual_phone_search",
  "manual_table_search",
  "unexpected_guest_approval",
  "offline_sync",
] as const satisfies readonly CheckInMethod[];

export const defaultCheckInMethods = [
  "qr_scan",
  "manual_name_search",
  "manual_invitation_id",
  "manual_phone_search",
  "manual_table_search",
] as const satisfies readonly CheckInMethod[];

export const manualCheckInMethods = [
  "manual_name_search",
  "manual_invitation_id",
  "manual_phone_search",
  "manual_table_search",
] as const satisfies readonly CheckInMethod[];

export const checkInMethodLabels = {
  manual_invitation_id: "Invitation ID",
  manual_name_search: "Name search",
  manual_phone_search: "Phone search",
  manual_table_search: "Table search",
  offline_sync: "Offline sync",
  qr_scan: "QR scan",
  unexpected_guest_approval: "Unexpected guest approval",
} as const satisfies Record<CheckInMethod, string>;

export type CheckInMethodGateSettings = {
  allowedMethods?: readonly string[] | null;
  enabled?: boolean | null;
  status?: string | null;
};

export function isCheckInOpen(
  settings?: Pick<CheckInMethodGateSettings, "enabled" | "status"> | null,
) {
  return Boolean(settings?.enabled && settings.status === "active");
}

// Null means settings are not configured yet and falls back to defaults.
// An explicit empty array is an admin choice to disable every method.
export function resolveAllowedCheckInMethods(
  allowedMethods?: readonly string[] | null,
): Set<CheckInMethod> {
  return new Set(
    (allowedMethods ?? defaultCheckInMethods).filter(
      (method): method is CheckInMethod =>
        checkInMethods.includes(method as CheckInMethod),
    ),
  );
}

export function resolveOpenCheckInMethods(
  settings?: CheckInMethodGateSettings | null,
): Set<CheckInMethod> {
  if (!isCheckInOpen(settings)) {
    return new Set();
  }

  return resolveAllowedCheckInMethods(settings?.allowedMethods);
}

export const checkInSyncStatuses = [
  "online_synced",
  "offline_pending",
  "sync_conflict",
  "sync_failed",
] as const satisfies readonly CheckInSyncStatus[];

export const checkInAuditActions = [
  "check_in_settings.created",
  "check_in_settings.updated",
  "check_in_tokens.created",
  "check_in_tokens.regenerated",
  "check_in_tokens.revoked",
  // Emitted by app_private.audit_check_in_change() for non-revocation token updates.
  "check_in_tokens.updated",
  "check_in_devices.updated",
  "check_in.guest_checked_in",
  "check_in.partial_arrival_updated",
  "check_in.duplicate_scan_detected",
  "check_in.offline_synced",
  "check_in.preload_snapshot.created",
  "check_in.sync_batch.created",
  "check_in.sync_batch.updated",
  "unexpected_guest_requests.created",
  "unexpected_guest_requests.approved",
  "unexpected_guest_requests.rejected",
  // Emitted by app_private.audit_check_in_change() for non-terminal request updates.
  "unexpected_guest_requests.updated",
  "check_in_devices.assigned",
  "check_in.sync_conflict.detected",
  "check_in.sync_conflict.updated",
] as const;

const checkInActionPermissions: Record<CheckInAction, PermissionSlug> = {
  dashboard: "check_in.dashboard",
  "devices.manage": "check_in.devices.manage",
  offline_sync: "check_in.offline_sync",
  perform: "check_in.perform",
  read: "check_in.read",
  search: "check_in.search",
  "settings.manage": "check_in.settings.manage",
  "tokens.manage": "check_in.tokens.manage",
  "unexpected_guests.create": "check_in.unexpected_guests.create",
  "unexpected_guests.review": "check_in.unexpected_guests.review",
};

const checkInMethodValues = new Set<CheckInMethod>(checkInMethods);
const guestSideValues = new Set<GuestSide>(["both", "bride", "groom"]);
const rsvpValues = new Set<RsvpCheckInStatus>([
  "locked",
  "manual_review",
  "maybe",
  "no",
  "pending",
  "yes",
]);

function asRecord(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new CheckInValidationError("Request body must be a JSON object.");
  }

  return payload as Record<string, unknown>;
}

function requiredText(value: unknown, fieldName: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new CheckInValidationError(`${fieldName} is required.`);
  }

  return value.trim();
}

function optionalText(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new CheckInValidationError("Optional text fields must be strings.");
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function optionalBoolean(value: unknown, fieldName: string) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "boolean") {
    throw new CheckInValidationError(`${fieldName} must be true or false.`);
  }

  return value;
}

function requiredPositiveInteger(value: unknown, fieldName: string) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    throw new CheckInValidationError(
      `${fieldName} must be a positive integer.`,
    );
  }

  return value;
}

function optionalIsoDateText(value: unknown, fieldName: string) {
  const text = optionalText(value);

  if (!text) {
    return text;
  }

  const date = new Date(text);

  if (Number.isNaN(date.getTime())) {
    throw new CheckInValidationError(`${fieldName} must be a valid date.`);
  }

  return text;
}

function optionalMethodArray(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw new CheckInValidationError("allowedMethods must be an array.");
  }

  return Array.from(
    new Set(
      value.map((item) => {
        if (
          typeof item !== "string" ||
          !checkInMethodValues.has(item as CheckInMethod)
        ) {
          throw new CheckInValidationError(
            "allowedMethods contains an unsupported check-in method.",
          );
        }

        return item as CheckInMethod;
      }),
    ),
  );
}

function optionalSettingStatus(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (value === "active" || value === "inactive") {
    return value;
  }

  throw new CheckInValidationError("status must be active or inactive.");
}

function optionalUnexpectedGuestMode(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (
    value === "disabled" ||
    value === "manual_recording_only" ||
    value === "supervisor_approval_required"
  ) {
    return value;
  }

  throw new CheckInValidationError("unexpectedGuestMode is not supported.");
}

function optionalDeviceStatus(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (value === "active" || value === "inactive") {
    return value;
  }

  throw new CheckInValidationError("device status is not supported.");
}

function optionalSyncStatus(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (
    typeof value === "string" &&
    checkInSyncStatuses.includes(value as CheckInSyncStatus)
  ) {
    return value as CheckInSyncStatus;
  }

  throw new CheckInValidationError("syncStatus is not supported.");
}

function optionalPreloadStatus(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (
    value === "not_preloaded" ||
    value === "preloaded" ||
    value === "expired" ||
    value === "failed"
  ) {
    return value;
  }

  throw new CheckInValidationError("preloadStatus is not supported.");
}

export function parseCheckInSettingsPayload(
  payload: unknown,
): CheckInSettingsInput {
  const body = asRecord(payload);

  return {
    allowedMethods: optionalMethodArray(body.allowedMethods),
    enabled: optionalBoolean(body.enabled, "enabled"),
    endsAt: optionalIsoDateText(body.endsAt, "endsAt"),
    offlinePreloadEnabled: optionalBoolean(
      body.offlinePreloadEnabled,
      "offlinePreloadEnabled",
    ),
    startsAt: optionalIsoDateText(body.startsAt, "startsAt"),
    status: optionalSettingStatus(body.status),
    supervisorApprovalRequired: optionalBoolean(
      body.supervisorApprovalRequired,
      "supervisorApprovalRequired",
    ),
    timezone: optionalText(body.timezone) ?? undefined,
    unexpectedGuestMode: optionalUnexpectedGuestMode(body.unexpectedGuestMode),
  };
}

export function parseCheckInDevicePayload(
  payload: unknown,
): CheckInDeviceInput {
  const body = asRecord(payload);

  return {
    assignedStaffUserId: optionalText(body.assignedStaffUserId),
    deviceLabel: optionalText(body.deviceLabel),
    mode: optionalText(body.mode) ?? undefined,
    preloadStatus: optionalPreloadStatus(body.preloadStatus),
    stationName: requiredText(body.stationName, "stationName"),
    status: optionalDeviceStatus(body.status),
    syncStatus: optionalSyncStatus(body.syncStatus),
  };
}

export function parseCheckInSearchPayload(
  payload: unknown,
): CheckInSearchFilters {
  const body = asRecord(payload);
  const side = optionalText(body.side) ?? "all";
  const rsvpStatus = optionalText(body.rsvpStatus) ?? "all";

  if (side !== "all" && !guestSideValues.has(side as GuestSide)) {
    throw new CheckInValidationError("side is not supported.");
  }

  if (
    rsvpStatus !== "all" &&
    !rsvpValues.has(rsvpStatus as RsvpCheckInStatus)
  ) {
    throw new CheckInValidationError("rsvpStatus is not supported.");
  }

  const tableId = optionalText(body.tableId);

  return {
    query: optionalText(body.query) ?? undefined,
    rsvpStatus: rsvpStatus as RsvpCheckInStatus | "all",
    side: side as GuestSide | "all",
    tableId: tableId === "unassigned" ? null : (tableId ?? undefined),
    vipOnly: optionalBoolean(body.vipOnly, "vipOnly"),
  };
}

export function parsePerformCheckInPayload(payload: unknown) {
  const body = asRecord(payload);
  const method = requiredText(body.method, "method");

  if (!checkInMethodValues.has(method as CheckInMethod)) {
    throw new CheckInValidationError("method is not supported.");
  }

  return {
    arrivalCount: requiredPositiveInteger(
      body.arrivalCount ?? 1,
      "arrivalCount",
    ),
    checkedInAt: optionalIsoDateText(body.checkedInAt, "checkedInAt"),
    deviceId: optionalText(body.deviceId),
    guestId: requiredText(body.guestId, "guestId"),
    invitationId: optionalText(body.invitationId),
    method: method as CheckInMethod,
    notes: optionalText(body.notes),
    sourceOfflineRecordId: optionalText(body.sourceOfflineRecordId),
    supervisorOverride: optionalBoolean(
      body.supervisorOverride,
      "supervisorOverride",
    ),
    syncStatus: optionalSyncStatus(body.syncStatus) ?? "online_synced",
    tokenId: optionalText(body.tokenId),
  };
}

export function parseUnexpectedGuestRequestPayload(payload: unknown) {
  const body = asRecord(payload);
  const side = optionalText(body.guestSide);

  if (side && !guestSideValues.has(side as GuestSide)) {
    throw new CheckInValidationError("guestSide is not supported.");
  }

  return {
    deviceId: optionalText(body.deviceId),
    guestSide: side as GuestSide | null,
    reason: optionalText(body.reason),
    requestedName: requiredText(body.requestedName, "requestedName"),
  };
}

export function parseUnexpectedGuestReviewPayload(payload: unknown) {
  const body = asRecord(payload);
  const status = requiredText(body.status, "status");
  const approvalMode = optionalText(body.approvalMode) ?? "in_app";

  if (
    status !== "approved" &&
    status !== "manual_approved" &&
    status !== "rejected"
  ) {
    throw new CheckInValidationError("status is not a supported review state.");
  }

  if (approvalMode !== "in_app" && approvalMode !== "manual_external") {
    throw new CheckInValidationError("approvalMode is not supported.");
  }

  return {
    approvalMode: approvalMode as UnexpectedGuestApprovalMode,
    approvedArrivalCount:
      body.approvedArrivalCount === undefined ||
      body.approvedArrivalCount === null ||
      body.approvedArrivalCount === ""
        ? undefined
        : requiredPositiveInteger(
            body.approvedArrivalCount,
            "approvedArrivalCount",
          ),
    decisionReason: optionalText(body.decisionReason),
    requestId: requiredText(body.requestId, "requestId"),
    status: status as Exclude<UnexpectedGuestRequestStatus, "pending">,
  };
}

export function generateCheckInToken() {
  return randomBytes(CHECK_IN_TOKEN_BYTES).toString("hex");
}

export function hashCheckInToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function tokenPreview(token: string) {
  return token.slice(0, 8);
}

export function buildCheckInQrPath(input: { eventId: string; token: string }) {
  return `/platform/events/${encodeURIComponent(
    input.eventId,
  )}/check-in/scan?${new URLSearchParams({ token: input.token }).toString()}`;
}

export function assertCheckInTokenIsSeparateFromPublicToken(input: {
  checkInToken: string;
  publicGuestToken: string | null;
}) {
  if (input.publicGuestToken && input.checkInToken === input.publicGuestToken) {
    throw new CheckInValidationError(
      "Check-in token must be separate from public guest page token.",
    );
  }
}

function normalizeSearchText(value: string | null | undefined) {
  return value?.trim().replace(/\s+/g, " ").toLowerCase() ?? "";
}

function normalizeDigits(value: string | null | undefined) {
  return value?.replace(/\D+/g, "") ?? "";
}

function sideMatches(guestSide: GuestSide, filter: GuestSide | "all") {
  if (filter === "all") {
    return true;
  }

  if (filter === "bride") {
    return guestSide === "bride" || guestSide === "both";
  }

  if (filter === "groom") {
    return guestSide === "groom" || guestSide === "both";
  }

  return guestSide === "both";
}

export function searchCheckInGuests(
  guests: CheckInGuest[],
  filters: CheckInSearchFilters,
) {
  const query = normalizeSearchText(filters.query);
  const queryDigits = normalizeDigits(filters.query);

  return guests.filter((guest) => {
    if (filters.side && !sideMatches(guest.guestSide, filters.side)) {
      return false;
    }

    if (
      filters.rsvpStatus &&
      filters.rsvpStatus !== "all" &&
      guest.rsvpStatus !== filters.rsvpStatus
    ) {
      return false;
    }

    if (filters.tableId !== undefined && guest.tableId !== filters.tableId) {
      return false;
    }

    if (filters.vipOnly && !guest.isVipProtocol) {
      return false;
    }

    if (!query) {
      return true;
    }

    const searchableText = [
      guest.displayName,
      guest.invitationId,
      guest.invitationPublicId,
      guest.tableCode,
      guest.tableName,
      guest.guestSide,
      guest.tags.join(" "),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const phoneDigits = normalizeDigits(guest.phoneNumber);

    return (
      searchableText.includes(query) ||
      (queryDigits.length > 0 && phoneDigits.includes(queryDigits))
    );
  });
}

export function calculateArrivalState(input: ArrivalStateInput): ArrivalState {
  const totalExpectedCount = Math.max(input.totalExpectedCount, 1);
  const attendanceBefore = Math.max(input.currentArrivedCount, 0);

  if (input.requestedArrivalCount < 1) {
    throw new CheckInValidationError("Arrival count must be at least 1.");
  }

  if (attendanceBefore >= totalExpectedCount && !input.supervisorOverride) {
    return {
      attendanceAfter: attendanceBefore,
      attendanceBefore,
      isComplete: true,
      isDuplicateScan: true,
      requestedArrivalCount: 0,
      totalExpectedCount,
      welcomeMessageAction: "suppress_duplicate",
      welcomeMessageSuppressedReason: "duplicate_scan",
    };
  }

  const attendanceAfter = attendanceBefore + input.requestedArrivalCount;

  if (attendanceAfter > totalExpectedCount && !input.supervisorOverride) {
    throw new CheckInValidationError(
      "Arrival count cannot exceed the expected count without supervisor override.",
    );
  }

  return {
    attendanceAfter,
    attendanceBefore,
    isComplete: attendanceAfter >= totalExpectedCount,
    isDuplicateScan: false,
    requestedArrivalCount: input.requestedArrivalCount,
    totalExpectedCount,
    welcomeMessageAction: input.supervisorOverride
      ? "none"
      : attendanceBefore === 0
        ? "prepare"
        : "suppress_duplicate",
    welcomeMessageSuppressedReason:
      input.supervisorOverride || attendanceBefore === 0
        ? null
        : "not_first_arrival",
  };
}

export function buildCheckInReadinessIssues(guest: CheckInGuest) {
  const issues: Array<{
    blocking: boolean;
    code:
      | "already_complete"
      | "rsvp_no_warning"
      | "table_missing_warning"
      | "vip_protocol_highlight";
    message: string;
    requirementIds: string[];
  }> = [];

  if (guest.arrivedCount >= guest.expectedCount) {
    issues.push({
      blocking: false,
      code: "already_complete",
      message: "Guest is already fully checked in; new scans are duplicates.",
      requirementIds: ["CHK-002", "CHK-006"],
    });
  }

  if (guest.rsvpStatus === "no") {
    issues.push({
      blocking: false,
      code: "rsvp_no_warning",
      message: "Guest RSVP is No; staff should verify before entry.",
      requirementIds: ["RSVP-010", "CHK-002"],
    });
  }

  if (!guest.tableId) {
    issues.push({
      blocking: false,
      code: "table_missing_warning",
      message: "Guest has no active table assignment.",
      requirementIds: ["SEAT-001", "CHK-002"],
    });
  }

  if (guest.isVipProtocol) {
    issues.push({
      blocking: false,
      code: "vip_protocol_highlight",
      message: "Guest requires VIP/protocol highlight.",
      requirementIds: ["CHK-010", "SEAT-010"],
    });
  }

  return issues;
}

export function buildOfflinePreloadDataset(input: {
  eventId: string;
  generatedAt: string;
  guests: CheckInGuest[];
  projectId: string;
}) {
  return {
    eventId: input.eventId,
    generatedAt: input.generatedAt,
    guests: input.guests.map((guest) => ({
      arrivedCount: guest.arrivedCount,
      displayName: guest.displayName,
      expectedCount: guest.expectedCount,
      guestId: guest.guestId,
      guestSide: guest.guestSide,
      invitationId: guest.invitationId,
      invitationPublicId: guest.invitationPublicId,
      isPrintedOnly: guest.isPrintedOnly,
      isVipProtocol: guest.isVipProtocol,
      phoneNumber: guest.phoneNumber,
      rsvpStatus: guest.rsvpStatus,
      tableCode: guest.tableCode,
      tableName: guest.tableName,
    })),
    projectId: input.projectId,
    schemaVersion: 1,
  };
}

export function detectOfflineSyncConflicts(input: {
  existingArrivalsByGuestId: Map<string, number>;
  offlineRecords: OfflineCheckInPayload[];
  totalExpectedByGuestId: Map<string, number>;
}) {
  const pendingArrivals = new Map(input.existingArrivalsByGuestId);
  const conflicts: OfflineSyncConflict[] = [];
  const seenOfflineIds = new Set<string>();

  for (const record of input.offlineRecords) {
    if (seenOfflineIds.has(record.offlineRecordId)) {
      conflicts.push({
        conflictType: "duplicate_check_in",
        guestId: record.guestId,
        offlineRecordId: record.offlineRecordId,
        reason: "Offline record id appears more than once in the batch.",
      });
      continue;
    }

    seenOfflineIds.add(record.offlineRecordId);

    const currentArrivals = pendingArrivals.get(record.guestId) ?? 0;
    const totalExpected = input.totalExpectedByGuestId.get(record.guestId) ?? 1;
    const nextArrivals = currentArrivals + record.arrivalCount;

    if (nextArrivals > totalExpected) {
      conflicts.push({
        conflictType: "arrival_count_conflict",
        guestId: record.guestId,
        offlineRecordId: record.offlineRecordId,
        reason: "Offline arrivals exceed the expected guest count.",
      });
      continue;
    }

    pendingArrivals.set(record.guestId, nextArrivals);
  }

  return conflicts;
}

export function calculateCheckInDashboardMetrics(input: {
  devices: Array<{ id: string; stationName: string }>;
  guests: CheckInGuest[];
  records: CheckInRecordLike[];
  syncConflictCount: number;
  unexpectedRequests: UnexpectedGuestRequestLike[];
}): CheckInDashboardMetrics {
  const tableMetrics = new Map<
    string,
    { arrivedUnits: number; expectedUnits: number; tableName: string }
  >();

  for (const guest of input.guests) {
    const tableId = guest.tableId ?? "unassigned";
    const current = tableMetrics.get(tableId) ?? {
      arrivedUnits: 0,
      expectedUnits: 0,
      tableName: guest.tableName ?? "Unassigned",
    };
    current.arrivedUnits += guest.arrivedCount;
    current.expectedUnits += guest.expectedCount;
    tableMetrics.set(tableId, current);
  }

  const deviceNames = new Map(
    input.devices.map((device) => [device.id, device.stationName]),
  );

  const arrivedRecords = input.records.filter(
    (record) => !record.isDuplicateScan,
  );
  const sumBy = <K extends string>(
    items: CheckInRecordLike[],
    keyForItem: (item: CheckInRecordLike) => K,
  ) => {
    const values = new Map<K, number>();

    for (const item of items) {
      values.set(
        keyForItem(item),
        (values.get(keyForItem(item)) ?? 0) + item.arrivalCount,
      );
    }

    return values;
  };

  const byDeviceMap = sumBy(
    arrivedRecords.filter((record) => record.deviceId),
    (record) => record.deviceId ?? "unknown",
  );
  const byMethodMap = sumBy(arrivedRecords, (record) => record.method);
  const byStaffMap = sumBy(arrivedRecords, (record) => record.staffUserId);
  const expectedUnits = input.guests.reduce(
    (total, guest) => total + guest.expectedCount,
    0,
  );
  const arrivedUnits = input.guests.reduce(
    (total, guest) => total + Math.min(guest.arrivedCount, guest.expectedCount),
    0,
  );

  return {
    arrivedUnits,
    byDevice: [...byDeviceMap.entries()].map(([deviceId, units]) => ({
      arrivedUnits: units,
      deviceId,
      label: deviceNames.get(deviceId) ?? "Unknown device",
    })),
    byMethod: [...byMethodMap.entries()].map(([method, units]) => ({
      arrivedUnits: units,
      method,
    })),
    byStaff: [...byStaffMap.entries()].map(([staffUserId, units]) => ({
      arrivedUnits: units,
      staffUserId,
    })),
    byTable: [...tableMetrics.entries()].map(([tableId, value]) => ({
      arrivedUnits: value.arrivedUnits,
      expectedUnits: value.expectedUnits,
      tableId,
      tableName: value.tableName,
    })),
    duplicateScanCount: input.records.filter((record) => record.isDuplicateScan)
      .length,
    expectedUnits,
    offlinePendingCount: input.records.filter(
      (record) => record.syncStatus === "offline_pending",
    ).length,
    partialArrivalCount: input.guests.filter(
      (guest) =>
        guest.arrivedCount > 0 && guest.arrivedCount < guest.expectedCount,
    ).length,
    remainingUnits: Math.max(expectedUnits - arrivedUnits, 0),
    syncConflictCount: input.syncConflictCount,
    unexpectedApprovedCount: input.unexpectedRequests.filter(
      (request) =>
        request.status === "approved" || request.status === "manual_approved",
    ).length,
    unexpectedPendingCount: input.unexpectedRequests.filter(
      (request) => request.status === "pending",
    ).length,
  };
}

export function canPerformCheckInAction(
  assignments: RoleAssignment[],
  projectId: string,
  eventId: string,
  action: CheckInAction,
) {
  return hasScopedPermission(assignments, checkInActionPermissions[action], {
    eventId,
    projectId,
    scope: "event",
  });
}

export function canUseCheckInSupervisorOverride(
  assignments: RoleAssignment[],
  projectId: string,
  eventId: string,
) {
  return canPerformCheckInAction(
    assignments,
    projectId,
    eventId,
    "unexpected_guests.review",
  );
}

export function getSprint9CheckInStatus() {
  return {
    epic: "EPIC-CHK",
    features: [
      "FEAT-CHK-001",
      "FEAT-CHK-002",
      "FEAT-CHK-003",
      "FEAT-CHK-004",
      "FEAT-CHK-005",
    ],
    issue: 25,
    modules: [
      {
        name: "Staff-only event check-in access and settings",
        requirementIds: ["CHK-001", "CHK-003", "CHK-004", "TECH-004"],
      },
      {
        name: "Separate secure check-in token and QR foundation",
        requirementIds: ["CHK-003", "INV-007", "INV-008", "TECH-010"],
      },
      {
        name: "QR/manual search check-in and printed-only handling",
        requirementIds: ["CHK-002", "CHK-012"],
      },
      {
        name: "Couple partial arrivals and no duplicate welcome placeholder",
        requirementIds: ["CHK-005", "CHK-006", "MSG-007"],
      },
      {
        name: "Unexpected guest request and supervisor approval foundation",
        requirementIds: ["CHK-008", "CHK-009"],
      },
      {
        name: "Device/station assignment and offline preload/sync foundation",
        requirementIds: ["CHK-011", "CHK-013", "TECH-007"],
      },
      {
        name: "VIP/protocol highlight and dashboard metrics foundation",
        requirementIds: ["CHK-010", "CHK-014", "SEAT-010"],
      },
      {
        name: "Permission checks and audit logging",
        requirementIds: ["CHK-001", "REP-006", "TECH-004"],
      },
    ],
    outOfScope: [
      "contracts",
      "pricing",
      "payments",
      "partner project creation",
      "full WhatsApp sending automation",
      "full reports/dashboard module",
      "post-event guest-book workflow",
      "invitation PDF generation",
      "guest import workflow",
    ],
    requirementIds: [
      "CHK-001",
      "CHK-002",
      "CHK-003",
      "CHK-004",
      "CHK-005",
      "CHK-006",
      "CHK-007",
      "CHK-008",
      "CHK-009",
      "CHK-010",
      "CHK-011",
      "CHK-012",
      "CHK-013",
      "CHK-014",
      "INV-007",
      "INV-008",
      "MSG-007",
      "SEAT-010",
      "REP-006",
      "TECH-007",
      "TECH-010",
    ],
    sprint: "Sprint 9 - Check-in & Wedding-Day Operations",
    stories: ["STORY-CHK-001", "STORY-CHK-002", "STORY-CHK-003"],
    tasks: ["TASK-CHK-001", "TASK-CHK-002"],
    tests: ["TEST-CHK-001", "TEST-CHK-002", "TEST-CHK-003"],
  };
}
