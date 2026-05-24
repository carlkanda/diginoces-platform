import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import {
  listProjectMessageInvitationOptions,
  listProjectMessageLogs,
  listProjectMessageQueue,
} from "@/lib/messages/message-db";
import { formatStatus, shortId } from "@/lib/messages/message-format";
import {
  ProjectAccessError,
  requireProjectPermission,
} from "@/lib/projects/project-api";
import { getProjectDetails } from "@/lib/projects/project-service";
import { listProjectGuests } from "@/lib/guests/guest-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prepareProjectMessageAction } from "../actions";

export const dynamic = "force-dynamic";

type MessageQueuePageProps = {
  params: Promise<{
    projectId: string;
  }>;
  searchParams: Promise<{
    messageError?: string;
  }>;
};

const queueTimestampFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatQueueContext(item: {
  created_at: string;
  guest_display_name?: string | null;
  message_log_id: string;
  scheduled_for: string | null;
}) {
  if (item.guest_display_name) {
    return `Guest ${item.guest_display_name}`;
  }

  if (item.scheduled_for) {
    return `Scheduled ${queueTimestampFormatter.format(new Date(item.scheduled_for))}`;
  }

  return `Log ${shortId(item.message_log_id) ?? "unlinked"}`;
}

export default async function MessageQueuePage({
  params,
  searchParams,
}: MessageQueuePageProps) {
  const authContext = await getAuthContext();
  const { projectId } = await params;
  const feedback = await searchParams;

  if (authContext.status === "anonymous") {
    redirect(
      buildLoginRedirectPath(
        `/platform/projects/${projectId}/communications/queue`,
      ),
    );
  }

  if (authContext.status === "not_configured") {
    return (
      <>
        <h1 className="page-title">Sending queue</h1>
        <section className="section">
          <div className="alert">
            Supabase environment variables are not configured. Message queue
            data will load after local credentials are supplied.
          </div>
        </section>
      </>
    );
  }

  const supabase = await createSupabaseServerClient();
  const context = { supabase, user: authContext.user };

  try {
    await requireProjectPermission(context, projectId, "messages.prepare");
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      notFound();
    }

    throw error;
  }

  const [details, guests, logs, queueItems, invitations] = await Promise.all([
    getProjectDetails(supabase, projectId),
    listProjectGuests(supabase, projectId),
    listProjectMessageLogs(supabase, projectId, 25),
    listProjectMessageQueue(supabase, projectId, 25),
    listProjectMessageInvitationOptions(supabase, projectId),
  ]);

  if (!details) {
    notFound();
  }

  const prepareMessage = prepareProjectMessageAction.bind(null, projectId);
  const hasMessagePrerequisites =
    details.events.length > 0 && guests.length > 0;

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Sprint 7 foundation</p>
          <h1 className="page-title">Guided manual sending queue</h1>
          <p className="page-summary">
            Prepare invitation sends, resends, Maybe follow-ups, event
            reminders, and modification notices without unofficial WhatsApp Web
            automation or production API credentials.
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
            href={`/platform/projects/${projectId}/communications/templates`}
          >
            Templates
          </Link>
        </div>
      </div>

      <section className="section">
        <div className="section-heading">
          <h2>Prepare message</h2>
          <span className="meta-list">Manual WhatsApp workflow</span>
        </div>
        {feedback.messageError ? (
          <div className="alert">{feedback.messageError}</div>
        ) : null}
        {hasMessagePrerequisites ? (
          <form action={prepareMessage} className="stacked-form">
            <div className="form-grid">
              <label>
                Message type
                <select defaultValue="invitation" name="messageType" required>
                  <option value="invitation">Invitation</option>
                  <option value="invitation_resend">Invitation resend</option>
                  <option value="maybe_follow_up">Maybe follow-up</option>
                  <option value="event_reminder">Event reminder</option>
                  <option value="modification_notice">
                    Modification notice
                  </option>
                  <option value="manual_custom">Manual custom</option>
                </select>
              </label>
              <label>
                Event
                <select defaultValue="" name="eventId" required>
                  <option disabled value="">
                    Please select an event
                  </option>
                  {details.events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Guest
                <select defaultValue="" name="guestId" required>
                  <option disabled value="">
                    Please select a guest
                  </option>
                  {guests.map((guest) => (
                    <option key={guest.id} value={guest.id}>
                      {guest.display_name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Invitation
                <select name="invitationId">
                  <option value="">None</option>
                  {invitations.map((invitation) => (
                    <option key={invitation.id} value={invitation.id}>
                      {invitation.status} - {invitation.guest_display_name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Public guest page link
              <input
                name="publicGuestPageLink"
                placeholder="https://example.com/g/secure-token"
                type="url"
              />
            </label>
            <label>
              Change reason
              <input
                name="changeReason"
                placeholder="event_time_changed, guest_name_corrected"
              />
            </label>
            <button className="button" type="submit">
              Prepare guided message
            </button>
          </form>
        ) : (
          <div className="alert">
            Add at least one event and one guest before preparing a message.
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Queue items</h2>
          <span className="meta-list">{queueItems.length} recent items</span>
        </div>
        {queueItems.length === 0 ? (
          <div className="empty-state">No queued messages yet.</div>
        ) : (
          <div className="task-list">
            {queueItems.map((item) => (
              <div className="task-row" key={item.id}>
                <span>
                  <strong>{formatStatus(item.message_type)}</strong>
                  <small>{formatQueueContext(item)}</small>
                </span>
                <span className="tag">{formatStatus(item.status)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Prepared messages</h2>
          <span className="meta-list">{logs.length} recent logs</span>
        </div>
        {logs.length === 0 ? (
          <div className="empty-state">No messages have been prepared yet.</div>
        ) : (
          <div className="record-list">
            {logs.map((log) => (
              <Link
                className="record-row"
                href={`/platform/projects/${projectId}/communications/${log.id}`}
                key={log.id}
              >
                <span>
                  <strong>{formatStatus(log.message_type)}</strong>
                  <small>
                    {log.guest_display_name ??
                      shortId(log.guest_id) ??
                      "No guest"}
                  </small>
                </span>
                <span className="tag">{formatStatus(log.status)}</span>
                <span className="meta-list">{log.language.toUpperCase()}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
