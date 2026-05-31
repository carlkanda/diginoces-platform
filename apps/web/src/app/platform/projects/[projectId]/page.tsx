import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import {
  getEventLifecycleLabel,
  getEventTypeLabel,
  getProjectLifecycleLabel,
} from "@/lib/projects/project-foundation";
import {
  hasProjectPermission,
  ProjectAccessError,
  requireProjectPermission,
} from "@/lib/projects/project-api";
import { hasAnyCommercialReadPermission } from "@/lib/contracts/contract-api";
import { getProjectDetails } from "@/lib/projects/project-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ProjectDetailPageProps = {
  params: Promise<{
    projectId: string;
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

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const authContext = await getAuthContext();
  const { projectId } = await params;

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath(`/platform/projects/${projectId}`));
  }

  if (authContext.status === "not_configured") {
    return (
      <>
        <h1 className="page-title">Project detail</h1>
        <section className="section">
          <div className="alert">
            Supabase environment variables are not configured. Project details
            will load after local credentials are supplied.
          </div>
        </section>
      </>
    );
  }

  const supabase = await createSupabaseServerClient();

  try {
    await requireProjectPermission(
      {
        supabase,
        user: authContext.user,
      },
      projectId,
      "projects.read",
    );
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      notFound();
    }

    throw error;
  }

  const details = await getProjectDetails(supabase, projectId);

  if (!details) {
    notFound();
  }

  const permissionContext = {
    supabase,
    user: authContext.user,
  };
  const [
    canReadGuests,
    canReadGuestImports,
    canReadRsvps,
    canReadMessages,
    canReadSeating,
    canReadCommercial,
    canReadProjectDashboard,
    canReadCoupleDashboard,
    canReadReports,
    canReadGuestBook,
    canReadPostEventFeedback,
  ] = await Promise.all([
    hasProjectPermission(permissionContext, projectId, "guests.read"),
    hasProjectPermission(permissionContext, projectId, "guest_imports.read"),
    hasProjectPermission(permissionContext, projectId, "rsvps.read"),
    hasProjectPermission(permissionContext, projectId, "messages.read"),
    hasProjectPermission(permissionContext, projectId, "seating.read"),
    hasAnyCommercialReadPermission(permissionContext, projectId),
    hasProjectPermission(
      permissionContext,
      projectId,
      "dashboards.project.read",
    ),
    hasProjectPermission(
      permissionContext,
      projectId,
      "dashboards.couple.read",
    ),
    hasProjectPermission(permissionContext, projectId, "reports.catalog.read"),
    hasProjectPermission(permissionContext, projectId, "guest_messages.read"),
    hasProjectPermission(
      permissionContext,
      projectId,
      "post_event_feedback.read",
    ),
  ]);
  const projectTasks = details.workflowTasks.filter(
    (task) => task.scope === "project",
  );

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{details.project.project_code}</p>
          <h1 className="page-title">
            {details.project.bride_name} & {details.project.groom_name}
          </h1>
          <p className="page-summary">
            Status: {getProjectLifecycleLabel(details.project.status)}
          </p>
        </div>
        <Link className="button secondary" href="/platform/projects">
          Projects
        </Link>
        {canReadProjectDashboard ? (
          <Link
            className="button"
            href={`/platform/projects/${projectId}/dashboard`}
          >
            Dashboard
          </Link>
        ) : null}
        {canReadCoupleDashboard ? (
          <Link
            className="button secondary"
            href={`/platform/projects/${projectId}/couple-dashboard`}
          >
            Couple view
          </Link>
        ) : null}
        {canReadReports ? (
          <Link
            className="button secondary"
            href={`/platform/reports?projectId=${projectId}`}
          >
            Reports
          </Link>
        ) : null}
        {canReadGuests ? (
          <Link
            className="button"
            href={`/platform/projects/${projectId}/guests`}
          >
            Guests
          </Link>
        ) : null}
        {canReadGuestImports ? (
          <Link
            className="button secondary"
            href={`/platform/projects/${projectId}/guest-imports`}
          >
            Guest imports
          </Link>
        ) : null}
        {canReadRsvps ? (
          <Link
            className="button secondary"
            href={`/platform/projects/${projectId}/rsvps`}
          >
            RSVP summary
          </Link>
        ) : null}
        {canReadMessages ? (
          <Link
            className="button secondary"
            href={`/platform/projects/${projectId}/communications`}
          >
            Communications
          </Link>
        ) : null}
        {canReadCommercial ? (
          <Link
            className="button secondary"
            href={`/platform/projects/${projectId}/commercial`}
          >
            Contracts & payments
          </Link>
        ) : null}
        {canReadGuestBook ? (
          <Link
            className="button secondary"
            href={`/platform/projects/${projectId}/guest-book`}
          >
            Guest book
          </Link>
        ) : null}
        {canReadPostEventFeedback ? (
          <Link
            className="button secondary"
            href={`/platform/projects/${projectId}/feedback`}
          >
            Feedback
          </Link>
        ) : null}
      </div>

      <section className="section">
        <h2>Project foundation</h2>
        <div className="detail-grid">
          <div>
            <span>Project code</span>
            <strong>{details.project.project_code}</strong>
          </div>
          <div>
            <span>Project year</span>
            <strong>{details.project.project_year}</strong>
          </div>
          <div>
            <span>Preferred language</span>
            <strong>
              {details.project.preferred_language ?? "Unassigned"}
            </strong>
          </div>
          <div>
            <span>Primary contact</span>
            <strong>
              {details.project.primary_contact_name ?? "Unassigned"}
            </strong>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Guest management</h2>
          <span className="meta-list">Sprint 3, 4, and 5 foundation</span>
        </div>
        <p className="page-summary">
          Manage the project master guest list, bride/groom side filters, tags,
          title types, event assignments, import history, and RSVP summary
          foundation without invitations, seating, or check-in workflows.
        </p>
        {canReadGuests ? (
          <Link
            className="button"
            href={`/platform/projects/${projectId}/guests`}
          >
            Open guest list
          </Link>
        ) : null}
        {canReadGuestImports ? (
          <Link
            className="button secondary"
            href={`/platform/projects/${projectId}/guest-imports`}
          >
            Open imports
          </Link>
        ) : null}
        {canReadRsvps ? (
          <Link
            className="button secondary"
            href={`/platform/projects/${projectId}/rsvps`}
          >
            RSVP summary
          </Link>
        ) : null}
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>WhatsApp communications</h2>
          <span className="meta-list">Sprint 7 foundation</span>
        </div>
        <p className="page-summary">
          Manage approved French/English templates, prepare guided manual
          WhatsApp messages, open the correct WhatsApp link, and record sent,
          failed, skipped, or resent statuses with audit coverage.
        </p>
        {canReadMessages ? (
          <Link
            className="button"
            href={`/platform/projects/${projectId}/communications`}
          >
            Open communications
          </Link>
        ) : null}
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Tables and seating</h2>
          <span className="meta-list">Sprint 8 foundation</span>
        </div>
        <p className="page-summary">
          Manage event-specific tables, capacity warnings, RSVP-aware
          assignments, VIP/protocol seating notes, and Canva table-card CSV
          exports from each event.
        </p>
        {canReadSeating && details.events.length > 0 ? (
          <div className="button-group">
            {details.events.map((event) => (
              <Link
                className="button secondary"
                href={`/platform/events/${event.id}/seating`}
                key={event.id}
              >
                {event.name} seating
              </Link>
            ))}
          </div>
        ) : details.events.length === 0 ? (
          <div className="empty-state">
            No events configured. Create an event to manage seating.
          </div>
        ) : (
          <div className="empty-state">
            You do not have access to seating for these events. Contact your
            admin.
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Commercial controls</h2>
          <span className="meta-list">Sprint 10 foundation</span>
        </div>
        <p className="page-summary">
          Configure service packages, select event packages, calculate pricing,
          generate the project contract, approve it in-app, record manual
          payments, and monitor guest-facing payment gates.
        </p>
        {canReadCommercial ? (
          <Link
            className="button"
            href={`/platform/projects/${projectId}/commercial`}
          >
            Open contracts and payments
          </Link>
        ) : null}
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Guest wishes and feedback</h2>
          <span className="meta-list">Sprint 12 foundation</span>
        </div>
        <p className="page-summary">
          Collect text guest wishes from public guest pages, moderate approved
          guest-book content, track Canva CSV export metadata, and collect
          private post-event feedback with testimonial permission.
        </p>
        {canReadGuestBook || canReadPostEventFeedback ? (
          <div className="button-group">
            {canReadGuestBook ? (
              <Link
                className="button"
                href={`/platform/projects/${projectId}/guest-book`}
              >
                Open guest book
              </Link>
            ) : null}
            {canReadPostEventFeedback ? (
              <Link
                className="button secondary"
                href={`/platform/projects/${projectId}/feedback`}
              >
                Open feedback
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="empty-state">
            Guest wishes and post-event feedback are not available for your
            current project access.
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Events</h2>
          <span className="meta-list">{details.events.length} records</span>
        </div>

        {details.events.length === 0 ? (
          <div className="empty-state">No events are configured yet.</div>
        ) : (
          <div className="record-list">
            {details.events.map((event) => (
              <Link
                className="record-row"
                href={`/platform/events/${event.id}`}
                key={event.id}
              >
                <span>
                  <strong>{event.name}</strong>
                  <small>
                    {event.event_code} - {getEventTypeLabel(event.event_type)}
                  </small>
                </span>
                <span className="tag">
                  {getEventLifecycleLabel(event.status)}
                </span>
                <span className="meta-list">
                  {formatDate(event.event_date)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <h2>Workflow foundation</h2>
        <div className="task-list">
          {projectTasks.map((task) => (
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
