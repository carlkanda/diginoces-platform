import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import { ProjectAccessError } from "@/lib/projects/project-api";
import {
  getEventDashboardAccessMap,
  getReportingPermissionSet,
  requireProjectDashboardPermission,
} from "@/lib/reports/report-api";
import { getProjectDashboardOverview } from "@/lib/reports/report-db";
import { getDashboardVisibility } from "@/lib/reports/report-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

function StatusList({
  values,
}: {
  values: Record<string, number | string | null>;
}) {
  const entries = Object.entries(values);

  if (entries.length === 0) {
    return <div className="empty-state">No records yet.</div>;
  }

  return (
    <div className="detail-grid">
      {entries.map(([key, value]) => (
        <div key={key}>
          <span>{key.replace(/([A-Z])/g, " $1")}</span>
          <strong>{value ?? "none"}</strong>
        </div>
      ))}
    </div>
  );
}

export default async function ProjectDashboardPage({ params }: PageProps) {
  const authContext = await getAuthContext();
  const { projectId } = await params;

  if (authContext.status === "anonymous") {
    redirect(
      buildLoginRedirectPath(`/platform/projects/${projectId}/dashboard`),
    );
  }

  if (authContext.status === "not_configured") {
    return (
      <>
        <h1 className="page-title">Project dashboard</h1>
        <section className="section">
          <div className="alert">
            Supabase environment variables are not configured. Project dashboard
            metrics will load after local credentials are supplied.
          </div>
        </section>
      </>
    );
  }

  const supabase = await createSupabaseServerClient();
  const context = { supabase, user: authContext.user };

  try {
    await requireProjectDashboardPermission(context, projectId);
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      notFound();
    }

    throw error;
  }

  const permissions = await getReportingPermissionSet(context, { projectId });
  const visibility = getDashboardVisibility(permissions);
  const overview = await getProjectDashboardOverview(
    supabase,
    projectId,
    visibility,
  );

  if (!overview) {
    notFound();
  }

  const eventDashboardAccess = await getEventDashboardAccessMap(
    context,
    projectId,
    overview.events.map((event) => event.id),
  );

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{overview.project.project_code}</p>
          <h1 className="page-title">Project dashboard</h1>
          <p className="page-summary">
            {overview.project.bride_name} & {overview.project.groom_name} -
            role-aware operational metrics for the project.
          </p>
        </div>
        <Link
          className="button secondary"
          href={`/platform/projects/${projectId}`}
        >
          Project
        </Link>
        {visibility.canReadCoupleDashboard ? (
          <Link
            className="button secondary"
            href={`/platform/projects/${projectId}/couple-dashboard`}
          >
            Couple view
          </Link>
        ) : null}
        <Link
          className="button secondary"
          href={`/platform/reports?projectId=${projectId}`}
        >
          Reports
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
          <h2>Operational summaries</h2>
          <span className="meta-list">Sprint 11 widgets</span>
        </div>
        <StatusList values={overview.summaries.guests} />
        <StatusList values={overview.summaries.rsvps} />
        <StatusList values={overview.summaries.invitations} />
        <StatusList values={overview.summaries.guestImports} />
        <StatusList values={overview.summaries.communications} />
        <StatusList values={overview.summaries.seating} />
        <StatusList values={overview.summaries.checkIn} />
        <StatusList values={overview.summaries.commercial} />
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Events</h2>
          <span className="meta-list">{overview.events.length} records</span>
        </div>
        {overview.events.length === 0 ? (
          <div className="empty-state">No event records available yet.</div>
        ) : (
          <div className="record-list">
            {overview.events.map((event) => (
              <div className="record-row" key={event.id}>
                <span>
                  <strong>{event.name}</strong>
                  <small>{event.event_code}</small>
                </span>
                <span className="tag">{event.status}</span>
                {eventDashboardAccess.get(event.id) ? (
                  <Link
                    className="button secondary"
                    href={`/platform/events/${event.id}/dashboard`}
                  >
                    Dashboard
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
