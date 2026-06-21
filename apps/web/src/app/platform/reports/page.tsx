import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  DownloadIcon,
  FileTextIcon,
  HistoryIcon,
  LockKeyholeIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
} from "lucide-react";

import { exportReportAction } from "@/app/platform/reports/actions";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import { redirectToMfaIfStepUpRequired } from "@/lib/auth/mfa-route-guard";
import { getReportingPermissionSet } from "@/lib/reports/report-api";
import { listReportExports } from "@/lib/reports/report-db";
import { getReportCatalogForPermissions } from "@/lib/reports/report-service";
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

export const dynamic = "force-dynamic";

type ReportsPageProps = {
  searchParams: Promise<{
    eventId?: string;
    projectId?: string;
    reportError?: string;
    reportStatus?: string;
  }>;
};

function canRunReport(
  scope: string,
  projectId: string | undefined,
  eventId: string | undefined,
) {
  if (scope === "global") {
    return true;
  }

  if (scope === "project") {
    return Boolean(projectId);
  }

  return Boolean(eventId);
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function formatLabel(value: string | null | undefined) {
  if (!value) {
    return "Not set";
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

function formatScope(scope: string) {
  if (scope === "global") {
    return "Workspace";
  }

  if (scope === "project") {
    return "Wedding project";
  }

  return "Event";
}

function formatReportName(key: string, fallback: string) {
  if (key === "audit_log_export") {
    return "Activity history export";
  }

  if (key === "payment_contract_summary") {
    return "Commercial access summary";
  }

  return fallback;
}

function formatReportDescription(key: string, fallback: string) {
  if (key === "audit_log_export") {
    return "Redacted team activity export for authorized operational review.";
  }

  if (key === "project_guest_summary") {
    return "Guest count, family side, delivery type, and event assignment summary.";
  }

  if (key === "rsvp_summary") {
    return "RSVP attendance summary across the wedding project's events.";
  }

  if (key === "payment_contract_summary") {
    return "Contract, balance, payment gate, and exception summary for authorized teams.";
  }

  if (key === "seating_summary") {
    return "Table capacity, assigned guests, and remaining seating summary.";
  }

  if (key === "check_in_summary") {
    return "Expected guests, arrivals, duplicate scans, and unexpected guest requests.";
  }

  return fallback;
}

function formatReportError(value: string) {
  const labels: Record<string, string> = {
    permission_denied:
      "You do not have access to create that export in this context.",
    report_export_failed:
      "We could not create the report. Review the context and try again.",
    supabase_not_configured:
      "The workspace connection is not ready. Reports will be available once access is restored.",
  };

  return labels[value] ?? "We could not create the report. Please try again.";
}

function formatExportFilename(value: unknown) {
  if (!value) {
    return "Export file pending";
  }

  return String(value)
    .replaceAll("audit_log_export", "activity-history-export")
    .replaceAll("_", "-");
}

function formatDateTime(value: unknown) {
  if (typeof value !== "string") {
    return "Time not recorded";
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

function contextLabel(
  projectId: string | undefined,
  eventId: string | undefined,
) {
  if (eventId) {
    return "Event reporting context";
  }

  if (projectId) {
    return "Wedding reporting context";
  }

  return "Workspace reporting context";
}

function contextDescription(
  projectId: string | undefined,
  eventId: string | undefined,
) {
  if (eventId) {
    return "Event-level exports are available because this page was opened with an event context.";
  }

  if (projectId) {
    return "Wedding-level exports are available because this page was opened with a project context.";
  }

  return "Workspace exports are available here. Open reports from a wedding or event page to unlock scoped exports.";
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const authContext = await getAuthContext();
  const params = await searchParams;
  const projectId = params.projectId;
  const eventId = params.eventId;
  const reportReturnPathParams = new URLSearchParams();

  if (projectId) {
    reportReturnPathParams.set("projectId", projectId);
  }

  if (eventId) {
    reportReturnPathParams.set("eventId", eventId);
  }

  const reportReturnPathQuery = reportReturnPathParams.toString();
  const reportReturnPath = reportReturnPathQuery
    ? `/platform/reports?${reportReturnPathQuery}`
    : "/platform/reports";

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath(reportReturnPath));
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
              <BreadcrumbPage>Reports</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Card>
          <CardHeader>
            <CardTitle>
              <h1 className="text-3xl font-semibold tracking-normal text-balance">
                Reports are waiting for workspace access
              </h1>
            </CardTitle>
            <CardDescription>
              Reporting stays closed until the secure workspace connection is
              ready.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <LockKeyholeIcon aria-hidden="true" />
              <AlertTitle>Connection required</AlertTitle>
              <AlertDescription>
                Report data will appear after the workspace connection is ready.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </main>
    );
  }

  const supabase = await createSupabaseServerClient();
  const context = { supabase, user: authContext.user };
  const permissions = await getReportingPermissionSet(context, {
    eventId,
    projectId,
  });
  const reportCatalogCapabilities = [
    {
      permission: "reports.catalog.read",
      scope: "global",
    },
    ...(projectId
      ? [
          {
            permission: "reports.catalog.read" as const,
            scope: "project" as const,
            scopeId: projectId,
          },
        ]
      : []),
    ...(eventId
      ? [
          {
            permission: "reports.catalog.read" as const,
            scope: "event" as const,
            scopeId: eventId,
          },
        ]
      : []),
  ] as const;

  if (!permissions.has("reports.catalog.read")) {
    await redirectToMfaIfStepUpRequired(
      context,
      reportReturnPath,
      reportCatalogCapabilities,
    );
    notFound();
  }

  const [catalog, exports] = await Promise.all([
    Promise.resolve(getReportCatalogForPermissions(permissions)),
    listReportExports(supabase, { eventId, projectId }),
  ]);
  const runnableReportCount = catalog.filter((definition) =>
    canRunReport(definition.scope, projectId, eventId),
  ).length;
  const scopedReportCount = catalog.filter(
    (definition) => definition.scope !== "global",
  ).length;

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
            <BreadcrumbLink render={<Link href="/platform/dashboard" />}>
              Operations
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Reports</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              {contextLabel(projectId, eventId)}
            </Badge>
            <Badge variant="outline">CSV exports</Badge>
            <Badge variant="outline">Permission checked</Badge>
          </div>
          <div className="max-w-3xl">
            <h1 className="text-3xl font-semibold tracking-normal text-balance">
              Reports
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground text-pretty">
              Generate operational CSV exports from the reporting catalog your
              role can access. Each export is scoped to the current workspace,
              wedding, or event context.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              render={<Link href="/platform/dashboard" />}
            >
              <ArrowLeftIcon aria-hidden="true" data-icon="inline-start" />
              Operations dashboard
            </Button>
            <Button
              variant="outline"
              render={<Link href="/platform/audit-logs" />}
            >
              <HistoryIcon aria-hidden="true" data-icon="inline-start" />
              Activity history
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              <h2>Export readiness</h2>
            </CardTitle>
            <CardDescription>
              {contextDescription(projectId, eventId)}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Available reports</span>
              <strong>{catalog.length}</strong>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">
                Ready in this context
              </span>
              <strong>{runnableReportCount}</strong>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Scoped reports</span>
              <strong>{scopedReportCount}</strong>
            </div>
          </CardContent>
        </Card>
      </section>

      {params.reportStatus === "generated" ? (
        <Alert>
          <CheckCircle2Icon aria-hidden="true" />
          <AlertTitle>Report export is ready</AlertTitle>
          <AlertDescription>
            The export was generated and added to the report history below.
          </AlertDescription>
        </Alert>
      ) : null}

      {params.reportError ? (
        <Alert variant="destructive">
          <TriangleAlertIcon aria-hidden="true" />
          <AlertTitle>Report export needs attention</AlertTitle>
          <AlertDescription>
            {formatReportError(params.reportError)}
          </AlertDescription>
        </Alert>
      ) : null}

      <Alert>
        <ShieldCheckIcon aria-hidden="true" />
        <AlertTitle>Reports follow your current access</AlertTitle>
        <AlertDescription>
          Internal commercial reports and activity history exports only appear
          for roles with the matching reporting and audit permissions.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Report catalog</h2>
          </CardTitle>
          <CardDescription>
            Choose a report that matches the current scope. Wedding and event
            reports unlock when this page is opened from the matching workspace.
          </CardDescription>
          <CardAction>
            <Badge variant="secondary">
              {pluralize(catalog.length, "report")}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          {catalog.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileTextIcon aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle>No reports available</EmptyTitle>
                <EmptyDescription>
                  This role does not currently have a report for the selected
                  workspace context.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  variant="outline"
                  render={<Link href="/platform/dashboard" />}
                >
                  Return to operations
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <>
              <div className="grid gap-3 md:hidden">
                {catalog.map((definition) => {
                  const runnable = canRunReport(
                    definition.scope,
                    projectId,
                    eventId,
                  );
                  const reportName = formatReportName(
                    definition.key,
                    definition.name,
                  );

                  return (
                    <div className="workflow-record" key={definition.key}>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{reportName}</p>
                          <p className="mt-1 text-sm leading-5 text-muted-foreground">
                            {formatReportDescription(
                              definition.key,
                              definition.description,
                            )}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {formatScope(definition.scope)}
                        </Badge>
                      </div>
                      <Separator />
                      <div className="flex flex-wrap gap-1.5">
                        <Badge
                          variant={
                            definition.internalOnly ? "secondary" : "outline"
                          }
                        >
                          {definition.internalOnly ? "Internal" : "Operational"}
                        </Badge>
                        <Badge variant="outline">
                          {formatLabel(definition.format)}
                        </Badge>
                      </div>
                      {runnable ? (
                        <form action={exportReportAction}>
                          <input
                            name="reportKey"
                            type="hidden"
                            value={definition.key}
                          />
                          <input
                            name="scope"
                            type="hidden"
                            value={definition.scope}
                          />
                          {projectId ? (
                            <input
                              name="projectId"
                              type="hidden"
                              value={projectId}
                            />
                          ) : null}
                          {eventId ? (
                            <input
                              name="eventId"
                              type="hidden"
                              value={eventId}
                            />
                          ) : null}
                          <Button
                            aria-label={`Generate CSV export for ${reportName}`}
                            className="w-full"
                            size="sm"
                            type="submit"
                            variant="outline"
                          >
                            <DownloadIcon
                              aria-hidden="true"
                              data-icon="inline-start"
                            />
                            Generate CSV
                          </Button>
                        </form>
                      ) : (
                        <p className="text-sm leading-5 text-muted-foreground">
                          Open from a matching wedding or event.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Report</TableHead>
                      <TableHead>Scope</TableHead>
                      <TableHead>Access</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {catalog.map((definition) => {
                      const runnable = canRunReport(
                        definition.scope,
                        projectId,
                        eventId,
                      );
                      const reportName = formatReportName(
                        definition.key,
                        definition.name,
                      );

                      return (
                        <TableRow key={definition.key}>
                          <TableCell className="max-w-md whitespace-normal">
                            <div className="flex flex-col gap-1">
                              <span className="font-medium">{reportName}</span>
                              <span className="text-sm leading-5 text-muted-foreground">
                                {formatReportDescription(
                                  definition.key,
                                  definition.description,
                                )}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {formatScope(definition.scope)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1.5">
                              <Badge
                                variant={
                                  definition.internalOnly
                                    ? "secondary"
                                    : "outline"
                                }
                              >
                                {definition.internalOnly
                                  ? "Internal"
                                  : "Operational"}
                              </Badge>
                              <Badge variant="outline">
                                {formatLabel(definition.format)}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {runnable ? (
                              <form action={exportReportAction}>
                                <input
                                  name="reportKey"
                                  type="hidden"
                                  value={definition.key}
                                />
                                <input
                                  name="scope"
                                  type="hidden"
                                  value={definition.scope}
                                />
                                {projectId ? (
                                  <input
                                    name="projectId"
                                    type="hidden"
                                    value={projectId}
                                  />
                                ) : null}
                                {eventId ? (
                                  <input
                                    name="eventId"
                                    type="hidden"
                                    value={eventId}
                                  />
                                ) : null}
                                <Button
                                  aria-label={`Generate CSV export for ${reportName}`}
                                  size="sm"
                                  type="submit"
                                  variant="outline"
                                >
                                  <DownloadIcon
                                    aria-hidden="true"
                                    data-icon="inline-start"
                                  />
                                  Generate CSV
                                </Button>
                              </form>
                            ) : (
                              <span className="inline-flex max-w-48 text-right text-sm leading-5 text-muted-foreground">
                                Open from a matching wedding or event.
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Export history</h2>
          </CardTitle>
          <CardDescription>
            Recent report exports stay visible for audit-friendly handoff and
            row-count review.
          </CardDescription>
          <CardAction>
            <Badge variant="secondary">
              {pluralize(exports.length, "export")}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          {exports.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <HistoryIcon aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle>No exports yet</EmptyTitle>
                <EmptyDescription>
                  Generated CSV files will appear here with their status, row
                  count, and generated time.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <>
              <div className="grid gap-3 md:hidden">
                {exports.map((exportRow) => (
                  <div className="workflow-record" key={String(exportRow.id)}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">
                          {formatReportName(
                            String(exportRow.report_key),
                            formatLabel(String(exportRow.report_key)),
                          )}
                        </p>
                        <p className="mt-1 break-all text-sm leading-5 text-muted-foreground">
                          {formatExportFilename(exportRow.filename)}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {formatLabel(String(exportRow.status))}
                      </Badge>
                    </div>
                    <Separator />
                    <div className="grid gap-2 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Rows</span>
                        <span>
                          {pluralize(Number(exportRow.row_count ?? 0), "row")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Generated</span>
                        <span>{formatDateTime(exportRow.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Export</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Rows</TableHead>
                      <TableHead>Generated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exports.map((exportRow) => (
                      <TableRow key={String(exportRow.id)}>
                        <TableCell className="max-w-md whitespace-normal">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">
                              {formatReportName(
                                String(exportRow.report_key),
                                formatLabel(String(exportRow.report_key)),
                              )}
                            </span>
                            <span className="text-sm leading-5 text-muted-foreground break-all">
                              {formatExportFilename(exportRow.filename)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {formatLabel(String(exportRow.status))}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {pluralize(Number(exportRow.row_count ?? 0), "row")}
                        </TableCell>
                        <TableCell>
                          {formatDateTime(exportRow.created_at)}
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
    </main>
  );
}
