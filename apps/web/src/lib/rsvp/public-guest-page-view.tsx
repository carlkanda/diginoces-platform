import {
  canSubmitPublicRsvp,
  getGuestPageLabels,
  type PublicGuestEvent,
  type RsvpResponseStatus,
} from "@/lib/rsvp/rsvp-service";
import type { PublicGuestPagePayload } from "@/lib/rsvp/rsvp-db";

type PublicGuestPageViewProps = {
  formActionFactory?: (
    eventId: string,
  ) => (formData: FormData) => Promise<void> | void;
  payload: Extract<PublicGuestPagePayload, { status: "ok" }>;
  result?: string;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Date to be confirmed";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "full",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function formatTime(value: string | null) {
  return value ? value.slice(0, 5) : "Time to be confirmed";
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

  return "Pending";
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

export function PublicGuestPageView({
  formActionFactory,
  payload,
  result,
}: PublicGuestPageViewProps) {
  const language =
    payload.guest.preferredLanguage ?? payload.project.preferredLanguage;
  const labels = getGuestPageLabels(language);
  const isPreview = payload.mode === "preview";
  const invitedEvents = payload.events.map(toPublicGuestEvent);
  const responseOptions = rsvpResponseOptions(labels);

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
            const now = new Date().toISOString();
            const paymentGate =
              payload.project.guestPageAccessStatus === "locked"
                ? "locked"
                : "unlocked";

            return (
              <article className="public-event-card" key={event.eventId}>
                <div>
                  <h3>{event.name}</h3>
                  <p className="meta-list">
                    {formatDate(event.eventDate)} at{" "}
                    {formatTime(event.startsAt)}
                  </p>
                  <p className="meta-list">
                    {event.venueName ?? "Venue to be confirmed"}
                  </p>
                  {event.rsvpDeadlineAt ? (
                    <p className="meta-list">
                      RSVP deadline:{" "}
                      {new Intl.DateTimeFormat("en", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(event.rsvpDeadlineAt))}
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
                      value={language ?? "fr"}
                    />
                    {responseOptions.map((option) => {
                      const decision = canSubmitPublicRsvp({
                        eventId: event.eventId,
                        invitedEvents,
                        isPrintedOnly: payload.guest.isPrintedOnly,
                        now,
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
    </div>
  );
}
