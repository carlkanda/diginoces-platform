import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BarChart3Icon,
  CalendarCheckIcon,
  FileTextIcon,
  ShieldCheckIcon,
  Table2Icon,
  UsersRoundIcon,
} from "lucide-react";

import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import {
  hasEventPermission,
  hasProjectPermission,
  ProjectAccessError,
} from "@/lib/projects/project-api";
import {
  formatProjectCoupleDisplayName,
  formatProjectEventDisplayName,
  formatProjectEventDisplayReference,
  type EventType,
  getEventTypeLabel,
  isInternalProjectDisplayText,
} from "@/lib/projects/project-foundation";
import { requireEventDashboardPermission } from "@/lib/reports/report-api";
import { getEventDashboardOverview } from "@/lib/reports/report-db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
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
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

type DashboardSummarySection = {
  actionHref: string;
  actionLabel: string;
  description: string;
  show: boolean;
  title: string;
  values: Record<string, number>;
};

type ReadinessSignal = {
  detail: string;
  label: string;
  status: string;
  value: number | string;
};

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatLabel(value: string | null | undefined) {
  if (!value) {
    return "None";
  }

  const label = value
    .replaceAll(".", " ")
    .replaceAll("_", " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  return label
    .replace(/\bApi\b/g, "App")
    .replace(/\bCsv\b/g, "CSV")
    .replace(/\bId\b/g, "ID")
    .replace(/\bPdf\b/g, "PDF")
    .replace(/\bQr\b/g, "QR")
    .replace(/\bRsvp\b/g, "RSVP");
}

const dashboardLabelOverrides: Record<string, string> = {
  Arrivals: "Recorded arrivals",
  "Assigned seats/tables": "Assigned seats",
  "Invited guests": "Invited guests",
  "Manual Review Required": "Review needed",
  "RSVP yes": "Attending",
  "Unexpected pending": "Unexpected guests waiting",
  activeAssignments: "Assigned seats",
  arrivedUnits: "Recorded arrivals",
  duplicateScans: "Duplicate scans",
  manualReviewRequired: "Review needed",
  maybe: "Maybe",
  no: "Cannot attend",
  not_generated: "Not generated",
  "Not Generated": "Not generated",
  rsvpYes: "Attending",
  unexpectedPending: "Unexpected guests waiting",
  yes: "Attending",
};

function formatDashboardLabel(value: string | null | undefined) {
  if (!value) {
    return "None";
  }

  return dashboardLabelOverrides[value] ?? formatLabel(value);
}

function formatMetricValue(value: number | string) {
  return typeof value === "number" ? value.toLocaleString("en") : value;
}

function formatVisibility(value: string) {
  switch (value) {
    case "public_safe":
      return "Shared signal";
    case "partner":
      return "Partner signal";
    default:
      return "Internal signal";
  }
}

function totalValues(values: Record<string, number>) {
  return Object.values(values).reduce((total, value) => total + value, 0);
}

function summaryEntries(values: Record<string, number>) {
  return Object.entries(values).sort(([left], [right]) =>
    formatDashboardLabel(left).localeCompare(formatDashboardLabel(right)),
  );
}

function SummaryTable({ values }: { values: Record<string, number> }) {
  const rows = summaryEntries(values);

  if (rows.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BarChart3Icon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>No signal recorded yet</EmptyTitle>
          <EmptyDescription>
            This area will fill in as the event team records activity.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <>
      <div className="grid gap-3 md:hidden">
        {rows.map(([key, value]) => (
          <div className="workflow-tile" key={key}>
            <span className="text-sm font-medium text-muted-foreground">
              {formatDashboardLabel(key)}
            </span>
            <strong className="mt-1 block text-lg">
              {value.toLocaleString("en")}
            </strong>
          </div>
        ))}
      </div>

      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Signal</TableHead>
              <TableHead className="text-right">Count</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(([key, value]) => (
              <TableRow key={key}>
                <TableCell>{formatDashboardLabel(key)}</TableCell>
                <TableCell className="text-right font-medium">
                  {value.toLocaleString("en")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

export default async function EventDashboardPage({ params }: PageProps) {
  const authContext = await getAuthContext();
  const { eventId } = await params;

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath(`/platform/events/${eventId}/dashboard`));
  }

  if (authContext.status === "not_configured") {
    return (
      <main className="flex flex-col gap-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/platform" />}>
                Workspace
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Event dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Card>
          <CardHeader>
            <CardTitle>Event dashboard is waiting for access</CardTitle>
            <CardDescription>
              Event metrics will appear after the workspace connection is ready.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <ShieldCheckIcon aria-hidden="true" />
              <AlertTitle>Connection required</AlertTitle>
              <AlertDescription>
                Dashboard data stays closed until the secure workspace
                connection is available.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </main>
    );
  }

  const supabase = await createSupabaseServerClient();
  const context = { supabase, user: authContext.user };

  try {
    await requireEventDashboardPermission(context, eventId);
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      notFound();
    }

    throw error;
  }

  const overview = await getEventDashboardOverview(supabase, eventId);

  if (!overview) {
    notFound();
  }

  const eventTypeLabel = getEventTypeLabel(
    overview.event.event_type as EventType,
  );
  const fallbackEventName = `${eventTypeLabel} event`;
  const eventName = isInternalProjectDisplayText(overview.event.name)
    ? fallbackEventName
    : formatProjectEventDisplayName(overview.event, 0);
  const eventReference = formatProjectEventDisplayReference(overview.event, 0);
  const eventReferenceValue = eventReference.isCode
    ? eventReference.value
    : fallbackEventName;
  const projectName = overview.project
    ? formatProjectCoupleDisplayName(overview.project, 0)
    : "Wedding project";
  const projectHref = overview.project
    ? `/platform/projects/${overview.project.id}`
    : "/platform/projects";
  const permissionContext = { supabase, user: authContext.user };
  const [canReadRsvps, canReadInvitations, canReadSeating, canReadCheckIn] =
    overview.project
      ? await Promise.all([
          hasProjectPermission(
            permissionContext,
            overview.project.id,
            "rsvps.read",
          ),
          hasProjectPermission(
            permissionContext,
            overview.project.id,
            "invitation_templates.read",
          ),
          hasProjectPermission(
            permissionContext,
            overview.project.id,
            "seating.read",
          ),
          hasEventPermission(permissionContext, eventId, "check_in.read"),
        ])
      : [false, false, false, false];
  const summarySections = (
    [
      {
        actionHref: overview.project
          ? `/platform/projects/${overview.project.id}/rsvps`
          : `/platform/events/${eventId}`,
        actionLabel: "Review RSVPs",
        description: "Current guest replies that affect event attendance.",
        show: canReadRsvps,
        title: "Guest replies",
        values: overview.summaries.rsvps,
      },
      {
        actionHref: `/platform/events/${eventId}/invitations`,
        actionLabel: "Open invitations",
        description:
          "Invitation files and delivery preparation for this event.",
        show: canReadInvitations,
        title: "Invitations",
        values: overview.summaries.invitations,
      },
      {
        actionHref: `/platform/events/${eventId}/seating`,
        actionLabel: "Open seating",
        description: "Table capacity and current seat assignments.",
        show: canReadSeating,
        title: "Seating",
        values: overview.summaries.seating,
      },
      {
        actionHref: `/platform/events/${eventId}/check-in`,
        actionLabel: "Open check-in",
        description: "Arrival activity recorded by the event team.",
        show: canReadCheckIn,
        title: "Arrivals",
        values: overview.summaries.checkIn,
      },
    ] satisfies DashboardSummarySection[]
  ).filter((section) => section.show);
  const readinessSignals = [
    {
      detail: "Rows that need review before response counts are trusted.",
      label: "RSVP review",
      status:
        (overview.summaries.rsvps.manualReviewRequired ?? 0) > 0
          ? "Needs attention"
          : "Clear",
      value: overview.summaries.rsvps.manualReviewRequired ?? 0,
    },
    {
      detail: "Guests with active table assignments for this event.",
      label: "Seat assignments",
      status:
        (overview.summaries.seating.activeAssignments ?? 0) > 0
          ? "In progress"
          : "Not started",
      value: overview.summaries.seating.activeAssignments ?? 0,
    },
    {
      detail: "Guests recorded as arrived by staff or scan workflow.",
      label: "Recorded arrivals",
      status:
        (overview.summaries.checkIn.arrivedUnits ?? 0) > 0
          ? "Active"
          : "No arrivals yet",
      value: overview.summaries.checkIn.arrivedUnits ?? 0,
    },
    {
      detail: "Unexpected guest requests still waiting for a decision.",
      label: "Unexpected guests",
      status:
        (overview.summaries.checkIn.unexpectedPending ?? 0) > 0
          ? "Needs attention"
          : "Clear",
      value: overview.summaries.checkIn.unexpectedPending ?? 0,
    },
  ] satisfies ReadinessSignal[];

  return (
    <main className="flex flex-col gap-6">
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
            <BreadcrumbLink render={<Link href={projectHref} />}>
              {projectName}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              render={<Link href={`/platform/events/${eventId}`} />}
            >
              {eventName}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{eventTypeLabel}</Badge>
            <Badge variant="outline">
              {formatLabel(overview.event.status)}
            </Badge>
            <Badge variant="outline">
              {eventReference.label}: {eventReferenceValue}
            </Badge>
          </div>
          <div className="max-w-3xl">
            <h1 className="text-3xl font-semibold tracking-normal text-balance">
              Event operations dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground text-pretty">
              Review RSVP, invitation, seating, and arrival signals for{" "}
              {eventName}. Use this page to decide where the event team should
              focus next.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              render={<Link href={`/platform/events/${eventId}`} />}
            >
              <ArrowLeftIcon aria-hidden="true" data-icon="inline-start" />
              Event workspace
            </Button>
            <Button
              variant="outline"
              render={<Link href={`/platform/reports?eventId=${eventId}`} />}
            >
              <FileTextIcon aria-hidden="true" data-icon="inline-start" />
              Reports
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dashboard snapshot</CardTitle>
            <CardDescription>
              The current event signal set and refresh evidence.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Generated</span>
              <strong className="text-right">
                {formatDateTime(overview.generatedAt)}
              </strong>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Signals</span>
              <strong>{pluralize(overview.metrics.length, "signal")}</strong>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Scope</span>
              <strong>{formatLabel(overview.scope)}</strong>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Wedding</span>
              <strong className="text-right">{projectName}</strong>
            </div>
          </CardContent>
        </Card>
      </section>

      <Alert>
        <ShieldCheckIcon aria-hidden="true" />
        <AlertTitle>Dashboard access is event-scoped</AlertTitle>
        <AlertDescription>
          This view combines only the event signals your role may read. Use the
          linked event workspace when you need to continue into an operational
          area.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="signals" className="gap-4">
        <TabsList>
          <TabsTrigger value="signals">
            <BarChart3Icon aria-hidden="true" data-icon="inline-start" />
            Signals
          </TabsTrigger>
          <TabsTrigger value="areas">
            <Table2Icon aria-hidden="true" data-icon="inline-start" />
            Areas
          </TabsTrigger>
          <TabsTrigger value="readiness">
            <CalendarCheckIcon aria-hidden="true" data-icon="inline-start" />
            Readiness
          </TabsTrigger>
        </TabsList>

        <TabsContent value="signals">
          <Card>
            <CardHeader>
              <CardTitle>Event signals</CardTitle>
              <CardDescription>
                Comparable event-level measures for quick operational review.
              </CardDescription>
              <CardAction>
                <Badge variant="secondary">
                  {overview.metrics.length} visible
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              {overview.metrics.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <BarChart3Icon aria-hidden="true" />
                    </EmptyMedia>
                    <EmptyTitle>No event signals yet</EmptyTitle>
                    <EmptyDescription>
                      Signals will appear after RSVP, seating, invitation, or
                      arrival activity is recorded for this event.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <>
                  <div className="grid gap-3 md:hidden">
                    {overview.metrics.map((metric) => (
                      <div className="workflow-record" key={metric.label}>
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <h3 className="font-medium">
                              {formatDashboardLabel(metric.label)}
                            </h3>
                            <strong className="mt-1 block text-lg">
                              {typeof metric.value === "string"
                                ? formatDashboardLabel(metric.value)
                                : formatMetricValue(metric.value)}
                            </strong>
                          </div>
                          <Badge variant="outline">
                            {formatVisibility(metric.visibility)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Signal</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead className="text-right">
                            Visibility
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {overview.metrics.map((metric) => (
                          <TableRow key={metric.label}>
                            <TableCell className="font-medium">
                              {formatDashboardLabel(metric.label)}
                            </TableCell>
                            <TableCell>
                              <strong>
                                {typeof metric.value === "string"
                                  ? formatDashboardLabel(metric.value)
                                  : formatMetricValue(metric.value)}
                              </strong>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline">
                                {formatVisibility(metric.visibility)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="areas">
          {summarySections.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ShieldCheckIcon aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle>No downstream areas available</EmptyTitle>
                <EmptyDescription>
                  This role can read the event dashboard but cannot open the
                  detailed event work areas from this view.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {summarySections.map((section) => (
                <Card key={section.title}>
                  <CardHeader>
                    <CardTitle>{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                    <CardAction>
                      <Badge variant="secondary">
                        {totalValues(section.values).toLocaleString("en")} total
                      </Badge>
                    </CardAction>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <SummaryTable values={section.values} />
                    <div>
                      <Button
                        render={<Link href={section.actionHref} />}
                        size="sm"
                        variant="outline"
                      >
                        {section.actionLabel}
                        <ArrowRightIcon
                          aria-hidden="true"
                          data-icon="inline-end"
                        />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="readiness">
          <Card>
            <CardHeader>
              <CardTitle>Readiness review</CardTitle>
              <CardDescription>
                Signals that usually decide the next event-team action.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:hidden">
                {readinessSignals.map((signal) => (
                  <div className="workflow-record" key={signal.label}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="font-medium">{signal.label}</h3>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {signal.detail}
                        </p>
                      </div>
                      <Badge
                        variant={
                          signal.status === "Needs attention"
                            ? "destructive"
                            : "outline"
                        }
                      >
                        {signal.status}
                      </Badge>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">
                        Current value
                      </span>
                      <strong>{formatMetricValue(signal.value)}</strong>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Checkpoint</TableHead>
                      <TableHead>Current state</TableHead>
                      <TableHead>Detail</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {readinessSignals.map((signal) => (
                      <TableRow key={signal.label}>
                        <TableCell className="font-medium">
                          {signal.label}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              signal.status === "Needs attention"
                                ? "destructive"
                                : "outline"
                            }
                          >
                            {signal.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-md whitespace-normal text-muted-foreground">
                          {signal.detail}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatMetricValue(signal.value)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <section className="grid gap-4 md:grid-cols-2">
        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersRoundIcon aria-hidden="true" />
              Guest movement
            </CardTitle>
            <CardDescription>
              RSVP, seating, and check-in counts should be reviewed together
              before event-day handoff.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileTextIcon aria-hidden="true" />
              Evidence path
            </CardTitle>
            <CardDescription>
              Reports remain available for exports when the team needs a CSV
              handoff or audit-friendly snapshot.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    </main>
  );
}
