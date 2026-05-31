import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import { ProjectAccessError } from "@/lib/projects/project-api";
import {
  requireAuditExportPermission,
  requireAuditLogReadPermission,
} from "@/lib/reports/report-api";
import { exportAuditLogsAction } from "@/app/platform/audit-logs/actions";
import { listAuditLogs } from "@/lib/reports/report-db";
import { normalizeAuditLogFilters } from "@/lib/reports/report-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type AuditLogsPageProps = {
  searchParams: Promise<{
    action?: string;
    actorUserId?: string;
    auditError?: string;
    auditStatus?: string;
    from?: string;
    objectType?: string;
    search?: string;
    to?: string;
  }>;
};

export default async function AuditLogsPage({
  searchParams,
}: AuditLogsPageProps) {
  const authContext = await getAuthContext();
  const params = await searchParams;

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath("/platform/audit-logs"));
  }

  if (authContext.status === "not_configured") {
    return (
      <>
        <h1 className="page-title">Audit logs</h1>
        <section className="section">
          <div className="alert">
            Supabase environment variables are not configured. Audit logs will
            load after local credentials are supplied.
          </div>
        </section>
      </>
    );
  }

  const supabase = await createSupabaseServerClient();
  const context = { supabase, user: authContext.user };
  let canExport = false;

  try {
    await requireAuditLogReadPermission(context);
    await requireAuditExportPermission(context)
      .then(() => {
        canExport = true;
      })
      .catch(() => {
        canExport = false;
      });
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      notFound();
    }

    throw error;
  }

  const filters = normalizeAuditLogFilters(params);
  const logs = await listAuditLogs(supabase, filters, 100);

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Internal only</p>
          <h1 className="page-title">Audit logs</h1>
          <p className="page-summary">
            Filtered audit-log viewer with redacted export foundation for
            authorized internal roles.
          </p>
        </div>
        <Link className="button secondary" href="/platform/dashboard">
          Global dashboard
        </Link>
      </div>

      {params.auditStatus === "exported" ? (
        <section className="section">
          <div className="alert success">
            Audit-log export metadata was created with old/new values redacted.
          </div>
        </section>
      ) : null}

      {params.auditError ? (
        <section className="section">
          <div className="alert">
            Audit-log action failed: {params.auditError}
          </div>
        </section>
      ) : null}

      <section className="section">
        <h2>Filters</h2>
        <form className="form-grid" method="get">
          <label>
            Action
            <input
              name="action"
              type="text"
              defaultValue={params.action ?? ""}
            />
          </label>
          <label>
            Object type
            <input
              name="objectType"
              type="text"
              defaultValue={params.objectType ?? ""}
            />
          </label>
          <label>
            Actor user ID
            <input
              name="actorUserId"
              type="text"
              defaultValue={params.actorUserId ?? ""}
            />
          </label>
          <label>
            Search
            <input
              name="search"
              type="text"
              defaultValue={params.search ?? ""}
            />
          </label>
          <button className="button" type="submit">
            Apply filters
          </button>
        </form>
      </section>

      {canExport ? (
        <section className="section">
          <div className="section-heading">
            <h2>Export</h2>
            <span className="meta-list">old_value and new_value excluded</span>
          </div>
          <form action={exportAuditLogsAction}>
            <input name="action" type="hidden" value={params.action ?? ""} />
            <input
              name="objectType"
              type="hidden"
              value={params.objectType ?? ""}
            />
            <input
              name="actorUserId"
              type="hidden"
              value={params.actorUserId ?? ""}
            />
            <input name="search" type="hidden" value={params.search ?? ""} />
            <button className="button secondary" type="submit">
              Export filtered CSV
            </button>
          </form>
        </section>
      ) : null}

      <section className="section">
        <div className="section-heading">
          <h2>Logs</h2>
          <span className="meta-list">{logs.length} records</span>
        </div>
        {logs.length === 0 ? (
          <div className="empty-state">No audit records match the filters.</div>
        ) : (
          <div className="record-list">
            {logs.map((log) => (
              <div className="record-row" key={log.id}>
                <span>
                  <strong>{log.action}</strong>
                  <small>
                    {log.objectType} -{" "}
                    {new Date(log.createdAt).toLocaleString()}
                  </small>
                </span>
                <span className="tag">{log.source}</span>
                <span className="meta-list">{log.actorUserId ?? "system"}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
