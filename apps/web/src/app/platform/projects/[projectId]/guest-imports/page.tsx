import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import {
  requireAnyGuestImportCreatePermission,
  requireGuestImportReadPermission,
} from "@/lib/guest-imports/guest-import-api";
import { listGuestImportSessions } from "@/lib/guest-imports/guest-import-db";
import { ProjectAccessError } from "@/lib/projects/project-api";
import { getProjectDetails } from "@/lib/projects/project-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type GuestImportsPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

export default async function GuestImportsPage({
  params,
}: GuestImportsPageProps) {
  const authContext = await getAuthContext();
  const { projectId } = await params;

  if (authContext.status === "anonymous") {
    redirect(
      buildLoginRedirectPath(`/platform/projects/${projectId}/guest-imports`),
    );
  }

  if (authContext.status === "not_configured") {
    return (
      <>
        <h1 className="page-title">Guest imports</h1>
        <section className="section">
          <div className="alert">
            Supabase environment variables are not configured. Guest import
            history will load after local credentials are supplied.
          </div>
        </section>
      </>
    );
  }

  const supabase = await createSupabaseServerClient();
  const context = { supabase, user: authContext.user };
  try {
    await requireGuestImportReadPermission(context, projectId);
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      notFound();
    }

    throw error;
  }

  let canUpload = false;
  try {
    await requireAnyGuestImportCreatePermission(context, projectId);
    canUpload = true;
  } catch (error) {
    if (!(error instanceof ProjectAccessError)) {
      throw error;
    }
  }

  const [projectDetails, sessions] = await Promise.all([
    getProjectDetails(supabase, projectId),
    listGuestImportSessions(supabase, projectId),
  ]);

  if (!projectDetails) {
    redirect("/platform/projects");
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{projectDetails.project.project_code}</p>
          <h1 className="page-title">Guest import history</h1>
          <p className="page-summary">
            CSV import sessions are staged for Diginoces review before approved
            rows become guest records.
          </p>
        </div>
        <div className="button-group">
          <Link
            className="button secondary"
            href={`/platform/projects/${projectId}/guests`}
          >
            Guests
          </Link>
          {canUpload ? (
            <Link
              className="button"
              href={`/platform/projects/${projectId}/guest-imports/new`}
            >
              Upload CSV
            </Link>
          ) : null}
        </div>
      </div>

      <section className="section">
        <div className="section-heading">
          <h2>Import sessions</h2>
          <span className="meta-list">{sessions.length} records</span>
        </div>

        {sessions.length === 0 ? (
          <div className="empty-state">No guest imports have been started.</div>
        ) : (
          <div className="record-list">
            {sessions.map((session) => (
              <Link
                className="record-row"
                href={`/platform/projects/${projectId}/guest-imports/${session.id}`}
                key={session.id}
              >
                <span>
                  <strong>{session.source_filename}</strong>
                  <small>
                    {session.row_count} rows - {session.valid_row_count} valid -{" "}
                    {session.invalid_row_count} blocked
                  </small>
                </span>
                <span className="tag">{session.import_side}</span>
                <span className="meta-list">
                  {formatStatus(session.status)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
