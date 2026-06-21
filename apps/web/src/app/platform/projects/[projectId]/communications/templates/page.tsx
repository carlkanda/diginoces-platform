import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  LanguagesIcon,
  MessageSquareTextIcon,
  PlusIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
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
import { Textarea } from "@/components/ui/textarea";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import { redirectToMfaIfStepUpRequired } from "@/lib/auth/mfa-route-guard";
import { listProjectMessageTemplates } from "@/lib/messages/message-db";
import {
  formatMessageBodyPreview,
  formatMessageLanguage,
  formatStatus,
  sanitizeFeedbackMessage,
} from "@/lib/messages/message-format";
import {
  hasProjectPermission,
  ProjectAccessError,
  requireProjectPermission,
} from "@/lib/projects/project-api";
import {
  formatProjectCoupleDisplayName,
  formatProjectDisplayReference,
  isInternalProjectDisplayText,
} from "@/lib/projects/project-foundation";
import { getProjectDetails } from "@/lib/projects/project-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createMessageTemplateAction } from "../actions";
import { SubmitButton } from "../submit-button";

export const dynamic = "force-dynamic";

type MessageTemplatesPageProps = {
  params: Promise<{
    projectId: string;
  }>;
  searchParams: Promise<{
    messageError?: string;
    messageStatus?: string;
  }>;
};

const defaultTemplateBody =
  "Bonjour {{guest.display_name}}, votre invitation pour {{event.name}} est prete: {{public_guest_page_link}}";

const messageTypeOptions = [
  ["invitation", "Invitation"],
  ["invitation_resend", "Invitation resend"],
  ["rsvp_request", "RSVP request"],
  ["maybe_follow_up", "Maybe follow-up"],
  ["event_reminder", "Event reminder"],
  ["modification_notice", "Event update"],
  ["welcome_table_placeholder", "Welcome and table note"],
  ["manual_custom", "Custom message"],
] as const;

const languageOptions = [
  ["fr", "French"],
  ["en", "English"],
] as const;

const statusOptions = [
  ["active", "Active"],
  ["draft", "Draft"],
  ["inactive", "Inactive"],
] as const;

const selectClassName =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50";

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function templateDisplayTitle(
  title: string,
  messageType: string,
  index: number,
) {
  if (isInternalProjectDisplayText(title)) {
    return `${formatStatus(messageType)} wording ${index + 1}`;
  }

  return title;
}

