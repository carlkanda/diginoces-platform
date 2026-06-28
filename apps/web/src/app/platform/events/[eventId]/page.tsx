import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  ClipboardListIcon,
  FileTextIcon,
  MapIcon,
  PackageCheckIcon,
  SettingsIcon,
  ShieldCheckIcon,
  TicketIcon,
  UsersRoundIcon,
} from "lucide-react";

import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import {
  formatProjectCoupleDisplayName,
  formatProjectEventDisplayName,
  formatProjectEventDisplayReference,
  formatProjectVenueDisplay,
  getEventLifecycleLabel,
  getEventTypeLabel,
  isInternalProjectDisplayText,
} from "@/lib/projects/project-foundation";
import {
  hasEventPermission,
  hasProjectPermission,
  ProjectAccessError,
  requireEventPermission,
} from "@/lib/projects/project-api";
import { getEventDetails } from "@/lib/projects/project-service";
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
  EmptyContent,
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

type EventDetailPageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

type EventWorkArea = {
  actionLabel: string;
  description: string;
  href: string;
  label: string;
  phase: "Before the event" | "Event day" | "Evidence";
  show: boolean;
  tone?: "primary";
};

function formatDate(value: string | null) {
  if (!value) {
    return "Not scheduled";
  }

  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00Z`)
    : new Date(value);

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(date);
}

function formatTime(value: string | null) {
  if (!value) {
    return null;
  }

  return value.slice(0, 5);
}

function formatTimeRange(startsAt: string | null, endsAt: string | null) {
  const start = formatTime(startsAt);
  const end = formatTime(endsAt);

  if (start && end) {
    return `${start} - ${end}`;
  }

  return start ?? end ?? "Time not set";
}

function formatTaskStatus(value: string) {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function EventDetailPage({
  params,
}: EventDetailPageProps) {
  const authContext = await getAuthContext();
  const { eventId } = await params;

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath(`/platform/events/${eventId}`));
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
              <BreadcrumbPage>Event workspace</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Card>
          <CardHeader>
            <CardTitle>Event workspace is waiting for access</CardTitle>
            <CardDescription>
              Event details will appear after the workspace connection is ready.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <ShieldCheckIcon aria-hidden="true" />
              <AlertTitle>Connection required</AlertTitle>
              <AlertDescription>
                Event data stays closed until the secure workspace connection is
                available.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </main>
    );
  }

  const supabase = await createSupabaseServerClient();

  try {
    await requireEventPermission(
      {
        supabase,
        user: authContext.user,
      },
      eventId,
      "events.read",
    );
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      notFound();
    }

    throw error;
  }

  const details = await getEventDetails(supabase, eventId);

  if (!details) {
    notFound();
  }

  const permissionContext = {
    supabase,
    user: authContext.user,
  };
  const [
    canReadInvitations,
    canReadSeating,
    canReadCheckIn,
    canReadEventDashboard,
    canReadFiles,
    canUpdateEvent,
    canManageEventMembers,
  ] = await Promise.all([
    hasProjectPermission(
      permissionContext,
      details.project.id,
      "invitation_templates.read",
    ),
    hasProjectPermission(permissionContext, details.project.id, "seating.read"),
    hasEventPermission(permissionContext, eventId, "check_in.read"),
    hasEventPermission(permissionContext, eventId, "dashboards.event.read"),
    hasEventPermission(permissionContext, eventId, "files.read"),
    hasEventPermission(permissionContext, eventId, "events.update"),
    hasEventPermission(permissionContext, eventId, "event_members.manage"),
  ]);
  const projectName = formatProjectCoupleDisplayName(details.project, 0);
  const eventTypeLabel = getEventTypeLabel(details.event.event_type);
  const fallbackEventName = `${eventTypeLabel} event`;
  const eventName = isInternalProjectDisplayText(details.event.name)
    ? fallbackEventName
    : formatProjectEventDisplayName(details.event, 0);
  const eventReference = formatProjectEventDisplayReference(details.event, 0);
  const eventReferenceValue = eventReference.isCode
    ? eventReference.value
    : fallbackEventName;
  const venueName = formatProjectVenueDisplay(details.event.venue_name);
  const eventStatusLabel = getEventLifecycleLabel(details.event.status);
  const eventDateLabel = formatDate(details.event.event_date);
  const eventTimeLabel = formatTimeRange(
    details.event.starts_at,
    details.event.ends_at,
  );
  const eventWorkAreas = (
    [
      {
        actionLabel: "Open dashboard",
        description:
          "Review event-level guest, RSVP, seating, check-in, and delivery signals.",
        href: `/platform/events/${eventId}/dashboard`,
        label: "Event dashboard",
        phase: "Evidence",
        show: canReadEventDashboard,
        tone: "primary",
      },
      {
        actionLabel: "Prepare invitations",
        description:
          "Manage templates, field placement, previews, approval, and generated files.",
        href: `/platform/events/${eventId}/invitations`,
        label: "Invitations",
        phase: "Before the event",
        show: canReadInvitations,
        tone: "primary",
      },
      {
        actionLabel: "Plan seating",
        description:
          "Assign guests to tables, review capacity, and prepare table-card exports.",
        href: `/platform/events/${eventId}/seating`,
        label: "Seating",
        phase: "Before the event",
        show: canReadSeating,
      },
      {
        actionLabel: "Run check-in",
        description:
          "Run staff check-in, scan guest codes, search manually, and monitor arrivals.",
        href: `/platform/events/${eventId}/check-in`,
        label: "Check-in",
        phase: "Event day",
        show: canReadCheckIn,
      },
      {
        actionLabel: "Review files",
        description:
          "Manage event-specific files, secure downloads, and retention review.",
        href: `/platform/events/${eventId}/files`,
        label: "Files",
        phase: "Evidence",
        show: canReadFiles,
      },
    ] satisfies EventWorkArea[]
  ).filter((area) => area.show);
  const primaryWorkArea =
    eventWorkAreas.find((area) => area.label === "Event dashboard") ??
    eventWorkAreas[0];
  const canOpenEventSetup = canUpdateEvent || canManageEventMembers;
  const eventDetailRows = [
    {
      label: eventReference.label,
      value: eventReferenceValue,
    },
    {
      label: "Date",
      value: eventDateLabel,
    },
    {
      label: "Time",
      value: eventTimeLabel,
    },
    {
      label: "Venue",
      value: venueName,
    },
    {
      label: "Wedding",
      value: projectName,
    },
  ];

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
            <BreadcrumbLink
              render={
                <Link href={`/platform/projects/${details.project.id}`} />
              }
            >
              {projectName}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{eventName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{eventTypeLabel}</Badge>
            <Badge variant="outline">{eventStatusLabel}</Badge>
            <Badge variant="outline">
              {eventReference.label}: {eventReferenceValue}
            </Badge>
          </div>
          <div className="max-w-3xl">
            <h1 className="text-3xl font-semibold tracking-normal text-balance">
              {eventName}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground text-pretty">
              Event command center for {projectName}. Use it to move from event
              context into invitations, seating, check-in, files, and reporting
              without losing the current event.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              render={
                <Link href={`/platform/projects/${details.project.id}`} />
              }
            >
              <ArrowLeftIcon aria-hidden="true" data-icon="inline-start" />
              Back to wedding
            </Button>
            {canOpenEventSetup ? (
              <Button
                render={<Link href={`/platform/events/${eventId}/settings`} />}
                variant="outline"
              >
                <SettingsIcon aria-hidden="true" data-icon="inline-start" />
                Event setup
              </Button>
            ) : null}
            {primaryWorkArea ? (
              <Button render={<Link href={primaryWorkArea.href} />}>
                {primaryWorkArea.actionLabel}
                <ArrowRightIcon aria-hidden="true" data-icon="inline-end" />
              </Button>
            ) : null}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Event snapshot</CardTitle>
            <CardDescription>
              Key facts teams need before entering an event workflow.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Date</span>
              <strong>{eventDateLabel}</strong>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Time</span>
              <strong>{eventTimeLabel}</strong>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Venue</span>
              <strong className="text-right">{venueName}</strong>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Work areas</span>
              <strong>{eventWorkAreas.length}</strong>
            </div>
          </CardContent>
        </Card>
      </section>

      <Alert>
        <ShieldCheckIcon aria-hidden="true" />
        <AlertTitle>Event access controls this workspace</AlertTitle>
        <AlertDescription>
          This page only shows work areas your role can open for this event.
          Project-level areas still respect wedding permissions.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="work" className="gap-4">
        <TabsList>
          <TabsTrigger value="work">
            <PackageCheckIcon aria-hidden="true" data-icon="inline-start" />
            Work areas
          </TabsTrigger>
          <TabsTrigger value="details">
            <CalendarDaysIcon aria-hidden="true" data-icon="inline-start" />
            Event details
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <ClipboardListIcon aria-hidden="true" data-icon="inline-start" />
            Readiness
          </TabsTrigger>
        </TabsList>

        <TabsContent value="work">
          <Card>
            <CardHeader>
              <CardTitle>Run this event</CardTitle>
              <CardDescription>
                Move into the event-specific workspace you need next.
              </CardDescription>
              <CardAction>
                <Badge variant="secondary">
                  {eventWorkAreas.length} available
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              {eventWorkAreas.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <PackageCheckIcon aria-hidden="true" />
                    </EmptyMedia>
                    <EmptyTitle>No event work areas available</EmptyTitle>
                    <EmptyDescription>
                      Your role can read this event, but no event work areas are
                      available to this account yet.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button
                      variant="outline"
                      render={
                        <Link
                          href={`/platform/projects/${details.project.id}`}
                        />
                      }
                    >
                      Return to wedding
                    </Button>
                  </EmptyContent>
                </Empty>
              ) : (
                <>
                  <div className="grid gap-3 md:hidden">
                    {eventWorkAreas.map((area) => (
                      <div className="workflow-record" key={area.href}>
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <h3 className="font-medium">{area.label}</h3>
                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                              {area.description}
                            </p>
                          </div>
                          <Badge
                            variant={
                              area.tone === "primary" ? "secondary" : "outline"
                            }
                          >
                            {area.phase}
                          </Badge>
                        </div>
                        <div>
                          <Button
                            aria-label={`${area.actionLabel}: ${area.description}`}
                            render={<Link href={area.href} />}
                            size="sm"
                            variant={
                              area.tone === "primary" ? "default" : "outline"
                            }
                          >
                            {area.actionLabel}
                            <ArrowRightIcon
                              aria-hidden="true"
                              data-icon="inline-end"
                            />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Area</TableHead>
                          <TableHead>When it matters</TableHead>
                          <TableHead>Purpose</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {eventWorkAreas.map((area) => (
                          <TableRow key={area.href}>
                            <TableCell className="font-medium">
                              {area.label}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  area.tone === "primary"
                                    ? "secondary"
                                    : "outline"
                                }
                              >
                                {area.phase}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-md whitespace-normal text-muted-foreground">
                              {area.description}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                aria-label={`${area.actionLabel}: ${area.description}`}
                                render={<Link href={area.href} />}
                                size="sm"
                                variant={
                                  area.tone === "primary"
                                    ? "default"
                                    : "outline"
                                }
                              >
                                {area.actionLabel}
                                <ArrowRightIcon
                                  aria-hidden="true"
                                  data-icon="inline-end"
                                />
                              </Button>
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

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Event details</CardTitle>
              <CardDescription>
                Operational identity, schedule, and venue details for this
                event.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:hidden">
                {eventDetailRows.map((row) => (
                  <div className="workflow-tile" key={row.label}>
                    <span className="text-sm font-medium text-muted-foreground">
                      {row.label}
                    </span>
                    <strong className="mt-1 block">{row.value}</strong>
                  </div>
                ))}
              </div>

              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Field</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eventDetailRows.map((row) => (
                      <TableRow key={row.label}>
                        <TableCell className="text-muted-foreground">
                          {row.label}
                        </TableCell>
                        <TableCell className="font-medium">
                          {row.value}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Readiness tasks</CardTitle>
              <CardDescription>
                Event-level tasks that keep this event ready for handoff and
                event-day work.
              </CardDescription>
              <CardAction>
                <Badge variant="secondary">
                  {details.workflowTasks.length} tasks
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              {details.workflowTasks.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <ClipboardListIcon aria-hidden="true" />
                    </EmptyMedia>
                    <EmptyTitle>No readiness tasks assigned</EmptyTitle>
                    <EmptyDescription>
                      Readiness tasks will appear here when the event has
                      preparation work assigned.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <>
                  <div className="grid gap-3 md:hidden">
                    {details.workflowTasks.map((task) => (
                      <div className="workflow-tile" key={task.id}>
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <h3 className="font-medium">{task.title}</h3>
                          <Badge variant="outline">
                            {formatTaskStatus(task.status)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Task</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {details.workflowTasks.map((task) => (
                          <TableRow key={task.id}>
                            <TableCell className="font-medium">
                              {task.title}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {formatTaskStatus(task.status)}
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
      </Tabs>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TicketIcon aria-hidden="true" />
              Invitations
            </CardTitle>
            <CardDescription>
              {canReadInvitations
                ? "Template and generation work is available."
                : "Invitation work is not available to this role."}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapIcon aria-hidden="true" />
              Seating
            </CardTitle>
            <CardDescription>
              {canReadSeating
                ? "Table planning is available."
                : "Seating access is not available to this role."}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersRoundIcon aria-hidden="true" />
              Check-in
            </CardTitle>
            <CardDescription>
              {canReadCheckIn
                ? "Arrival operations are available."
                : "Check-in access is not available to this role."}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileTextIcon aria-hidden="true" />
              Files
            </CardTitle>
            <CardDescription>
              {canReadFiles
                ? "Event files are available."
                : "File access is not available to this role."}
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    </main>
  );
}
