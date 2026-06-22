import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ClipboardListIcon,
  MessageSquareTextIcon,
  SendIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { OperationalEmptyState } from "@/components/operational-empty-state";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { buttonVariants } from "@/components/ui/button";
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
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import { redirectToMfaIfStepUpRequired } from "@/lib/auth/mfa-route-guard";
import { listProjectGuests } from "@/lib/guests/guest-service";
import {
  listProjectMessageInvitationOptions,
  listProjectMessageLogs,
  listProjectMessageQueue,
} from "@/lib/messages/message-db";
import {
  formatMessageGuestDisplayName,
  formatMessageLanguage,
  formatStatus,
  sanitizeFeedbackMessage,
} from "@/lib/messages/message-format";
import {
  ProjectAccessError,
  requireProjectPermission,
} from "@/lib/projects/project-api";
import {
  formatProjectCoupleDisplayName,
  formatProjectDisplayReference,
  formatProjectEventDisplayName,
} from "@/lib/projects/project-foundation";
import { getProjectDetails } from "@/lib/projects/project-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prepareProjectMessageAction } from "../actions";
import { SubmitButton } from "../submit-button";

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

const messageTypeOptions = [
  ["invitation", "Invitation"],
  ["invitation_resend", "Invitation resend"],
  ["maybe_follow_up", "Maybe follow-up"],
  ["event_reminder", "Event reminder"],
  ["modification_notice", "Event update"],
  ["manual_custom", "Custom message"],
] as const;

const selectClassName =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50";

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Not scheduled";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Time not recorded";
  }

  return queueTimestampFormatter.format(date);
}

function getStatusBadgeVariant(status: string) {
  if (status === "failed") {
    return "destructive" as const;
  }

  if (status === "sent" || status === "opened_manually") {
    return "default" as const;
  }

  if (status === "skipped") {
    return "outline" as const;
  }

  return "secondary" as const;
}

function getQueueContext(
  item: {
    created_at: string;
    guest_display_name?: string | null;
    message_log_id: string;
    scheduled_for: string | null;
  },
  index: number,
) {
  if (item.guest_display_name) {
    return {
      label: "Guest",
      value: formatMessageGuestDisplayName(
        item.guest_display_name,
        `Guest ${index + 1}`,
      ),
    };
  }

  if (item.scheduled_for) {
    const scheduledDate = new Date(item.scheduled_for);

    if (!Number.isNaN(scheduledDate.getTime())) {
      return {
        label: "Scheduled",
        value: queueTimestampFormatter.format(scheduledDate),
      };
    }
  }

  return {
    label: "Message",
    value: `Prepared message ${index + 1}`,
  };
}

