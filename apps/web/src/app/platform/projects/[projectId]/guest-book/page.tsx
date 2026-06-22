import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  DownloadIcon,
  HeartHandshakeIcon,
  MessageSquareTextIcon,
  ShieldCheckIcon,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAnyGuestBookPagePermission } from "@/lib/guest-wishes/guest-wish-api";
import {
  listGuestBookExports,
  listGuestMessagesForPermissions,
} from "@/lib/guest-wishes/guest-wish-db";
import { resolveGuestWishProjectPageContext } from "@/lib/guest-wishes/guest-wish-page-context";
import {
  formatProjectCoupleDisplayName,
  formatProjectDisplayReference,
  isInternalProjectDisplayText,
} from "@/lib/projects/project-foundation";
import { getProjectDetails } from "@/lib/projects/project-service";
import { ConfirmSubmitButton } from "./confirm-submit-button";
import { exportGuestBookAction, moderateGuestMessageAction } from "./actions";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    projectId: string;
  }>;
  searchParams: Promise<{
    rows?: string;
    status?: string;
  }>;
};

function publicMessageText(
  value: string | null | undefined,
  fallback = "Waiting for review",
) {
  if (!value || isInternalProjectDisplayText(value)) {
    return fallback;
  }

  return value;
}

function guestBookGuestName(value: string, index: number) {
  return isInternalProjectDisplayText(value) ? `Guest ${index + 1}` : value;
}

