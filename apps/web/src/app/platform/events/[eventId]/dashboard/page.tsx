import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import { ProjectAccessError } from "@/lib/projects/project-api";
import { requireEventDashboardPermission } from "@/lib/reports/report-api";
import { getEventDashboardOverview } from "@/lib/reports/report-db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

function SummaryGrid({ values }: { values: Record<string, number> }) {
  return (
    <div className="detail-grid">
      {Object.entries(values).map(([key, value]) => (
        <div key={key}>
          <span>{key.replace(/([A-Z])/g, " $1")}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}

export default async function EventDashboardPage({ params }: PageProps) {
  const authContext = await getAuthContext();
  const { eventId } = await params;

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath(`/platform/events/${eventId}/dashboard`));
  }

  if (authContext.status === "not_configured") {
    return (
      <>
        <h1 className="page-title">Event dashboard</h1>
        <section className="section">
          <div className="alert">
            Supabase environment variables are not configured. Event dashboard
            metrics will load after local credentials are supplied.
          </div>
        </section>
      </>
    );
  }

  const supabase = await createSupabaseServerClient();
  const context = { supabase, user: authContext.user };

  try {
    await requireEventDashboardPermission(context, eventId);
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      notFound();
    }

    throw error;
  }

  const overview = await getEventDashboardOverview(supabase, eventId);

  if (!overview) {
    notFound();
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{overview.event.event_code}</p>
          <h1 className="page-title">Event dashboard</h1>
          <p className="page-summary">
            Operational event summary for RSVP, seating, invitations, and
            check-in.
          </p>
        </div>
        <Link className="button secondary" href={`/platform/events/${eventId}`}>
          Event
        </Link>
        <Link
          className="button secondary"
          href={`/platform/reports?eventId=${eventId}`}
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
          <h2>Event summaries</h2>
          <span className="meta-list">Sprint 11 widgets</span>
        </div>
        <SummaryGrid values={overview.summaries.rsvps} />
        <SummaryGrid values={overview.summaries.invitations} />
        <SummaryGrid values={overview.summaries.seating} />
        <SummaryGrid values={overview.summaries.checkIn} />
      </section>
    </>
  );
}
