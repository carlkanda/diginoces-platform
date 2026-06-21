import {
  CalendarDaysIcon,
  ClockIcon,
  DownloadIcon,
  FileTextIcon,
  HeartHandshakeIcon,
  MapPinIcon,
  MessageSquareTextIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "lucide-react";
import {
  canSubmitPublicRsvp,
  DEFAULT_GUEST_PAGE_LANGUAGE,
  getGuestPageLabels,
  type PublicGuestEvent,
  type RsvpResponseStatus,
} from "@/lib/rsvp/rsvp-service";
import { canEditGuestMessage as canEditGuestMessageForStatus } from "@/lib/guest-wishes/guest-wish-service";
import type { GuestDownloadableFile } from "@/lib/files/file-db";
import {
  formatProjectEventDisplayName,
  isInternalProjectDisplayText,
} from "@/lib/projects/project-foundation";
import type { PublicGuestPagePayload } from "@/lib/rsvp/rsvp-db";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

type PublicGuestPageViewProps = {
  downloadableFiles?: GuestDownloadableFile[];
  formActionFactory?: (
    eventId: string,
  ) => (formData: FormData) => Promise<void> | void;
  guestToken?: string;
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
    return language?.toLowerCase().startsWith("en")
      ? "Date to be confirmed"
      : "Date a confirmer";
  }

  return new Intl.DateTimeFormat(language ?? DEFAULT_GUEST_PAGE_LANGUAGE, {
    dateStyle: "full",
    timeZone,
  }).format(new Date(`${value}T00:00:00Z`));
}