function formatDateTime(value: string, locale?: string | null) {
  return new Intl.DateTimeFormat(locale ?? "en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getTemplateStatusBadgeVariant(status: string) {
  if (status === "active") {
    return "default" as const;
  }

  if (status === "archived" || status === "inactive") {
    return "outline" as const;
  }

  return "secondary" as const;
}

function getMessageTypeDescription(messageType: string) {
  const descriptions: Record<string, string> = {
    event_reminder: "Event timing and attendance reminders.",
    invitation: "First invitation wording for guests.",
    invitation_resend: "Follow-up wording when an invitation is resent.",
    manual_custom: "One-off wording for a controlled manual message.",
    maybe_follow_up: "Follow-up wording for Maybe RSVP guests.",
    modification_notice: "Event change wording for already-invited guests.",
    rsvp_request: "Reminder wording for guests who still need to respond.",
    welcome_table_placeholder:
      "Placeholder wording for future table or welcome information.",
  };

  return descriptions[messageType] ?? "Reusable wording for guest messages.";
}

export default async function MessageTemplatesPage({
  params,
  searchParams,
}: MessageTemplatesPageProps) {
  const authContext = await getAuthContext();
  const { projectId } = await params;
  const feedbackParams = await searchParams;
  const feedback = {
    messageError: sanitizeFeedbackMessage(feedbackParams.messageError),
    messageStatus: feedbackParams.messageStatus,
  };

  if (authContext.status === "anonymous") {
    redirect(
      buildLoginRedirectPath(
        `/platform/projects/${projectId}/communications/templates`,
      ),
    );
  }

  if (authContext.status === "not_configured") {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2">
          <Badge variant="outline" className="w-fit">
            Message templates
          </Badge>
          <h1 className="text-2xl font-semibold tracking-normal text-balance">
            Message wording
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground text-pretty">
            Saved WhatsApp wording will appear after this environment is
            connected to Diginoces access services.
          </p>
        </div>
        <Alert>
          <MessageSquareTextIcon data-icon="inline-start" />
          <AlertTitle>Access setup needed</AlertTitle>
          <AlertDescription>
            Supabase is not configured for this environment, so message
            templates cannot be loaded yet.
          </AlertDescription>
        </Alert>
      </main>
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
      await redirectToMfaIfStepUpRequired(
        context,
        `/platform/projects/${projectId}/communications/templates`,
        {
          permission: "message_templates.read",
          scope: "project",
          scopeId: projectId,
        },
      );
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
  const activeTemplates = templates.filter(
    (template) => template.status === "active",
  ).length;
  const frenchTemplates = templates.filter(
    (template) => template.language === "fr",
  ).length;
  const englishTemplates = templates.filter(
    (template) => template.language === "en",
  ).length;
  const projectLabel = formatProjectCoupleDisplayName(details.project, 0);
  const projectReference = formatProjectDisplayReference(details.project, 0);

  return (
    <main className="flex w-full flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
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
              {projectLabel}
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
            <BreadcrumbPage>Templates</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              {projectReference.label}: {projectReference.value}
            </Badge>
            <Badge variant="secondary">
              {pluralize(templates.length, "template")}
            </Badge>
            <Badge variant="secondary">
              {pluralize(activeTemplates, "active template")}
            </Badge>
          </div>
          <CardTitle className="text-2xl font-semibold tracking-normal text-balance">
            <h1>Prepare reusable guest message wording</h1>
          </CardTitle>
          <CardDescription className="max-w-3xl text-pretty">
            Keep French and English WhatsApp wording ready for invitations, RSVP
            requests, reminders, follow-ups, and event updates. This page
            prepares text only; sending remains a guided manual workflow.
          </CardDescription>
          <CardAction className="flex flex-wrap gap-2">
            <Link
              aria-label={`Back to message history for ${projectLabel}`}
              className={buttonVariants({ variant: "outline" })}
              href={`/platform/projects/${projectId}/communications`}
            >
              <ArrowLeftIcon data-icon="inline-start" />
              Message history
            </Link>
            <Link
              aria-label={`Open message queue for ${projectLabel}`}
              className={buttonVariants({ variant: "secondary" })}
              href={`/platform/projects/${projectId}/communications/queue`}
            >
              Message queue
            </Link>
          </CardAction>
        </CardHeader>
      </Card>

      {feedback.messageError ? (
        <Alert variant="destructive">
          <TriangleAlertIcon data-icon="inline-start" />
          <AlertTitle>Template was not saved</AlertTitle>
          <AlertDescription>{feedback.messageError}</AlertDescription>
        </Alert>
      ) : null}
      {feedback.messageStatus ? (
        <Alert>
          <CheckCircle2Icon data-icon="inline-start" />
          <AlertTitle>Wording saved</AlertTitle>
          <AlertDescription>
            Review the template before using it to prepare guest messages.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="flex min-w-0 flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>
                <h2 className="flex items-center gap-2">
                  <MessageSquareTextIcon />
                  Template library
                </h2>
              </CardTitle>
              <CardDescription>
                Review reusable wording by purpose, language, version, and
                status before preparing messages.
              </CardDescription>
              <CardAction>
                <Badge variant="outline">
                  {pluralize(templates.length, "saved template")}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              {templates.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <MessageSquareTextIcon />
                    </EmptyMedia>
                    <EmptyTitle>No message wording yet</EmptyTitle>
                    <EmptyDescription>
                      Create reusable wording so operations can prepare guest
                      messages without rewriting the same text each time.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="overflow-x-auto">
                  <Table aria-label={`Message templates for ${projectLabel}`}>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Template</TableHead>
                        <TableHead>Language</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Version</TableHead>
                        <TableHead>Preview</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {templates.map((template, index) => {
                        const title = templateDisplayTitle(
                          template.title,
                          template.message_type,
                          index,
                        );

                        return (
                          <TableRow key={template.id}>
                            <TableCell>
                              <div className="flex min-w-56 flex-col gap-1">
                                <span className="font-medium">{title}</span>
                                <span className="text-xs text-muted-foreground">
                                  {formatStatus(template.message_type)}
                                </span>
                                <span className="text-xs text-muted-foreground text-pretty">
                                  {getMessageTypeDescription(
                                    template.message_type,
                                  )}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {formatMessageLanguage(template.language)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={getTemplateStatusBadgeVariant(
                                  template.status,
                                )}
                              >
                                {formatStatus(template.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex min-w-28 flex-col gap-1">
                                <span className="font-mono text-xs">
                                  v{template.template_version}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  Updated {formatDateTime(template.updated_at)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex min-w-80 flex-col gap-2">
                                <p className="max-w-xl text-sm text-muted-foreground text-pretty">
                                  {formatMessageBodyPreview(template.body)}
                                </p>
                                {template.variables.length > 0 ? (
                                  <div
                                    aria-label={`Variables for ${title}`}
                                    className="flex flex-wrap gap-1.5"
                                  >
                                    {template.variables.map((variable) => (
                                      <Badge key={variable} variant="outline">
                                        {`{{${variable}}}`}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>
                <h2 className="flex items-center gap-2">
                  <LanguagesIcon />
                  Language coverage
                </h2>
              </CardTitle>
              <CardDescription>
                Templates should cover the languages used by guests for this
                wedding.
              </CardDescription>
            </CardHeader>
            <CardContent className="message-ops">
              <dl className="message-ops__grid">
                <div className="message-ops__metric">
                  <dt className="message-ops__metric-label">French wording</dt>
                  <dd className="message-ops__metric-value">
                    {pluralize(frenchTemplates, "template")}
                  </dd>
                  <dd className="message-ops__metric-note">
                    Ready for French guest messages
                  </dd>
                </div>
                <div className="message-ops__metric">
                  <dt className="message-ops__metric-label">English wording</dt>
                  <dd className="message-ops__metric-value">
                    {pluralize(englishTemplates, "template")}
                  </dd>
                  <dd className="message-ops__metric-note">
                    Ready for English guest messages
                  </dd>
                </div>
                <div className="message-ops__metric">
                  <dt className="message-ops__metric-label">Active wording</dt>
                  <dd className="message-ops__metric-value">
                    {pluralize(activeTemplates, "template")}
                  </dd>
                  <dd className="message-ops__metric-note">
                    Available for queue preparation
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Alert>
            <ShieldCheckIcon data-icon="inline-start" />
            <AlertTitle>Manual WhatsApp control</AlertTitle>
            <AlertDescription>
              Templates prepare the text used by the message queue. This page
              does not send WhatsApp messages automatically.
            </AlertDescription>
          </Alert>

          {canManageTemplates ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  <h2 className="flex items-center gap-2">
                    <PlusIcon />
                    Create wording
                  </h2>
                </CardTitle>
                <CardDescription>
                  Add reusable wording for a message type and language. Keep
                  variables intact so Diginoces can insert the right guest,
                  event, and invitation link.
                </CardDescription>
              </CardHeader>
              <form
                action={createTemplate}
                aria-label={`Create message wording for ${projectLabel}`}
              >
                <CardContent>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="messageType">
                        Message purpose
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
                        Choose the workflow where this wording will be used.
                      </FieldDescription>
                    </Field>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="language">Language</FieldLabel>
                        <select
                          className={selectClassName}
                          defaultValue="fr"
                          id="language"
                          name="language"
                          required
                        >
                          {languageOptions.map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="status">Status</FieldLabel>
                        <select
                          className={selectClassName}
                          defaultValue="active"
                          id="status"
                          name="status"
                          required
                        >
                          {statusOptions.map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>

                    <Field>
                      <FieldLabel htmlFor="title">Title</FieldLabel>
                      <Input id="title" name="title" required />
                      <FieldDescription>
                        Use a name your operations team will recognize.
                      </FieldDescription>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="body">Message body</FieldLabel>
                      <Textarea
                        defaultValue={defaultTemplateBody}
                        id="body"
                        name="body"
                        required
                        rows={6}
                      />
                      <FieldDescription>
                        Supported variables include guest, event, and public
                        invitation link fields.
                      </FieldDescription>
                    </Field>
                  </FieldGroup>
                </CardContent>
                <CardFooter>
                  <SubmitButton
                    ariaLabel={`Create message wording for ${projectLabel}`}
                    className={buttonVariants()}
                    pendingLabel="Creating wording..."
                  >
                    <PlusIcon data-icon="inline-start" />
                    Create wording
                  </SubmitButton>
                </CardFooter>
              </form>
            </Card>
          ) : (
            <Alert>
              <MessageSquareTextIcon data-icon="inline-start" />
              <AlertTitle>Read-only access</AlertTitle>
              <AlertDescription>
                You can review saved wording, but template changes require a
                role with message-template management access.
              </AlertDescription>
            </Alert>
          )}
        </aside>
      </div>
    </main>
  );
}
