import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import { listEventInvitationTemplates } from "@/lib/invitations/invitation-db";
import {
  ProjectAccessError,
  hasProjectPermission,
  requireEventPermission,
} from "@/lib/projects/project-api";
import { getEventDetails } from "@/lib/projects/project-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type EventInvitationTemplatesPageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

export default async function EventInvitationTemplatesPage({
  params,
}: EventInvitationTemplatesPageProps) {
  const authContext = await getAuthContext();
  const { eventId } = await params;

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath(`/platform/events/${eventId}/invitations`));
  }

  if (authContext.status === "not_configured") {
    return (
      <>
        <h1 className="page-title">Invitation templates</h1>
        <section className="section">
          <div className="alert">
            Supabase environment variables are not configured. Invitation
            templates will load after local credentials are supplied.
          </div>
        </section>
      </>
    );
  }

  const supabase = await createSupabaseServerClient();
  const context = { supabase, user: authContext.user };

  try {
    await requireEventPermission(context, eventId, "invitation_templates.read");
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      notFound();
    }

    throw error;
  }

  const [eventDetails, templates] = await Promise.all([
    getEventDetails(supabase, eventId),
    listEventInvitationTemplates(supabase, eventId),
  ]);

  if (!eventDetails) {
    notFound();
  }

  const canCreate = await hasProjectPermission(
    context,
    eventDetails.project.id,
    "invitation_templates.create",
  );

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Sprint 6 foundation</p>
          <h1 className="page-title">Invitation templates</h1>
          <p className="page-summary">
            Canva-exported PDF template registration, coordinate fields,
            technical preview approval, and generation job foundation for{" "}
            {eventDetails.event.name}.
          </p>
        </div>
        <div className="button-group">
          <Link
            className="button secondary"
            href={`/platform/events/${eventId}`}
          >
            Event
          </Link>
          {canCreate ? (
            <Link
              className="button"
              href={`/platform/events/${eventId}/invitations/new`}
            >
              Register template
            </Link>
          ) : null}
        </div>
      </div>

      <section className="section">
        <div className="section-heading">
          <h2>{eventDetails.event.name}</h2>
          <span className="meta-list">{templates.length} templates</span>
        </div>

        {templates.length === 0 ? (
          <div className="empty-state">
            No invitation templates have been registered for this event yet.
          </div>
        ) : (
          <div className="progress-overview">
            {templates.map((template) => (
              <article className="progress-card" key={template.id}>
                <div className="progress-card-header">
                  <div>
                    <p className="eyebrow">
                      v{template.template_version} · {template.source_filename}
                    </p>
                    <h3>{template.name}</h3>
                  </div>
                  <span className="tag">{formatStatus(template.status)}</span>
                </div>
                <p className="meta-list">
                  PDF metadata only; source-file persistence remains behind the
                  app-owned storage abstraction.
                </p>
                <Link
                  className="button secondary"
                  href={`/platform/events/${eventId}/invitations/${template.id}`}
                >
                  Open template
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
