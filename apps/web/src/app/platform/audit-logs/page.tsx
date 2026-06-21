import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ActivityIcon,
  ArrowLeftIcon,
  CheckCircle2Icon,
  DownloadIcon,
  FilterIcon,
  HistoryIcon,
  LockKeyholeIcon,
  SearchIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
  UserRoundIcon,
} from "lucide-react";

import { exportAuditLogsAction } from "@/app/platform/audit-logs/actions";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import { redirectToMfaIfStepUpRequired } from "@/lib/auth/mfa-route-guard";
import { ProjectAccessError } from "@/lib/projects/project-api";
import {
  requireAuditExportPermission,
  requireAuditLogReadPermission,
} from "@/lib/reports/report-api";
import { listAuditLogs } from "@/lib/reports/report-db";
import { normalizeAuditLogFilters } from "@/lib/reports/report-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  formatDateTime,
  formatLabel,
  pluralize,
} from "@/lib/ui/format-helpers";
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
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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

type AuditLogsPageProps = {
  searchParams: Promise<{
    action?: string;
    actorUserId?: string;
    auditError?: string;
    auditStatus?: string;
    from?: string;
    objectType?: string;
    search?: string;
    to?: string;
  }>;
};

const auditSourceLabels: Record<string, string> = {
  api: "App activity",
  auth: "Sign-in activity",
  storage: "File activity",
  system: "System update",
};

function formatAuditLabel(value: string | null | undefined) {
  return formatLabel(value, {
    fallback: "System",
    labels: auditSourceLabels,
  });
}

function formatTeamMemberReference(value: string | null | undefined) {
  if (!value) {
    return "System activity";
  }

  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  return uuidPattern.test(value)
    ? `Team member ${value.slice(0, 8)}`
    : `Team member ${value}`;
}

function formatRecordReference(value: string | null | undefined) {
  if (!value) {
    return "No linked record";
  }

  return value.length > 16
    ? `${value.slice(0, 8)}...${value.slice(-4)}`
    : value;
}

function formatAuditExportError(value: string) {
  const labels: Record<string, string> = {
    audit_export_failed:
      "We could not create the export. Review the filters and try again.",
    supabase_not_configured:
      "The workspace connection is not ready. Activity export will be available once access is restored.",
  };

  return labels[value] ?? "We could not create the export. Please try again.";
}

function hasActiveFilters(params: Awaited<AuditLogsPageProps["searchParams"]>) {
  return Boolean(
    params.action ||
    params.actorUserId ||
    params.from ||
    params.objectType ||
    params.search ||
    params.to,
  );
}

