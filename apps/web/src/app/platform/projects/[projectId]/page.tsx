import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  ClipboardCheckIcon,
  FolderKanbanIcon,
  LanguagesIcon,
  LockKeyholeIcon,
  MailCheckIcon,
  UsersRoundIcon,
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
import { Separator } from "@/components/ui/separator";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import {
  formatProjectContactDisplay,
  formatProjectCoupleDisplayName,
  formatProjectDisplayReference,
  formatProjectEventDisplayName,
  formatProjectEventDisplayReference,
  formatProjectVenueDisplay,
  type EventLifecycleStatus,
  getEventLifecycleLabel,
  getEventTypeLabel,
  getProjectLifecycleLabel,
  type ProjectLifecycleStatus,
} from "@/lib/projects/project-foundation";
import {
  hasProjectPermission,
  ProjectAccessError,
  requireProjectPermission,
} from "@/lib/projects/project-api";
import {
  getGuestBookPagePermissions,
  getPostEventFeedbackPagePermissions,
} from "@/lib/guest-wishes/guest-wish-api";
import { hasAnyCommercialReadPermission } from "@/lib/contracts/contract-api";
import { hasAnyProjectFileCapability } from "@/lib/files/file-api";
import { getProjectDetails } from "@/lib/projects/project-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type ProjectDetailPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

type ProjectWorkArea = {
  description: string;
  href: string;
  label: string;
  show: boolean;
  tone?: "primary";
};

