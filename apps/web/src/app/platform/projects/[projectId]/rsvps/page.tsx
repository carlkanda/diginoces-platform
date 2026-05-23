import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import {
  ProjectAccessError,
  requireProjectPermission,
} from "@/lib/projects/project-api";
import { getProjectDetails } from "@/lib/projects/project-service";
import { getProjectRsvpSummary } from "@/lib/rsvp/rsvp-db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ProjectRsvpSummaryPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

function formatDeadline(value: string | null, locale?: string | null) {
  if (!value) {
    return "No deadline set";
  }

  return new Intl.DateTimeFormat(locale ?? "en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function ProjectRsvpSummaryPage({
  params,
}: ProjectRsvpSummaryPageProps) {
  const authContext = await getAuthContext();
  const { projectId } = await params;

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath(`/platform/projects/${projectId}/rsvps`));
  }

  if (authContext.status === "not_configured") {
    return (
      <>
        <h1 className="page-title">RSVP summary</h1>
        <section className="section">
          <div className="alert">
            Supabase environment variables are not configured. RSVP summary will
            load after local credentials are supplied.
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
      "rsvps.read",
    );
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      notFound();
    }

    throw error;
  }

  const [projectDetails, summary] = await Promise.all([
    getProjectDetails(supabase, projectId),
    getProjectRsvpSummary(supabase, projectId),
  ]);

  if (!projectDetails) {
    notFound();
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Sprint 5 foundation</p>
          <h1 className="page-title">RSVP summary</h1>
          <p className="page-summary">
            Event-specific RSVP counts, deadline review counts, and operational
            effects foundation.
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
        <div className="section-heading">
          <h2>
            {projectDetails.project.bride_name} &{" "}
            {projectDetails.project.groom_name}
          </h2>
          <span className="meta-list">{summary.length} events</span>
        </div>

        {summary.length === 0 ? (
          <div className="empty-state">
            No invited events have RSVP summary data yet.
          </div>
        ) : (
          <div className="rsvp-summary-grid">
            {summary.map((event) => (
              <article className="progress-card" key={event.eventId}>
                <div className="progress-card-header">
                  <div>
                    <p className="eyebrow">
                      {formatDeadline(
                        event.rsvpDeadlineAt,
                        projectDetails.project.preferred_language,
                      )}
                    </p>
                    <h3>{event.eventName}</h3>
                  </div>
                  <span className="tag">{event.invitedCount} invited</span>
                </div>
                <div className="detail-grid compact">
                  <div>
                    <span>Yes</span>
                    <strong>{event.yesCount}</strong>
                  </div>
                  <div>
                    <span>No</span>
                    <strong>{event.noCount}</strong>
                  </div>
                  <div>
                    <span>Maybe</span>
                    <strong>{event.maybeCount}</strong>
                  </div>
                  <div>
                    <span>Pending</span>
                    <strong>{event.pendingCount}</strong>
                  </div>
                </div>
                {event.manualReviewCount > 0 ? (
                  <div className="alert">
                    {event.manualReviewCount} records need manual review after
                    deadline or Maybe/Pending review rules.
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
