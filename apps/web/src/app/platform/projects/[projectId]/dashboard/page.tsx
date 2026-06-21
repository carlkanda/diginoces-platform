import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowRightIcon,
  BarChart3Icon,
  CalendarDaysIcon,
  ClipboardListIcon,
  LockKeyholeIcon,
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
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
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
import { ProjectAccessError } from "@/lib/projects/project-api";
import {
  getEventDashboardAccessMap,
  getReportingPermissionSet,
  requireProjectDashboardPermission,
} from "@/lib/reports/report-api";
import {
  formatProjectCoupleDisplayName,
  formatProjectDisplayReference,
  formatProjectEventDisplayName,
  formatProjectEventDisplayReference,
} from "@/lib/projects/project-foundation";
import { getProjectDashboardOverview } from "@/lib/reports/report-db";
import { getDashboardVisibility } from "@/lib/reports/report-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
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
  "Active guests": "Active guests",
  "Active tables": "Active tables",
  "Checked-in arrivals": "Recorded arrivals",
  "Invited event assignments": "Guests invited to events",
  "Manual Review Required": "Review needed",
  "Payment gate": "Guest page access",
  "Pending RSVP": "Awaiting RSVP",
  "Prepared messages": "Messages ready to send",
  "RSVP yes": "Attending",
  activeAssignments: "Assigned seats",
  activePaymentExceptions: "Active payment exceptions",
  arrivedUnits: "Recorded arrivals",
  checkedInArrivals: "Recorded arrivals",
  confirmedPayments: "Confirmed payments",
  contractApproved: "Approved contracts",
  duplicateScans: "Duplicate scans",
  exception_override: "Exception approved",
  invitedEventAssignments: "Guests invited to events",
  latestContractId: "Latest contract",
  manualReviewRequired: "Review needed",
  maybe: "Maybe",
  no: "Cannot attend",
  notGenerated: "Not generated",
  not_configured: "Not ready yet",
  paymentGate: "Guest page access",
  paymentVolumeCents: "Confirmed payment total",
  pendingRsvp: "Awaiting RSVP",
  printedOnly: "Printed invitation",
  prepared: "Ready to send",
  restricted: "Restricted",
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

function formatCurrencyFromCents(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
  }).format(value / 100);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDashboardValue(
  key: string,
  value: number | string | null | undefined,
) {
  if (value === null || value === undefined) {
    return "None";
  }

  if (key === "latestContractId") {
    return typeof value === "string" && value.length > 0
      ? "Contract on file"
      : "None";
  }

  if (key.endsWith("Cents") && typeof value === "number") {
    return formatCurrencyFromCents(value);
  }

  if (typeof value === "string") {
    return formatDashboardLabel(value);
  }

  return value;
}

