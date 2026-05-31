import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import { ProjectAccessError } from "@/lib/projects/project-api";
import {
  getReportingPermissionSet,
  requireCoupleDashboardPermission,
} from "@/lib/reports/report-api";
import { getCoupleDashboardOverview } from "@/lib/reports/report-db";
import { getDashboardVisibility } from "@/lib/reports/report-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function CoupleDashboardPage({ params }: PageProps) {
  const authContext = await getAuthContext();
  const { projectId } = await params;

  if (authContext.status === "anonymous") {
    redirect(
      buildLoginRedirectPath(
        `/platform/projects/${projectId}/couple-dashboard`,
      ),
    );
  }

  if (authContext.status === "not_configured") {
    return (
      <>
        <h1 className="page-title">Couple dashboard</h1>
        <section className="section">
          <div className="alert">
            Supabase environment variables are not configured. Couple dashboard
            metrics will load after local credentials are supplied.
          </div>
        </section>
      </>
    );
  }

  const supabase = await createSupabaseServerClient();
  const context = { supabase, user: authContext.user };

  try {
    await requireCoupleDashboardPermission(context, projectId);
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      notFound();
    }

    throw error;
  }

  const permissions = await getReportingPermissionSet(context, { projectId });
  const overview = await getCoupleDashboardOverview(
    supabase,
    projectId,
    getDashboardVisibility(permissions),
  );

  if (!overview) {
    notFound();
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{overview.project.project_code}</p>
          <h1 className="page-title">Couple dashboard</h1>
          <p className="page-summary">
            Simplified project view for the couple, without internal finance,
            audit, partner, or operational staff-only data.
          </p>
        </div>
        <Link
          className="button secondary"
          href={`/platform/projects/${projectId}`}
        >
          Project
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
        <h2>Public-safe summaries</h2>
        <div className="detail-grid">
          {Object.entries(overview.summaries.guests).map(([key, value]) => (
            <div key={key}>
              <span>{key.replace(/([A-Z])/g, " $1")}</span>
              <strong>{value}</strong>
            </div>
          ))}
          {Object.entries(overview.summaries.rsvps).map(([key, value]) => (
            <div key={key}>
              <span>RSVP {key.replace(/([A-Z])/g, " $1")}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
