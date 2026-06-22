import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ActivityIcon,
  ArrowRightIcon,
  CalendarClockIcon,
  FileTextIcon,
  LockKeyholeIcon,
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
  CardContent,
  CardDescription,
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
import { formatUsd } from "@/lib/contracts/contract-service";
import { ProjectAccessError } from "@/lib/projects/project-api";
import {
  formatProjectCoupleDisplayName,
  formatProjectDisplayReference,
} from "@/lib/projects/project-foundation";
import {
  getReportingPermissionSet,
  requireGlobalDashboardPermission,
} from "@/lib/reports/report-api";
import {
  getGlobalDashboardOverview,
  type GlobalDashboardOverview,
  type MetricCard,
} from "@/lib/reports/report-db";
import { getDashboardVisibility } from "@/lib/reports/report-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function formatLabel(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  const labels: Record<string, string> = {
    api: "App activity",
    auth: "Sign-in activity",
    generated: "Generated",
    open: "Open",
    ready_for_invitations: "Ready for invitations",
    system: "System update",
    user: "User action",
  };

  if (labels[value]) {
    return labels[value];
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

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}

function metricDisplay(metric: MetricCard) {
  if (metric.value === "restricted") {
    return "Restricted by role";
  }

  if (
    metric.label === "Confirmed payment volume" &&
    typeof metric.value === "number"
  ) {
    return formatUsd(metric.value);
  }

  return String(metric.value);
}

function metricTone(metric: MetricCard) {
  if (metric.value === "restricted") {
    return "secondary" as const;
  }

  if (typeof metric.value === "number" && metric.value > 0) {
    if (
      metric.label.includes("needing") ||
      metric.label.includes("Unexpected") ||
      metric.label.includes("Draft")
    ) {
      return "destructive" as const;
    }

    return "default" as const;
  }

  return "outline" as const;
}

function metricByLabel(
  overview: GlobalDashboardOverview,
  label: string,
): MetricCard | null {
  return overview.metrics.find((metric) => metric.label === label) ?? null;
}

function signalValue(overview: GlobalDashboardOverview, label: string): string {
  const metric = metricByLabel(overview, label);
  return metric ? metricDisplay(metric) : "Not available";
}

