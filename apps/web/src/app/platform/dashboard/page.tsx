import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import { ProjectAccessError } from "@/lib/projects/project-api";
import {
  getReportingPermissionSet,
  requireGlobalDashboardPermission,
} from "@/lib/reports/report-api";
import { getGlobalDashboardOverview } from "@/lib/reports/report-db";
import { getDashboardVisibility } from "@/lib/reports/report-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function GlobalDashboardPage() {
  const authContext = await getAuthContext();

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath("/platform/dashboard"));
  }

  if (authContext.status === "not_configured") {
    return (
      <>
        <h1 className="page-title">Global dashboard</h1>
        <section className="section">
          <div className="alert">
            Supabase environment variables are not configured. Dashboard metrics
            will load after local credentials are supplied.
          </div>
        </section>
      </>
    );
  }

  const supabase = await createSupabaseServerClient();
  const context = { supabase, user: authContext.user };

  try {
    await requireGlobalDashboardPermission(context);
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      notFound();
    }

    throw error;
  }

  const permissions = await getReportingPermissionSet(context);
  const overview = await getGlobalDashboardOverview(
    supabase,
    getDashboardVisibility(permissions),
  );

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Sprint 11 foundation</p>
          <h1 className="page-title">Global dashboard</h1>
          <p className="page-summary">
            Internal operational summary across projects, events, imports,
            messages, payments, reports, and audit activity.
          </p>
        </div>
        <Link className="button secondary" href="/platform/reports">
          Reports
        </Link>
        <Link className="button secondary" href="/platform/audit-logs">
          Audit logs
        </Link>
      </div>

      <section className="section">
        <div className="status-grid">
          {overview.metrics.map((metric) => (
            <div key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Recent projects</h2>
          <span className="meta-list">{overview.recentProjects.length}</span>
        </div>
        {overview.recentProjects.length === 0 ? (
          <div className="empty-state">No project records available yet.</div>
        ) : (
          <div className="record-list">
            {overview.recentProjects.map((project) => (
              <Link
                className="record-row"
                href={`/platform/projects/${project.id}/dashboard`}
                key={project.id}
              >
                <span>
                  <strong>
                    {project.bride_name} & {project.groom_name}
                  </strong>
                  <small>{project.project_code}</small>
                </span>
                <span className="tag">{project.status}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {overview.recentAuditLogs.length > 0 ? (
        <section className="section">
          <div className="section-heading">
            <h2>Recent audit activity</h2>
            <Link className="button secondary" href="/platform/audit-logs">
              Open audit logs
            </Link>
          </div>
          <div className="record-list">
            {overview.recentAuditLogs.map((log) => (
              <div className="record-row" key={log.id}>
                <span>
                  <strong>{log.action}</strong>
                  <small>
                    {log.objectType} -{" "}
                    {new Date(log.createdAt).toLocaleString()}
                  </small>
                </span>
                <span className="tag">{log.source}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
