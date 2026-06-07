import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import { redirectToMfaIfStepUpRequired } from "@/lib/auth/mfa-route-guard";
import { getReportingPermissionSet } from "@/lib/reports/report-api";
import { exportReportAction } from "@/app/platform/reports/actions";
import { listReportExports } from "@/lib/reports/report-db";
import { getReportCatalogForPermissions } from "@/lib/reports/report-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ReportsPageProps = {
  searchParams: Promise<{
    eventId?: string;
    projectId?: string;
    reportError?: string;
    reportStatus?: string;
  }>;
};

function canRunReport(
  scope: string,
  projectId: string | undefined,
  eventId: string | undefined,
) {
  if (scope === "global") {
    return true;
  }

  if (scope === "project") {
    return Boolean(projectId);
  }

  return Boolean(eventId);
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const authContext = await getAuthContext();
  const params = await searchParams;
  const projectId = params.projectId;
  const eventId = params.eventId;
  const reportReturnPathParams = new URLSearchParams();

  if (projectId) {
    reportReturnPathParams.set("projectId", projectId);
  }

  if (eventId) {
    reportReturnPathParams.set("eventId", eventId);
  }

  const reportReturnPathQuery = reportReturnPathParams.toString();
  const reportReturnPath = reportReturnPathQuery
    ? `/platform/reports?${reportReturnPathQuery}`
    : "/platform/reports";

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath(reportReturnPath));
  }

  if (authContext.status === "not_configured") {
    return (
      <>
        <h1 className="page-title">Reports</h1>
        <section className="section">
          <div className="alert">
            Supabase environment variables are not configured. Reports will load
            after local credentials are supplied.
          </div>
        </section>
      </>
    );
  }

  const supabase = await createSupabaseServerClient();
  const context = { supabase, user: authContext.user };
  const permissions = await getReportingPermissionSet(context, {
    eventId,
    projectId,
  });
  const reportCatalogCapabilities = [
    {
      permission: "reports.catalog.read",
      scope: "global",
    },
    ...(projectId
      ? [
          {
            permission: "reports.catalog.read" as const,
            scope: "project" as const,
            scopeId: projectId,
          },
        ]
      : []),
    ...(eventId
      ? [
          {
            permission: "reports.catalog.read" as const,
            scope: "event" as const,
            scopeId: eventId,
          },
        ]
      : []),
  ] as const;

  if (!permissions.has("reports.catalog.read")) {
    await redirectToMfaIfStepUpRequired(
      context,
      reportReturnPath,
      reportCatalogCapabilities,
    );
    notFound();
  }

  const [catalog, exports] = await Promise.all([
    Promise.resolve(getReportCatalogForPermissions(permissions)),
    listReportExports(supabase, { eventId, projectId }),
  ]);

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Sprint 11 foundation</p>
          <h1 className="page-title">Reports</h1>
          <p className="page-summary">
            Role-filtered report catalog and CSV export metadata for project,
            event, commercial, and audit summaries.
          </p>
        </div>
        <Link className="button secondary" href="/platform/dashboard">
          Global dashboard
        </Link>
      </div>

      {params.reportStatus === "generated" ? (
        <section className="section">
          <div className="alert success">
            Report export metadata was created.
          </div>
        </section>
      ) : null}

      {params.reportError ? (
        <section className="section">
          <div className="alert">
            Report action failed: {params.reportError}
          </div>
        </section>
      ) : null}

      <section className="section">
        <div className="section-heading">
          <h2>Catalog</h2>
          <span className="meta-list">{catalog.length} available</span>
        </div>
        {catalog.length === 0 ? (
          <div className="empty-state">
            No report definitions are available for this role and scope.
          </div>
        ) : (
          <div className="record-list">
            {catalog.map((definition) => {
              const runnable = canRunReport(
                definition.scope,
                projectId,
                eventId,
              );

              return (
                <div className="record-row" key={definition.key}>
                  <span>
                    <strong>{definition.name}</strong>
                    <small>{definition.description}</small>
                  </span>
                  <span className="tag">{definition.scope}</span>
                  {runnable ? (
                    <form action={exportReportAction}>
                      <input
                        name="reportKey"
                        type="hidden"
                        value={definition.key}
                      />
                      <input
                        name="scope"
                        type="hidden"
                        value={definition.scope}
                      />
                      {projectId ? (
                        <input
                          name="projectId"
                          type="hidden"
                          value={projectId}
                        />
                      ) : null}
                      {eventId ? (
                        <input name="eventId" type="hidden" value={eventId} />
                      ) : null}
                      <button className="button secondary" type="submit">
                        Generate CSV
                      </button>
                    </form>
                  ) : (
                    <span className="meta-list">
                      Open from a matching project or event.
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Export history</h2>
          <span className="meta-list">{exports.length} records</span>
        </div>
        {exports.length === 0 ? (
          <div className="empty-state">No report exports recorded yet.</div>
        ) : (
          <div className="record-list">
            {exports.map((exportRow) => (
              <div className="record-row" key={String(exportRow.id)}>
                <span>
                  <strong>{String(exportRow.report_key)}</strong>
                  <small>{String(exportRow.filename ?? "metadata only")}</small>
                </span>
                <span className="tag">{String(exportRow.status)}</span>
                <span className="meta-list">
                  {String(exportRow.row_count ?? 0)} rows
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