function guestBookEventName(message: unknown) {
  if (typeof message !== "object" || message === null) {
    return null;
  }

  const record = message as { eventName?: unknown };

  if (
    typeof record.eventName !== "string" ||
    isInternalProjectDisplayText(record.eventName)
  ) {
    return null;
  }

  return record.eventName;
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function formatLabel(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return value
    .replaceAll("_", " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bCsv\b/g, "CSV")
    .replace(/\bId\b/g, "ID");
}

function formatDateTime(value: string | null | undefined) {
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

function getMessageStatusBadgeVariant(status: string) {
  if (status === "excluded" || status === "flagged") {
    return "destructive" as const;
  }

  if (
    status === "admin_approved" ||
    status === "admin_edited" ||
    status === "couple_approved" ||
    status === "exported"
  ) {
    return "default" as const;
  }

  if (status === "archived") {
    return "outline" as const;
  }

  return "secondary" as const;
}

function guestBookActionNotice(
  status: string | undefined,
  exportedRowCount: number | null,
) {
  if (status === "exported") {
    return {
      description:
        exportedRowCount !== null
          ? `Guest-book export prepared with ${pluralize(exportedRowCount, "row")}.`
          : "Guest-book export prepared.",
      title: "Export prepared",
      variant: "default" as const,
    };
  }

  if (status === "moderated") {
    return {
      description: "Guest-book review saved.",
      title: "Moderation saved",
      variant: "default" as const,
    };
  }

  if (status === "error") {
    return {
      description: "The guest-book action could not be completed.",
      title: "Action did not complete",
      variant: "destructive" as const,
    };
  }

  return null;
}

function parseExportedRowCount(value: string | undefined) {
  if (typeof value !== "string" || !/^(?:0|[1-9]\d*)$/.test(value)) {
    return null;
  }

  const rowCount = Number(value);

  return Number.isFinite(rowCount) ? rowCount : null;
}

export default async function GuestBookPage({
  params,
  searchParams,
}: PageProps) {
  const { projectId } = await params;
  const query = await searchParams;
  const pageContext = await resolveGuestWishProjectPageContext({
    nextPath: `/platform/projects/${projectId}/guest-book`,
    notConfiguredMessage:
      "Guest-book tools are not connected for this workspace yet. Once access is ready, approved wishes and exports will appear here.",
    notConfiguredTitle: "Guest book",
    projectId,
    requirePermission: requireAnyGuestBookPagePermission,
  });

  if (pageContext.status === "not_configured") {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>
              <h1>Keepsake message review</h1>
            </CardTitle>
            <CardDescription>
              Approved wishes and export tools will appear after this
              environment is connected to Diginoces access services.
            </CardDescription>
          </CardHeader>
        </Card>
        <Alert>
          <MessageSquareTextIcon data-icon="inline-start" />
          <AlertTitle>Access setup needed</AlertTitle>
          <AlertDescription>
            Guest-book tools are not connected for this workspace yet.
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  const { permissions, supabase } = pageContext;
  const canModerate = permissions.canModerateMessages;
  const canExport = permissions.canCreateExports;
  const canCoupleReview = permissions.canReviewAsCouple;
  const exportedRowCount = parseExportedRowCount(query.rows);
  const actionNotice = guestBookActionNotice(query.status, exportedRowCount);

  const [projectDetails, messages, exports] = await Promise.all([
    getProjectDetails(supabase, projectId),
    listGuestMessagesForPermissions(supabase, projectId, permissions),
    listGuestBookExports(supabase, projectId),
  ]);

  if (!projectDetails) {
    notFound();
  }

  const projectName = formatProjectCoupleDisplayName(projectDetails.project, 0);
  const projectReference = formatProjectDisplayReference(
    projectDetails.project,
    0,
  );
  const exportAction = exportGuestBookAction.bind(null, projectId);
  const latestMessage = messages[0];
  const latestGuestName = latestMessage
    ? guestBookGuestName(latestMessage.guestDisplayName, 0)
    : "Guest message";
  const latestMessageText = latestMessage
    ? publicMessageText(latestMessage.currentText ?? latestMessage.approvedText)
    : "Approved wishes will appear here as guests share their notes.";
  const pendingMessages = messages.filter(
    (message) => message.status === "pending_review",
  ).length;
  const approvedMessages = messages.filter((message) =>
    ["admin_approved", "admin_edited", "couple_approved", "exported"].includes(
      message.status,
    ),
  ).length;
  const excludedMessages = messages.filter(
    (message) => message.status === "excluded" || message.status === "flagged",
  ).length;
  const latestExport = exports[0];

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
            <BreadcrumbPage>Guest book</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader>
          <CardTitle>
            <h1>Guest-book review for {projectName}</h1>
          </CardTitle>
          <CardDescription>
            Review guest wishes, protect the final keepsake from unsuitable
            text, and prepare approved messages for the design workflow.
          </CardDescription>
          <CardAction className="flex flex-wrap gap-2">
            <Link
              className={buttonVariants({ variant: "outline" })}
              href={`/platform/projects/${projectId}`}
            >
              <ArrowLeftIcon data-icon="inline-start" />
              Project
            </Link>
            {canCoupleReview ? (
              <Link
                className={buttonVariants({ variant: "outline" })}
                href={`/platform/projects/${projectId}/guest-book/couple-review`}
              >
                <HeartHandshakeIcon data-icon="inline-start" />
                Couple review
              </Link>
            ) : null}
            <Link
              className={buttonVariants({ variant: "outline" })}
              href={`/platform/projects/${projectId}/feedback`}
            >
              Event feedback
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant="secondary">Keepsake messages</Badge>
          <Badge variant="outline">{projectName}</Badge>
          <Badge variant={canModerate ? "default" : "outline"}>
            {canModerate ? "Moderation ready" : "View only"}
          </Badge>
          <Badge variant="outline">
            {pluralize(messages.length, "message")}
          </Badge>
        </CardContent>
      </Card>

      {actionNotice ? (
        <Alert variant={actionNotice.variant}>
          {actionNotice.variant === "destructive" ? (
            <TriangleAlertIcon data-icon="inline-start" />
          ) : (
            <CheckCircle2Icon data-icon="inline-start" />
          )}
          <AlertTitle>{actionNotice.title}</AlertTitle>
          <AlertDescription>{actionNotice.description}</AlertDescription>
        </Alert>
      ) : null}

      <section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>
                <h2>Review state</h2>
              </CardTitle>
              <CardDescription>
                The current guest-book workload and export readiness.
              </CardDescription>
              <CardAction>
                <Badge variant="secondary">
                  {pluralize(messages.length, "message")}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="review-board">
              <dl className="review-board__summary">
                <div className="review-board__stat">
                  <dt className="review-board__stat-label">Pending review</dt>
                  <dd className="review-board__stat-value">
                    {pendingMessages}
                  </dd>
                  <dd className="review-board__stat-note">Need a decision</dd>
                </div>
                <div className="review-board__stat">
                  <dt className="review-board__stat-label">Approved</dt>
                  <dd className="review-board__stat-value">
                    {approvedMessages}
                  </dd>
                  <dd className="review-board__stat-note">
                    Eligible for keepsake work
                  </dd>
                </div>
                <div className="review-board__stat">
                  <dt className="review-board__stat-label">
                    Excluded or flagged
                  </dt>
                  <dd className="review-board__stat-value">
                    {excludedMessages}
                  </dd>
                  <dd className="review-board__stat-note">
                    Kept out of the export
                  </dd>
                </div>
                <div className="review-board__stat">
                  <dt className="review-board__stat-label">Prepared exports</dt>
                  <dd className="review-board__stat-value">{exports.length}</dd>
                  <dd className="review-board__stat-note">
                    CSV versions tracked
                  </dd>
                </div>
              </dl>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="review-board__lane">
                  <div className="review-board__lane-header">
                    <p className="review-board__lane-title">Review first</p>
                    <Badge variant="secondary">
                      {pluralize(pendingMessages, "note")}
                    </Badge>
                  </div>
                  <p className="review-board__lane-copy">
                    Start with messages that still need a moderation decision
                    before the couple or design team sees them.
                  </p>
                </div>
                <div className="review-board__lane">
                  <div className="review-board__lane-header">
                    <p className="review-board__lane-title">
                      Protect the keepsake
                    </p>
                    <Badge variant="outline">
                      {pluralize(excludedMessages, "held note")}
                    </Badge>
                  </div>
                  <p className="review-board__lane-copy">
                    Flagged or excluded messages remain visible for audit, but
                    stay out of the export.
                  </p>
                </div>
                <div className="review-board__lane">
                  <div className="review-board__lane-header">
                    <p className="review-board__lane-title">
                      Prepare design handoff
                    </p>
                    <Badge variant="outline">
                      {latestExport
                        ? `Version ${latestExport.version}`
                        : "No export"}
                    </Badge>
                  </div>
                  <p className="review-board__lane-copy">
                    Create the CSV only after the review queue is ready for the
                    final guest-book layout.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <h2>Messages for the keepsake</h2>
              </CardTitle>
              <CardDescription>
                Review each guest note before it is included in the final
                guest-book export.
              </CardDescription>
              <CardAction>
                <Badge variant="secondary">
                  {pluralize(messages.length, "message")}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              {messages.length === 0 ? (
                <OperationalEmptyState
                  description="Guest wishes appear here after guests submit messages from their public page."
                  icon={MessageSquareTextIcon}
                  nextStep="Share guest pages through the approved communication flow, then review each submitted message before export."
                  title="No keepsake messages yet"
                />
              ) : (
                <div className="review-board__message-list">
                  {messages.map((message, messageIndex) => {
                    const guestName = guestBookGuestName(
                      message.guestDisplayName,
                      messageIndex,
                    );
                    const messageText = publicMessageText(
                      message.currentText ?? message.approvedText,
                    );
                    const eventName = guestBookEventName(message);

                    return (
                      <article
                        aria-label={`Guest-book message from ${guestName}`}
                        className="review-board__message"
                        key={message.id}
                      >
                        <div className="review-board__message-header">
                          <div className="flex min-w-0 flex-col gap-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="review-board__message-title">
                                {guestName}
                              </h3>
                              {eventName ? (
                                <Badge variant="outline">{eventName}</Badge>
                              ) : null}
                            </div>
                            <p className="review-board__message-meta">
                              Submitted {formatDateTime(message.submittedAt)}
                            </p>
                          </div>
                          <Badge
                            variant={getMessageStatusBadgeVariant(
                              message.status,
                            )}
                          >
                            {formatLabel(message.status)}
                          </Badge>
                        </div>
                        <blockquote className="review-board__quote text-pretty">
                          {messageText}
                        </blockquote>
                        {canModerate ? (
                          <form
                            action={moderateGuestMessageAction.bind(
                              null,
                              projectId,
                            )}
                            className="review-board__actions"
                          >
                            <input
                              name="messageId"
                              type="hidden"
                              value={message.id}
                            />
                            <input
                              name="approvedText"
                              type="hidden"
                              value={
                                message.approvedText ??
                                message.currentText ??
                                ""
                              }
                            />
                            <button
                              aria-label={`Approve guest-book message from ${guestName}`}
                              className={buttonVariants({
                                size: "sm",
                                variant: "outline",
                              })}
                              name="action"
                              type="submit"
                              value="approve"
                            >
                              Approve
                            </button>
                            <ConfirmSubmitButton
                              aria-label={`Exclude guest-book message from ${guestName}`}
                              className={buttonVariants({
                                size: "sm",
                                variant: "destructive",
                              })}
                              message="Exclude this message from the guest-book export?"
                              name="action"
                              type="submit"
                              value="exclude"
                            >
                              Exclude
                            </ConfirmSubmitButton>
                          </form>
                        ) : (
                          <p className="review-board__message-meta">
                            Review decisions are visible to users with
                            moderation access.
                          </p>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>
                <h2>Latest note</h2>
              </CardTitle>
              <CardDescription>
                A quick read of the newest guest-book submission.
              </CardDescription>
              <CardAction>
                <Badge variant="outline">{latestGuestName}</Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <blockquote className="review-board__quote text-pretty">
                {latestMessageText}
              </blockquote>
            </CardContent>
          </Card>

          <Alert>
            <ShieldCheckIcon data-icon="inline-start" />
            <AlertTitle>Export only approved messages</AlertTitle>
            <AlertDescription>
              Excluded and flagged messages stay visible for review but are kept
              out of keepsake exports.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>
                <h2>Export readiness</h2>
              </CardTitle>
              <CardDescription>
                Prepare a CSV once the review queue is ready for design work.
              </CardDescription>
            </CardHeader>
            <CardContent className="review-board">
              <dl className="review-board__summary">
                <div className="review-board__stat">
                  <dt className="review-board__stat-label">Latest export</dt>
                  <dd className="review-board__stat-value">
                    {latestExport
                      ? `Version ${latestExport.version}`
                      : "Not prepared"}
                  </dd>
                </div>
                <div className="review-board__stat">
                  <dt className="review-board__stat-label">Rows</dt>
                  <dd className="review-board__stat-value">
                    {latestExport
                      ? pluralize(latestExport.rowCount, "row")
                      : "No rows"}
                  </dd>
                </div>
              </dl>
            </CardContent>
            {canExport ? (
              <CardFooter>
                <form action={exportAction}>
                  <button
                    aria-label={`Prepare keepsake CSV export for ${projectName}`}
                    className={buttonVariants()}
                    type="submit"
                  >
                    <DownloadIcon data-icon="inline-start" />
                    Prepare keepsake CSV
                  </button>
                </form>
              </CardFooter>
            ) : null}
          </Card>
        </div>
      </section>

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>
            <h2>Export history</h2>
          </CardTitle>
          <CardDescription>
            Track CSV files used to assemble the final keepsake design.
          </CardDescription>
          <CardAction>
            <Badge variant="secondary">
              {pluralize(exports.length, "prepared export")}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          {exports.length === 0 ? (
            <OperationalEmptyState
              description="Approved guest-book messages can be packaged into a CSV for the keepsake design workflow."
              icon={DownloadIcon}
              nextStep="Approve the messages that belong in the final keepsake, then prepare the CSV export."
              title="No export prepared"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rows</TableHead>
                  <TableHead>Excluded</TableHead>
                  <TableHead>Prepared</TableHead>
                  <TableHead>Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exports.map((exportRow) => (
                  <TableRow key={exportRow.id}>
                    <TableCell className="whitespace-normal font-medium">
                      {exportRow.filename}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          exportRow.status === "failed"
                            ? "destructive"
                            : "outline"
                        }
                      >
                        {formatLabel(exportRow.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {pluralize(exportRow.rowCount, "row")}
                    </TableCell>
                    <TableCell>
                      {pluralize(exportRow.excludedCount, "message")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(exportRow.generatedAt)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={exportRow.isActive ? "default" : "outline"}
                      >
                        {exportRow.isActive ? "Active" : "Archived"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
