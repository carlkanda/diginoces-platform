import {
  canSubmitPublicRsvp,
  DEFAULT_GUEST_PAGE_LANGUAGE,
  getGuestPageLabels,
  type PublicGuestEvent,
  type RsvpResponseStatus,
} from "@/lib/rsvp/rsvp-service";
import { canEditGuestMessage as canEditGuestMessageForStatus } from "@/lib/guest-wishes/guest-wish-service";
import type { PublicGuestPagePayload } from "@/lib/rsvp/rsvp-db";

type PublicGuestPageViewProps = {
  formActionFactory?: (
    eventId: string,
  ) => (formData: FormData) => Promise<void> | void;
  messageFormAction?: (formData: FormData) => Promise<void> | void;
  messageResult?: string;
  payload: Extract<PublicGuestPagePayload, { status: "ok" }>;
  result?: string;
};

function formatDate(
  value: string | null,
  language: string | null | undefined,
  timeZone = "UTC",
) {
  if (!value) {
    return "Date to be confirmed";
  }

  return new Intl.DateTimeFormat(language ?? DEFAULT_GUEST_PAGE_LANGUAGE, {
    dateStyle: "full",
    timeZone,
  }).format(new Date(`${value}T00:00:00Z`));
}

function formatTime(value: string | null) {
  if (!value) {
    return "Time to be confirmed";
  }

  const [hours, minutes] = value.split(":");

  if (!/^\d{1,2}$/.test(hours ?? "") || !/^\d{1,2}$/.test(minutes ?? "")) {
    return "Time to be confirmed";
  }

  const hour = Number(hours);
  const minute = Number(minutes);

  if (hour > 23 || minute > 59) {
    return "Time to be confirmed";
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function toPublicGuestEvent(
  event: Extract<PublicGuestPagePayload, { status: "ok" }>["events"][number],
): PublicGuestEvent {
  return {
    eventDate: event.eventDate,
    eventId: event.eventId,
    invited: true,
    name: event.name,
    rsvpDeadlineAt: event.rsvpDeadlineAt,
    startsAt: event.startsAt,
    venueName: event.venueName,
  };
}

function statusLabel(
  status: string | undefined,
  labels: ReturnType<typeof getGuestPageLabels>,
) {
  if (status === "yes") {
    return labels.yes;
  }

  if (status === "no") {
    return labels.no;
  }

  if (status === "maybe") {
    return labels.maybe;
  }

  return labels.pending;
}

function rsvpResponseOptions(labels: ReturnType<typeof getGuestPageLabels>) {
  return [
    {
      label: labels.yes,
      status: "yes",
    },
    {
      label: labels.no,
      status: "no",
    },
    {
      label: labels.maybe,
      status: "maybe",
    },
  ] satisfies { label: string; status: RsvpResponseStatus }[];
}

function guestMessageStatusLabel(
  status: string,
  labels: ReturnType<typeof getGuestPageLabels>,
) {
  const statusLabels: Record<string, string> = {
    admin_approved: labels.messageStatusAdminApproved,
    admin_edited: labels.messageStatusAdminEdited,
    archived: labels.messageStatusArchived,
    couple_approved: labels.messageStatusCoupleApproved,
    couple_correction_requested: labels.messageStatusCoupleCorrectionRequested,
    excluded: labels.messageStatusExcluded,
    exported: labels.messageStatusExported,
    flagged: labels.messageStatusFlagged,
    not_submitted: labels.messageStatusNotSubmitted,
    pending_review: labels.messageStatusPendingReview,
  };

  return statusLabels[status] ?? labels.messageStatusPendingReview;
}

function messageResultLabel(
  result: string,
  labels: ReturnType<typeof getGuestPageLabels>,
) {
  if (result === "deadline_passed") {
    return labels.messageErrorDeadlinePassed;
  }

  if (result === "message_locked") {
    return labels.messageSubmissionUnavailable;
  }

  if (
    result === "invalid" ||
    result === "invalid_language" ||
    result === "invalid_message_text" ||
    result === "not_invited"
  ) {
    return labels.messageErrorInvalid;
  }

  return labels.messageErrorGeneric;
}

export function PublicGuestPageView({
  formActionFactory,
  messageFormAction,
  messageResult,
  payload,
  result,
}: PublicGuestPageViewProps) {
  const language =
    payload.guest.preferredLanguage ?? payload.project.preferredLanguage;
  const labels = getGuestPageLabels(language);
  const isPreview = payload.mode === "preview";
  const invitedEvents = payload.events.map(toPublicGuestEvent);
  const responseOptions = rsvpResponseOptions(labels);
  const now = new Date();
  const guestMessageDeadline = payload.guestMessage.deadlineAt;
  const guestMessageEditState = canEditGuestMessageForStatus({
    deadlineAt: guestMessageDeadline,
    now: now.toISOString(),
    status: payload.guestMessage.status,
  });
  const guestMessageClosed =
    !guestMessageEditState.allowed &&
    guestMessageEditState.reason === "deadline_passed";
  const guestMessageLocked =
    !guestMessageEditState.allowed &&
    guestMessageEditState.reason === "message_locked";
  const canEditGuestMessage =
    !isPreview &&
    guestMessageEditState.allowed &&
    !payload.guest.isPrintedOnly &&
    payload.project.guestPageAccessStatus !== "locked";

  return (
    <div className="public-page">
      {isPreview ? (
        <div className="alert">
          Internal preview. This does not count as a guest page access.
        </div>
      ) : null}

      {result === "saved" ? (
        <div className="alert success">RSVP saved.</div>
      ) : null}

      {messageResult === "saved" ? (
        <div className="alert success">{labels.messageSavedAlert}</div>
      ) : null}

      {messageResult && messageResult !== "saved" ? (
        <div className="alert">{messageResultLabel(messageResult, labels)}</div>
      ) : null}

      <section className="public-hero">
        <div>
          <p className="eyebrow">Diginoces RSVP</p>
          <h1>
            {payload.project.brideName} & {payload.project.groomName}
          </h1>
          <p>{payload.guest.displayName}, your personal guest page is ready.</p>
        </div>
        <div className="couple-photo-placeholder">
          {payload.project.couplePhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={`${payload.project.brideName} and ${payload.project.groomName}`}
              src={payload.project.couplePhotoUrl}
            />
          ) : (
            <span>
              {payload.project.brideName.slice(0, 1)}
              {payload.project.groomName.slice(0, 1)}
            </span>
          )}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>{labels.rsvpTitle}</h2>
          <span className="meta-list">
            {payload.events.length} invited events
          </span>
        </div>

        {payload.guest.isPrintedOnly ? (
          <div className="alert">
            Printed-only RSVP is handled manually by Diginoces or the couple.
          </div>
        ) : null}

        <div className="public-event-list">
          {payload.events.map((event) => {
            const currentStatus = event.rsvp?.status ?? "pending";
            const action = formActionFactory?.(event.eventId);
            const paymentGate =
              payload.project.guestPageAccessStatus === "locked"
                ? "locked"
                : "unlocked";

            return (
              <article className="public-event-card" key={event.eventId}>
                <div>
                  <h3>{event.name}</h3>
                  <p className="meta-list">
                    {formatDate(event.eventDate, language)} at{" "}
                    {formatTime(event.startsAt)}
                  </p>
                  <p className="meta-list">
                    {event.venueName ?? "Venue to be confirmed"}
                  </p>
                  {event.rsvpDeadlineAt ? (
                    <p className="meta-list">
                      RSVP deadline:{" "}
                      {new Intl.DateTimeFormat(
                        language ?? DEFAULT_GUEST_PAGE_LANGUAGE,
                        {
                          dateStyle: "medium",
                          timeStyle: "short",
                        },
                      ).format(new Date(event.rsvpDeadlineAt))}
                    </p>
                  ) : null}
                </div>

                <div className="rsvp-panel">
                  <span className="tag">
                    {statusLabel(currentStatus, labels)}
                  </span>
                  {event.rsvp?.manualReviewRequired ? (
                    <span className="tag warning-tag">Manual review</span>
                  ) : null}

                  <form action={action} className="rsvp-form">
                    <input
                      name="preferredLanguage"
                      type="hidden"
                      value={language ?? DEFAULT_GUEST_PAGE_LANGUAGE}
                    />
                    {responseOptions.map((option) => {
                      const decision = canSubmitPublicRsvp({
                        eventId: event.eventId,
                        invitedEvents,
                        isPrintedOnly: payload.guest.isPrintedOnly,
                        now: now.toISOString(),
                        paymentGate,
                        previousStatus: currentStatus,
                        requestedStatus: option.status,
                      });

                      return (
                        <button
                          className="button secondary"
                          disabled={isPreview || !decision.allowed}
                          key={option.status}
                          name="response"
                          type="submit"
                          value={option.status}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </form>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section">
        <div className="scope-note">
          <strong>{labels.downloadPlaceholder}</strong>
          <p>
            Sprint 5 exposes only the placeholder. Invitation PDF generation, QR
            images, WhatsApp sending, seating, and check-in remain out of scope.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>{labels.messageSectionTitle}</h2>
          <span className="tag">
            {guestMessageStatusLabel(payload.guestMessage.status, labels)}
          </span>
        </div>
        <p className="page-summary">{labels.messageHelp}</p>
        {guestMessageDeadline ? (
          <p className="meta-list">
            {labels.messageDeadlineLabel}{" "}
            {new Intl.DateTimeFormat(language ?? DEFAULT_GUEST_PAGE_LANGUAGE, {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(guestMessageDeadline))}
          </p>
        ) : null}
        {guestMessageClosed ? (
          <div className="alert">{labels.messageDeadlinePassedAlert}</div>
        ) : null}
        {guestMessageLocked ? (
          <div className="alert">{labels.messageSubmissionUnavailable}</div>
        ) : null}
        {messageFormAction ? (
          <form action={messageFormAction} className="stacked-form">
            <input
              name="preferredLanguage"
              type="hidden"
              value={language ?? DEFAULT_GUEST_PAGE_LANGUAGE}
            />
            <label>
              {labels.messageTextareaLabel}
              <textarea
                defaultValue={payload.guestMessage.currentText ?? ""}
                disabled={!canEditGuestMessage}
                maxLength={1200}
                name="messageText"
                rows={5}
              />
            </label>
            <button
              className="button"
              disabled={!canEditGuestMessage}
              type="submit"
            >
              {labels.messageSaveButton}
            </button>
          </form>
        ) : (
          <div className="empty-state">
            {labels.messageSubmissionUnavailable}
          </div>
        )}
      </section>
    </div>
  );
}
