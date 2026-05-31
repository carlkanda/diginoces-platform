import type { Json } from "@/types/database";
import type { PermissionSlug } from "@/lib/security/permissions";

export type DashboardScope =
  | "couple"
  | "event"
  | "global"
  | "partner"
  | "project";
export type ReportFormat = "csv" | "excel_placeholder" | "pdf_placeholder";
export type ReportScope = "event" | "global" | "project";
export type ReportStatus = "available" | "placeholder" | "post_mvp";

export type ReportDefinition = {
  description: string;
  format: ReportFormat;
  internalOnly: boolean;
  key: ReportKey;
  name: string;
  requirementIds: string[];
  requiredPermissions: PermissionSlug[];
  scope: ReportScope;
  status: ReportStatus;
};

export type ReportKey =
  | "audit_log_export"
  | "check_in_summary"
  | "payment_contract_summary"
  | "project_guest_summary"
  | "rsvp_summary"
  | "seating_summary";

export type DashboardVisibility = {
  canReadAuditLogs: boolean;
  canReadCoupleDashboard: boolean;
  canReadEventDashboard: boolean;
  canReadGlobalDashboard: boolean;
  canReadInternalReports: boolean;
  canReadInternalRevenue: boolean;
  canReadPartnerDashboard: boolean;
  canReadProjectDashboard: boolean;
  canReadReports: boolean;
};

export type CsvColumn<T extends Record<string, unknown>> = {
  key: keyof T & string;
  label: string;
};

export type AuditLogExportRow = {
  action: string;
  actorUserId: string | null;
  createdAt: string;
  id: string;
  newValue?: Json | null;
  objectId: string | null;
  objectType: string;
  oldValue?: Json | null;
  reason: string | null;
  source: string;
};

export type AuditLogFilters = {
  action?: string | null;
  actorUserId?: string | null;
  from?: string | null;
  objectType?: string | null;
  search?: string | null;
  to?: string | null;
};

export class ReportValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReportValidationError";
  }
}

export const sprint11ReportDefinitions: ReportDefinition[] = [
  {
    description:
      "Project guest count, side, printed-only, and event assignment summary.",
    format: "csv",
    internalOnly: false,
    key: "project_guest_summary",
    name: "Project guest summary",
    requirementIds: ["REP-001", "REP-003", "REP-005", "GM-001"],
    requiredPermissions: ["reports.catalog.read", "reports.export"],
    scope: "project",
    status: "available",
  },
  {
    description: "Event-level RSVP Yes/No/Maybe/Pending summary by project.",
    format: "csv",
    internalOnly: false,
    key: "rsvp_summary",
    name: "RSVP summary",
    requirementIds: ["REP-001", "REP-003", "REP-005", "RSVP-010"],
    requiredPermissions: ["reports.catalog.read", "reports.export"],
    scope: "project",
    status: "available",
  },
  {
    description:
      "Event table count, assigned guests, unassigned guests, and capacity summary.",
    format: "csv",
    internalOnly: false,
    key: "seating_summary",
    name: "Seating summary",
    requirementIds: ["REP-001", "REP-005", "SEAT-001"],
    requiredPermissions: ["reports.catalog.read", "reports.export"],
    scope: "event",
    status: "available",
  },
  {
    description:
      "Expected, arrived, remaining, and unexpected guest request summary.",
    format: "csv",
    internalOnly: false,
    key: "check_in_summary",
    name: "Check-in summary",
    requirementIds: ["REP-001", "REP-005", "CHK-014"],
    requiredPermissions: ["reports.catalog.read", "reports.export"],
    scope: "event",
    status: "available",
  },
  {
    description:
      "Internal contract, balance, payment gate, and exception summary.",
    format: "csv",
    internalOnly: true,
    key: "payment_contract_summary",
    name: "Payment and contract summary",
    requirementIds: ["REP-002", "REP-005", "PAY-014", "ROLE-004"],
    requiredPermissions: [
      "reports.catalog.read",
      "reports.export",
      "reports.internal.read",
      "revenue.read",
    ],
    scope: "project",
    status: "available",
  },
  {
    description:
      "Filtered internal audit-log export without old/new value payloads.",
    format: "csv",
    internalOnly: true,
    key: "audit_log_export",
    name: "Audit log export",
    requirementIds: ["REP-006", "REP-007", "TECH-004"],
    requiredPermissions: ["reports.catalog.read", "audit.read", "audit.export"],
    scope: "global",
    status: "available",
  },
];

