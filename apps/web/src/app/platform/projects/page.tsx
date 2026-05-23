import Link from "next/link";
import { redirect } from "next/navigation";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import {
  getProjectLifecycleLabel,
  getSprint2FoundationStatus,
} from "@/lib/projects/project-foundation";
import { listProjects } from "@/lib/projects/project-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export default async function ProjectsPage() {
  const authContext = await getAuthContext();
  const foundation = getSprint2FoundationStatus();

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath("/platform/projects"));
  }

  const projects =
    authContext.status === "authenticated"
      ? await listProjects(await createSupabaseServerClient())
      : [];

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{foundation.epic}</p>
          <h1 className="page-title">Wedding projects</h1>
          <p className="page-summary">
            Project and event foundations for Sprint 2. This view exposes only
            project records the signed-in user can access through backend RLS.
          </p>
        </div>
        <Link className="button secondary" href="/platform">
          Platform
        </Link>
      </div>

      {authContext.status === "not_configured" ? (
        <section className="section">
          <div className="alert">
            Supabase environment variables are not configured. Project data will
            load after local Supabase credentials are supplied.
          </div>
        </section>
      ) : (
        <section className="section">
          <div className="section-heading">
            <h2>Accessible projects</h2>
            <span className="meta-list">{projects.length} records</span>
          </div>

          {projects.length === 0 ? (
            <div className="empty-state">
              No projects are visible for this account yet.
            </div>
          ) : (
            <div className="record-list">
              {projects.map((project) => (
                <Link
                  className="record-row"
                  href={`/platform/projects/${project.id}`}
                  key={project.id}
                >
                  <span>
                    <strong>
                      {project.bride_name} & {project.groom_name}
                    </strong>
                    <small>{project.project_code}</small>
                  </span>
                  <span className="tag">
                    {getProjectLifecycleLabel(project.status)}
                  </span>
                  <span className="meta-list">
                    Updated {formatDate(project.updated_at)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}
    </>
  );
}