function formatTime(value: string | null, language?: string | null) {
  if (!value) {
    return language?.toLowerCase().startsWith("en")
      ? "Time to be confirmed"
      : "Heure a confirmer";
  }

  const [hours, minutes] = value.split(":");

  if (!/^\d{1,2}$/.test(hours ?? "") || !/^\d{1,2}$/.test(minutes ?? "")) {
    return language?.toLowerCase().startsWith("en")
      ? "Time to be confirmed"
      : "Heure a confirmer";
  }

  const hour = Number(hours);
  const minute = Number(minutes);

  if (hour > 23 || minute > 59) {
    return language?.toLowerCase().startsWith("en")
      ? "Time to be confirmed"
      : "Heure a confirmer";
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function formatPublicGuestDisplayName(displayName: string) {
  return isInternalProjectDisplayText(displayName) ? "Guest" : displayName;
}

export function formatPublicCoupleDisplayName(
  project: Extract<PublicGuestPagePayload, { status: "ok" }>["project"],
) {
  const coupleName = `${project.brideName} & ${project.groomName}`;

  return isInternalProjectDisplayText(coupleName)
    ? "Wedding celebration"
    : coupleName;
}

function formatPublicCoupleInitials(
  project: Extract<PublicGuestPagePayload, { status: "ok" }>["project"],
) {
  const coupleName = `${project.brideName} & ${project.groomName}`;

  if (isInternalProjectDisplayText(coupleName)) {
    return "DC";
  }

  return `${project.brideName.slice(0, 1)}${project.groomName.slice(0, 1)}`;
}

function formatPublicEventDisplayName(
  event: Extract<PublicGuestPagePayload, { status: "ok" }>["events"][number],
  index: number,
) {
  return formatProjectEventDisplayName({ name: event.name }, index);
}

function formatPublicVenueDisplayName(
  value: string | null,
  language?: string | null,
) {
  if (!value || isInternalProjectDisplayText(value)) {
    return language?.toLowerCase().startsWith("en")
      ? "Venue to be confirmed"
      : "Lieu a confirmer";
  }

  return value;
}

function toPublicGuestEvent(
  event: Extract<PublicGuestPagePayload, { status: "ok" }>["events"][number],
  index: number,
): PublicGuestEvent {
  return {
    eventDate: event.eventDate,
    eventId: event.eventId,
    invited: true,
    name: formatPublicEventDisplayName(event, index),
    rsvpDeadlineAt: event.rsvpDeadlineAt,
    startsAt: event.startsAt,
    venueName: formatPublicVenueDisplayName(event.venueName),
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

function formatGuestFileCategory(
  value: string,
  language: string | null | undefined,
) {
  const isEnglish = language?.toLowerCase().startsWith("en");
  const labels: Record<string, string> = {
    contract: isEnglish ? "Contract" : "Contrat",
    guest_invitation: "Invitation",
    invitation: "Invitation",
    invitation_pdf: "Invitation PDF",
    other: isEnglish ? "File" : "Fichier",
    seating: isEnglish ? "Seating plan" : "Plan de table",
  };

  return labels[value] ?? value.replaceAll("_", " ");
}

function formatGuestFileType(value: string) {
  const labels: Record<string, string> = {
    "application/pdf": "PDF",
    "image/jpeg": "JPEG image",
    "image/png": "PNG image",
    "image/webp": "WebP image",
  };

  return labels[value] ?? "File";
}

function formatEventCount(count: number, language: string | null | undefined) {
  const isEnglish = language?.toLowerCase().startsWith("en");

  if (isEnglish) {
    return `${count} ${count === 1 ? "event" : "events"}`;
  }

  return `${count} ${count === 1 ? "evenement" : "evenements"}`;
}

function formatReplyDeadline(
  value: string | null,
  language: string | null | undefined,
) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat(language ?? DEFAULT_GUEST_PAGE_LANGUAGE, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function guestReadyLine(
  guestDisplayName: string,
  language: string | null | undefined,
) {
  const isEnglish = language?.toLowerCase().startsWith("en");

  if (guestDisplayName === "Guest") {
    return isEnglish
      ? "Your personal invitation page is ready."
      : "Votre page personnelle d'invitation est prete.";
  }

  return isEnglish
    ? `${guestDisplayName}, your personal invitation page is ready.`
    : `${guestDisplayName}, votre page personnelle d'invitation est prete.`;
}

export function PublicGuestPageView({
  downloadableFiles = [],
  formActionFactory,
  guestToken,
  messageFormAction,
  messageResult,
  payload,
  result,
}: PublicGuestPageViewProps) {
  const language =
    payload.guest.preferredLanguage ?? payload.project.preferredLanguage;
  const labels = getGuestPageLabels(language);
  const isEnglish = language?.toLowerCase().startsWith("en") ?? false;
  const isPreview = payload.mode === "preview";
  const coupleDisplayName = formatPublicCoupleDisplayName(payload.project);
  const guestDisplayName = formatPublicGuestDisplayName(
    payload.guest.displayName,
  );
  const coupleInitials = formatPublicCoupleInitials(payload.project);
  const formattedEvents = payload.events.map((event, index) => ({
    ...event,
    name: formatPublicEventDisplayName(event, index),
    venueName: formatPublicVenueDisplayName(event.venueName, language),
  }));
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
  const publicGuestToken = guestToken?.trim() ?? "";
  const canRenderDownloads =
    publicGuestToken.length > 0 && downloadableFiles.length > 0;
  const displayedDownloadCount = canRenderDownloads
    ? downloadableFiles.length
    : 0;

  return (
    <div className="public-route min-h-svh bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3">
          {isPreview ? (
            <Alert>
              <ShieldCheckIcon aria-hidden="true" />
              <AlertTitle>
                {isEnglish ? "Preview mode" : "Mode apercu"}
              </AlertTitle>
              <AlertDescription>
                {isEnglish
                  ? "RSVP choices and messages are not saved from this view."
                  : "Les reponses RSVP et les messages ne sont pas enregistres depuis cette vue."}
              </AlertDescription>
            </Alert>
          ) : null}

          {result === "saved" ? (
            <Alert>
              <HeartHandshakeIcon aria-hidden="true" />
              <AlertTitle>RSVP saved.</AlertTitle>
              <AlertDescription>
                {isEnglish
                  ? "Your answer was recorded for this invitation."
                  : "Votre reponse a ete enregistree pour cette invitation."}
              </AlertDescription>
            </Alert>
          ) : null}

          {messageResult === "saved" ? (
            <Alert>
              <MessageSquareTextIcon aria-hidden="true" />
              <AlertTitle>{labels.messageSavedAlert}</AlertTitle>
              <AlertDescription>
                {isEnglish
                  ? "The couple will see it after the Diginoces review step."
                  : "Le couple le verra apres la verification Diginoces."}
              </AlertDescription>
            </Alert>
          ) : null}

          {messageResult && messageResult !== "saved" ? (
            <Alert variant="destructive">
              <MessageSquareTextIcon aria-hidden="true" />
              <AlertTitle>
                {isEnglish ? "Message not saved" : "Message non enregistre"}
              </AlertTitle>
              <AlertDescription>
                {messageResultLabel(messageResult, labels)}
              </AlertDescription>
            </Alert>
          ) : null}
        </div>

        <section className="grid min-h-[72svh] items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
          <div className="flex max-w-3xl flex-col gap-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {isEnglish ? "Personal invitation" : "Invitation personnelle"}
              </Badge>
              <Badge variant="outline">
                {formatEventCount(payload.events.length, language)}
              </Badge>
            </div>

            <div className="flex flex-col gap-4">
              <p className="text-sm font-medium text-muted-foreground">
                Diginoces RSVP
              </p>
              <h1 className="max-w-4xl text-5xl leading-none font-semibold tracking-normal text-balance md:text-6xl">
                {coupleDisplayName}
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground text-pretty">
                {guestReadyLine(guestDisplayName, language)}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-1 rounded-lg border bg-card p-4 text-card-foreground">
                <CalendarDaysIcon aria-hidden="true" />
                <strong>{labels.rsvpTitle}</strong>
                <span className="text-sm text-muted-foreground">
                  {isEnglish
                    ? "Reply for each event listed below."
                    : "Repondez pour chaque evenement ci-dessous."}
                </span>
              </div>
              <div className="flex flex-col gap-1 rounded-lg border bg-card p-4 text-card-foreground">
                <FileTextIcon aria-hidden="true" />
                <strong>{labels.filesTitle}</strong>
                <span className="text-sm text-muted-foreground">
                  {isEnglish
                    ? "Open files shared with this guest link."
                    : "Ouvrez les fichiers partages avec ce lien invite."}
                </span>
              </div>
              <div className="flex flex-col gap-1 rounded-lg border bg-card p-4 text-card-foreground">
                <MessageSquareTextIcon aria-hidden="true" />
                <strong>{labels.messageSectionTitle}</strong>
                <span className="text-sm text-muted-foreground">
                  {isEnglish
                    ? "Leave one written note for the couple."
                    : "Laissez un message ecrit pour le couple."}
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border bg-card text-card-foreground">
            {payload.project.couplePhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={coupleDisplayName}
                className="aspect-[4/5] w-full object-cover"
                src={payload.project.couplePhotoUrl}
              />
            ) : (
              <div className="flex aspect-[4/5] items-center justify-center bg-secondary">
                <span className="text-6xl font-semibold text-secondary-foreground">
                  {coupleInitials}
                </span>
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-start">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex flex-col gap-1">
                  <h2 className="text-2xl font-semibold tracking-normal">
                    {labels.rsvpTitle}
                  </h2>
                  <p className="max-w-2xl text-muted-foreground">
                    {isEnglish
                      ? "Confirm your attendance for each event included in this invitation."
                      : "Confirmez votre presence pour chaque evenement de cette invitation."}
                  </p>
                </div>
                <Badge variant="outline">
                  {formatEventCount(payload.events.length, language)}
                </Badge>
              </div>

              {payload.guest.isPrintedOnly ? (
                <Alert>
                  <FileTextIcon aria-hidden="true" />
                  <AlertTitle>
                    {isEnglish ? "Printed reply" : "Reponse imprimee"}
                  </AlertTitle>
                  <AlertDescription>
                    {isEnglish
                      ? "Printed-only RSVP is handled manually by Diginoces or the couple."
                      : "La reponse RSVP imprimee est geree manuellement par Diginoces ou par le couple."}
                  </AlertDescription>
                </Alert>
              ) : null}

              <div className="flex flex-col gap-4">
                {formattedEvents.map((event) => {
                  const currentStatus = event.rsvp?.status ?? "pending";
                  const action = formActionFactory?.(event.eventId);
                  const paymentGate =
                    payload.project.guestPageAccessStatus === "locked"
                      ? "locked"
                      : "unlocked";
                  const replyDeadline = formatReplyDeadline(
                    event.rsvpDeadlineAt,
                    language,
                  );

                  return (
                    <Card key={event.eventId}>
                      <CardHeader>
                        <CardTitle>{event.name}</CardTitle>
                        <CardDescription>
                          {formatDate(event.eventDate, language)} -{" "}
                          {formatTime(event.startsAt, language)}
                        </CardDescription>
                        <CardAction>
                          <Badge variant="secondary">
                            {statusLabel(currentStatus, labels)}
                          </Badge>
                        </CardAction>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-5">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="flex gap-3 rounded-lg border bg-background p-3">
                            <CalendarDaysIcon
                              aria-hidden="true"
                              className="mt-0.5"
                            />
                            <div className="flex flex-col gap-1">
                              <strong>
                                {isEnglish ? "Date and time" : "Date et heure"}
                              </strong>
                              <span className="text-sm text-muted-foreground">
                                {formatDate(event.eventDate, language)} -{" "}
                                {formatTime(event.startsAt, language)}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-3 rounded-lg border bg-background p-3">
                            <MapPinIcon aria-hidden="true" className="mt-0.5" />
                            <div className="flex flex-col gap-1">
                              <strong>{isEnglish ? "Place" : "Lieu"}</strong>
                              <span className="text-sm text-muted-foreground">
                                {event.venueName ??
                                  formatPublicVenueDisplayName(null, language)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {replyDeadline ? (
                          <div className="flex items-start gap-3 rounded-lg bg-muted p-3">
                            <ClockIcon aria-hidden="true" className="mt-0.5" />
                            <p className="text-sm text-muted-foreground">
                              {isEnglish ? "Reply by" : "Repondre avant"}{" "}
                              <strong className="text-foreground">
                                {replyDeadline}
                              </strong>
                            </p>
                          </div>
                        ) : null}

                        <div className="flex flex-wrap gap-2">
                          <Badge>
                            RSVP: {statusLabel(currentStatus, labels)}
                          </Badge>
                          {event.rsvp?.manualReviewRequired ? (
                            <Badge variant="outline">
                              {isEnglish
                                ? "Needs team review"
                                : "Verification necessaire"}
                            </Badge>
                          ) : null}
                        </div>

                        <form action={action} className="flex flex-col gap-3">
                          <input
                            name="preferredLanguage"
                            type="hidden"
                            value={language ?? DEFAULT_GUEST_PAGE_LANGUAGE}
                          />
                          <div className="flex flex-wrap gap-2">
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
                                <Button
                                  disabled={isPreview || !decision.allowed}
                                  key={option.status}
                                  name="response"
                                  type="submit"
                                  value={option.status}
                                  variant={
                                    currentStatus === option.status
                                      ? "default"
                                      : "outline"
                                  }
                                >
                                  {option.label}
                                </Button>
                              );
                            })}
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileTextIcon aria-hidden="true" />
                  {labels.filesTitle}
                </CardTitle>
                <CardDescription>{labels.downloadHelp}</CardDescription>
                <CardAction>
                  <Badge variant="outline">
                    {displayedDownloadCount} {labels.availableDownloads}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardContent>
                {!canRenderDownloads ? (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <DownloadIcon aria-hidden="true" />
                      </EmptyMedia>
                      <EmptyTitle>{labels.downloadPlaceholder}</EmptyTitle>
                      <EmptyDescription>
                        {labels.downloadUnavailableHelp}
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <div className="flex flex-col gap-3">
                    {downloadableFiles.map((file) => (
                      <div
                        className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                        key={file.fileId}
                      >
                        <div className="flex min-w-0 flex-col gap-1">
                          <strong className="break-words">
                            {file.filename}
                          </strong>
                          <span className="text-sm text-muted-foreground">
                            {formatGuestFileCategory(file.category, language)} -{" "}
                            {labels.fileVersionLabel} {file.version}
                          </span>
                          <div className="flex flex-wrap gap-2 pt-1">
                            <Badge variant="secondary">
                              {formatGuestFileType(file.mimeType)}
                            </Badge>
                            <Badge variant="outline">
                              {labels.downloadAction}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          render={
                            <a
                              href={`/api/public/guest/${encodeURIComponent(
                                publicGuestToken,
                              )}/files/${encodeURIComponent(
                                file.fileId,
                              )}/download`}
                            />
                          }
                        >
                          <DownloadIcon
                            data-icon="inline-start"
                            aria-hidden="true"
                          />
                          {labels.downloadAction}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquareTextIcon aria-hidden="true" />
                  {labels.messageSectionTitle}
                </CardTitle>
                <CardDescription>{labels.messageHelp}</CardDescription>
                <CardAction>
                  <Badge>
                    {guestMessageStatusLabel(
                      payload.guestMessage.status,
                      labels,
                    )}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {guestMessageDeadline ? (
                  <Alert>
                    <ClockIcon aria-hidden="true" />
                    <AlertTitle>{labels.messageDeadlineLabel}</AlertTitle>
                    <AlertDescription>
                      {new Intl.DateTimeFormat(
                        language ?? DEFAULT_GUEST_PAGE_LANGUAGE,
                        {
                          dateStyle: "medium",
                          timeStyle: "short",
                        },
                      ).format(new Date(guestMessageDeadline))}
                    </AlertDescription>
                  </Alert>
                ) : null}
                {guestMessageClosed ? (
                  <Alert>
                    <MessageSquareTextIcon aria-hidden="true" />
                    <AlertTitle>
                      {isEnglish ? "Message deadline passed" : "Date depassee"}
                    </AlertTitle>
                    <AlertDescription>
                      {labels.messageDeadlinePassedAlert}
                    </AlertDescription>
                  </Alert>
                ) : null}
                {guestMessageLocked ? (
                  <Alert>
                    <ShieldCheckIcon aria-hidden="true" />
                    <AlertTitle>
                      {labels.messageSubmissionUnavailable}
                    </AlertTitle>
                    <AlertDescription>
                      {labels.messageUnavailableHelp}
                    </AlertDescription>
                  </Alert>
                ) : null}
                {messageFormAction ? (
                  <form action={messageFormAction}>
                    <input
                      name="preferredLanguage"
                      type="hidden"
                      value={language ?? DEFAULT_GUEST_PAGE_LANGUAGE}
                    />
                    <FieldSet>
                      <FieldLegend>{labels.messageSectionTitle}</FieldLegend>
                      <FieldGroup>
                        <Field>
                          <FieldLabel htmlFor="messageText">
                            {labels.messageTextareaLabel}
                          </FieldLabel>
                          <Textarea
                            defaultValue={
                              payload.guestMessage.currentText ?? ""
                            }
                            disabled={!canEditGuestMessage}
                            id="messageText"
                            maxLength={1200}
                            name="messageText"
                            rows={6}
                          />
                          <FieldDescription>
                            {labels.messageHelp}
                          </FieldDescription>
                        </Field>
                      </FieldGroup>
                    </FieldSet>
                    <div className="mt-4">
                      <Button disabled={!canEditGuestMessage} type="submit">
                        {labels.messageSaveButton}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <MessageSquareTextIcon aria-hidden="true" />
                      </EmptyMedia>
                      <EmptyTitle>
                        {labels.messageSubmissionUnavailable}
                      </EmptyTitle>
                      <EmptyDescription>
                        {labels.messageUnavailableHelp}
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                )}
              </CardContent>
            </Card>
          </div>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SparklesIcon aria-hidden="true" />
                  {isEnglish ? "Invitation guide" : "Guide d'invitation"}
                </CardTitle>
                <CardDescription>
                  {isEnglish
                    ? "Everything on this page belongs to this personal guest link."
                    : "Tout sur cette page appartient a ce lien invite personnel."}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">
                    {labels.rsvpTitle}
                  </span>
                  <Badge variant="secondary">
                    {formatEventCount(payload.events.length, language)}
                  </Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">
                    {labels.filesTitle}
                  </span>
                  <Badge variant="secondary">{displayedDownloadCount}</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">
                    {labels.messageTextareaLabel}
                  </span>
                  <Badge variant="outline">
                    {guestMessageStatusLabel(
                      payload.guestMessage.status,
                      labels,
                    )}
                  </Badge>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  {isEnglish
                    ? "Keep this link private. It opens only the guest details connected to this invitation."
                    : "Gardez ce lien prive. Il ouvre uniquement les details invites lies a cette invitation."}
                </p>
              </CardFooter>
            </Card>
          </aside>
        </section>
      </div>
    </div>
  );
}