export function getDashboardVisibility(
  permissions: ReadonlySet<PermissionSlug>,
): DashboardVisibility {
  return {
    canReadAuditLogs: permissions.has("audit.read"),
    canReadCoupleDashboard: permissions.has("dashboards.couple.read"),
    canReadEventDashboard: permissions.has("dashboards.event.read"),
    canReadGlobalDashboard: permissions.has("dashboards.global.read"),
    canReadInternalReports: permissions.has("reports.internal.read"),
    canReadInternalRevenue: permissions.has("revenue.read"),
    canReadPartnerDashboard: permissions.has("dashboards.partner.read"),
    canReadProjectDashboard: permissions.has("dashboards.project.read"),
    canReadReports: permissions.has("reports.catalog.read"),
  };
}

export function canAccessReportDefinition(
  definition: ReportDefinition,
  permissions: ReadonlySet<PermissionSlug>,
) {
  return definition.requiredPermissions.every((permission) =>
    permissions.has(permission),
  );
}

export function getReportCatalogForPermissions(
  permissions: ReadonlySet<PermissionSlug>,
) {
  return sprint11ReportDefinitions.filter((definition) =>
    canAccessReportDefinition(definition, permissions),
  );
}

function formatCsvValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  const rawText =
    value instanceof Date
      ? value.toISOString()
      : typeof value === "object"
        ? JSON.stringify(value)
        : String(value);
  const isStandaloneNumber = /^-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(
    rawText,
  );
  const text =
    !isStandaloneNumber && /^[=+\-@\t\r\n]/.test(rawText)
      ? `'${rawText}`
      : rawText;

  if (/[",\r\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

export function buildCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: CsvColumn<T>[],
) {
  const header = columns
    .map((column) => formatCsvValue(column.label))
    .join(",");
  const body = rows.map((row) =>
    columns.map((column) => formatCsvValue(row[column.key])).join(","),
  );

  return [header, ...body].join("\r\n");
}

function parseTime(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function filterAuditLogRows(
  rows: AuditLogExportRow[],
  filters: AuditLogFilters,
) {
  const fromTime = parseTime(filters.from);
  const toTime = parseTime(filters.to);
  const search = filters.search?.trim().toLowerCase();

  return rows.filter((row) => {
    const rowTime = parseTime(row.createdAt);

    if (filters.action && row.action !== filters.action) {
      return false;
    }

    if (filters.actorUserId && row.actorUserId !== filters.actorUserId) {
      return false;
    }

    if (filters.objectType && row.objectType !== filters.objectType) {
      return false;
    }

    if (fromTime !== null && rowTime !== null && rowTime < fromTime) {
      return false;
    }

    if (toTime !== null && rowTime !== null && rowTime > toTime) {
      return false;
    }

    if (search) {
      const searchable = [
        row.action,
        row.actorUserId,
        row.objectId,
        row.objectType,
        row.reason,
        row.source,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(search);
    }

    return true;
  });
}

export function sanitizeAuditLogRowForExport(row: AuditLogExportRow) {
  return {
    action: row.action,
    actorUserId: row.actorUserId,
    createdAt: row.createdAt,
    id: row.id,
    objectId: row.objectId,
    objectType: row.objectType,
    reason: row.reason,
    source: row.source,
  };
}

export const auditLogCsvColumns = [
  { key: "createdAt", label: "Created at" },
  { key: "action", label: "Action" },
  { key: "objectType", label: "Object type" },
  { key: "objectId", label: "Object ID" },
  { key: "actorUserId", label: "Actor user ID" },
  { key: "source", label: "Source" },
  { key: "reason", label: "Reason" },
] satisfies CsvColumn<ReturnType<typeof sanitizeAuditLogRowForExport>>[];

const sprint11Features = [
  "Global, project, event, couple, and partner dashboard foundations",
  "Role-aware dashboard metric visibility",
  "Operational summary widgets across guests, RSVP, seating, check-in, messaging, imports, and commercial controls",
  "Report catalog and CSV export foundation",
  "Audit-log viewer, filtering, and redacted CSV export foundation",
  "Permission-gated report export metadata and audit coverage",
];

export function parseReportKey(value: unknown): ReportKey {
  if (typeof value !== "string") {
    throw new ReportValidationError("reportKey is required.");
  }

  const definition = sprint11ReportDefinitions.find(
    (entry) => entry.key === value,
  );

  if (!definition) {
    throw new ReportValidationError("reportKey is not supported.");
  }

  return definition.key;
}

export function parseReportScope(value: unknown): ReportScope {
  if (value === "global" || value === "project" || value === "event") {
    return value;
  }

  throw new ReportValidationError("scope is not supported.");
}

function normalizeAuditDateFilter(key: "from" | "to", value: string) {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (dateOnly) {
    const year = Number(dateOnly[1]);
    const month = Number(dateOnly[2]);
    const day = Number(dateOnly[3]);
    const parsed = new Date(Date.UTC(year, month - 1, day));

    if (
      parsed.getUTCFullYear() !== year ||
      parsed.getUTCMonth() !== month - 1 ||
      parsed.getUTCDate() !== day
    ) {
      throw new ReportValidationError(`${key} filter must be a valid date.`);
    }

    return key === "from" ? `${value}T00:00:00.000Z` : `${value}T23:59:59.999Z`;
  }

  if (Number.isNaN(Date.parse(value))) {
    throw new ReportValidationError(`${key} filter must be a valid date.`);
  }

  return value;
}

export function normalizeAuditLogFilters(value: unknown): AuditLogFilters {
  if (value === undefined || value === null) {
    return {};
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    throw new ReportValidationError("filters must be an object.");
  }

  const input = value as Record<string, unknown>;
  const filters: AuditLogFilters = {};

  for (const key of [
    "action",
    "actorUserId",
    "from",
    "objectType",
    "search",
    "to",
  ] as const) {
    const field = input[key];

    if (field === undefined || field === null) {
      continue;
    }

    if (typeof field !== "string") {
      throw new ReportValidationError(`${key} filter must be a string.`);
    }

    let normalized = field.trim();

    if ((key === "from" || key === "to") && normalized.length > 0) {
      normalized = normalizeAuditDateFilter(key, normalized);
    }

    filters[key] = normalized.length > 0 ? normalized : null;
  }

  if (
    filters.from &&
    filters.to &&
    Date.parse(filters.from) > Date.parse(filters.to)
  ) {
    throw new ReportValidationError("from filter must not be after to filter.");
  }

  return filters;
}

export function getSprint11ReportingStatus() {
  return {
    features: sprint11Features,
    issue: 27,
    modules: [
      {
        description:
          "Permission-gated dashboard services for global, project, event, couple, and partner views.",
        name: "Dashboard foundations",
      },
      {
        description:
          "Report catalog and CSV export metadata for Sprint 11 operational summaries.",
        name: "Report export foundation",
      },
      {
        description:
          "Audit-log viewer, filters, and redacted CSV export support for authorized internal users.",
        name: "Audit-log foundation",
      },
    ],
    requirementIds: [
      "REP-001",
      "REP-002",
      "REP-003",
      "REP-004",
      "REP-005",
      "REP-006",
      "REP-007",
      "ROLE-002",
      "ROLE-003",
      "ROLE-004",
      "ROLE-005",
      "PAY-014",
      "PART-005",
      "FILE-002",
      "FILE-008",
      "TECH-004",
    ],
    sprint: "Sprint 11 - Dashboards, Reports & Audit Logs",
  };
}
