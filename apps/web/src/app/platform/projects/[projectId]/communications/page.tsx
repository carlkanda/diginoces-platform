import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import { getProjectMessageOverview } from "@/lib/messages/message-db";
import { formatStatus } from "@/lib/messages/message-format";
import {
  hasProjectPermission,
  ProjectAccessError,
  requireProjectPermission,
} from "@/lib/projects/project-api";
import { getProjectDetails } from "@/lib/projects/project-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type CommunicationsPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

function shortId(value: string | null) {
  return value ? `${value.slice(0, 8)}...` : null;
}

export default async function CommunicationsPage({
  params,
}: CommunicationsPageProps) {
  const authContext = await getAuthContext();
  const { projectId } = await params;

  if (authContext.status === "anonymous") {
    redirect(
      buildLoginRedirectPath(`/platform/projects/${projectId}/communications`),
    );
  }

  if (authContext.status === "not_configured") {
    return (
      <>
        <h1 className="page-title">Communications</h1>
        <section className="section">
          <div className="alert">
            Supabase environment variables are not configured. Communication
            workflows will load after local credentials are supplied.
          </div>
        </section>
      </>
    );
  }

  const supabase = await createSupabaseServerClient();
  const context = { supabase, user: authContext.user };

  try {
    await requireProjectPermission(context, projectId, "messages.read");
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      notFound();
    }

    throw error;
  }

  const [details, overview, canReadTemplates, canManageTemplates, canPrepare] =
    await Promise.all([
      getProjectDetails(supabase, projectId),
      getProjectMessageOverview(supabase, projectId),
      hasProjectPermission(context, projectId, "message_templates.read"),
      hasProjectPermission(context, projectId, "message_templates.manage"),
      hasProjectPermission(context, projectId, "messages.prepare"),
    ]);

  if (!details) {
    notFound();
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Sprint 7 foundation</p>
          <h1 className="page-title">WhatsApp communications</h1>
          <p className="page-summary">
            Guided manual WhatsApp preparation, template management, sending
            queue, and communication history for {details.project.bride_name} &{" "}
            {details.project.groom_name}.
          </p>
        </div>
        <div className="button-group">
          <Link
            className="button secondary"
            href={`/platform/projects/${projectId}`}
          >
            Project
          </Link>
          {canReadTemplates || canManageTemplates ? (
            <Link
              className="button secondary"
              href={`/platform/projects/${projectId}/communications/templates`}
            >
              Templates
            </Link>
          ) : null}
          {canPrepare ? (
            <Link
              className="button"
              href={`/platform/projects/${projectId}/communications/queue`}
            >
              Sending queue
            </Link>
          ) : null}
        </div>
      </div>

      <section className="section">
        <div className="section-heading">
          <h2>Communication readiness</h2>
          <span className="meta-list">
            {overview.templates.length} templates - {overview.logs.length} logs
          </span>
        </div>
        <div className="detail-grid">
          <div>
            <span>Templates</span>
            <strong>{overview.templates.length}</strong>
          </div>
          <div>
            <span>Prepared or sent messages</span>
            <strong>{overview.logs.length}</strong>
          </div>
          <div>
            <span>Queue items</span>
            <strong>{overview.queueItems.length}</strong>
          </div>
          <div>
            <span>Sending mode</span>
            <strong>Guided manual, API-ready</strong>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Recent communication history</h2>
          <span className="meta-list">{overview.logs.length} recent logs</span>
        </div>

        {overview.logs.length === 0 ? (
          <div className="empty-state">
            No WhatsApp communication logs have been prepared yet.
          </div>
        ) : (
          <div className="record-list">
            {overview.logs.map((log) => (
              <Link
                className="record-row"
                href={`/platform/projects/${projectId}/communications/${log.id}`}
                key={log.id}
              >
                <span>
                  <strong>{formatStatus(log.message_type)}</strong>
                  <small>
                    {log.language.toUpperCase()} - guest{" "}
                    {log.guest_display_name ?? shortId(log.guest_id) ?? "n/a"}
                  </small>
                </span>
                <span className="tag">{formatStatus(log.status)}</span>
                <span className="meta-list">
                  {formatStatus(log.sending_mode)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
