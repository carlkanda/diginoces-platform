import type { SupabaseClient } from "@supabase/supabase-js";
import {
  auditLogCsvColumns,
  buildCsv,
  filterAuditLogRows,
  getReportCatalogForPermissions,
  normalizeAuditLogFilters,
  parseReportKey,
  parseReportScope,
  ReportValidationError,
  sanitizeAuditLogRowForExport,
  sprint11ReportDefinitions,
  type AuditLogExportRow,
  type AuditLogFilters,
  type CsvColumn,
  type DashboardVisibility,
  type ReportKey,
  type ReportScope,
} from "@/lib/reports/report-service";
import type { PermissionSlug } from "@/lib/security/permissions";

type AnySupabase = SupabaseClient;

type BaseRow = Record<string, unknown>;

export type MetricCard = {
  label: string;
  value: number | string;
  visibility: "internal" | "partner" | "public_safe";
};

export type ProjectSummaryRow = {
  bride_name: string;
  groom_name: string;
  guest_list_access_status?: string | null;
  guest_page_access_status?: string | null;
  id: string;
  latest_contract_id?: string | null;
  preferred_language: string | null;
  project_code: string;
  status: string;
};

export type EventSummaryRow = {
  event_code: string;
  event_date: string | null;
  event_type: string;
  id: string;
  name: string;
  project_id: string;
  status: string;
  venue_name: string | null;
};

export type DashboardOverview = {
  generatedAt: string;
  metrics: MetricCard[];
  requirementIds: string[];
  scope: string;
};

export type GlobalDashboardOverview = DashboardOverview & {
  recentAuditLogs: AuditLogExportRow[];
  recentProjects: ProjectSummaryRow[];
};

export type ProjectDashboardOverview = DashboardOverview & {
  events: EventSummaryRow[];
  project: ProjectSummaryRow;
  summaries: {
    checkIn: Record<string, number>;
    commercial: Record<string, number | string | null>;
    communications: Record<string, number>;
    guestImports: Record<string, number>;
    guests: Record<string, number>;
    invitations: Record<string, number>;
    reports: Record<string, number>;
    rsvps: Record<string, number>;
    seating: Record<string, number>;
  };
};

export type EventDashboardOverview = DashboardOverview & {
  event: EventSummaryRow;
  project: ProjectSummaryRow | null;
  summaries: {
    checkIn: Record<string, number>;
    invitations: Record<string, number>;
    rsvps: Record<string, number>;
    seating: Record<string, number>;
  };
};

export type PartnerDashboardOverview = DashboardOverview & {
  boundaries: string[];
  status: "placeholder";
};

export type ReportExportInput = {
  actorUserId: string;
  eventId?: string | null;
  filters?: unknown;
  permissions: ReadonlySet<PermissionSlug>;
  projectId?: string | null;
  reportKey: unknown;
  scope: unknown;
};

export type ReportExportResult = {
  csv: string;
  exportRecord: BaseRow;
  filename: string;
  rowCount: number;
};