type ProjectWorkAreaGroup = {
  areas: ProjectWorkArea[];
  description: string;
  label: string;
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

function formatTaskStatus(value: string) {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatPreferredLanguage(value: string | null) {
  if (!value) {
    return "Language not set";
  }

  const labels: Record<string, string> = {
    en: "English",
    fr: "French",
  };

  return labels[value.toLowerCase()] ?? value;
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function getProjectStatusVariant(
  status: ProjectLifecycleStatus,
): "default" | "secondary" | "outline" {
  if (
    status === "active" ||
    status === "ready_for_invitations" ||
    status === "event_operations"
  ) {
    return "default";
  }

  if (status === "lead" || status === "draft" || status === "submitted") {
    return "secondary";
  }

  return "outline";
}

function getEventStatusVariant(
  status: EventLifecycleStatus,
): "default" | "secondary" | "outline" {
  if (status === "ready" || status === "in_progress") {
    return "default";
  }

  if (status === "draft" || status === "scheduled") {
    return "secondary";
  }

  return "outline";
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const authContext = await getAuthContext();
  const { projectId } = await params;

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath(`/platform/projects/${projectId}`));
  }

  if (authContext.status === "not_configured") {
    return (
      <main className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Wedding workspace</CardTitle>
            <CardDescription>
              Project data will appear after the workspace connection is ready.
            </CardDescription>
          </CardHeader>
        </Card>
        <Alert>
          <LockKeyholeIcon />
          <AlertTitle>Workspace connection pending</AlertTitle>
          <AlertDescription>
            The page stays available without exposing project records until the
            Supabase connection is configured.
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
      "projects.read",
    );
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      notFound();
    }

    throw error;
  }

  const details = await getProjectDetails(supabase, projectId);

  if (!details) {
    notFound();
  }

  const permissionContext = {
    supabase,
    user: authContext.user,
  };
  const [
    canReadGuests,
    canReadGuestImports,
    canReadRsvps,
    canReadMessages,
    canReadSeating,
    canReadCommercial,
    canReadProjectDashboard,
    canReadCoupleDashboard,
    canReadReports,
    canReadProjectComments,
    canReadFiles,
    guestBookPermissions,
    feedbackPermissions,
  ] = await Promise.all([
    hasProjectPermission(permissionContext, projectId, "guests.read"),
    hasProjectPermission(permissionContext, projectId, "guest_imports.read"),
    hasProjectPermission(permissionContext, projectId, "rsvps.read"),
    hasProjectPermission(permissionContext, projectId, "messages.read"),
    hasProjectPermission(permissionContext, projectId, "seating.read"),
    hasAnyCommercialReadPermission(permissionContext, projectId),
    hasProjectPermission(
      permissionContext,
      projectId,
      "dashboards.project.read",
    ),
    hasProjectPermission(
      permissionContext,
      projectId,
      "dashboards.couple.read",
    ),
    hasProjectPermission(permissionContext, projectId, "reports.catalog.read"),
    hasProjectPermission(permissionContext, projectId, "project_comments.read"),
    hasAnyProjectFileCapability(permissionContext, projectId),
    getGuestBookPagePermissions(permissionContext, projectId),
    getPostEventFeedbackPagePermissions(permissionContext, projectId),
  ]);
  const canReadGuestBook = Object.values(guestBookPermissions).some(Boolean);
  const canReadPostEventFeedback =
    Object.values(feedbackPermissions).some(Boolean);
  const projectTasks = details.workflowTasks.filter(
    (task) => task.scope === "project",
  );
  const projectName = formatProjectCoupleDisplayName(details.project, 0);
  const projectReference = formatProjectDisplayReference(details.project, 0);
  const preferredLanguage = formatPreferredLanguage(
    details.project.preferred_language,
  );
  const primaryContact = formatProjectContactDisplay(
    details.project.primary_contact_name ??
      details.project.primary_contact_email ??
      details.project.primary_contact_phone ??
      null,
  );
  const workAreaGroups: ProjectWorkAreaGroup[] = [
    {
      label: "Plan and review",
      description:
        "Use dashboards and reports to understand where this wedding stands.",
      areas: [
        {
          description:
            "Review project activity, guest progress, RSVP movement, and operational signals.",
          href: `/platform/projects/${projectId}/dashboard`,
          label: "Project dashboard",
          show: canReadProjectDashboard,
          tone: "primary",
        },
        {
          description:
            "Open the couple-facing view for a simpler project summary.",
          href: `/platform/projects/${projectId}/couple-dashboard`,
          label: "Couple view",
          show: canReadCoupleDashboard,
        },
        {
          description:
            "Open project-scoped reporting and exports available to this account.",
          href: `/platform/reports?projectId=${projectId}`,
          label: "Reports",
          show: canReadReports,
        },
      ],
    },
    {
      label: "Prepare guests",
      description:
        "Build the guest list, review imports, collect responses, and prepare messages.",
      areas: [
        {
          description:
            "Manage names, sides, tags, title types, event assignments, and guest profiles.",
          href: `/platform/projects/${projectId}/guests`,
          label: "Guest list",
          show: canReadGuests,
          tone: "primary",
        },
        {
          description:
            "Review uploaded CSV rows before they are added to the guest list.",
          href: `/platform/projects/${projectId}/guest-imports`,
          label: "Guest imports",
          show: canReadGuestImports,
        },
        {
          description:
            "Track event-level Yes, No, Maybe, and pending responses.",
          href: `/platform/projects/${projectId}/rsvps`,
          label: "RSVP",
          show: canReadRsvps,
        },
        {
          description:
            "Prepare WhatsApp text, guided sends, follow-ups, and message history.",
          href: `/platform/projects/${projectId}/communications`,
          label: "Messages",
          show: canReadMessages,
        },
      ],
    },
    {
      label: "Deliver and coordinate",
      description:
        "Keep the project moving with files, commercial controls, partner comments, and post-event work.",
      areas: [
        {
          description:
            "Manage project files, event files, guest-facing downloads, and retention review.",
          href: `/platform/projects/${projectId}/files`,
          label: "Files",
          show: canReadFiles,
        },
        {
          description:
            "Review packages, contract status, payments, and guest-page gates.",
          href: `/platform/projects/${projectId}/commercial`,
          label: "Commercial",
          show: canReadCommercial,
        },
        {
          description:
            "Coordinate project notes with authorized staff and partners.",
          href: `/platform/projects/${projectId}/comments`,
          label: "Project comments",
          show: canReadProjectComments,
        },
        {
          description: "Moderate guest wishes and prepare guest-book content.",
          href: `/platform/projects/${projectId}/guest-book`,
          label: "Guest book",
          show: canReadGuestBook,
        },
        {
          description:
            "Review private post-event feedback and testimonial permission.",
          href: `/platform/projects/${projectId}/feedback`,
          label: "Feedback",
          show: canReadPostEventFeedback,
        },
      ],
    },
  ];
  const visibleWorkAreaGroups = workAreaGroups
    .map((group) => ({
      ...group,
      areas: group.areas.filter((area) => area.show),
    }))
    .filter((group) => group.areas.length > 0);

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
              Projects
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{projectName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader className="has-data-[slot=card-action]:grid-cols-1 sm:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
          <CardTitle>
            <h1 className="text-2xl leading-tight font-semibold text-balance">
              {projectName}
            </h1>
          </CardTitle>
          <CardDescription className="max-w-3xl">
            Open the next area of work for this wedding.
          </CardDescription>
          <CardAction className="col-start-1 row-start-auto mt-3 justify-self-start sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:mt-0 sm:justify-self-end">
            <Badge variant={getProjectStatusVariant(details.project.status)}>
              {getProjectLifecycleLabel(details.project.status)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(220px,280px)]">
          <dl
            aria-label="Wedding project details"
            className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
          >
            <div className="rounded-lg border bg-background p-3">
              <dt className="text-xs font-medium text-muted-foreground">
                {projectReference.label}
              </dt>
              <dd className="mt-1 truncate font-medium">
                {projectReference.value}
              </dd>
            </div>
            <div className="rounded-lg border bg-background p-3">
              <dt className="text-xs font-medium text-muted-foreground">
                Events
              </dt>
              <dd className="mt-1 font-medium">
                {pluralize(details.events.length, "event")}
              </dd>
            </div>
            <div className="rounded-lg border bg-background p-3">
              <dt className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <LanguagesIcon aria-hidden="true" />
                Language
              </dt>
              <dd className="mt-1 font-medium">{preferredLanguage}</dd>
            </div>
            <div className="rounded-lg border bg-background p-3">
              <dt className="text-xs font-medium text-muted-foreground">
                Primary contact
              </dt>
              <dd className="mt-1 truncate font-medium">{primaryContact}</dd>
            </div>
          </dl>
          <div className="flex flex-col gap-3 rounded-lg border bg-background p-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">Quick actions</p>
                <InfoHint
                  label="Quick action guidance"
                  text="Start with the records most teams need first. Available actions still depend on your role."
                />
              </div>
            </div>
            <Separator />
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/platform/projects"
            >
              Back to projects
            </Link>
            {canReadProjectDashboard ? (
              <Link
                className={buttonVariants({ variant: "outline" })}
                href={`/platform/projects/${projectId}/dashboard`}
              >
                Open dashboard
              </Link>
            ) : null}
            {canReadGuests ? (
              <Link
                className={buttonVariants()}
                href={`/platform/projects/${projectId}/guests`}
              >
                Open guest list
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <h2>Work areas</h2>
            <InfoHint
              label="Work area guidance"
              text="Move through this wedding by task. Each destination appears only when your role can use it."
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {visibleWorkAreaGroups.length === 0 ? (
            <OperationalEmptyState
              description="This account can see the wedding, but no project work area is available to this role yet."
              icon={FolderKanbanIcon}
              nextStep="Ask a Diginoces administrator to review the project membership and role assignment."
              title="No available work areas"
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-3">
              {visibleWorkAreaGroups.map((group) => (
                <section className="flex flex-col gap-3" key={group.label}>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-medium">{group.label}</h2>
                    <InfoHint
                      label={`${group.label} guidance`}
                      text={group.description}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    {group.areas.map((area) => (
                      <Link
                        aria-label={`${area.label}: ${area.description}`}
                        className={cn(
                          "group flex min-h-24 items-start justify-between gap-3 rounded-lg border bg-background p-3 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                          area.tone === "primary" && "bg-secondary",
                        )}
                        href={area.href}
                        key={area.href}
                      >
                        <span className="min-w-0">
                          <span className="block font-medium">
                            {area.label}
                          </span>
                          <span className="mt-1 block text-sm text-muted-foreground">
                            {area.description}
                          </span>
                        </span>
                        <ArrowRightIcon aria-hidden="true" />
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDaysIcon />
              Events
            </CardTitle>
            <CardDescription>
              Open an event for invitations, seating, check-in, files, and
              event-level dashboards.
            </CardDescription>
            <CardAction>
              <Badge variant="outline">
                {pluralize(details.events.length, "event")}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            {details.events.length === 0 ? (
              <OperationalEmptyState
                description="Events linked to this wedding appear here with date, venue, status, and event-day entry points."
                icon={CalendarDaysIcon}
                nextStep="Create the wedding events before configuring invitations, seating, check-in, and event files."
                title="No events configured"
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Venue
                    </TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {details.events.map((event, eventIndex) => {
                    const eventLabel = formatProjectEventDisplayName(
                      event,
                      eventIndex,
                    );
                    const eventReference = formatProjectEventDisplayReference(
                      event,
                      eventIndex,
                    );
                    const venueLabel = formatProjectVenueDisplay(
                      event.venue_name,
                    );

                    return (
                      <TableRow key={event.id}>
                        <TableCell className="min-w-56 whitespace-normal">
                          <div className="flex flex-col gap-1">
                            <Link
                              className="font-medium underline-offset-4 hover:underline"
                              href={`/platform/events/${event.id}`}
                            >
                              {eventLabel}
                            </Link>
                            <span className="text-xs text-muted-foreground">
                              {getEventTypeLabel(event.event_type)}
                            </span>
                            <span
                              aria-label={`${eventReference.label}: ${eventReference.value}.`}
                              className="font-mono text-xs text-muted-foreground"
                            >
                              {eventReference.value}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getEventStatusVariant(event.status)}>
                            {getEventLifecycleLabel(event.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground md:table-cell">
                          {formatDate(event.event_date)}
                        </TableCell>
                        <TableCell className="hidden max-w-56 whitespace-normal text-muted-foreground lg:table-cell">
                          {venueLabel}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {canReadSeating ? (
                              <Link
                                className={buttonVariants({
                                  variant: "outline",
                                  size: "sm",
                                })}
                                href={`/platform/events/${event.id}/seating`}
                              >
                                Seating
                              </Link>
                            ) : null}
                            <Link
                              aria-label={`Open ${eventLabel}`}
                              className={buttonVariants({
                                variant: "outline",
                                size: "sm",
                              })}
                              href={`/platform/events/${event.id}`}
                            >
                              Open
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheckIcon />
                Readiness tasks
              </CardTitle>
              <CardDescription>
                Project tasks that keep guest, invitation, seating, and
                event-day work on track.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {projectTasks.length === 0 ? (
                <OperationalEmptyState
                  description="No project-level readiness tasks are assigned right now."
                  icon={CheckCircle2Icon}
                  nextStep="Use the visible work areas above to continue guest, RSVP, invitation, messaging, seating, or file work."
                  title="No readiness tasks"
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projectTasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="whitespace-normal font-medium">
                          {task.title}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline">
                            {formatTaskStatus(task.status)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Alert>
            <UsersRoundIcon />
            <AlertTitle>Permission-scoped workspace</AlertTitle>
            <AlertDescription>
              Work areas, events, and actions are limited to what your role can
              access. Missing destinations usually mean the project membership
              or role assignment needs review.
            </AlertDescription>
          </Alert>

          <Card size="sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MailCheckIcon />
                Best next step
              </CardTitle>
              <CardDescription>
                Start with guest list readiness when available, then move into
                RSVP, invitations, messages, seating, and check-in as the event
                approaches.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </main>
  );
}
