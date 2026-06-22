import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeftIcon,
  CalendarClockIcon,
  CheckCircle2Icon,
  CircleHelpIcon,
  ClockIcon,
  MessageCircleIcon,
  XCircleIcon,
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
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
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
import { getProjectRsvpSummary } from "@/lib/rsvp/rsvp-db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ProjectRsvpSummaryPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

function formatDeadline(value: string | null, locale?: string | null) {
  if (!value) {
    return "No deadline set";
  }

  return new Intl.DateTimeFormat(locale ?? "en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function followUpLabel(pendingCount: number, reviewCount: number) {
  const needsReply =
    pendingCount > 0
      ? pluralize(pendingCount, "guest still needs", "guests still need")
      : "";
  const needsReview =
    reviewCount > 0 ? pluralize(reviewCount, "guest needs", "guests need") : "";

  if (needsReply && needsReview) {
    return `${needsReply} a reply, and ${needsReview} team review.`;
  }

  if (needsReply) {
    return `${needsReply} a reply.`;
  }

  if (needsReview) {
    return `${needsReview} team review.`;
  }

  return "No follow-up needed for this event right now.";
}

function attentionSummary(count: number) {
  return count === 1
    ? "1 item still needs attention."
    : `${count} items still need attention.`;
}

function formatPercent(numerator: number, denominator: number) {
  if (denominator <= 0) {
    return "0%";
  }

  return `${Math.min(100, Math.round((numerator / denominator) * 100))}%`;
}

export default async function ProjectRsvpSummaryPage({
  params,
}: ProjectRsvpSummaryPageProps) {
  const authContext = await getAuthContext();
  const { projectId } = await params;

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath(`/platform/projects/${projectId}/rsvps`));
  }

  if (authContext.status === "not_configured") {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2">
          <Badge variant="outline" className="w-fit">
            Guest responses
          </Badge>
          <h1 className="text-2xl font-semibold tracking-normal text-balance">
            Response tracking
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground text-pretty">
            RSVP information will appear here after this environment is
            connected to Diginoces access services.
          </p>
        </div>
        <Alert>
          <MessageCircleIcon data-icon="inline-start" />
          <AlertTitle>Access setup needed</AlertTitle>
          <AlertDescription>
            Supabase is not configured for this environment, so response totals
            cannot be loaded yet.
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  const supabase = await createSupabaseServerClient();

  try {
    await requireProjectPermission(
      {
        supabase,
        user: authContext.user,
      },
      projectId,
      "rsvps.read",
    );
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      notFound();
    }

    throw error;
  }

  const [projectDetails, summary] = await Promise.all([
    getProjectDetails(supabase, projectId),
    getProjectRsvpSummary(supabase, projectId),
  ]);

  if (!projectDetails) {
    notFound();
  }

  const totalInvited = summary.reduce(
    (sum, event) => sum + event.invitedCount,
    0,
  );
  const totalYes = summary.reduce((sum, event) => sum + event.yesCount, 0);
  const totalNo = summary.reduce((sum, event) => sum + event.noCount, 0);
  const totalMaybe = summary.reduce((sum, event) => sum + event.maybeCount, 0);
  const totalPending = summary.reduce(
    (sum, event) => sum + event.pendingCount,
    0,
  );
  const totalManualReview = summary.reduce(
    (sum, event) => sum + event.manualReviewCount,
    0,
  );
  const totalAnswered = totalYes + totalNo + totalMaybe;
  const totalFollowUp = totalPending + totalManualReview;
  const projectName = formatProjectCoupleDisplayName(projectDetails.project, 0);
  const projectReference = formatProjectDisplayReference(
    projectDetails.project,
    0,
  );
  const responseRate = formatPercent(totalAnswered, totalInvited);

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
              {projectName}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Guest responses</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader className="has-data-[slot=card-action]:grid-cols-1 sm:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
          <div className="flex max-w-3xl flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                {projectReference.label}: {projectReference.value}
              </Badge>
              <Badge variant={totalFollowUp > 0 ? "secondary" : "default"}>
                {totalFollowUp > 0
                  ? pluralize(totalFollowUp, "follow-up")
                  : "No follow-up"}
              </Badge>
            </div>
            <CardTitle>
              <h1 className="text-2xl font-semibold tracking-normal text-balance">
                Guest responses
              </h1>
            </CardTitle>
            <CardDescription className="max-w-3xl text-pretty">
              Track event-specific RSVP progress, response mix, and the guests
              who still need a reply or team review.
            </CardDescription>
          </div>
          <CardAction className="col-start-1 row-start-auto mt-3 flex flex-wrap gap-2 justify-self-start sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:mt-0 sm:justify-self-end">
            <Link
              aria-label={`Back to project overview for ${projectName}`}
              className={buttonVariants({ variant: "outline" })}
              href={`/platform/projects/${projectId}`}
            >
              <ArrowLeftIcon data-icon="inline-start" />
              Project overview
            </Link>
            <Link
              aria-label={`Open guest list for ${projectName}`}
              className={buttonVariants({ variant: "ghost" })}
              href={`/platform/projects/${projectId}/guests`}
            >
              Guest list
            </Link>
          </CardAction>
        </CardHeader>
      </Card>

      <section className="grid gap-4 lg:grid-cols-4" aria-label="RSVP totals">
        {[
          {
            icon: CalendarClockIcon,
            label: "Event invitations",
            value: totalInvited,
            description: "Invites counted across every event.",
          },
          {
            icon: CheckCircle2Icon,
            label: "Attending",
            value: totalYes,
            description: "Confirmed yes responses.",
          },
          {
            icon: XCircleIcon,
            label: "Cannot attend",
            value: totalNo,
            description: "Guests who replied no.",
          },
          {
            icon: CircleHelpIcon,
            label: "Maybe",
            value: totalMaybe,
            description: "Guests who may need a final check.",
          },
        ].map((item) => (
          <Card key={item.label}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <item.icon data-icon="inline-start" />
                {item.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-normal">
                {item.value}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card>
          <CardHeader>
            <CardTitle>
              <h2 className="text-base font-semibold">Responses by event</h2>
            </CardTitle>
            <CardDescription>
              {pluralize(totalAnswered, "reply", "replies")} received across{" "}
              {pluralize(summary.length, "event")};{" "}
              {totalFollowUp > 0
                ? attentionSummary(totalFollowUp)
                : "nothing needs attention right now."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {summary.length === 0 ? (
              <OperationalEmptyState
                action={
                  <Link
                    className={buttonVariants({ variant: "outline" })}
                    href={`/platform/projects/${projectId}/guests`}
                  >
                    Open guest list
                  </Link>
                }
                description="Event-level response totals appear here after guests receive public page links and submit their choices."
                icon={MessageCircleIcon}
                nextStep="Open the guest list to confirm event assignments, then use guest pages and messages to collect replies."
                title="No response data yet"
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead className="text-right">Invited</TableHead>
                      <TableHead className="text-right">Yes</TableHead>
                      <TableHead className="text-right">No</TableHead>
                      <TableHead className="text-right">Maybe</TableHead>
                      <TableHead className="text-right">Awaiting</TableHead>
                      <TableHead className="text-right">Review</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.map((event, eventIndex) => {
                      const eventName = formatProjectEventDisplayName(
                        { name: event.eventName },
                        eventIndex,
                      );
                      const eventAnswered =
                        event.yesCount + event.noCount + event.maybeCount;

                      return (
                        <TableRow key={event.eventId}>
                          <TableCell>
                            <div className="flex min-w-56 flex-col gap-1">
                              <span className="font-medium">{eventName}</span>
                              <span className="text-sm text-muted-foreground">
                                {followUpLabel(
                                  event.pendingCount,
                                  event.manualReviewCount,
                                )}
                              </span>
                              <div
                                aria-label={`${formatPercent(
                                  eventAnswered,
                                  event.invitedCount,
                                )} response coverage`}
                                className="mt-1 h-2 overflow-hidden rounded-full bg-muted"
                              >
                                <div
                                  className="h-full rounded-full bg-primary"
                                  style={{
                                    width: formatPercent(
                                      eventAnswered,
                                      event.invitedCount,
                                    ),
                                  }}
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="min-w-44 text-muted-foreground">
                            {formatDeadline(
                              event.rsvpDeadlineAt,
                              projectDetails.project.preferred_language,
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {event.invitedCount}
                          </TableCell>
                          <TableCell className="text-right">
                            {event.yesCount}
                          </TableCell>
                          <TableCell className="text-right">
                            {event.noCount}
                          </TableCell>
                          <TableCell className="text-right">
                            {event.maybeCount}
                          </TableCell>
                          <TableCell className="text-right">
                            {event.pendingCount}
                          </TableCell>
                          <TableCell className="text-right">
                            {event.manualReviewCount > 0 ? (
                              <Badge variant="secondary">
                                {event.manualReviewCount}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
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

        <aside className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>
                <h2 className="text-base font-semibold">Response coverage</h2>
              </CardTitle>
              <CardDescription>
                How much of the current invited event list has answered.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-normal">
                {responseRate}
              </div>
              <div
                aria-label={`${responseRate} total response coverage`}
                className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
              >
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: responseRate }}
                />
              </div>
              <dl className="mt-4 grid gap-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Awaiting reply</dt>
                  <dd className="font-medium">{totalPending}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Team review</dt>
                  <dd className="font-medium">{totalManualReview}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Events tracked</dt>
                  <dd className="font-medium">{summary.length}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {totalFollowUp > 0 ? (
            <Alert>
              <ClockIcon data-icon="inline-start" />
              <AlertTitle>Follow-up needed</AlertTitle>
              <AlertDescription>
                Review pending replies and uncertain responses before closing
                event counts.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <CheckCircle2Icon data-icon="inline-start" />
              <AlertTitle>No immediate follow-up</AlertTitle>
              <AlertDescription>
                Current responses do not require team review or guest reply
                follow-up.
              </AlertDescription>
            </Alert>
          )}
        </aside>
      </section>
    </main>
  );
}