async function listRows<T extends BaseRow>(
  query: PromiseLike<{ data: T[] | null; error: unknown }>,
) {
  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function maybeRow<T extends BaseRow>(
  query: PromiseLike<{ data: T | null; error: unknown }>,
) {
  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data;
}

async function countRows(
  query: PromiseLike<{ count: number | null; error: unknown }>,
) {
  const { count, error } = await query;

  if (error) {
    throw error;
  }

  return count ?? 0;
}

function statusCounts(rows: BaseRow[], field = "status") {
  return rows.reduce<Record<string, number>>((counts, row) => {
    const key =
      typeof row[field] === "string" && row[field].length > 0
        ? row[field]
        : "unknown";
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function sumRows(rows: BaseRow[], field: string) {
  return rows.reduce((total, row) => {
    const value = row[field];
    return total + (typeof value === "number" ? value : 0);
  }, 0);
}

function asProject(row: BaseRow): ProjectSummaryRow {
  return {
    bride_name: String(row.bride_name ?? ""),
    groom_name: String(row.groom_name ?? ""),
    guest_list_access_status:
      typeof row.guest_list_access_status === "string"
        ? row.guest_list_access_status
        : null,
    guest_page_access_status:
      typeof row.guest_page_access_status === "string"
        ? row.guest_page_access_status
        : null,
    id: String(row.id),
    latest_contract_id:
      typeof row.latest_contract_id === "string"
        ? row.latest_contract_id
        : null,
    preferred_language:
      typeof row.preferred_language === "string"
        ? row.preferred_language
        : null,
    project_code: String(row.project_code ?? ""),
    status: String(row.status ?? "unknown"),
  };
}

function asEvent(row: BaseRow): EventSummaryRow {
  return {
    event_code: String(row.event_code ?? ""),
    event_date: typeof row.event_date === "string" ? row.event_date : null,
    event_type: String(row.event_type ?? "unknown"),
    id: String(row.id),
    name: String(row.name ?? ""),
    project_id: String(row.project_id),
    status: String(row.status ?? "unknown"),
    venue_name: typeof row.venue_name === "string" ? row.venue_name : null,
  };
}

function nowIso() {
  return new Date().toISOString();
}

function table(supabase: AnySupabase, name: string) {
  return supabase.from(name);
}

function quotePostgrestOrValue(value: string) {
  return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}

function auditLogSearchPattern(search: string) {
  const escapedPattern = `%${search
    .replaceAll("%", "\\%")
    .replaceAll("_", "\\_")}%`;

  return quotePostgrestOrValue(escapedPattern);
}

const auditSources = ["api", "auth", "storage", "system"] as const;

export function auditLogSearchOrFilters(search: string) {
  const pattern = auditLogSearchPattern(search);
  const searchLower = search.toLowerCase();
  const textFilters = [
    `action.ilike.${pattern}`,
    `object_type.ilike.${pattern}`,
    `reason.ilike.${pattern}`,
    ...auditSources
      .filter((source) => source.includes(searchLower))
      .map((source) => `source.eq.${source}`),
  ];

  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      search,
    )
  ) {
    textFilters.push(`actor_user_id.eq.${search}`, `object_id.eq.${search}`);
  }

  return textFilters;
}

export async function getGlobalDashboardOverview(
  supabase: AnySupabase,
  visibility: DashboardVisibility,
): Promise<GlobalDashboardOverview> {
  const today = new Date().toISOString().slice(0, 10);
  const [
    projects,
    projectCount,
    activeProjectCount,
    upcomingEventCount,
    draftEventCount,
    contracts,
    payments,
    imports,
    messages,
    unexpected,
    reportExportCount,
    auditRows,
  ] = await Promise.all([
    listRows<BaseRow>(
      table(supabase, "wedding_projects")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(8),
    ),
    countRows(
      table(supabase, "wedding_projects").select("id", {
        count: "exact",
        head: true,
      }),
    ),
    countRows(
      table(supabase, "wedding_projects")
        .select("id", { count: "exact", head: true })
        .in("status", ["active", "ready_for_invitations", "event_operations"]),
    ),
    countRows(
      table(supabase, "events")
        .select("id", { count: "exact", head: true })
        .gte("event_date", today),
    ),
    countRows(
      table(supabase, "events")
        .select("id", { count: "exact", head: true })
        .eq("status", "draft"),
    ),
    visibility.canReadInternalReports
      ? listRows<BaseRow>(
          table(supabase, "contracts").select("id, status").limit(200),
        )
      : Promise.resolve([]),
    visibility.canReadInternalRevenue
      ? listRows<BaseRow>(
          table(supabase, "payments")
            .select("id, status, paid_amount_cents")
            .limit(200),
        )
      : Promise.resolve([]),
    listRows<BaseRow>(
      table(supabase, "guest_import_sessions").select("id, status").limit(200),
    ),
    listRows<BaseRow>(
      table(supabase, "message_logs").select("id, status").limit(200),
    ),
    listRows<BaseRow>(
      table(supabase, "unexpected_guest_requests")
        .select("id, status")
        .limit(200),
    ),
    countRows(
      table(supabase, "report_exports").select("id", {
        count: "exact",
        head: true,
      }),
    ),
    visibility.canReadAuditLogs
      ? listAuditLogs(supabase, {}, 8)
      : Promise.resolve([]),
  ]);
  const contractCounts = statusCounts(contracts);
  const importCounts = statusCounts(imports);
  const messageCounts = statusCounts(messages);
  const unexpectedCounts = statusCounts(unexpected);

  return {
    generatedAt: nowIso(),
    metrics: [
      {
        label: "Projects",
        value: projectCount,
        visibility: "internal",
      },
      {
        label: "Upcoming events",
        value: upcomingEventCount,
        visibility: "internal",
      },
      {
        label: "Active projects",
        value: activeProjectCount,
        visibility: "internal",
      },
      {
        label: "Pending contracts",
        value:
          (contractCounts.generated ?? 0) +
          (contractCounts.sent_for_approval ?? 0),
        visibility: "internal",
      },
      {
        label: "Confirmed payment volume",
        value: visibility.canReadInternalRevenue
          ? sumRows(
              payments.filter((payment) => payment.status === "confirmed"),
              "paid_amount_cents",
            )
          : "restricted",
        visibility: "internal",
      },
      {
        label: "Imports needing review",
        value:
          (importCounts.ready_for_review ?? 0) +
          (importCounts.validation_failed ?? 0),
        visibility: "internal",
      },
      {
        label: "Messages needing action",
        value:
          (messageCounts.prepared ?? 0) +
          (messageCounts.failed ?? 0) +
          (messageCounts.queued ?? 0),
        visibility: "internal",
      },
      {
        label: "Unexpected guest requests",
        value: unexpectedCounts.pending ?? 0,
        visibility: "internal",
      },
      {
        label: "Report exports",
        value: reportExportCount,
        visibility: "internal",
      },
      {
        label: "Draft events",
        value: draftEventCount,
        visibility: "internal",
      },
    ],
    recentAuditLogs: auditRows,
    recentProjects: projects.map(asProject),
    requirementIds: ["REP-001", "REP-002", "REP-006", "PAY-014"],
    scope: "global",
  };
}

export async function getProjectDashboardOverview(
  supabase: AnySupabase,
  projectId: string,
  visibility: DashboardVisibility,
): Promise<ProjectDashboardOverview | null> {
  const project = await maybeRow<ProjectSummaryRow>(
    table(supabase, "wedding_projects")
      .select("*")
      .eq("id", projectId)
      .maybeSingle(),
  );

  if (!project) {
    return null;
  }

  const [
    events,
    guests,
    assignments,
    imports,
    rsvps,
    invitations,
    messages,
    tables,
    tableAssignments,
    checkIns,
    unexpected,
    contracts,
    payments,
    paymentExceptions,
    reportExports,
  ] = await Promise.all([
    listRows<BaseRow>(
      table(supabase, "events")
        .select("*")
        .eq("project_id", projectId)
        .order("event_date", { ascending: true, nullsFirst: false }),
    ),
    listRows<BaseRow>(
      table(supabase, "guests")
        .select("id, guest_side, is_active, is_printed_only")
        .eq("project_id", projectId),
    ),
    listRows<BaseRow>(
      table(supabase, "guest_event_assignments")
        .select("id, invited, status")
        .eq("project_id", projectId),
    ),
    listRows<BaseRow>(
      table(supabase, "guest_import_sessions")
        .select("id, status")
        .eq("project_id", projectId),
    ),
    listRows<BaseRow>(
      table(supabase, "rsvp_records")
        .select("id, status, manual_review_required")
        .eq("project_id", projectId),
    ),
    listRows<BaseRow>(
      table(supabase, "invitations")
        .select("id, status")
        .eq("project_id", projectId),
    ),
    listRows<BaseRow>(
      table(supabase, "message_logs")
        .select("id, status")
        .eq("project_id", projectId),
    ),
    listRows<BaseRow>(
      table(supabase, "event_tables")
        .select("id, status, capacity")
        .eq("project_id", projectId),
    ),
    listRows<BaseRow>(
      table(supabase, "guest_table_assignments")
        .select("id, status")
        .eq("project_id", projectId),
    ),
    listRows<BaseRow>(
      table(supabase, "check_in_records")
        .select("id, arrival_count, is_duplicate_scan")
        .eq("project_id", projectId),
    ),
    listRows<BaseRow>(
      table(supabase, "unexpected_guest_requests")
        .select("id, status")
        .eq("project_id", projectId),
    ),
    visibility.canReadInternalReports || visibility.canReadInternalRevenue
      ? listRows<BaseRow>(
          table(supabase, "contracts")
            .select("id, status, final_amount_cents, is_latest")
            .eq("project_id", projectId),
        )
      : Promise.resolve([]),
    visibility.canReadInternalRevenue
      ? listRows<BaseRow>(
          table(supabase, "payments")
            .select("id, status, paid_amount_cents")
            .eq("project_id", projectId),
        )
      : Promise.resolve([]),
    visibility.canReadInternalReports
      ? listRows<BaseRow>(
          table(supabase, "payment_exceptions")
            .select("id, status")
            .eq("project_id", projectId),
        )
      : Promise.resolve([]),
    listRows<BaseRow>(
      table(supabase, "report_exports")
        .select("id, status")
        .eq("project_id", projectId),
    ),
  ]);
  const activeGuests = guests.filter((guest) => guest.is_active === true);
  const guestSideCounts = statusCounts(activeGuests, "guest_side");
  const importCounts = statusCounts(imports);
  const rsvpCounts = statusCounts(rsvps);
  const invitationCounts = statusCounts(invitations);
  const messageCounts = statusCounts(messages);
  const tableCounts = statusCounts(tables);
  const assignmentCounts = statusCounts(tableAssignments);
  const unexpectedCounts = statusCounts(unexpected);
  const contractCounts = statusCounts(contracts);
  const paymentCounts = statusCounts(payments);

  return {
    events: events.map(asEvent),
    generatedAt: nowIso(),
    metrics: [
      {
        label: "Active guests",
        value: activeGuests.length,
        visibility: "public_safe",
      },
      {
        label: "Invited event assignments",
        value: assignments.filter((assignment) => assignment.invited === true)
          .length,
        visibility: "public_safe",
      },
      {
        label: "RSVP yes",
        value: rsvpCounts.yes ?? 0,
        visibility: "public_safe",
      },
      {
        label: "Pending RSVP",
        value: rsvpCounts.pending ?? 0,
        visibility: "public_safe",
      },
      {
        label: "Prepared messages",
        value: messageCounts.prepared ?? 0,
        visibility: "internal",
      },
      {
        label: "Active tables",
        value: tableCounts.active ?? 0,
        visibility: "public_safe",
      },
      {
        label: "Checked-in arrivals",
        value: sumRows(checkIns, "arrival_count"),
        visibility: "internal",
      },
      {
        label: "Payment gate",
        value: project.guest_page_access_status ?? "not_configured",
        visibility: "internal",
      },
    ],
    project: asProject(project),
    requirementIds: ["REP-001", "REP-002", "REP-003", "PAY-014"],
    scope: "project",
    summaries: {
      checkIn: {
        arrivedUnits: sumRows(checkIns, "arrival_count"),
        duplicateScans: checkIns.filter(
          (record) => record.is_duplicate_scan === true,
        ).length,
        unexpectedPending: unexpectedCounts.pending ?? 0,
      },
      commercial: {
        activePaymentExceptions: statusCounts(paymentExceptions).active ?? 0,
        confirmedPayments: paymentCounts.confirmed ?? 0,
        contractApproved: contractCounts.approved ?? 0,
        latestContractId: project.latest_contract_id ?? null,
        paymentVolumeCents: visibility.canReadInternalRevenue
          ? sumRows(
              payments.filter((payment) => payment.status === "confirmed"),
              "paid_amount_cents",
            )
          : "restricted",
      },
      communications: messageCounts,
      guestImports: importCounts,
      guests: {
        active: activeGuests.length,
        both: guestSideCounts.both ?? 0,
        bride: guestSideCounts.bride ?? 0,
        groom: guestSideCounts.groom ?? 0,
        printedOnly: guests.filter((guest) => guest.is_printed_only === true)
          .length,
        total: guests.length,
      },
      invitations: invitationCounts,
      reports: statusCounts(reportExports),
      rsvps: {
        ...rsvpCounts,
        manualReviewRequired: rsvps.filter(
          (rsvp) => rsvp.manual_review_required === true,
        ).length,
      },
      seating: {
        activeAssignments: assignmentCounts.active ?? 0,
        capacity: sumRows(tables, "capacity"),
        tables: tables.length,
      },
    },
  };
}

export async function getCoupleDashboardOverview(
  supabase: AnySupabase,
  projectId: string,
  visibility: DashboardVisibility,
) {
  const overview = await getProjectDashboardOverview(
    supabase,
    projectId,
    visibility,
  );

  if (!overview) {
    return null;
  }

  return {
    ...overview,
    metrics: overview.metrics.filter(
      (metric) => metric.visibility === "public_safe",
    ),
    requirementIds: ["REP-003", "ROLE-005"],
    scope: "couple",
    summaries: {
      ...overview.summaries,
      commercial: {
        paymentGate: overview.project.guest_page_access_status ?? "locked",
      },
      reports: {},
    },
  };
}

export async function getEventDashboardOverview(
  supabase: AnySupabase,
  eventId: string,
): Promise<EventDashboardOverview | null> {
  const event = await maybeRow<EventSummaryRow>(
    table(supabase, "events").select("*").eq("id", eventId).maybeSingle(),
  );

  if (!event) {
    return null;
  }

  const [
    project,
    assignments,
    rsvps,
    invitations,
    tables,
    tableAssignments,
    checkIns,
    unexpected,
  ] = await Promise.all([
    maybeRow<ProjectSummaryRow>(
      table(supabase, "wedding_projects")
        .select("*")
        .eq("id", event.project_id)
        .maybeSingle(),
    ),
    listRows<BaseRow>(
      table(supabase, "guest_event_assignments")
        .select("id, invited, status")
        .eq("event_id", eventId),
    ),
    listRows<BaseRow>(
      table(supabase, "rsvp_records")
        .select("id, status, manual_review_required")
        .eq("event_id", eventId),
    ),
    listRows<BaseRow>(
      table(supabase, "invitations")
        .select("id, status")
        .eq("event_id", eventId),
    ),
    listRows<BaseRow>(
      table(supabase, "event_tables")
        .select("id, status, capacity")
        .eq("event_id", eventId),
    ),
    listRows<BaseRow>(
      table(supabase, "guest_table_assignments")
        .select("id, status")
        .eq("event_id", eventId),
    ),
    listRows<BaseRow>(
      table(supabase, "check_in_records")
        .select("id, arrival_count, is_duplicate_scan")
        .eq("event_id", eventId),
    ),
    listRows<BaseRow>(
      table(supabase, "unexpected_guest_requests")
        .select("id, status")
        .eq("event_id", eventId),
    ),
  ]);
  const rsvpCounts = statusCounts(rsvps);
  const invitationCounts = statusCounts(invitations);
  const assignmentCounts = statusCounts(tableAssignments);
  const unexpectedCounts = statusCounts(unexpected);

  return {
    event: asEvent(event),
    generatedAt: nowIso(),
    metrics: [
      {
        label: "Invited guests",
        value: assignments.filter((assignment) => assignment.invited === true)
          .length,
        visibility: "public_safe",
      },
      {
        label: "RSVP yes",
        value: rsvpCounts.yes ?? 0,
        visibility: "public_safe",
      },
      {
        label: "Assigned seats/tables",
        value: assignmentCounts.active ?? 0,
        visibility: "public_safe",
      },
      {
        label: "Arrivals",
        value: sumRows(checkIns, "arrival_count"),
        visibility: "internal",
      },
      {
        label: "Unexpected pending",
        value: unexpectedCounts.pending ?? 0,
        visibility: "internal",
      },
    ],
    project: project ? asProject(project) : null,
    requirementIds: ["REP-001", "ROLE-003"],
    scope: "event",
    summaries: {
      checkIn: {
        arrivedUnits: sumRows(checkIns, "arrival_count"),
        duplicateScans: checkIns.filter(
          (record) => record.is_duplicate_scan === true,
        ).length,
        unexpectedPending: unexpectedCounts.pending ?? 0,
      },
      invitations: invitationCounts,
      rsvps: {
        ...rsvpCounts,
        manualReviewRequired: rsvps.filter(
          (rsvp) => rsvp.manual_review_required === true,
        ).length,
      },
      seating: {
        activeAssignments: assignmentCounts.active ?? 0,
        capacity: sumRows(tables, "capacity"),
        tables: tables.length,
      },
    },
  };
}

export function getPartnerDashboardPlaceholder(): PartnerDashboardOverview {
  return {
    boundaries: [
      "Partner view is restricted to future partner-scoped operational summaries.",
      "No project financials, guest personal data, audit logs, commissions, or SaaS scaling features are exposed in Sprint 11.",
      "Partner project creation and partner commission management remain out of scope.",
    ],
    generatedAt: nowIso(),
    metrics: [
      {
        label: "Partner dashboard",
        value: "foundation only",
        visibility: "partner",
      },
    ],
    requirementIds: ["REP-004", "PART-005"],
    scope: "partner",
    status: "placeholder",
  };
}

export async function listAuditLogs(
  supabase: AnySupabase,
  filters: AuditLogFilters = {},
  limit = 100,
) {
  const search = filters.search?.trim();
  let query = table(supabase, "audit_logs")
    .select(
      "id, actor_user_id, action, object_type, object_id, source, reason, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filters.action) {
    query = query.eq("action", filters.action);
  }

  if (filters.actorUserId) {
    query = query.eq("actor_user_id", filters.actorUserId);
  }

  if (filters.objectType) {
    query = query.eq("object_type", filters.objectType);
  }

  if (filters.from) {
    query = query.gte("created_at", filters.from);
  }

  if (filters.to) {
    query = query.lte("created_at", filters.to);
  }

  if (search) {
    const textFilters = auditLogSearchOrFilters(search);

    query = query.or(textFilters.join(","));
  }

  const rows = await listRows<BaseRow>(query);

  return rows.map(
    (row): AuditLogExportRow => ({
      action: String(row.action),
      actorUserId:
        typeof row.actor_user_id === "string" ? row.actor_user_id : null,
      createdAt: String(row.created_at),
      id: String(row.id),
      objectId: typeof row.object_id === "string" ? row.object_id : null,
      objectType: String(row.object_type),
      reason: typeof row.reason === "string" ? row.reason : null,
      source: String(row.source),
    }),
  );
}

export async function listReportExports(
  supabase: AnySupabase,
  filters: {
    eventId?: string;
    projectId?: string;
  } = {},
) {
  let query = table(supabase, "report_exports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(25);

  if (filters.projectId) {
    query = query.eq("project_id", filters.projectId);
  }

  if (filters.eventId) {
    query = query.eq("event_id", filters.eventId);
  }

  return listRows<BaseRow>(query);
}

async function getReportDefinitionId(
  supabase: AnySupabase,
  reportKey: ReportKey,
) {
  const row = await maybeRow<BaseRow>(
    table(supabase, "report_definitions")
      .select("id")
      .eq("report_key", reportKey)
      .maybeSingle(),
  );

  return typeof row?.id === "string" ? row.id : null;
}

async function createReportExportRecord(
  supabase: AnySupabase,
  input: {
    actorUserId: string;
    eventId?: string | null;
    filename: string;
    filters: AuditLogFilters;
    isAuditExport: boolean;
    projectId?: string | null;
    reportDefinitionId: string | null;
    reportKey: ReportKey;
    rowCount: number;
    scope: ReportScope;
  },
) {
  const { data, error } = await supabase.rpc("create_report_export", {
    p_audit_redacted_fields: ["old_value", "new_value"],
    p_event_id: input.eventId ?? null,
    p_filename: input.filename,
    p_filters: input.filters,
    p_format: "csv",
    p_is_audit_export: input.isAuditExport,
    p_metadata: {
      fileRegistration: "metadata_only",
      storage: "not_persisted_sprint_11",
    },
    p_mime_type: "text/csv",
    p_project_id: input.projectId ?? null,
    p_report_definition_id: input.reportDefinitionId,
    p_report_key: input.reportKey,
    p_requested_by: input.actorUserId,
    p_row_count: input.rowCount,
    p_scope: input.scope,
    p_status: "generated",
  });

  if (error) {
    throw error;
  }

  return data as BaseRow;
}

function assertExportScope(
  reportKey: ReportKey,
  requestedScope: ReportScope,
  projectId: string | null | undefined,
  eventId: string | null | undefined,
) {
  const definition = sprint11ReportDefinitions.find(
    (entry) => entry.key === reportKey,
  );

  if (!definition) {
    throw new ReportValidationError("Unsupported report definition.");
  }

  if (definition.scope !== requestedScope) {
    throw new ReportValidationError(
      "Report scope does not match the report definition.",
    );
  }

  if (requestedScope === "project" && !projectId) {
    throw new ReportValidationError(
      "projectId is required for project reports.",
    );
  }

  if (requestedScope === "event" && !eventId) {
    throw new ReportValidationError("eventId is required for event reports.");
  }
}

function assertReportCatalogPermission(
  reportKey: ReportKey,
  permissions: ReadonlySet<PermissionSlug>,
) {
  const catalog = getReportCatalogForPermissions(permissions);

  if (!catalog.some((entry) => entry.key === reportKey)) {
    throw new ReportValidationError("Report access denied.");
  }
}

function filenameFor(reportKey: ReportKey) {
  return `${reportKey}-${new Date().toISOString().replace(/[:.]/g, "-")}.csv`;
}

async function projectGuestSummaryRows(
  supabase: AnySupabase,
  projectId: string,
) {
  const [guests, assignments] = await Promise.all([
    listRows<BaseRow>(
      table(supabase, "guests")
        .select(
          "id, display_name, guest_side, is_printed_only, preferred_language, is_active, whatsapp_number",
        )
        .eq("project_id", projectId)
        .order("display_name", { ascending: true }),
    ),
    listRows<BaseRow>(
      table(supabase, "guest_event_assignments")
        .select("guest_id, event_id, status")
        .eq("project_id", projectId),
    ),
  ]);
  const assignmentsByGuest = assignments.reduce<Record<string, number>>(
    (counts, assignment) => {
      const guestId = String(assignment.guest_id);
      counts[guestId] = (counts[guestId] ?? 0) + 1;
      return counts;
    },
    {},
  );

  return guests.map((guest) => ({
    active: guest.is_active === true ? "yes" : "no",
    assignedEvents: assignmentsByGuest[String(guest.id)] ?? 0,
    displayName: String(guest.display_name),
    guestSide: String(guest.guest_side),
    hasWhatsapp: typeof guest.whatsapp_number === "string" ? "yes" : "no",
    preferredLanguage:
      typeof guest.preferred_language === "string"
        ? guest.preferred_language
        : "",
    printedOnly: guest.is_printed_only === true ? "yes" : "no",
  }));
}

async function rsvpSummaryRows(supabase: AnySupabase, projectId: string) {
  const rows = await listRows<BaseRow>(
    table(supabase, "rsvp_records")
      .select("event_id, status, manual_review_required")
      .eq("project_id", projectId),
  );
  const events = await listRows<BaseRow>(
    table(supabase, "events")
      .select("id, name, event_date")
      .eq("project_id", projectId),
  );

  return events.map((event) => {
    const eventRows = rows.filter((row) => row.event_id === event.id);
    const counts = statusCounts(eventRows);

    return {
      eventDate: typeof event.event_date === "string" ? event.event_date : "",
      eventName: String(event.name),
      maybe: counts.maybe ?? 0,
      no: counts.no ?? 0,
      pending: counts.pending ?? 0,
      reviewRequired: eventRows.filter(
        (row) => row.manual_review_required === true,
      ).length,
      yes: counts.yes ?? 0,
    };
  });
}

async function seatingSummaryRows(supabase: AnySupabase, eventId: string) {
  const [tables, assignments] = await Promise.all([
    listRows<BaseRow>(
      table(supabase, "event_tables")
        .select("id, table_code, table_name, capacity, status")
        .eq("event_id", eventId),
    ),
    listRows<BaseRow>(
      table(supabase, "guest_table_assignments")
        .select("table_id, status")
        .eq("event_id", eventId),
    ),
  ]);

  return tables.map((tableRow) => {
    const tableAssignments = assignments.filter(
      (assignment) =>
        assignment.table_id === tableRow.id && assignment.status === "active",
    );
    const capacity =
      typeof tableRow.capacity === "number" ? tableRow.capacity : 0;

    return {
      assignedGuests: tableAssignments.length,
      capacity,
      remainingCapacity: Math.max(capacity - tableAssignments.length, 0),
      status: String(tableRow.status),
      tableCode: String(tableRow.table_code),
      tableName: String(tableRow.table_name),
    };
  });
}

async function checkInSummaryRows(supabase: AnySupabase, eventId: string) {
  const [assignments, checkIns, unexpected] = await Promise.all([
    listRows<BaseRow>(
      table(supabase, "guest_event_assignments")
        .select("id, invited, status")
        .eq("event_id", eventId),
    ),
    listRows<BaseRow>(
      table(supabase, "check_in_records")
        .select("arrival_count, is_duplicate_scan, sync_status")
        .eq("event_id", eventId),
    ),
    listRows<BaseRow>(
      table(supabase, "unexpected_guest_requests")
        .select("status")
        .eq("event_id", eventId),
    ),
  ]);
  const unexpectedCounts = statusCounts(unexpected);
  const expected = assignments.filter(
    (assignment) => assignment.invited === true,
  ).length;
  const arrived = sumRows(checkIns, "arrival_count");

  return [
    {
      arrived,
      duplicateScans: checkIns.filter(
        (record) => record.is_duplicate_scan === true,
      ).length,
      expected,
      remaining: Math.max(expected - arrived, 0),
      unexpectedApproved: unexpectedCounts.approved ?? 0,
      unexpectedPending: unexpectedCounts.pending ?? 0,
      unexpectedRejected: unexpectedCounts.rejected ?? 0,
    },
  ];
}

async function paymentContractSummaryRows(
  supabase: AnySupabase,
  projectId: string,
) {
  const [contracts, payments, exceptions] = await Promise.all([
    listRows<BaseRow>(
      table(supabase, "contracts")
        .select(
          "contract_number, version, status, final_amount_cents, is_latest",
        )
        .eq("project_id", projectId),
    ),
    listRows<BaseRow>(
      table(supabase, "payments")
        .select("status, paid_amount_cents")
        .eq("project_id", projectId),
    ),
    listRows<BaseRow>(
      table(supabase, "payment_exceptions")
        .select("status")
        .eq("project_id", projectId),
    ),
  ]);
  const paymentCounts = statusCounts(payments);
  const exceptionCounts = statusCounts(exceptions);

  return contracts.map((contract) => ({
    activeExceptions: exceptionCounts.active ?? 0,
    confirmedPaymentCount: paymentCounts.confirmed ?? 0,
    confirmedPaymentTotalCents: sumRows(
      payments.filter((payment) => payment.status === "confirmed"),
      "paid_amount_cents",
    ),
    contractNumber: String(contract.contract_number),
    finalAmountCents:
      typeof contract.final_amount_cents === "number"
        ? contract.final_amount_cents
        : 0,
    isLatest: contract.is_latest === true ? "yes" : "no",
    status: String(contract.status),
    version: typeof contract.version === "number" ? contract.version : 0,
  }));
}

async function rowsForReport(
  supabase: AnySupabase,
  reportKey: ReportKey,
  projectId: string | null | undefined,
  eventId: string | null | undefined,
  filters: AuditLogFilters,
) {
  switch (reportKey) {
    case "audit_log_export":
      return filterAuditLogRows(
        await listAuditLogs(supabase, filters, 1000),
        filters,
      ).map(sanitizeAuditLogRowForExport);
    case "check_in_summary":
      return checkInSummaryRows(supabase, eventId ?? "");
    case "payment_contract_summary":
      return paymentContractSummaryRows(supabase, projectId ?? "");
    case "project_guest_summary":
      return projectGuestSummaryRows(supabase, projectId ?? "");
    case "rsvp_summary":
      return rsvpSummaryRows(supabase, projectId ?? "");
    case "seating_summary":
      return seatingSummaryRows(supabase, eventId ?? "");
  }
}

function columnsForReport(
  reportKey: ReportKey,
  rows: BaseRow[],
): CsvColumn<BaseRow>[] {
  if (reportKey === "audit_log_export") {
    return auditLogCsvColumns as CsvColumn<BaseRow>[];
  }

  const sample = rows[0];

  if (!sample) {
    return [{ key: "empty", label: "Empty" }];
  }

  return Object.keys(sample).map((key) => ({
    key,
    label: key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (value) => value.toUpperCase()),
  })) satisfies CsvColumn<BaseRow>[];
}

export async function generateReportCsv(
  supabase: AnySupabase,
  input: ReportExportInput,
): Promise<ReportExportResult> {
  const reportKey = parseReportKey(input.reportKey);
  const scope = parseReportScope(input.scope);
  const filters = normalizeAuditLogFilters(input.filters);

  assertExportScope(reportKey, scope, input.projectId, input.eventId);
  assertReportCatalogPermission(reportKey, input.permissions);

  const rows = (await rowsForReport(
    supabase,
    reportKey,
    input.projectId,
    input.eventId,
    filters,
  )) as BaseRow[];
  const csv =
    rows.length > 0
      ? buildCsv(rows, columnsForReport(reportKey, rows))
      : buildCsv([{ empty: "No rows" }], [{ key: "empty", label: "Empty" }]);
  const filename = filenameFor(reportKey);
  const reportDefinitionId = await getReportDefinitionId(supabase, reportKey);
  const data = await createReportExportRecord(supabase, {
    actorUserId: input.actorUserId,
    eventId: input.eventId,
    filename,
    filters,
    isAuditExport: reportKey === "audit_log_export",
    projectId: input.projectId,
    reportDefinitionId,
    reportKey,
    rowCount: rows.length,
    scope,
  });

  return {
    csv,
    exportRecord: data as BaseRow,
    filename,
    rowCount: rows.length,
  };
}