export default async function MessageQueuePage({
  params,
  searchParams,
}: MessageQueuePageProps) {
  const authContext = await getAuthContext();
  const { projectId } = await params;
  const feedbackParams = await searchParams;
  const feedback = {
    messageError: sanitizeFeedbackMessage(feedbackParams.messageError),
  };

  if (authContext.status === "anonymous") {
    redirect(
      buildLoginRedirectPath(
        `/platform/projects/${projectId}/communications/queue`,
      ),
    );
  }

  if (authContext.status === "not_configured") {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2">
          <Badge variant="outline" className="w-fit">
            Prepare messages
          </Badge>
          <h1 className="text-2xl font-semibold tracking-normal text-balance">
            Message queue
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground text-pretty">
            Messages to send will appear after this environment is connected to
            Diginoces access services.
          </p>
        </div>
        <Alert>
          <MessageSquareTextIcon data-icon="inline-start" />
          <AlertTitle>Access setup needed</AlertTitle>
          <AlertDescription>
            Supabase is not configured for this environment, so message
            preparation cannot be loaded yet.
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  const supabase = await createSupabaseServerClient();
  const context = { supabase, user: authContext.user };

  try {
    await requireProjectPermission(context, projectId, "messages.prepare");
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      await redirectToMfaIfStepUpRequired(
        context,
        `/platform/projects/${projectId}/communications/queue`,
        {
          permission: "messages.prepare",
          scope: "project",
          scopeId: projectId,
        },
      );
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
  const projectLabel = formatProjectCoupleDisplayName(details.project, 0);
  const projectReference = formatProjectDisplayReference(details.project, 0);
  const waitingQueueItems = queueItems.filter(
    (item) =>
      item.status !== "sent" &&
      item.status !== "skipped" &&
      item.status !== "failed",
  ).length;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/platform" />}>
              Workspace
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/platform/projects" />}>
              Weddings
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              render={<Link href={`/platform/projects/${projectId}`} />}
            >
              {projectReference.value}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              render={
                <Link href={`/platform/projects/${projectId}/communications`} />
              }
            >
              Messages
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Queue</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Manual send preparation</Badge>
            <Badge variant="outline">{projectLabel}</Badge>
          </div>
          <CardTitle className="text-2xl font-semibold tracking-normal text-balance">
            <h1>Prepare WhatsApp messages</h1>
          </CardTitle>
          <CardDescription className="max-w-3xl text-pretty">
            Choose the guest, event, invitation context, and message type.
            Diginoces prepares the wording; your team still reviews and sends it
            manually.
          </CardDescription>
          <CardAction className="flex flex-wrap gap-2">
            <Link
              className={buttonVariants({ variant: "outline" })}
              href={`/platform/projects/${projectId}/communications`}
            >
              <ArrowLeftIcon data-icon="inline-start" />
              Message overview
            </Link>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href={`/platform/projects/${projectId}/communications/templates`}
            >
              <MessageSquareTextIcon data-icon="inline-start" />
              Wording
            </Link>
          </CardAction>
        </CardHeader>
      </Card>

      {feedback.messageError ? (
        <Alert variant="destructive">
          <TriangleAlertIcon data-icon="inline-start" />
          <AlertTitle>Message was not prepared</AlertTitle>
          <AlertDescription>{feedback.messageError}</AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.96fr)_minmax(360px,0.64fr)]">
        <Card>
          <CardHeader>
            <CardTitle>
              <h2>Prepare one guest message</h2>
            </CardTitle>
            <CardDescription>
              The prepared message can include the guest name, event details,
              invitation reference, and public guest page link.
            </CardDescription>
            <CardAction>
              <Badge variant={hasMessagePrerequisites ? "default" : "outline"}>
                {hasMessagePrerequisites ? "Ready" : "Needs setup"}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            {hasMessagePrerequisites ? (
              <form
                action={prepareMessage}
                aria-label={`Prepare a WhatsApp message for ${projectLabel}`}
                className="flex flex-col gap-5"
              >
                <FieldSet>
                  <FieldLegend>Message context</FieldLegend>
                  <FieldDescription>
                    Select the target and message type before Diginoces creates
                    the final wording.
                  </FieldDescription>
                  <FieldGroup>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="messageType">
                          Message type
                        </FieldLabel>
                        <select
                          className={selectClassName}
                          defaultValue="invitation"
                          id="messageType"
                          name="messageType"
                          required
                        >
                          {messageTypeOptions.map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                        <FieldDescription>
                          Choose the reason this guest is being contacted.
                        </FieldDescription>
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="eventId">Event</FieldLabel>
                        <select
                          className={selectClassName}
                          defaultValue=""
                          id="eventId"
                          name="eventId"
                          required
                        >
                          <option disabled value="">
                            Select an event
                          </option>
                          {details.events.map((event, eventIndex) => (
                            <option key={event.id} value={event.id}>
                              {formatProjectEventDisplayName(event, eventIndex)}
                            </option>
                          ))}
                        </select>
                        <FieldDescription>
                          Event details can be inserted into the prepared text.
                        </FieldDescription>
                      </Field>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="guestId">Guest</FieldLabel>
                        <select
                          className={selectClassName}
                          defaultValue=""
                          id="guestId"
                          name="guestId"
                          required
                        >
                          <option disabled value="">
                            Select a guest
                          </option>
                          {guests.map((guest, guestIndex) => (
                            <option key={guest.id} value={guest.id}>
                              {formatMessageGuestDisplayName(
                                guest.display_name,
                                `Guest ${guestIndex + 1}`,
                              )}
                            </option>
                          ))}
                        </select>
                        <FieldDescription>
                          The guest profile provides name and WhatsApp context.
                        </FieldDescription>
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="invitationId">
                          Invitation
                        </FieldLabel>
                        <select
                          className={selectClassName}
                          id="invitationId"
                          name="invitationId"
                        >
                          <option value="">None</option>
                          {invitations.map((invitation, invitationIndex) => (
                            <option key={invitation.id} value={invitation.id}>
                              {formatStatus(invitation.status)} -{" "}
                              {formatMessageGuestDisplayName(
                                invitation.guest_display_name,
                                `Guest ${invitationIndex + 1}`,
                              )}
                            </option>
                          ))}
                        </select>
                        <FieldDescription>
                          Attach generated invitation context when relevant.
                        </FieldDescription>
                      </Field>
                    </div>
                    <FieldSeparator>Optional details</FieldSeparator>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="publicGuestPageLink">
                          Public guest page link
                        </FieldLabel>
                        <Input
                          id="publicGuestPageLink"
                          name="publicGuestPageLink"
                          placeholder="https://diginoces.com/g/secure-token"
                          type="url"
                        />
                        <FieldDescription>
                          Include only the guest-specific link prepared for this
                          recipient.
                        </FieldDescription>
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="changeReason">
                          Change reason
                        </FieldLabel>
                        <Input
                          id="changeReason"
                          name="changeReason"
                          placeholder="Event time changed"
                        />
                        <FieldDescription>
                          Useful for updates, reminders, and modified event
                          details.
                        </FieldDescription>
                      </Field>
                    </div>
                  </FieldGroup>
                </FieldSet>
                <div className="message-ops__checkpoint">
                  <p className="message-ops__checkpoint-copy">
                    After preparation, the message opens on its detail page for
                    review and manual sending.
                  </p>
                  <SubmitButton
                    ariaLabel={`Prepare a WhatsApp message for ${projectLabel}`}
                    className={buttonVariants()}
                    pendingLabel="Preparing..."
                  >
                    <SendIcon data-icon="inline-start" />
                    Prepare message
                  </SubmitButton>
                </div>
              </form>
            ) : (
              <Alert>
                <TriangleAlertIcon data-icon="inline-start" />
                <AlertTitle>Event and guest setup is needed</AlertTitle>
                <AlertDescription>
                  Add at least one event and one guest before preparing a
                  WhatsApp message.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <h2>Queue health</h2>
            </CardTitle>
            <CardDescription>
              A quick check before the team starts manual sending work.
            </CardDescription>
          </CardHeader>
          <CardContent className="message-ops">
            <dl className="message-ops__grid">
              <div className="message-ops__metric">
                <dt className="message-ops__metric-label">Guests</dt>
                <dd className="message-ops__metric-value">
                  {pluralize(guests.length, "guest")}
                </dd>
                <dd className="message-ops__metric-note">
                  Available recipients
                </dd>
              </div>
              <div className="message-ops__metric">
                <dt className="message-ops__metric-label">Events</dt>
                <dd className="message-ops__metric-value">
                  {pluralize(details.events.length, "event")}
                </dd>
                <dd className="message-ops__metric-note">
                  Message context sources
                </dd>
              </div>
              <div className="message-ops__metric">
                <dt className="message-ops__metric-label">Waiting to send</dt>
                <dd className="message-ops__metric-value">
                  {waitingQueueItems}
                </dd>
                <dd className="message-ops__metric-note">
                  Manual follow-up queue
                </dd>
              </div>
              <div className="message-ops__metric">
                <dt className="message-ops__metric-label">Prepared history</dt>
                <dd className="message-ops__metric-value">
                  {pluralize(logs.length, "message")}
                </dd>
                <dd className="message-ops__metric-note">
                  Recent message records
                </dd>
              </div>
            </dl>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground">
              Sending stays controlled: prepare here, send manually from the
              message detail page, then record the outcome.
            </p>
          </CardFooter>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Messages to send</h2>
          </CardTitle>
          <CardDescription>
            These messages are waiting for manual sending or follow-up.
          </CardDescription>
          <CardAction>
            <Badge variant="secondary">
              {pluralize(queueItems.length, "recent item")}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          {queueItems.length === 0 ? (
            <OperationalEmptyState
              description="Prepared messages that need a manual send or follow-up appear here."
              icon={ClipboardListIcon}
              nextStep="Use the preparation form above when the guest, event, and wording context are ready."
              title="No messages waiting"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Message</TableHead>
                  <TableHead>Context</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queueItems.map((item, itemIndex) => {
                  const context = getQueueContext(item, itemIndex);

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="whitespace-normal">
                        <div className="flex min-w-0 flex-col gap-1">
                          <span className="font-medium">
                            {formatStatus(item.message_type)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatStatus(item.sending_mode)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-normal">
                        <div className="flex min-w-0 flex-col gap-1">
                          <span className="text-xs text-muted-foreground">
                            {context.label}
                          </span>
                          <span>{context.value}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(item.status)}>
                          {formatStatus(item.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(item.scheduled_for)}
                      </TableCell>
                      <TableCell>{item.attempts}</TableCell>
                      <TableCell className="text-right">
                        <Link
                          className={buttonVariants({
                            size: "sm",
                            variant: "outline",
                          })}
                          href={`/platform/projects/${projectId}/communications/${item.message_log_id}`}
                        >
                          Open
                          <ArrowRightIcon data-icon="inline-end" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Prepared message history</h2>
          </CardTitle>
          <CardDescription>
            Open any prepared message to review the text and record the final
            manual sending result.
          </CardDescription>
          <CardAction>
            <Badge variant="secondary">
              {pluralize(logs.length, "recent message")}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <OperationalEmptyState
              description="Prepared messages create the review trail before the team opens WhatsApp and records the result."
              icon={MessageSquareTextIcon}
              nextStep="Use the form above to prepare the first guest message."
              title="No messages prepared yet"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Message</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prepared</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log, logIndex) => {
                  const guestLabel = formatMessageGuestDisplayName(
                    log.guest_display_name,
                    `Guest ${logIndex + 1}`,
                  );

                  return (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-normal font-medium">
                        {formatStatus(log.message_type)}
                      </TableCell>
                      <TableCell className="whitespace-normal">
                        {guestLabel}
                      </TableCell>
                      <TableCell>
                        {formatMessageLanguage(log.language)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(log.status)}>
                          {formatStatus(log.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(log.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          className={buttonVariants({
                            size: "sm",
                            variant: "outline",
                          })}
                          href={`/platform/projects/${projectId}/communications/${log.id}`}
                        >
                          Review
                          <ArrowRightIcon data-icon="inline-end" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
