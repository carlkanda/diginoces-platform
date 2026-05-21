import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/auth-service";
import {
  getEventLifecycleLabel,
  getEventTypeLabel,
  getProjectLifecycleLabel,
} from "@/lib/projects/project-foundation";
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

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const authContext = await getAuthContext();
  const { projectId } = await params;

  if (authContext.status === "anonymous") {
    redirect(`/login?next=/platform/projects/${projectId}`);
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

  const details = await getProjectDetails(
    await createSupabaseServerClient(),
    projectId,
  );

  if (!details) {
    notFound();
  }

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
            <strong>{details.project.preferred_language}</strong>
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
