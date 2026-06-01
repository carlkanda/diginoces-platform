import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import { getEventDetails } from "@/lib/projects/project-service";
import {
  ProjectAccessError,
  requireEventPermission,
} from "@/lib/projects/project-api";
import { listEventFiles } from "@/lib/files/file-db";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

export default async function EventFilesPage({ params }: PageProps) {
  const authContext = await getAuthContext();
  const { eventId } = await params;

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath(`/platform/events/${eventId}/files`));
  }

  if (authContext.status === "not_configured") {
    return (
      <>
        <h1 className="page-title">Event files</h1>
        <section className="section">
          <div className="alert">
            Supabase environment variables are not configured. Event file
            records will load after local credentials are supplied.
          </div>
        </section>
      </>
    );
  }

  const supabase = authContext.supabase;
  const context = { supabase, user: authContext.user };

  try {
    await requireEventPermission(context, eventId, "files.read");
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      notFound();
    }

    throw error;
  }

  const [event, files] = await Promise.all([
    getEventDetails(supabase, eventId),
    listEventFiles(supabase, eventId),
  ]);

  if (!event) {
    notFound();
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{event.event.event_code}</p>
          <h1 className="page-title">Event files</h1>
          <p className="page-summary">
            Event-level templates, invitations, seating exports, check-in
            reports, and report exports.
          </p>
        </div>
        <Link
          className="button secondary"
          href={`/platform/projects/${event.project.id}/files`}
        >
          Project files
        </Link>
      </div>

      <section className="section">
        {files.length === 0 ? (
          <div className="empty-state">No event files registered yet.</div>
        ) : (
          <div className="record-list">
            {files.map((file) => (
              <Link
                className="record-row"
                href={`/platform/projects/${event.project.id}/files/${file.id}`}
                key={file.id}
              >
                <span>
                  <strong>{file.filename}</strong>
                  <small>
                    {file.category} - v{file.version}
                  </small>
                </span>
                <span className="tag">{file.status}</span>
                <span className="tag">{file.visibility}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
