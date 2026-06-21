import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  ExternalLinkIcon,
  MessageSquareTextIcon,
  SendIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
  XCircleIcon,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import { redirectToMfaIfStepUpRequired } from "@/lib/auth/mfa-route-guard";
import { getMessageLogDetails } from "@/lib/messages/message-db";
import {
  formatMessageBodyPreview,
  formatMessageGuestDisplayName,
  formatMessageLanguage,
  formatMessageWhatsappNumber,
  formatStatus,
  publicManualWhatsappUrl,
  sanitizeFeedbackMessage,
} from "@/lib/messages/message-format";
import {
  hasProjectPermission,
  ProjectAccessError,
  requireProjectPermission,
} from "@/lib/projects/project-api";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { markProjectMessageStatusAction } from "../actions";
import { SubmitButton } from "../submit-button";

export const dynamic = "force-dynamic";

const allowedFeedbackStatuses = new Set([
  "failed",
  "opened_manually",
  "resent",
  "sent",
  "skipped",
]);

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

function sanitizeFeedbackStatus(value: string | undefined) {
  return value && allowedFeedbackStatuses.has(value) ? value : undefined;
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

function formatDateTime(value: string | null) {
  if (!value) {
    return "Not recorded";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Time not recorded";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function MessageLogDetailPage({
  params,
  searchParams,
}: MessageLogDetailPageProps) {
  const authContext = await getAuthContext();
  const { messageLogId, projectId } = await params;
  const feedbackParams = await searchParams;
  const feedback = {
    messageError: sanitizeFeedbackMessage(feedbackParams.messageError),
    messageStatus: sanitizeFeedbackStatus(feedbackParams.messageStatus),
  };

  if (authContext.status === "anonymous") {
    redirect(
      buildLoginRedirectPath(
        `/platform/projects/${projectId}/communications/${messageLogId}`,
      ),
    );
  }

  if (authContext.status === "not_configured") {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2">
          <Badge variant="outline" className="w-fit">
            Prepared message
          </Badge>
          <h1 className="text-2xl font-semibold tracking-normal text-balance">
            Message details
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground text-pretty">
            Message details will appear after this environment is connected to
            Diginoces access services.
          </p>
        </div>
        <Alert>
          <MessageSquareTextIcon data-icon="inline-start" />
          <AlertTitle>Access setup needed</AlertTitle>
          <AlertDescription>
            Supabase is not configured for this environment, so this prepared
            message cannot be loaded yet.
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  const supabase = await createSupabaseServerClient();
  const context = { supabase, user: authContext.user };

  try {
    await requireProjectPermission(context, projectId, "messages.read");
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      await redirectToMfaIfStepUpRequired(
        context,
        `/platform/projects/${projectId}/communications/${messageLogId}`,
        {
          permission: "messages.read",
          scope: "project",
          scopeId: projectId,
        },
      );
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
  const guestLabel = formatMessageGuestDisplayName(
    messageLog.guest_display_name,
  );
  const messageContext = `${formatStatus(messageLog.message_type)} for ${guestLabel}`;
  const manualWhatsappUrl = publicManualWhatsappUrl(
    messageLog.manual_whatsapp_url,
  );

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
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
              Project
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
            <BreadcrumbPage>
              {formatStatus(messageLog.message_type)}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={getStatusBadgeVariant(messageLog.status)}>
              {formatStatus(messageLog.status)}
            </Badge>
            <Badge variant="outline">
              {formatMessageLanguage(messageLog.language)}
            </Badge>
            <Badge variant="secondary">{guestLabel}</Badge>
          </div>
          <CardTitle className="text-2xl font-semibold tracking-normal text-balance">
            <h1>{formatStatus(messageLog.message_type)}</h1>
          </CardTitle>
          <CardDescription className="max-w-3xl text-pretty">
            Review the exact WhatsApp text for {guestLabel}, open WhatsApp only
            when ready, then record the result so the team can follow up
            confidently.
          </CardDescription>
          <CardAction className="flex flex-wrap gap-2">
            <Link
              className={buttonVariants({ variant: "outline" })}
              href={`/platform/projects/${projectId}/communications/queue`}
            >
              <ArrowLeftIcon data-icon="inline-start" />
              Queue
            </Link>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href={`/platform/projects/${projectId}/communications`}
            >
              Message overview
            </Link>
          </CardAction>
        </CardHeader>
      </Card>

      {feedback.messageError ? (
        <Alert variant="destructive">
          <TriangleAlertIcon data-icon="inline-start" />
          <AlertTitle>Message status was not updated</AlertTitle>
          <AlertDescription>{feedback.messageError}</AlertDescription>
        </Alert>
      ) : null}

      {feedback.messageStatus ? (
        <Alert>
          <CheckCircle2Icon data-icon="inline-start" />
          <AlertTitle>Status recorded</AlertTitle>
          <AlertDescription>
            Message status updated to {formatStatus(feedback.messageStatus)}.
          </AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>
              <h2>Prepared message</h2>
            </CardTitle>
            <CardDescription>
              Confirm the recipient, wording version, and final text before any
              manual send.
            </CardDescription>
            <CardAction>
              <Badge variant={getStatusBadgeVariant(messageLog.status)}>
                {formatStatus(messageLog.status)}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="message-ops">
            <dl className="message-ops__grid">
              <div className="message-ops__metric">
                <dt className="message-ops__metric-label">WhatsApp number</dt>
                <dd className="message-ops__metric-value">
                  {formatMessageWhatsappNumber(
                    messageLog.target_whatsapp_number,
                  )}
                </dd>
                <dd className="message-ops__metric-note">Recipient channel</dd>
              </div>
              <div className="message-ops__metric">
                <dt className="message-ops__metric-label">Wording version</dt>
                <dd className="message-ops__metric-value">
                  {messageLog.template_version ?? "Unassigned"}
                </dd>
                <dd className="message-ops__metric-note">
                  Template used for rendering
                </dd>
              </div>
              <div className="message-ops__metric">
                <dt className="message-ops__metric-label">WhatsApp opened</dt>
                <dd className="message-ops__metric-value">
                  {formatDateTime(messageLog.opened_at)}
                </dd>
                <dd className="message-ops__metric-note">Manual app handoff</dd>
              </div>
              <div className="message-ops__metric">
                <dt className="message-ops__metric-label">Sent result</dt>
                <dd className="message-ops__metric-value">
                  {formatDateTime(messageLog.sent_at)}
                </dd>
                <dd className="message-ops__metric-note">
                  Final recorded outcome
                </dd>
              </div>
            </dl>
            <div className="message-ops__preview">
              <pre>
                {formatMessageBodyPreview(
                  messageLog.rendered_body,
                  "Prepared message preview is hidden for this sample workspace record.",
                )}
              </pre>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>
                <h2>Delivery summary</h2>
              </CardTitle>
              <CardDescription>
                Current send state for this guest message.
              </CardDescription>
            </CardHeader>
            <CardContent className="message-ops">
              <dl className="message-ops__grid">
                <div className="message-ops__metric">
                  <dt className="message-ops__metric-label">Channel</dt>
                  <dd className="message-ops__metric-value">
                    {formatStatus(messageLog.channel)}
                  </dd>
                  <dd className="message-ops__metric-note">
                    Communication channel
                  </dd>
                </div>
                <div className="message-ops__metric">
                  <dt className="message-ops__metric-label">Mode</dt>
                  <dd className="message-ops__metric-value">
                    {formatStatus(messageLog.sending_mode)}
                  </dd>
                  <dd className="message-ops__metric-note">
                    Sending remains manual
                  </dd>
                </div>
                <div className="message-ops__metric">
                  <dt className="message-ops__metric-label">Prepared</dt>
                  <dd className="message-ops__metric-value">
                    {formatDateTime(messageLog.created_at)}
                  </dd>
                  <dd className="message-ops__metric-note">
                    Message creation time
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Alert>
            <ShieldCheckIcon data-icon="inline-start" />
            <AlertTitle>Manual sending checkpoint</AlertTitle>
            <AlertDescription>
              Opening WhatsApp does not mark the message as sent. Record the
              final outcome after the team completes the manual step.
            </AlertDescription>
          </Alert>
        </div>
      </section>

      {canSend ? (
        <Card>
          <CardHeader>
            <CardTitle>
              <h2>Send and record outcome</h2>
            </CardTitle>
            <CardDescription>
              Open WhatsApp when a link is available, then mark the result so
              operations can follow up accurately.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-wrap gap-2">
              {manualWhatsappUrl ? (
                <a
                  className={buttonVariants()}
                  href={manualWhatsappUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <ExternalLinkIcon data-icon="inline-start" />
                  Open WhatsApp
                </a>
              ) : null}
              <form action={markOpened}>
                <SubmitButton
                  ariaLabel={`Mark WhatsApp opened for ${messageContext}`}
                  className={buttonVariants({ variant: "outline" })}
                >
                  <ExternalLinkIcon data-icon="inline-start" />
                  Mark opened
                </SubmitButton>
              </form>
              <form action={markSent}>
                <SubmitButton
                  ariaLabel={`Mark sent for ${messageContext}`}
                  className={buttonVariants({ variant: "outline" })}
                >
                  <SendIcon data-icon="inline-start" />
                  Mark sent
                </SubmitButton>
              </form>
            </div>

            <FieldSet>
              <FieldLegend>Exceptions</FieldLegend>
              <FieldDescription>
                Failed or skipped messages need a reason so another team member
                understands what happened.
              </FieldDescription>
              <FieldGroup className="grid gap-4 md:grid-cols-2">
                <form
                  action={markFailed}
                  aria-label={`Mark failed for ${messageContext}`}
                  className="message-ops__exception"
                >
                  <Field>
                    <FieldLabel htmlFor="failureReason">
                      Failure reason
                    </FieldLabel>
                    <Input
                      id="failureReason"
                      name="reason"
                      placeholder="Wrong number provided"
                      required
                    />
                    <FieldDescription>
                      Use when the message could not be sent.
                    </FieldDescription>
                  </Field>
                  <SubmitButton
                    ariaLabel={`Mark failed for ${messageContext}`}
                    className={buttonVariants({ variant: "destructive" })}
                  >
                    <XCircleIcon data-icon="inline-start" />
                    Mark failed
                  </SubmitButton>
                </form>
                <form
                  action={markSkipped}
                  aria-label={`Mark skipped for ${messageContext}`}
                  className="message-ops__exception"
                >
                  <Field>
                    <FieldLabel htmlFor="skipReason">Skip reason</FieldLabel>
                    <Input
                      id="skipReason"
                      name="reason"
                      placeholder="Guest prefers printed invitation only"
                      required
                    />
                    <FieldDescription>
                      Use when the team intentionally does not send.
                    </FieldDescription>
                  </Field>
                  <SubmitButton
                    ariaLabel={`Mark skipped for ${messageContext}`}
                    className={buttonVariants({ variant: "outline" })}
                  >
                    Mark skipped
                  </SubmitButton>
                </form>
              </FieldGroup>
            </FieldSet>
          </CardContent>
        </Card>
      ) : (
        <Alert>
          <ShieldCheckIcon data-icon="inline-start" />
          <AlertTitle>Outcome recording is restricted</AlertTitle>
          <AlertDescription>
            Your role can read this prepared message, but only authorized team
            members can open the sending controls and record outcomes.
          </AlertDescription>
        </Alert>
      )}
    </main>
  );
}
