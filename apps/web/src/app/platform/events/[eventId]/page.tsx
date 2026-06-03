import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import {
  getEventLifecycleLabel,
  getEventTypeLabel,
} from "@/lib/projects/project-foundation";
import {
  hasEventPermission,
  hasProjectPermission,
  ProjectAccessError,
  requireEventPermission,
} from "@/lib/projects/project-api";
import { getEventDetails } from "@/lib/projects/project-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type EventDetailPageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Not scheduled";
  }

  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00Z`)
    : new Date(value);

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(date);
}

export default async function EventDetailPage({
  params,
}: EventDetailPageProps) {
  const authContext = await getAuthContext();
  const { eventId } = await params;

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath(`/platform/events/${eventId}`));
  }

  if (authContext.status === "not_configured") {
    return (
      <>
        <h1 className="page-title">Event detail</h1>
        <section className="section">
          <div className="alert">
            Supabase environment variables are not configured. Event details
            will load after local credentials are supplied.
          </div>
        </section>
      </>
    );
  }

  const supabase = await createSupabaseServerClient();

  try {
    await requireEventPermission(
      {
        supabase,
        user: authContext.user,
      },
      eventId,
      "events.read",
    );
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      notFound();
    }

    throw error;
  }

  const details = await getEventDetails(supabase, eventId);

  if (!details) {
    notFound();
  }

  const permissionContext = {
    supabase,
    user: authContext.user,
  };
  const [
    canReadInvitations,
    canReadSeating,
    canReadCheckIn,
    canReadEventDashboard,
    canReadFiles,
  ] = await Promise.all([
    hasProjectPermission(
      permissionContext,
      details.project.id,
      "invitation_templates.read",
    ),
    hasProjectPermission(permissionContext, details.project.id, "seating.read"),
    hasEventPermission(permissionContext, eventId, "check_in.read"),
    hasEventPermission(permissionContext, eventId, "dashboards.event.read"),
    hasEventPermission(permissionContext, eventId, "files.read"),
  ]);

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{details.event.event_code}</p>
          <h1 className="page-title">{details.event.name}</h1>
          <p className="page-summary">
            {getEventTypeLabel(details.event.event_type)} event for{" "}
            {details.project.bride_name} & {details.project.groom_name}
          </p>
        </div>
        <Link
          className="button secondary"
          href={`/platform/projects/${details.project.id}`}
        >
          Project
        </Link>
        {canReadEventDashboard ? (
          <Link
            className="button"
            href={`/platform/events/${eventId}/dashboard`}
          >
            Dashboard
          </Link>
        ) : null}
        {canReadInvitations ? (
          <Link
            className="button"
            href={`/platform/events/${eventId}/invitations`}
          >
            Invitations
          </Link>
        ) : null}
        {canReadSeating ? (
          <Link
            className="button secondary"
            href={`/platform/events/${eventId}/seating`}
          >
            Seating
          </Link>
        ) : null}
        {canReadCheckIn ? (
          <Link
            className="button secondary"
            href={`/platform/events/${eventId}/check-in`}
          >
            Check-in
          </Link>
        ) : null}
        {canReadFiles ? (
          <Link
            className="button secondary"
            href={`/platform/events/${eventId}/files`}
          >
            Files
          </Link>
        ) : null}
      </div>

      <section className="section">
        <h2>Event foundation</h2>
        <div className="detail-grid">
          <div>
            <span>Event code</span>
            <strong>{details.event.event_code}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>{getEventLifecycleLabel(details.event.status)}</strong>
          </div>
          <div>
            <span>Date</span>
            <strong>{formatDate(details.event.event_date)}</strong>
          </div>
          <div>
            <span>Venue</span>
            <strong>{details.event.venue_name ?? "Unassigned"}</strong>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Tables and seating</h2>
          <span className="meta-list">Sprint 8 foundation</span>
        </div>
        <p className="page-summary">
          Create event-specific tables, assign invited guests, monitor
          RSVP-aware capacity, and generate Canva table-card CSV exports.
        </p>
        {canReadSeating ? (
          <Link className="button" href={`/platform/events/${eventId}/seating`}>
            Open seating
          </Link>
        ) : null}
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Wedding-day check-in</h2>
          <span className="meta-list">Sprint 9 foundation</span>
        </div>
        <p className="page-summary">
          Open the staff-only check-in screen for QR scans, manual search,
          partial arrivals, unexpected guest requests, devices, offline sync,
          and arrival dashboard metrics.
        </p>
        {canReadCheckIn ? (
          <Link
            className="button"
            href={`/platform/events/${eventId}/check-in`}
          >
            Open check-in
          </Link>
        ) : null}
      </section>

      <section className="section">
        <h2>Workflow foundation</h2>
        <div className="task-list">
          {details.workflowTasks.map((task) => (
            <div className="task-row" key={task.id}>
              <span>
                <strong>{task.title}</strong>
                <small>{task.requirement_ids.join(", ")}</small>
              </span>
              <span className="tag">{task.status.replaceAll("_", " ")}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
