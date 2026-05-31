import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  buildCsv,
  filterAuditLogRows,
  getDashboardVisibility,
  getReportCatalogForPermissions,
  normalizeAuditLogFilters,
  ReportValidationError,
  sanitizeAuditLogRowForExport,
  sprint11ReportDefinitions,
} from "@/lib/reports/report-service";
import {
  roleDefinitions,
  type PermissionSlug,
} from "@/lib/security/permissions";

const migrationDirectory = join(
  process.cwd(),
  "..",
  "..",
  "supabase",
  "migrations",
);

function readSprint11Migration() {
  const migrationFile = readdirSync(migrationDirectory).find((entry) =>
    entry.endsWith("_sprint_11_dashboards_reports_audit_logs.sql"),
  );

  expect(migrationFile).toBeDefined();

  return readFileSync(join(migrationDirectory, migrationFile ?? ""), "utf8");
}

function permissions(...values: PermissionSlug[]) {
  return new Set(values);
}

describe("Sprint 11 reporting and dashboard foundation", () => {
  it("grants dashboard and report permissions without exposing audit or revenue to couples and partners", () => {
    expect(roleDefinitions.diginoces_admin.grants).toEqual(
      expect.arrayContaining([
        "dashboards.global.read",
        "reports.export",
        "reports.internal.read",
        "audit.export",
      ]),
    );
    expect(roleDefinitions.operations_manager.grants).toEqual(
      expect.arrayContaining([
        "dashboards.global.read",
        "dashboards.project.read",
        "reports.export",
      ]),
    );
    expect(roleDefinitions.bride.grants).toEqual(
      expect.arrayContaining([
        "dashboards.couple.read",
        "dashboards.project.read",
        "reports.export",
      ]),
    );
    expect(roleDefinitions.bride.grants).not.toContain("audit.read");
    expect(roleDefinitions.bride.grants).not.toContain("audit.export");
    expect(roleDefinitions.bride.grants).not.toContain("revenue.read");
    expect(roleDefinitions.partner_admin.grants).toContain(
      "dashboards.partner.read",
    );
    expect(roleDefinitions.partner_admin.grants).not.toContain("audit.read");
    expect(roleDefinitions.partner_admin.grants).not.toContain("revenue.read");
  });

  it("derives role-aware dashboard visibility", () => {
    expect(
      getDashboardVisibility(
        permissions(
          "dashboards.global.read",
          "dashboards.project.read",
          "dashboards.event.read",
          "dashboards.couple.read",
          "dashboards.partner.read",
          "audit.read",
          "revenue.read",
        ),
      ),
    ).toMatchObject({
      canReadAuditLogs: true,
      canReadEventDashboard: true,
      canReadGlobalDashboard: true,
      canReadInternalRevenue: true,
      canReadPartnerDashboard: true,
    });

    expect(
      getDashboardVisibility(
        permissions(
          "dashboards.project.read",
          "dashboards.couple.read",
          "reports.export",
        ),
      ),
    ).toMatchObject({
      canReadAuditLogs: false,
      canReadCoupleDashboard: true,
      canReadGlobalDashboard: false,
      canReadInternalRevenue: false,
      canReadPartnerDashboard: false,
    });

    expect(getDashboardVisibility(new Set())).toMatchObject({
      canReadCoupleDashboard: false,
      canReadGlobalDashboard: false,
      canReadReports: false,
    });
  });

  it("filters report catalog entries by permissions and keeps internal reports hidden from couples", () => {
    const adminCatalog = getReportCatalogForPermissions(
      permissions(
        "reports.catalog.read",
        "reports.export",
        "reports.internal.read",
        "revenue.read",
        "audit.read",
        "audit.export",
      ),
    );
    expect(adminCatalog.map((entry) => entry.key)).toEqual(
      expect.arrayContaining([
        "project_guest_summary",
        "payment_contract_summary",
        "audit_log_export",
      ]),
    );

    const coupleCatalog = getReportCatalogForPermissions(
      permissions("reports.catalog.read", "reports.export"),
    );
    expect(coupleCatalog.map((entry) => entry.key)).toEqual(
      expect.arrayContaining(["project_guest_summary", "rsvp_summary"]),
    );
    expect(coupleCatalog.map((entry) => entry.key)).not.toContain(
      "payment_contract_summary",
    );
    expect(coupleCatalog.map((entry) => entry.key)).not.toContain(
      "audit_log_export",
    );
  });

  it("builds escaped CSV output with stable headers and formula neutralization", () => {
    const csv = buildCsv(
      [
        {
          displayName: "Ada Lovelace",
          notes: "Line one\nLine two",
          side: "bride",
        },
        {
          displayName: 'Grace "Amazing" Hopper',
          notes: null,
          side: "groom",
        },
        {
          displayName: "=SUM(1,1)",
          notes: "@hidden",
          side: "-formula",
        },
        {
          displayName: "\n=CMD",
          notes: "",
          side: "both",
        },
        {
          displayName: "Negative number",
          notes: null,
          side: -100,
        },
      ],
      [
        { key: "displayName", label: "Display name" },
        { key: "side", label: "Side" },
        { key: "notes", label: "Notes" },
      ],
    );

    expect(csv).toBe(
      'Display name,Side,Notes\r\nAda Lovelace,bride,"Line one\nLine two"\r\n"Grace ""Amazing"" Hopper",groom,\r\n"\'=SUM(1,1)",\'-formula,\'@hidden\r\n"\'\n=CMD",both,\r\nNegative number,-100,',
    );
  });

  it("rejects invalid audit-log date filters instead of widening exports", () => {
    expect(() =>
      normalizeAuditLogFilters({
        from: "not-a-date",
      }),
    ).toThrow(ReportValidationError);

    expect(() =>
      normalizeAuditLogFilters({
        from: "2026-02-31",
      }),
    ).toThrow(ReportValidationError);

    expect(() =>
      normalizeAuditLogFilters({
        from: "2027-02-29",
      }),
    ).toThrow(ReportValidationError);

    expect(() =>
      normalizeAuditLogFilters({
        from: "2026-05-01T00:00:00.000Z",
        to: "not-a-date",
      }),
    ).toThrow(ReportValidationError);

    expect(() =>
      normalizeAuditLogFilters({
        from: "2026-05-31T00:00:00.000Z",
        to: "2026-05-01T00:00:00.000Z",
      }),
    ).toThrow(ReportValidationError);

    expect(
      normalizeAuditLogFilters({
        from: "2026-05-01T00:00:00.000Z",
        to: "2026-05-31",
      }),
    ).toEqual({
      from: "2026-05-01T00:00:00.000Z",
      to: "2026-05-31T23:59:59.999Z",
    });

    expect(
      normalizeAuditLogFilters({
        from: "2026-05-01",
        to: "2026-05-31",
      }),
    ).toEqual({
      from: "2026-05-01T00:00:00.000Z",
      to: "2026-05-31T23:59:59.999Z",
    });
  });

  it("filters and sanitizes audit-log exports without old/new value payloads", () => {
    const logs = [
      {
        action: "payments.recorded",
        actorUserId: "finance-user",
        createdAt: "2026-05-01T10:00:00.000Z",
        id: "audit-1",
        newValue: { amount: 1000 },
        objectId: "payment-1",
        objectType: "payments",
        oldValue: null,
        reason: "manual payment",
        source: "api",
      },
      {
        action: "guests.updated",
        actorUserId: "staff-user",
        createdAt: "2026-05-02T10:00:00.000Z",
        id: "audit-2",
        newValue: { internal_notes: "hidden" },
        objectId: "guest-1",
        objectType: "guests",
        oldValue: { internal_notes: "old" },
        reason: "name correction",
        source: "api",
      },
    ];

    expect(
      filterAuditLogRows(logs, {
        action: "payments.recorded",
        from: "2026-05-01T00:00:00.000Z",
        objectType: "payments",
        to: "2026-05-01T23:59:59.000Z",
      }),
    ).toHaveLength(1);

    expect(sanitizeAuditLogRowForExport(logs[1])).toEqual({
      action: "guests.updated",
      actorUserId: "staff-user",
      createdAt: "2026-05-02T10:00:00.000Z",
      id: "audit-2",
      objectId: "guest-1",
      objectType: "guests",
      reason: "name correction",
      source: "api",
    });
  });

  it("documents Sprint 11 report definitions and database foundations", () => {
    expect(sprint11ReportDefinitions.map((entry) => entry.key)).toEqual([
      "project_guest_summary",
      "rsvp_summary",
      "seating_summary",
      "check_in_summary",
      "payment_contract_summary",
      "audit_log_export",
    ]);

    const migration = readSprint11Migration();

    expect(migration).toContain(
      "create table if not exists public.report_definitions",
    );
    expect(migration).toContain(
      "create table if not exists public.report_exports",
    );
    expect(migration).toContain(
      "create table if not exists public.audit_log_exports",
    );
    expect(migration).toContain(
      "create or replace function app_private.user_can_use_report_definition",
    );
    expect(migration).toContain(
      "create or replace function public.create_report_export",
    );
    expect(migration).toContain(
      "create or replace function public.current_user_can_access_events",
    );
    expect(migration).toContain(
      "constraint report_definitions_internal_permissions",
    );
    expect(migration).toContain("using (internal_only = false)");
    const scopeConstraint = migration.match(
      /constraint report_exports_scope_requires_ids check \(([\s\S]*?)\n  \),/,
    );
    expect(scopeConstraint?.[1]).toContain(
      "or (scope = 'event' and project_id is not null and event_id is not null)",
    );
    expect(migration).toContain("dashboards.global.read");
    expect(migration).toContain("reports.exported");
    expect(migration).toContain("audit_logs.read_internal");
    expect(migration).not.toContain("guest_wishes");
    expect(migration).not.toContain("partner_commissions");
  });

  it("adds Sprint 11 API and server-rendered route foundations", () => {
    const routeFiles = [
      "apps/web/src/app/api/dashboard/route.ts",
      "apps/web/src/app/api/projects/[projectId]/dashboard/route.ts",
      "apps/web/src/app/api/events/[eventId]/dashboard/route.ts",
      "apps/web/src/app/api/reports/route.ts",
      "apps/web/src/app/api/audit-logs/route.ts",
      "apps/web/src/app/platform/dashboard/page.tsx",
      "apps/web/src/app/platform/projects/[projectId]/dashboard/page.tsx",
      "apps/web/src/app/platform/projects/[projectId]/couple-dashboard/page.tsx",
      "apps/web/src/app/platform/events/[eventId]/dashboard/page.tsx",
      "apps/web/src/app/platform/partner-dashboard/page.tsx",
      "apps/web/src/app/platform/reports/page.tsx",
      "apps/web/src/app/platform/audit-logs/page.tsx",
    ];

    for (const routeFile of routeFiles) {
      expect(existsSync(join(process.cwd(), "..", "..", routeFile))).toBe(true);
    }
  });
});