export default async function GlobalDashboardPage() {
  const authContext = await getAuthContext();

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath("/platform/dashboard"));
  }

  if (authContext.status === "not_configured") {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/platform" />}>
                Workspace
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Operations overview</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Card>
          <CardHeader>
            <CardTitle>
              <h1 className="text-3xl leading-tight font-semibold tracking-normal text-balance">
                Operations overview is unavailable
              </h1>
            </CardTitle>
            <CardDescription>
              Cross-wedding signals will appear after the workspace connection
              is ready.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <LockKeyholeIcon aria-hidden="true" />
              <AlertTitle>Connection required</AlertTitle>
              <AlertDescription>
                This page is secure by default. Ask a Diginoces administrator to
                finish the workspace connection before reviewing global
                operations.
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
    await requireGlobalDashboardPermission(context);
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      await redirectToMfaIfStepUpRequired(context, "/platform/dashboard", {
        permission: "dashboards.global.read",
        scope: "global",
      });
      notFound();
    }

    throw error;
  }

  const permissions = await getReportingPermissionSet(context);
  const overview = await getGlobalDashboardOverview(
    supabase,
    getDashboardVisibility(permissions),
  );
  const reviewSignals = [
    {
      description: "Guest lists waiting for validation or approval.",
      label: "Imports needing review",
      value: signalValue(overview, "Imports needing review"),
    },
    {
      description: "Prepared, queued, or failed messages needing attention.",
      label: "Messages needing action",
      value: signalValue(overview, "Messages needing action"),
    },
    {
      description: "Unexpected arrivals that need an operational decision.",
      label: "Unexpected guest requests",
      value: signalValue(overview, "Unexpected guest requests"),
    },
    {
      description: "Contracts generated or waiting for approval.",
      label: "Pending contracts",
      value: signalValue(overview, "Pending contracts"),
    },
  ];

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
            <BreadcrumbPage>Operations overview</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex max-w-3xl flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Global workspace</Badge>
            <Badge variant="outline">
              {pluralize(overview.metrics.length, "signal")}
            </Badge>
            <Badge variant="outline">
              Updated {formatDateTime(overview.generatedAt)}
            </Badge>
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl leading-tight font-semibold tracking-normal text-balance">
              Operations overview
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground text-pretty">
              Scan cross-wedding activity, open recent project workspaces, and
              move into reports or the audit trail when a signal needs deeper
              review.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            aria-label="Open reports for the full workspace"
            className={buttonVariants({ variant: "outline" })}
            href="/platform/reports"
          >
            <FileTextIcon aria-hidden="true" data-icon="inline-start" />
            Reports
          </Link>
          <Link
            aria-label="Open activity history for the full workspace"
            className={buttonVariants({ variant: "outline" })}
            href="/platform/audit-logs"
          >
            <ActivityIcon aria-hidden="true" data-icon="inline-start" />
            Activity history
          </Link>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>
                <h2>Workspace signals</h2>
              </CardTitle>
              <CardDescription>
                Role-aware totals across weddings, events, imports, messages,
                contracts, reports, and guest operations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:hidden">
                {overview.metrics.map((metric) => (
                  <div className="workflow-record" key={metric.label}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{metric.label}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {metric.visibility === "internal"
                            ? "Internal operations"
                            : formatLabel(metric.visibility)}
                        </p>
                      </div>
                      <Badge variant={metricTone(metric)}>
                        {metricDisplay(metric)}
                      </Badge>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">Visibility</span>
                      <Badge variant="secondary">
                        {formatLabel(metric.visibility)}
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
                      <TableHead>Visibility</TableHead>
                      <TableHead className="text-right">
                        Current value
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overview.metrics.map((metric) => (
                      <TableRow key={metric.label}>
                        <TableCell className="min-w-56 whitespace-normal">
                          <div className="flex flex-col gap-1">
                            <strong className="text-sm font-medium">
                              {metric.label}
                            </strong>
                            <span className="text-xs text-muted-foreground">
                              {metric.visibility === "internal"
                                ? "Internal operations"
                                : formatLabel(metric.visibility)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {formatLabel(metric.visibility)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={metricTone(metric)}>
                            {metricDisplay(metric)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-1.5">
                  <CardTitle>
                    <h2>Recent weddings</h2>
                  </CardTitle>
                  <CardDescription>
                    Open the most recently updated projects and continue from
                    their project dashboard.
                  </CardDescription>
                </div>
                <Badge variant="outline">
                  {pluralize(overview.recentProjects.length, "wedding")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {overview.recentProjects.length === 0 ? (
                <OperationalEmptyState
                  description="Recently updated weddings appear here when the team starts working in the workspace."
                  icon={CalendarClockIcon}
                  nextStep="Open wedding projects to review assigned workspaces, or connect this account to active projects."
                  title="No recent weddings yet"
                />
              ) : (
                <>
                  <div className="grid gap-3 md:hidden">
                    {overview.recentProjects.map((project, projectIndex) => {
                      const projectName = formatProjectCoupleDisplayName(
                        project,
                        projectIndex,
                      );
                      const projectReference = formatProjectDisplayReference(
                        project,
                        projectIndex,
                      );

                      return (
                        <div className="workflow-record" key={project.id}>
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="font-medium">{projectName}</p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {projectReference.label}:{" "}
                                {projectReference.value}
                              </p>
                            </div>
                            <Badge variant="secondary">
                              {formatLabel(project.status)}
                            </Badge>
                          </div>
                          <Link
                            aria-label={`Open dashboard for ${projectName}`}
                            className={buttonVariants({
                              size: "sm",
                              variant: "outline",
                            })}
                            href={`/platform/projects/${project.id}/dashboard`}
                          >
                            Open dashboard
                            <ArrowRightIcon
                              aria-hidden="true"
                              data-icon="inline-end"
                            />
                          </Link>
                        </div>
                      );
                    })}
                  </div>

                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Wedding</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Open</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {overview.recentProjects.map(
                          (project, projectIndex) => {
                            const projectName = formatProjectCoupleDisplayName(
                              project,
                              projectIndex,
                            );
                            const projectReference =
                              formatProjectDisplayReference(
                                project,
                                projectIndex,
                              );

                            return (
                              <TableRow key={project.id}>
                                <TableCell className="min-w-64 whitespace-normal">
                                  <div className="flex flex-col gap-1">
                                    <strong className="text-sm font-medium">
                                      {projectName}
                                    </strong>
                                    <span className="text-xs text-muted-foreground">
                                      {projectReference.label}:{" "}
                                      {projectReference.value}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary">
                                    {formatLabel(project.status)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Link
                                    aria-label={`Open dashboard for ${projectName}`}
                                    className={buttonVariants({
                                      size: "sm",
                                      variant: "ghost",
                                    })}
                                    href={`/platform/projects/${project.id}/dashboard`}
                                  >
                                    Open
                                    <ArrowRightIcon
                                      aria-hidden="true"
                                      data-icon="inline-end"
                                    />
                                  </Link>
                                </TableCell>
                              </TableRow>
                            );
                          },
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-1.5">
                  <CardTitle>
                    <h2>Recent activity</h2>
                  </CardTitle>
                  <CardDescription>
                    Latest workspace actions visible to your role.
                  </CardDescription>
                </div>
                <Link
                  aria-label="Open complete activity history"
                  className={buttonVariants({ size: "sm", variant: "outline" })}
                  href="/platform/audit-logs"
                >
                  Activity history
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {overview.recentAuditLogs.length === 0 ? (
                <OperationalEmptyState
                  description="Activity appears here when your role can read the audit trail."
                  icon={ActivityIcon}
                  nextStep="Restricted roles should continue through project-level pages. Audit readers can open the full activity history."
                  title="No activity visible"
                />
              ) : (
                <>
                  <div className="grid gap-3 md:hidden">
                    {overview.recentAuditLogs.map((log) => (
                      <div className="workflow-record" key={log.id}>
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-medium">
                              {formatLabel(log.action)}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {formatLabel(log.objectType)}
                              {log.reason ? ` - ${log.reason}` : ""}
                            </p>
                          </div>
                          <Badge variant="secondary">
                            {formatLabel(log.source)}
                          </Badge>
                        </div>
                        <Separator />
                        <div className="text-sm text-muted-foreground">
                          {formatDateTime(log.createdAt)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Activity</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {overview.recentAuditLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="min-w-64 whitespace-normal">
                              <div className="flex flex-col gap-1">
                                <strong className="text-sm font-medium">
                                  {formatLabel(log.action)}
                                </strong>
                                <span className="text-xs text-muted-foreground">
                                  {formatLabel(log.objectType)}
                                  {log.reason ? ` - ${log.reason}` : ""}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {formatLabel(log.source)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {formatDateTime(log.createdAt)}
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
        </div>

        <aside className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>
                <h2>Review queue</h2>
              </CardTitle>
              <CardDescription>
                Signals most likely to need same-day attention.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {reviewSignals.map((signal) => (
                <div className="flex flex-col gap-2" key={signal.label}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">{signal.label}</span>
                    <Badge
                      variant={
                        signal.value !== "0" &&
                        signal.value !== "Not available" &&
                        signal.value !== "Restricted by role"
                          ? "destructive"
                          : "outline"
                      }
                    >
                      {signal.value}
                    </Badge>
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">
                    {signal.description}
                  </p>
                  <Separator />
                </div>
              ))}
            </CardContent>
          </Card>

          <Alert>
            <ShieldCheckIcon aria-hidden="true" />
            <AlertTitle>Role-aware overview</AlertTitle>
            <AlertDescription>
              Revenue, payment, and audit signals appear only when your role has
              matching access. Restricted values stay hidden instead of being
              approximated.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>
                <h2>Next movement</h2>
              </CardTitle>
              <CardDescription>
                Use the overview to choose the right operational surface.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Link
                className={buttonVariants({ variant: "outline" })}
                href="/platform/projects"
              >
                Weddings
                <ArrowRightIcon aria-hidden="true" data-icon="inline-end" />
              </Link>
              <Link
                className={buttonVariants({ variant: "outline" })}
                href="/platform/reports"
              >
                Reports
                <ArrowRightIcon aria-hidden="true" data-icon="inline-end" />
              </Link>
              <Link
                className={buttonVariants({ variant: "outline" })}
                href="/platform/audit-logs"
              >
                Activity history
                <ArrowRightIcon aria-hidden="true" data-icon="inline-end" />
              </Link>
            </CardContent>
          </Card>

          <Alert variant="destructive">
            <TriangleAlertIcon aria-hidden="true" />
            <AlertTitle>Use project pages for action</AlertTitle>
            <AlertDescription>
              This page is for triage. Open the wedding, report, or activity
              surface before making operational changes.
            </AlertDescription>
          </Alert>
        </aside>
      </section>
    </main>
  );
}
