import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  HistoryIcon,
  MessageSquareTextIcon,
  SendIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoHint } from "@/components/info-hint";
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
import { Separator } from "@/components/ui/separator";
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
import { getProjectMessageOverview } from "@/lib/messages/message-db";
import {
  formatMessageGuestDisplayName,
  formatMessageLanguage,
  formatStatus,
} from "@/lib/messages/message-format";
import {
  hasProjectPermission,
  ProjectAccessError,
  requireProjectPermission,
} from "@/lib/projects/project-api";
import {
  formatProjectCoupleDisplayName,
  formatProjectDisplayReference,
} from "@/lib/projects/project-foundation";
import { getProjectDetails } from "@/lib/projects/project-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type CommunicationsPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

const visibleQueueItems = 8;
const visibleLogs = 10;

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Time not recorded";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
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

export default async function CommunicationsPage({
  params,
}: CommunicationsPageProps) {
  const authContext = await getAuthContext();
  const { projectId } = await params;

  if (authContext.status === "anonymous") {
    redirect(
      buildLoginRedirectPath(`/platform/projects/${projectId}/communications`),
    );
  }

  if (authContext.status === "not_configured") {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2">
          <Badge variant="outline" className="w-fit">
            Communications
          </Badge>
          <h1 className="text-2xl font-semibold tracking-normal text-balance">
            WhatsApp preparation
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground text-pretty">
            Communication history will appear after this environment is
            connected to Diginoces access services.
          </p>
        </div>
        <Alert>
          <MessageSquareTextIcon data-icon="inline-start" />
          <AlertTitle>Access setup needed</AlertTitle>
          <AlertDescription>
            Supabase is not configured for this environment, so project messages
            cannot be loaded yet.
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
        `/platform/projects/${projectId}/communications`,
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

  const [
    details,
    messageOverview,
    canReadTemplates,
    canManageTemplates,
    canPrepare,
  ] = await Promise.all([
    getProjectDetails(supabase, projectId),
    getProjectMessageOverview(supabase, projectId),
    hasProjectPermission(context, projectId, "message_templates.read"),
    hasProjectPermission(context, projectId, "message_templates.manage"),
    hasProjectPermission(context, projectId, "messages.prepare"),
  ]);

  if (!details) {
    notFound();
  }

  const overview = messageOverview ?? {
    logs: [],
    queueItems: [],
    templates: [],
  };
  const projectLabel = formatProjectCoupleDisplayName(details.project, 0);
  const projectReference = formatProjectDisplayReference(details.project, 0);
  const activeTemplates = overview.templates.filter(
    (template) => template.status === "active",
  ).length;
  const draftTemplates = overview.templates.filter(
    (template) => template.status === "draft",
  ).length;
  const sentLogs = overview.logs.filter((log) => log.status === "sent").length;
  const waitingQueueItems = overview.queueItems.filter(
    (item) =>
      item.status !== "sent" &&
      item.status !== "skipped" &&
      item.status !== "failed",
  ).length;
  const queuePreview = overview.queueItems.slice(0, visibleQueueItems);
  const logPreview = overview.logs.slice(0, visibleLogs);

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
            <BreadcrumbPage>Messages</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Manual WhatsApp workflow</Badge>
            <Badge variant="outline">{projectLabel}</Badge>
          </div>
          <CardTitle className="text-2xl font-semibold tracking-normal text-balance">
            <h1>Messages for {projectLabel}</h1>
          </CardTitle>
          <CardDescription className="max-w-3xl text-pretty">
            Prepare guest messages, review them, and record manual sending.
          </CardDescription>
          <CardAction className="flex flex-wrap gap-2">
            <Link
              className={buttonVariants({ variant: "outline" })}
              href={`/platform/projects/${projectId}`}
            >
              <ArrowLeftIcon data-icon="inline-start" />
              Project
            </Link>
            {canReadTemplates || canManageTemplates ? (
              <Link
                className={buttonVariants({ variant: "outline" })}
                href={`/platform/projects/${projectId}/communications/templates`}
              >
                <MessageSquareTextIcon data-icon="inline-start" />
                Wording
              </Link>
            ) : null}
            {canPrepare ? (
              <Link
                className={buttonVariants()}
                href={`/platform/projects/${projectId}/communications/queue`}
              >
                <SendIcon data-icon="inline-start" />
                Prepare messages
              </Link>
            ) : null}
          </CardAction>
        </CardHeader>
      </Card>

      <Alert>
        <ShieldCheckIcon data-icon="inline-start" />
        <AlertTitle>WhatsApp sending stays manual</AlertTitle>
        <AlertDescription>
          Diginoces prepares and records messages. The team still opens WhatsApp
          and confirms the outcome.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <h2>Communication state</h2>
            <InfoHint
              label="Communication state guidance"
              text="This compact view shows wording readiness, prepared messages, and work waiting for a manual send."
            />
          </CardTitle>
          <CardAction>
            <Badge variant="outline">Project channel</Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="message-ops">
          <dl className="message-ops__grid">
            <div className="message-ops__metric">
              <dt className="message-ops__metric-label">Saved wording</dt>
              <dd className="message-ops__metric-value">
                {overview.templates.length}
              </dd>
              <dd className="message-ops__metric-note">
                {pluralize(activeTemplates, "active")} ·{" "}
                {pluralize(draftTemplates, "draft")}
              </dd>
            </div>
            <div className="message-ops__metric">
              <dt className="message-ops__metric-label">Prepared messages</dt>
              <dd className="message-ops__metric-value">
                {overview.logs.length}
              </dd>
              <dd className="message-ops__metric-note">
                {pluralize(sentLogs, "marked sent")}
              </dd>
            </div>
            <div className="message-ops__metric">
              <dt className="message-ops__metric-label">Waiting to send</dt>
              <dd className="message-ops__metric-value">{waitingQueueItems}</dd>
              <dd className="message-ops__metric-note">
                Manual follow-up queue
              </dd>
            </div>
            <div className="message-ops__metric">
              <dt className="message-ops__metric-label">Available movement</dt>
              <dd className="message-ops__metric-value">
                {canPrepare ? "Ready" : "Read only"}
              </dd>
              <dd className="message-ops__metric-note">
                Based on your project role
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <h2>Messages waiting for manual action</h2>
              <InfoHint
                label="Queue guidance"
                text="Use this queue to see what needs attention before the team records a final sending result."
              />
            </CardTitle>
            <CardAction>
              <Badge variant="secondary">
                {pluralize(overview.queueItems.length, "queue item")}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            {queuePreview.length === 0 ? (
              <OperationalEmptyState
                action={
                  canPrepare ? (
                    <Link
                      className={buttonVariants({ size: "sm" })}
                      href={`/platform/projects/${projectId}/communications/queue`}
                    >
                      Prepare messages
                    </Link>
                  ) : null
                }
                description="Prepared messages that need a manual WhatsApp send or follow-up appear here."
                icon={SendIcon}
                nextStep={
                  canPrepare
                    ? "Prepare messages when guest pages, templates, and phone numbers are ready."
                    : "You can read communication history only. Ask a project lead to prepare messages."
                }
                title="No messages waiting"
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Message</TableHead>
                    <TableHead>Guest</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queuePreview.map((item, itemIndex) => (
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
                        {formatMessageGuestDisplayName(
                          item.guest_display_name,
                          `Guest ${itemIndex + 1}`,
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(item.status)}>
                          {formatStatus(item.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(item.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
          <CardFooter className="justify-between gap-3">
            <span className="text-sm text-muted-foreground">
              Queue opens the message preparation workspace.
            </span>
            {canPrepare ? (
              <Link
                className={buttonVariants({ variant: "outline" })}
                href={`/platform/projects/${projectId}/communications/queue`}
              >
                Open queue
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            ) : null}
          </CardFooter>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>
                <h2>Wording readiness</h2>
              </CardTitle>
              <CardDescription>
                Templates keep bilingual guest messages consistent.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Active</span>
                <Badge>{activeTemplates}</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Draft</span>
                <Badge variant="secondary">{draftTemplates}</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Total</span>
                <Badge variant="outline">{overview.templates.length}</Badge>
              </div>
            </CardContent>
            {(canReadTemplates || canManageTemplates) && (
              <CardFooter>
                <Link
                  className={buttonVariants({ variant: "outline" })}
                  href={`/platform/projects/${projectId}/communications/templates`}
                >
                  Manage wording
                  <ArrowRightIcon data-icon="inline-end" />
                </Link>
              </CardFooter>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <h2>Good sending rhythm</h2>
                <InfoHint
                  label="Sending rhythm guidance"
                  text="The safest flow is prepare, review, open WhatsApp, then record the result."
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
              <p>
                Use templates for repeatable wording and message logs for
                accountability. A guest should never be marked sent until a team
                member confirms the manual send.
              </p>
              <p>
                If a message fails, record the reason so operations can decide
                whether to correct the number or use a printed invitation path.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Recent communication history</h2>
          </CardTitle>
          <CardDescription>
            Open a prepared message to review its text, WhatsApp link, and final
            recorded outcome.
          </CardDescription>
          <CardAction>
            <Badge variant="secondary">
              {pluralize(overview.logs.length, "recent message")}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          {logPreview.length === 0 ? (
            <OperationalEmptyState
              action={
                canPrepare ? (
                  <Link
                    className={buttonVariants({ size: "sm" })}
                    href={`/platform/projects/${projectId}/communications/queue`}
                  >
                    Open message queue
                  </Link>
                ) : null
              }
              description="Prepared messages build the audit-friendly trail for manual WhatsApp communication."
              icon={HistoryIcon}
              nextStep={
                canPrepare
                  ? "Open the queue to prepare the first guest message for manual sending."
                  : "When messages are prepared by an authorized teammate, the history will appear here."
              }
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
                  <TableHead>Sending</TableHead>
                  <TableHead>Prepared</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logPreview.map((log, logIndex) => {
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
                      <TableCell>
                        <Badge variant="outline">
                          {formatStatus(log.sending_mode)}
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
    </main>
  );
}
