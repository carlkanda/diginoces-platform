import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import {
  requireEventPermission,
  ProjectAccessError,
} from "@/lib/projects/project-api";
import { getEventDetails } from "@/lib/projects/project-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { registerInvitationTemplateAction } from "../actions";

export const dynamic = "force-dynamic";

type NewInvitationTemplatePageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

export default async function NewInvitationTemplatePage({
  params,
}: NewInvitationTemplatePageProps) {
  const authContext = await getAuthContext();
  const { eventId } = await params;

  if (authContext.status === "anonymous") {
    redirect(
      buildLoginRedirectPath(`/platform/events/${eventId}/invitations/new`),
    );
  }

  if (authContext.status === "not_configured") {
    return (
      <>
        <h1 className="page-title">Register invitation template</h1>
        <section className="section">
          <div className="alert">
            Supabase environment variables are not configured. Template
            registration will be available after local credentials are supplied.
          </div>
        </section>
      </>
    );
  }

  const supabase = await createSupabaseServerClient();

  try {
    await requireEventPermission(
      { supabase, user: authContext.user },
      eventId,
      "invitation_templates.create",
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

  const action = registerInvitationTemplateAction.bind(null, eventId);

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Sprint 6 foundation</p>
          <h1 className="page-title">Register invitation template</h1>
          <p className="page-summary">
            Register Canva-exported PDF metadata for {details.event.name}.
            Actual source-file persistence stays behind the storage provider
            boundary.
          </p>
        </div>
        <Link
          className="button secondary"
          href={`/platform/events/${eventId}/invitations`}
        >
          Templates
        </Link>
      </div>

      <section className="section">
        <form action={action} className="form-grid">
          <label>
            Template name
            <input
              name="templateName"
              placeholder="Reception invitation template"
              required
            />
          </label>
          <label>
            Canva PDF export
            <input
              accept="application/pdf,.pdf"
              name="templateFile"
              required
              type="file"
            />
          </label>
          <div className="button-group">
            <button className="button" type="submit">
              Register template
            </button>
            <Link
              className="button secondary"
              href={`/platform/events/${eventId}/invitations`}
            >
              Cancel
            </Link>
          </div>
        </form>
      </section>
    </>
  );
}