function StatusList({
  description,
  label,
  values,
}: {
  description: string;
  label: string;
  values: Record<string, number | string | null>;
}) {
  const entries = Object.entries(values);

  if (entries.length === 0) {
    return (
      <Card size="sm">
        <CardHeader>
          <CardTitle>
            <h3 className="text-base font-semibold">{label}</h3>
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ClipboardListIcon />
              </EmptyMedia>
              <EmptyTitle>No records yet</EmptyTitle>
              <EmptyDescription>
                This workstream will show a summary as soon as activity is
                recorded.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>
          <h3 className="text-base font-semibold">{label}</h3>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableBody>
            {entries.map(([key, value]) => (
              <TableRow key={key}>
                <TableCell className="whitespace-normal text-muted-foreground">
                  {formatDashboardLabel(key)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatDashboardValue(key, value)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default async function ProjectDashboardPage({ params }: PageProps) {
  const authContext = await getAuthContext();
  const { projectId } = await params;

  if (authContext.status === "anonymous") {
    redirect(
      buildLoginRedirectPath(`/platform/projects/${projectId}/dashboard`),
    );
  }

  if (authContext.status === "not_configured") {
    return (
      <main className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>
              <h1 className="text-2xl leading-tight font-semibold text-balance">
                Project dashboard
              </h1>
            </CardTitle>
            <CardDescription>
              Project metrics will appear after the workspace connection is
              ready.
            </CardDescription>
          </CardHeader>
        </Card>
        <Alert>
          <LockKeyholeIcon />
          <AlertTitle>Workspace connection pending</AlertTitle>
          <AlertDescription>
            Dashboard data is not requested until Supabase credentials are
            configured.
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  const supabase = await createSupabaseServerClient();
  const context = { supabase, user: authContext.user };

  try {
    await requireProjectDashboardPermission(context, projectId);
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      notFound();
    }

    throw error;
  }

  const permissions = await getReportingPermissionSet(context, { projectId });
  const visibility = getDashboardVisibility(permissions);
  const overview = await getProjectDashboardOverview(
    supabase,
    projectId,
    visibility,
  );

  if (!overview) {
    notFound();
  }

  const eventDashboardAccess = await getEventDashboardAccessMap(
    context,
    projectId,
    overview.events.map((event) => event.id),
  );
  const projectName = formatProjectCoupleDisplayName(overview.project, 0);
  const projectReference = formatProjectDisplayReference(overview.project, 0);
  const summarySections = [
    {
      description: "Active guests, sides, printed-only guests, and list size.",
      label: "Guest list",
      values: overview.summaries.guests,
    },
    {
      description: "Response status and any RSVP rows needing review.",
      label: "RSVP",
      values: overview.summaries.rsvps,
    },
    {
      description: "Generated invitations and invitation file status.",
      label: "Invitations",
      values: overview.summaries.invitations,
    },
    {
      description: "Guest import sessions and review status.",
      label: "Imports",
      values: overview.summaries.guestImports,
    },
    {
      description: "Prepared messages and manual sending status.",
      label: "Messages",
      values: overview.summaries.communications,
    },
    {
      description: "Tables, capacity, and active seat assignments.",
      label: "Seating",
      values: overview.summaries.seating,
    },
    {
      description: "Arrivals, duplicate scans, and unexpected guest requests.",
      label: "Check-in",
      values: overview.summaries.checkIn,
    },
    {
      description: "Contracts, confirmed payments, and guest-page access.",
      label: "Commercial",
      values: overview.summaries.commercial,
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
              Projects
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
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader className="has-data-[slot=card-action]:grid-cols-1 sm:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
          <CardTitle>
            <h1 className="text-2xl leading-tight font-semibold text-balance">
              Project dashboard
            </h1>
          </CardTitle>
          <CardDescription className="max-w-3xl">
            Track guest, RSVP, invitation, communication, seating, check-in, and
            commercial status for {projectName}.
          </CardDescription>
          <CardAction className="col-start-1 row-start-auto mt-3 justify-self-start sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:mt-0 sm:justify-self-end">
            <Badge variant="outline">
              {formatDateTime(overview.generatedAt)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(220px,280px)]">
          <dl
            aria-label="Dashboard coverage"
            className="grid gap-3 sm:grid-cols-3"
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
                Events tracked
              </dt>
              <dd className="mt-1 font-medium">
                {pluralize(overview.events.length, "event")}
              </dd>
            </div>
            <div className="rounded-lg border bg-background p-3">
              <dt className="text-xs font-medium text-muted-foreground">
                Signals available
              </dt>
              <dd className="mt-1 font-medium">
                {pluralize(overview.metrics.length, "signal")}
              </dd>
            </div>
          </dl>
          <div className="flex flex-col gap-3 rounded-lg border bg-background p-3">
            <div>
              <p className="text-sm font-medium">Dashboard actions</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Move from this view into project records or reports.
              </p>
            </div>
            <Separator />
            <Link
              aria-label={`Open project overview for ${projectName}`}
              className={buttonVariants({ variant: "outline" })}
              href={`/platform/projects/${projectId}`}
            >
              Project overview
            </Link>
            {visibility.canReadCoupleDashboard ? (
              <Link
                aria-label={`Open couple-facing view for ${projectName}`}
                className={buttonVariants({ variant: "outline" })}
                href={`/platform/projects/${projectId}/couple-dashboard`}
              >
                Couple view
              </Link>
            ) : null}
            <Link
              aria-label={`Open reports for ${projectName}`}
              className={buttonVariants()}
              href={`/platform/reports?projectId=${projectId}`}
            >
              Reports
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3Icon />
            <h2 className="text-base font-semibold">Operating signals</h2>
          </CardTitle>
          <CardDescription>
            A compact read of the project areas your role can access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {overview.metrics.map((metric) => (
              <div
                className="rounded-lg border bg-background p-3"
                key={metric.label}
              >
                <dt className="text-xs font-medium text-muted-foreground">
                  {formatDashboardLabel(metric.label)}
                </dt>
                <dd className="mt-1 text-lg font-semibold">
                  {typeof metric.value === "string"
                    ? formatDashboardLabel(metric.value)
                    : metric.value}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <section className="flex flex-col gap-4" aria-labelledby="summaries">
        <div>
          <h2 className="text-xl font-semibold" id="summaries">
            Operational summaries
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Each workstream summarizes recorded activity for this wedding.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {summarySections.map((section) => (
            <StatusList
              description={section.description}
              key={section.label}
              label={section.label}
              values={section.values}
            />
          ))}
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDaysIcon />
            <h2 className="text-base font-semibold">Event dashboards</h2>
          </CardTitle>
          <CardDescription>
            Open an event dashboard to review arrivals, seating, messages,
            files, and RSVP activity for that event.
          </CardDescription>
          <CardAction>
            <Badge variant="outline">
              {pluralize(overview.events.length, "event")}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          {overview.events.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CalendarDaysIcon />
                </EmptyMedia>
                <EmptyTitle>No events yet</EmptyTitle>
                <EmptyDescription>
                  Event dashboards will appear here once this project has event
                  records.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Reference
                  </TableHead>
                  <TableHead className="text-right">Access</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.events.map((event, eventIndex) => {
                  const eventName = formatProjectEventDisplayName(
                    event,
                    eventIndex,
                  );
                  const eventReference = formatProjectEventDisplayReference(
                    event,
                    eventIndex,
                  );

                  return (
                    <TableRow key={event.id}>
                      <TableCell className="min-w-56 whitespace-normal font-medium">
                        {eventName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {formatLabel(event.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {eventReference.label}: {eventReference.value}
                      </TableCell>
                      <TableCell className="text-right">
                        {eventDashboardAccess.get(event.id) ? (
                          <Link
                            aria-label={`Open dashboard for ${eventName}`}
                            className={buttonVariants({
                              variant: "outline",
                              size: "sm",
                            })}
                            href={`/platform/events/${event.id}/dashboard`}
                          >
                            Dashboard
                          </Link>
                        ) : (
                          <Badge variant="secondary">No dashboard access</Badge>
                        )}
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
