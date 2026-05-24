import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import { getMessageLogDetails } from "@/lib/messages/message-db";
import { formatStatus } from "@/lib/messages/message-format";
import {
  hasProjectPermission,
  ProjectAccessError,
  requireProjectPermission,
} from "@/lib/projects/project-api";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { markProjectMessageStatusAction } from "../actions";
import { SubmitButton } from "../submit-button";

export const dynamic = "force-dynamic";

type MessageLogDetailPageProps = {
  params: Promise<{
    messageLogId: string;
    projectId: string;
  }>;
  searchParams: Promise<{
    messageError?: string;
    messageStatus?: string;
  }>;
};

export default async function MessageLogDetailPage({
  params,
  searchParams,
}: MessageLogDetailPageProps) {
  const authContext = await getAuthContext();
  const { messageLogId, projectId } = await params;
  const feedback = await searchParams;

  if (authContext.status === "anonymous") {
    redirect(
      buildLoginRedirectPath(
        `/platform/projects/${projectId}/communications/${messageLogId}`,
      ),
    );
  }

  if (authContext.status === "not_configured") {
    return (
      <>
        <h1 className="page-title">Guided manual message</h1>
        <section className="section">
          <div className="alert">
            Supabase environment variables are not configured. Message details
            will load after local credentials are supplied.
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

  const [messageLog, canSend] = await Promise.all([
    getMessageLogDetails(supabase, projectId, messageLogId),
    hasProjectPermission(context, projectId, "messages.send"),
  ]);

  if (!messageLog) {
    notFound();
  }

  const markOpened = markProjectMessageStatusAction.bind(
    null,
    projectId,
    messageLogId,
    "opened_manually",
  );
  const markSent = markProjectMessageStatusAction.bind(
    null,
    projectId,
    messageLogId,
    "sent",
  );
  const markFailed = markProjectMessageStatusAction.bind(
    null,
    projectId,
    messageLogId,
    "failed",
  );
  const markSkipped = markProjectMessageStatusAction.bind(
    null,
    projectId,
    messageLogId,
    "skipped",
  );

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Guided manual WhatsApp</p>
          <h1 className="page-title">
            {formatStatus(messageLog.message_type)}
          </h1>
          <p className="page-summary">
            {messageLog.language.toUpperCase()} -{" "}
            {formatStatus(messageLog.status)} - guest{" "}
            {messageLog.guest_id ?? "Unlinked"}
          </p>
        </div>
        <div className="button-group">
          <Link
            className="button secondary"
            href={`/platform/projects/${projectId}/communications/queue`}
          >
            Queue
          </Link>
          <Link
            className="button secondary"
            href={`/platform/projects/${projectId}/communications`}
          >
            History
          </Link>
        </div>
      </div>

      <section className="section">
        <div className="section-heading">
          <h2>Prepared message</h2>
          <span className="tag">{formatStatus(messageLog.status)}</span>
        </div>
        <div className="detail-grid">
          <div>
            <span>Target WhatsApp</span>
            <strong>
              {messageLog.target_whatsapp_number ?? "Manual only"}
            </strong>
          </div>
          <div>
            <span>Template version</span>
            <strong>{messageLog.template_version ?? "Unassigned"}</strong>
          </div>
          <div>
            <span>Opened</span>
            <strong>{messageLog.opened_at ? "Yes" : "No"}</strong>
          </div>
          <div>
            <span>Sent confirmation</span>
            <strong>{messageLog.sent_at ? "Recorded" : "Pending"}</strong>
          </div>
        </div>
        <pre className="message-preview">{messageLog.rendered_body}</pre>
      </section>

      {canSend ? (
        <section className="section">
          <div className="section-heading">
            <h2>Manual send controls</h2>
            <span className="meta-list">No unofficial automation</span>
          </div>
          {feedback.messageError ? (
            <div className="alert">{feedback.messageError}</div>
          ) : null}
          {feedback.messageStatus ? (
            <div className="alert">
              Message status updated to {formatStatus(feedback.messageStatus)}.
            </div>
          ) : null}
          <div className="button-group">
            {messageLog.manual_whatsapp_url ? (
              <a
                className="button"
                href={messageLog.manual_whatsapp_url}
                rel="noopener noreferrer"
                target="_blank"
              >
                Open WhatsApp
              </a>
            ) : null}
            <form action={markOpened}>
              <SubmitButton>Mark opened</SubmitButton>
            </form>
            <form action={markSent}>
              <SubmitButton>Mark sent</SubmitButton>
            </form>
          </div>
          <div className="form-grid">
            <form action={markFailed} className="stacked-form">
              <label>
                Failure reason
                <input
                  name="reason"
                  placeholder="Wrong number provided"
                  required
                />
              </label>
              <SubmitButton>Mark failed</SubmitButton>
            </form>
            <form action={markSkipped} className="stacked-form">
              <label>
                Skip reason
                <input
                  name="reason"
                  placeholder="Guest prefers printed invitation only"
                  required
                />
              </label>
              <SubmitButton>Mark skipped</SubmitButton>
            </form>
          </div>
        </section>
      ) : null}
    </>
  );
}
