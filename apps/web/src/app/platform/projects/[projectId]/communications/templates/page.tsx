import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import { listProjectMessageTemplates } from "@/lib/messages/message-db";
import {
  hasProjectPermission,
  ProjectAccessError,
  requireProjectPermission,
} from "@/lib/projects/project-api";
import { getProjectDetails } from "@/lib/projects/project-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createMessageTemplateAction } from "../actions";

export const dynamic = "force-dynamic";

type MessageTemplatesPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

const defaultTemplateBody =
  "Bonjour {{guest.display_name}}, votre invitation pour {{event.name}} est prete: {{public_guest_page_link}}";

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

export default async function MessageTemplatesPage({
  params,
}: MessageTemplatesPageProps) {
  const authContext = await getAuthContext();
  const { projectId } = await params;

  if (authContext.status === "anonymous") {
    redirect(
      buildLoginRedirectPath(
        `/platform/projects/${projectId}/communications/templates`,
      ),
    );
  }

  if (authContext.status === "not_configured") {
    return (
      <>
        <h1 className="page-title">Message templates</h1>
        <section className="section">
          <div className="alert">
            Supabase environment variables are not configured. Message templates
            will load after local credentials are supplied.
          </div>
        </section>
      </>
    );
  }

  const supabase = await createSupabaseServerClient();
  const context = { supabase, user: authContext.user };

  try {
    await requireProjectPermission(
      context,
      projectId,
      "message_templates.read",
    );
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      notFound();
    }

    throw error;
  }

  const [details, templates, canManageTemplates] = await Promise.all([
    getProjectDetails(supabase, projectId),
    listProjectMessageTemplates(supabase, projectId),
    hasProjectPermission(context, projectId, "message_templates.manage"),
  ]);

  if (!details) {
    notFound();
  }

  const createTemplate = createMessageTemplateAction.bind(null, projectId);

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Sprint 7 foundation</p>
          <h1 className="page-title">Message templates</h1>
          <p className="page-summary">
            Approved French and English WhatsApp templates with dynamic
            variables for invitations, resends, reminders, follow-ups, and
            modification notices.
          </p>
        </div>
        <div className="button-group">
          <Link
            className="button secondary"
            href={`/platform/projects/${projectId}/communications`}
          >
            Communications
          </Link>
          <Link
            className="button secondary"
            href={`/platform/projects/${projectId}`}
          >
            Project
          </Link>
        </div>
      </div>

      <section className="section">
        <div className="section-heading">
          <h2>Template library</h2>
          <span className="meta-list">{templates.length} templates</span>
        </div>

        {templates.length === 0 ? (
          <div className="empty-state">
            No message templates have been configured for this project yet.
          </div>
        ) : (
          <div className="progress-overview">
            {templates.map((template) => (
              <article className="progress-card" key={template.id}>
                <div className="progress-card-header">
                  <div>
                    <p className="eyebrow">
                      {template.language.toUpperCase()} - v
                      {template.template_version}
                    </p>
                    <h3>{template.title}</h3>
                  </div>
                  <span className="tag">{formatStatus(template.status)}</span>
                </div>
                <p className="meta-list">
                  {formatStatus(template.message_type)}
                </p>
                <pre className="message-preview">{template.body}</pre>
              </article>
            ))}
          </div>
        )}
      </section>

      {canManageTemplates ? (
        <section className="section">
          <div className="section-heading">
            <h2>Create template</h2>
            <span className="meta-list">Approved manual foundation</span>
          </div>
          <form action={createTemplate} className="stacked-form">
            <div className="form-grid">
              <label>
                Message type
                <select defaultValue="invitation" name="messageType" required>
                  <option value="invitation">Invitation</option>
                  <option value="invitation_resend">Invitation resend</option>
                  <option value="rsvp_request">RSVP request</option>
                  <option value="maybe_follow_up">Maybe follow-up</option>
                  <option value="event_reminder">Event reminder</option>
                  <option value="modification_notice">
                    Modification notice
                  </option>
                  <option value="welcome_table_placeholder">
                    Welcome/table placeholder
                  </option>
                  <option value="manual_custom">Manual custom</option>
                </select>
              </label>
              <label>
                Language
                <select defaultValue="fr" name="language" required>
                  <option value="fr">French</option>
                  <option value="en">English</option>
                </select>
              </label>
              <label>
                Status
                <select defaultValue="active" name="status" required>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
              <label>
                Title
                <input name="title" required />
              </label>
            </div>
            <label>
              Body
              <textarea
                defaultValue={defaultTemplateBody}
                name="body"
                required
                rows={5}
              />
            </label>
            <button className="button" type="submit">
              Create template
            </button>
          </form>
        </section>
      ) : null}
    </>
  );
}