export default async function AuditLogsPage({
  searchParams,
}: AuditLogsPageProps) {
  const authContext = await getAuthContext();
  const params = await searchParams;

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath("/platform/audit-logs"));
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
              <BreadcrumbPage>Activity history</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Card>
          <CardHeader>
            <CardTitle>
              <h1>Activity history is waiting for workspace access</h1>
            </CardTitle>
            <CardDescription>
              Audit data stays closed until the secure workspace connection is
              ready.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <LockKeyholeIcon aria-hidden="true" />
              <AlertTitle>Connection required</AlertTitle>
              <AlertDescription>
                Activity history will appear after the workspace connection is
                ready.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </main>
    );
  }

  const supabase = await createSupabaseServerClient();
  const context = { supabase, user: authContext.user };
  let canExport = false;

  try {
    await requireAuditLogReadPermission(context);
    await requireAuditExportPermission(context)
      .then(() => {
        canExport = true;
      })
      .catch(() => {
        canExport = false;
      });
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      await redirectToMfaIfStepUpRequired(context, "/platform/audit-logs", {
        permission: "audit.read",
        scope: "global",
      });
      notFound();
    }

    throw error;
  }

  const filters = normalizeAuditLogFilters(params);
  const logs = await listAuditLogs(supabase, filters, 100);
  const activeFilters = hasActiveFilters(params);

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
            <BreadcrumbPage>Activity history</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Team-only access</Badge>
            <Badge variant="outline">Sensitive details redacted</Badge>
            <Badge variant="outline">
              {canExport ? "Export available" : "Read only"}
            </Badge>
          </div>
          <div className="max-w-3xl">
            <h1 className="text-3xl font-semibold tracking-normal text-balance">
              Activity history
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground text-pretty">
              Search team and system activity by action, record type, team
              member, date, or text. Exports keep sensitive change details
              hidden for safer handoff.
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
              render={<Link href="/platform/reports" />}
            >
              <HistoryIcon aria-hidden="true" data-icon="inline-start" />
              Reports
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              <h2>Traceability view</h2>
            </CardTitle>
            <CardDescription>
              Review the latest matching records before exporting an activity
              handoff.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Matching records</span>
              <strong>{logs.length}</strong>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Active filters</span>
              <strong>{activeFilters ? "Applied" : "None"}</strong>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Export access</span>
              <strong>{canExport ? "Allowed" : "Restricted"}</strong>
            </div>
          </CardContent>
        </Card>
      </section>

      {params.auditStatus === "exported" ? (
        <Alert>
          <CheckCircle2Icon aria-hidden="true" />
          <AlertTitle>Activity export was created</AlertTitle>
          <AlertDescription>
            Sensitive change details were hidden in the exported file.
          </AlertDescription>
        </Alert>
      ) : null}

      {params.auditError ? (
        <Alert variant="destructive">
          <TriangleAlertIcon aria-hidden="true" />
          <AlertTitle>Activity export needs attention</AlertTitle>
          <AlertDescription>
            {formatAuditExportError(params.auditError)}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Search activity</h2>
          </CardTitle>
          <CardDescription>
            Use one or more filters to narrow the activity history. Leave fields
            blank to see the latest records your role can read.
          </CardDescription>
          <CardAction>
            <Badge variant="secondary">
              {activeFilters ? "Filtered" : "Latest records"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" method="get">
            <FieldSet>
              <FieldLegend>Filters</FieldLegend>
              <FieldGroup className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Field>
                  <FieldLabel htmlFor="audit-action">Action</FieldLabel>
                  <Input
                    id="audit-action"
                    name="action"
                    type="text"
                    defaultValue={params.action ?? ""}
                    placeholder="Example: guest.updated"
                  />
                  <FieldDescription>
                    Match the recorded action name.
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="audit-object-type">
                    Record type
                  </FieldLabel>
                  <Input
                    id="audit-object-type"
                    name="objectType"
                    type="text"
                    defaultValue={params.objectType ?? ""}
                    placeholder="Example: guests"
                  />
                  <FieldDescription>
                    Narrow by the affected record family.
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="audit-actor">Team member</FieldLabel>
                  <Input
                    id="audit-actor"
                    name="actorUserId"
                    type="text"
                    defaultValue={params.actorUserId ?? ""}
                    placeholder="User reference"
                  />
                  <FieldDescription>
                    Use a team member ID when available.
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="audit-from">From</FieldLabel>
                  <Input
                    id="audit-from"
                    name="from"
                    type="date"
                    defaultValue={params.from?.slice(0, 10) ?? ""}
                  />
                  <FieldDescription>
                    Start date for the audit window.
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="audit-to">To</FieldLabel>
                  <Input
                    id="audit-to"
                    name="to"
                    type="date"
                    defaultValue={params.to?.slice(0, 10) ?? ""}
                  />
                  <FieldDescription>
                    End date for the audit window.
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="audit-search">Search</FieldLabel>
                  <Input
                    id="audit-search"
                    name="search"
                    type="text"
                    defaultValue={params.search ?? ""}
                    placeholder="Action, source, reason, or ID"
                  />
                  <FieldDescription>
                    Search across visible audit fields.
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </FieldSet>

            <div className="flex flex-wrap gap-2">
              <Button aria-label="Apply activity history filters" type="submit">
                <FilterIcon aria-hidden="true" data-icon="inline-start" />
                Apply filters
              </Button>
              {activeFilters ? (
                <Button
                  variant="outline"
                  render={<Link href="/platform/audit-logs" />}
                >
                  Clear filters
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <Alert>
        <ShieldCheckIcon aria-hidden="true" />
        <AlertTitle>Exports are redacted by design</AlertTitle>
        <AlertDescription>
          Activity exports include source, action, record type, record
          reference, actor, reason, and time. Old and new value payloads are not
          exposed here.
        </AlertDescription>
      </Alert>

      {canExport ? (
        <Card>
          <CardHeader>
            <CardTitle>
              <h2>Export filtered activity</h2>
            </CardTitle>
            <CardDescription>
              Create a CSV for the current filters. Use it for operational
              review, handoff, or incident investigation.
            </CardDescription>
            <CardAction>
              <Badge variant="secondary">CSV export</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <form action={exportAuditLogsAction}>
              <input name="action" type="hidden" value={params.action ?? ""} />
              <input
                name="objectType"
                type="hidden"
                value={params.objectType ?? ""}
              />
              <input
                name="actorUserId"
                type="hidden"
                value={params.actorUserId ?? ""}
              />
              <input name="from" type="hidden" value={params.from ?? ""} />
              <input name="search" type="hidden" value={params.search ?? ""} />
              <input name="to" type="hidden" value={params.to ?? ""} />
              <Button
                aria-label="Export filtered activity history as CSV"
                type="submit"
                variant="outline"
              >
                <DownloadIcon aria-hidden="true" data-icon="inline-start" />
                Export filtered CSV
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Alert>
          <LockKeyholeIcon aria-hidden="true" />
          <AlertTitle>Export access is restricted</AlertTitle>
          <AlertDescription>
            You can review activity history, but your role cannot create audit
            exports from this page.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Activity entries</h2>
          </CardTitle>
          <CardDescription>
            Review source, action, record type, actor, and time for the latest
            matching activity.
          </CardDescription>
          <CardAction>
            <Badge variant="secondary">
              {pluralize(logs.length, "record")}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SearchIcon aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle>No matching activity</EmptyTitle>
                <EmptyDescription>
                  Adjust the filters to broaden the activity history results.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                {activeFilters ? (
                  <Button
                    variant="outline"
                    render={<Link href="/platform/audit-logs" />}
                  >
                    Clear filters
                  </Button>
                ) : null}
              </EmptyContent>
            </Empty>
          ) : (
            <>
              <div className="grid gap-3 md:hidden">
                {logs.map((log) => (
                  <div className="workflow-record" key={log.id}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">
                          {formatAuditLabel(log.action)}
                        </p>
                        <p className="mt-1 text-sm leading-5 text-muted-foreground">
                          {log.reason ?? "No reason note recorded."}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {formatAuditLabel(log.source)}
                      </Badge>
                    </div>
                    <Separator />
                    <div className="grid gap-2 text-sm">
                      <div className="grid gap-1">
                        <span className="text-muted-foreground">Record</span>
                        <span>{formatAuditLabel(log.objectType)}</span>
                        <span className="break-all font-mono text-xs text-muted-foreground">
                          {formatRecordReference(log.objectId)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">
                          Team member
                        </span>
                        <span className="inline-flex items-center gap-2 text-right">
                          <UserRoundIcon aria-hidden="true" />
                          {formatTeamMemberReference(log.actorUserId)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Time</span>
                        <span className="text-right">
                          {formatDateTime(log.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Activity</TableHead>
                      <TableHead>Record</TableHead>
                      <TableHead>Team member</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="max-w-sm whitespace-normal">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">
                              {formatAuditLabel(log.action)}
                            </span>
                            <span className="text-sm leading-5 text-muted-foreground">
                              {log.reason ?? "No reason note recorded."}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs whitespace-normal">
                          <div className="flex flex-col gap-1">
                            <span>{formatAuditLabel(log.objectType)}</span>
                            <span className="font-mono text-xs text-muted-foreground">
                              {formatRecordReference(log.objectId)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UserRoundIcon aria-hidden="true" />
                            <span>
                              {formatTeamMemberReference(log.actorUserId)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {formatAuditLabel(log.source)}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDateTime(log.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Alert>
        <ActivityIcon aria-hidden="true" />
        <AlertTitle>Activity records are operational evidence</AlertTitle>
        <AlertDescription>
          Use this page to understand who changed what, when it happened, and
          which area of the platform produced the record.
        </AlertDescription>
      </Alert>
    </main>
  );
}
