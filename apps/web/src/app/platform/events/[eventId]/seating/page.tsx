import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  DownloadIcon,
  MapIcon,
  Table2Icon,
  UsersIcon,
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
import { Button } from "@/components/ui/button";
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
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
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
import { Textarea } from "@/components/ui/textarea";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import {
  hasProjectPermission,
  ProjectAccessError,
  requireEventPermission,
} from "@/lib/projects/project-api";
import {
  formatProjectCoupleDisplayName,
  formatProjectEventDisplayName,
  isInternalProjectDisplayText,
} from "@/lib/projects/project-foundation";
import { searchParamText } from "@/lib/navigation/search-params";
import { getEventSeatingOverview } from "@/lib/seating/seating-db";
import {
  formatEventTableCode,
  formatEventTableName,
  formatEventTableReference,
  isInternalEventTableLabel,
} from "@/lib/seating/seating-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  formatGuestDeliveryType,
  formatGuestSide,
  formatRsvpStatus,
  seatingStatusBadgeVariant as statusBadgeVariant,
} from "@/lib/ui/event-format-helpers";
import { pluralize } from "@/lib/ui/format-helpers";
import {
  assignGuestToEventTableAction,
  bulkCreateEventTablesAction,
  createEventTableAction,
  generateTableCardCsvExportAction,
  removeGuestFromEventTableAction,
  updateEventTableAction,
} from "./actions";

export const dynamic = "force-dynamic";

type SeatingPageProps = {
  params: Promise<{
    eventId: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Not scheduled";
  }

  const dateValue = value.includes("T") ? value : `${value}T00:00:00Z`;

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(dateValue));
}

function formatAssignmentMode(value: string | null | undefined) {
  const labels: Record<string, string> = {
    mixed: "Mixed",
    seat_level: "Seat-level",
    table_level: "Table-level",
  };

  return value ? (labels[value] ?? value.replaceAll("_", " ")) : "Table-level";
}

function formatTableStatus(value: string | null | undefined) {
  const labels: Record<string, string> = {
    active: "Active",
    archived: "Archived",
    draft: "Draft",
    locked: "Locked",
  };

  return value ? (labels[value] ?? value.replaceAll("_", " ")) : "Draft";
}

function formatSeatingGuestDisplayName(value: string, index: number) {
  return isInternalProjectDisplayText(value) ? `Guest ${index + 1}` : value;
}

function publicTableField(value: string | null | undefined) {
  if (!value || isInternalEventTableLabel(value)) {
    return "";
  }

  return value;
}

function statusMessage(status: string | undefined) {
  switch (status) {
    case "export_generated":
      return "Table-card CSV generated.";
    case "guest_assigned":
      return "Guest assigned to a table.";
    case "guest_removed":
      return "Guest removed from the seating plan.";
    case "table_created":
      return "Table created.";
    case "table_updated":
      return "Table updated.";
    case "tables_created":
      return "Tables created.";
    default:
      return null;
  }
}

export default async function EventSeatingPage({
  params,
  searchParams,
}: SeatingPageProps) {
  const authContext = await getAuthContext();
  const { eventId } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath(`/platform/events/${eventId}/seating`));
  }

  if (authContext.status === "not_configured") {
    return (
      <div className="flex flex-col gap-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/platform" />}>
                Workspace
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Event seating</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Card>
          <CardHeader>
            <CardTitle>Event seating</CardTitle>
            <CardDescription>
              Connect the workspace before loading table plans and assignments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTriangleIcon aria-hidden="true" />
              <AlertTitle>Workspace connection needed</AlertTitle>
              <AlertDescription>
                Seating tools will appear after the secure connection is ready.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  const context = {
    supabase,
    user: authContext.user,
  };

  try {
    await requireEventPermission(context, eventId, "seating.read");
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      notFound();
    }

    throw error;
  }

  const overview = await getEventSeatingOverview(supabase, eventId);
  const generatedExports = overview.exports.filter(
    (exportFile) => exportFile.status === "generated",
  );
  const [canManageTables, canAssign, canExport] = await Promise.all([
    hasProjectPermission(context, overview.project.id, "seating.tables.manage"),
    hasProjectPermission(context, overview.project.id, "seating.assign"),
    hasProjectPermission(context, overview.project.id, "seating.export"),
  ]);
  const seatingError = searchParamText(resolvedSearchParams, "seatingError");
  const seatingStatus = statusMessage(
    searchParamText(resolvedSearchParams, "seatingStatus"),
  );
  const projectLabel = formatProjectCoupleDisplayName(overview.project, 0);
  const eventName = formatProjectEventDisplayName(overview.event, 0);
  const openSeatCount = Math.max(
    0,
    overview.summary.capacity - overview.summary.totalActiveOccupancy,
  );
  const hasTables = overview.summary.tableSummaries.length > 0;
  const hasUnassignedGuests = overview.summary.unassignedGuests.length > 0;
  const canStartAssignments = canAssign && hasTables && hasUnassignedGuests;

  return (
    <div className="flex flex-col gap-6">
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
                <Link href={`/platform/projects/${overview.project.id}`} />
              }
            >
              {projectLabel}
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
            <BreadcrumbPage>Seating</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex max-w-3xl flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{projectLabel}</Badge>
                <Badge variant="outline">{eventName}</Badge>
                <Badge variant="outline">
                  {formatDate(overview.event.event_date)}
                </Badge>
              </div>
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-semibold tracking-normal text-balance">
                  Seating plan
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground text-pretty">
                  Build the table plan for this event, assign active invited
                  guests, and prepare the table-card CSV for print handoff.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                render={<Link href={`/platform/events/${eventId}`} />}
                variant="outline"
              >
                <ArrowLeftIcon data-icon="inline-start" />
                Event overview
              </Button>
              <Button
                render={
                  <Link href={`/platform/events/${eventId}/seating/map`} />
                }
                variant="outline"
              >
                <MapIcon data-icon="inline-start" />
                Seating map
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="ops-ledger__metrics">
            <div className="ops-ledger__metric">
              <span className="ops-ledger__metric-label">Seats assigned</span>
              <strong className="ops-ledger__metric-value">
                {overview.summary.totalActiveOccupancy}/
                {overview.summary.capacity}
              </strong>
              <span className="ops-ledger__metric-note">
                Active guests counted for this event.
              </span>
            </div>
            <div className="ops-ledger__metric">
              <span className="ops-ledger__metric-label">Open seats</span>
              <strong className="ops-ledger__metric-value">
                {openSeatCount}
              </strong>
              <span className="ops-ledger__metric-note">
                Available across active tables.
              </span>
            </div>
            <div className="ops-ledger__metric">
              <span className="ops-ledger__metric-label">
                Tables needing attention
              </span>
              <strong className="ops-ledger__metric-value">
                {overview.summary.overCapacityTables}
              </strong>
              <span className="ops-ledger__metric-note">
                Over-capacity tables to review.
              </span>
            </div>
            <div className="ops-ledger__metric">
              <span className="ops-ledger__metric-label">CSV versions</span>
              <strong className="ops-ledger__metric-value">
                {generatedExports.length}
              </strong>
              <span className="ops-ledger__metric-note">
                Generated table-card files.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {seatingError ? (
        <Alert variant="destructive">
          <AlertTriangleIcon aria-hidden="true" />
          <AlertTitle>Seating action could not be completed</AlertTitle>
          <AlertDescription>{seatingError}</AlertDescription>
        </Alert>
      ) : null}

      {seatingStatus ? (
        <Alert>
          <Table2Icon aria-hidden="true" />
          <AlertTitle>{seatingStatus}</AlertTitle>
          <AlertDescription>
            Review the updated table plan before preparing any printed handoff.
          </AlertDescription>
        </Alert>
      ) : null}

      {overview.summary.warnings.length > 0 ? (
        <Alert>
          <AlertTriangleIcon aria-hidden="true" />
          <AlertTitle>Guest count review needed</AlertTitle>
          <AlertDescription>
            <ul className="flex list-disc flex-col gap-1 pl-5">
              {overview.summary.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      <Tabs defaultValue="plan">
        <TabsList
          className="w-full justify-start overflow-x-auto"
          variant="line"
        >
          <TabsTrigger value="plan">Table plan</TabsTrigger>
          <TabsTrigger value="guests">Guest assignments</TabsTrigger>
          <TabsTrigger value="exports">Print handoff</TabsTrigger>
        </TabsList>

        <TabsContent className="flex flex-col gap-5" value="plan">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
            <Card>
              <CardHeader>
                <CardTitle>Tables</CardTitle>
                <CardDescription>
                  Compare capacity, status, and current guests before changing
                  assignments.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {hasTables ? (
                  <>
                    <div className="flex flex-col gap-3 md:hidden">
                      {overview.summary.tableSummaries.map(
                        (summary, tableIndex) => {
                          const displayTableReference =
                            formatEventTableReference(
                              summary.table,
                              tableIndex,
                            );

                          return (
                            <div
                              className="ops-ledger__record"
                              key={summary.table.id}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex flex-col gap-1">
                                  <span className="font-medium">
                                    {displayTableReference}
                                  </span>
                                  {publicTableField(
                                    summary.table.description,
                                  ) ? (
                                    <span className="text-sm text-muted-foreground">
                                      {publicTableField(
                                        summary.table.description,
                                      )}
                                    </span>
                                  ) : null}
                                </div>
                                <Badge
                                  variant={statusBadgeVariant(
                                    summary.table.status,
                                  )}
                                >
                                  {formatTableStatus(summary.table.status)}
                                </Badge>
                              </div>
                              <div className="grid gap-2 text-sm">
                                <div className="flex items-center justify-between gap-3">
                                  <span className="text-muted-foreground">
                                    Occupancy
                                  </span>
                                  <span>
                                    {summary.activeGuestCount}/
                                    {summary.capacity}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                  <span className="text-muted-foreground">
                                    Capacity
                                  </span>
                                  <Badge
                                    variant={
                                      summary.overCapacityBy > 0
                                        ? "destructive"
                                        : summary.remainingCapacity === 0
                                          ? "secondary"
                                          : "outline"
                                    }
                                  >
                                    {summary.overCapacityBy > 0
                                      ? `Over by ${summary.overCapacityBy}`
                                      : summary.remainingCapacity === 0
                                        ? "Full"
                                        : `${summary.remainingCapacity} open`}
                                  </Badge>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                  <span className="text-muted-foreground">
                                    Mode
                                  </span>
                                  <span>
                                    {formatAssignmentMode(
                                      summary.table.assignmentMode,
                                    )}
                                  </span>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="text-muted-foreground">
                                    Notes
                                  </span>
                                  <span>
                                    {publicTableField(summary.table.notes) ||
                                      "No team notes"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                    <div className="hidden md:block">
                      <Table className="min-w-[640px]">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Table</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Occupancy</TableHead>
                            <TableHead>Mode</TableHead>
                            <TableHead>Notes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {overview.summary.tableSummaries.map(
                            (summary, tableIndex) => {
                              const displayTableReference =
                                formatEventTableReference(
                                  summary.table,
                                  tableIndex,
                                );

                              return (
                                <TableRow key={summary.table.id}>
                                  <TableCell className="whitespace-normal">
                                    <div className="flex flex-col gap-1">
                                      <span className="font-medium">
                                        {displayTableReference}
                                      </span>
                                      {publicTableField(
                                        summary.table.description,
                                      ) ? (
                                        <span className="text-sm text-muted-foreground">
                                          {publicTableField(
                                            summary.table.description,
                                          )}
                                        </span>
                                      ) : null}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={statusBadgeVariant(
                                        summary.table.status,
                                      )}
                                    >
                                      {formatTableStatus(summary.table.status)}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-col gap-1">
                                      <span>
                                        {summary.activeGuestCount}/
                                        {summary.capacity}
                                      </span>
                                      <Badge
                                        variant={
                                          summary.overCapacityBy > 0
                                            ? "destructive"
                                            : summary.remainingCapacity === 0
                                              ? "secondary"
                                              : "outline"
                                        }
                                      >
                                        {summary.overCapacityBy > 0
                                          ? `Over by ${summary.overCapacityBy}`
                                          : summary.remainingCapacity === 0
                                            ? "Full"
                                            : `${summary.remainingCapacity} open`}
                                      </Badge>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {formatAssignmentMode(
                                      summary.table.assignmentMode,
                                    )}
                                  </TableCell>
                                  <TableCell className="max-w-72 whitespace-normal text-muted-foreground">
                                    {publicTableField(summary.table.notes) ||
                                      "No team notes"}
                                  </TableCell>
                                </TableRow>
                              );
                            },
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                ) : (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Table2Icon aria-hidden="true" />
                      </EmptyMedia>
                      <EmptyTitle>No tables yet</EmptyTitle>
                      <EmptyDescription>
                        Create tables before assigning guests or generating
                        table cards.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Planning readiness</CardTitle>
                <CardDescription>
                  The safest next step depends on both table capacity and guest
                  assignment access.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  <div className="ops-ledger__decision">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">Tables available</span>
                      <span className="text-sm text-muted-foreground">
                        {hasTables
                          ? `${pluralize(
                              overview.summary.tableSummaries.length,
                              "table",
                            )} ready for assignment.`
                          : "Create tables to begin the seating plan."}
                      </span>
                    </div>
                    <Badge variant={hasTables ? "secondary" : "outline"}>
                      {hasTables ? "Ready" : "Needed"}
                    </Badge>
                  </div>
                  <div className="ops-ledger__decision">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">Guests waiting</span>
                      <span className="text-sm text-muted-foreground">
                        {hasUnassignedGuests
                          ? `${pluralize(
                              overview.summary.unassignedGuests.length,
                              "active guest",
                            )} still need a table.`
                          : "All active invited guests are seated."}
                      </span>
                    </div>
                    <Badge
                      variant={hasUnassignedGuests ? "outline" : "secondary"}
                    >
                      {hasUnassignedGuests ? "Open" : "Clear"}
                    </Badge>
                  </div>
                  <div className="ops-ledger__decision">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">Team access</span>
                      <span className="text-sm text-muted-foreground">
                        {canAssign
                          ? "Your role can assign guests for this event."
                          : "Your role can review the plan without changing assignments."}
                      </span>
                    </div>
                    <Badge variant={canAssign ? "secondary" : "outline"}>
                      {canAssign ? "Can assign" : "Read only"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-between gap-3">
                <span className="text-sm text-muted-foreground">
                  Event-day teams should review the map after table edits.
                </span>
                <Button
                  render={
                    <Link href={`/platform/events/${eventId}/seating/map`} />
                  }
                  variant="outline"
                >
                  <MapIcon data-icon="inline-start" />
                  Open map
                </Button>
              </CardFooter>
            </Card>
          </div>

          {canManageTables ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Create one table</CardTitle>
                  <CardDescription>
                    Use this for a named family, protocol, or service table.
                  </CardDescription>
                </CardHeader>
                <form action={createEventTableAction.bind(null, eventId)}>
                  <CardContent>
                    <FieldSet>
                      <FieldLegend>Table details</FieldLegend>
                      <FieldGroup>
                        <Field>
                          <FieldLabel htmlFor="table-code">
                            Table code
                          </FieldLabel>
                          <Input
                            id="table-code"
                            name="tableCode"
                            placeholder="T1"
                            required
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="table-name">
                            Table name
                          </FieldLabel>
                          <Input
                            id="table-name"
                            name="tableName"
                            placeholder="Table 1"
                            required
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="table-capacity">
                            Capacity
                          </FieldLabel>
                          <Input
                            id="table-capacity"
                            min="1"
                            name="capacity"
                            required
                            type="number"
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="table-mode">
                            Assignment mode
                          </FieldLabel>
                          <NativeSelect
                            className="w-full"
                            id="table-mode"
                            name="assignmentMode"
                          >
                            <NativeSelectOption value="table_level">
                              Table-level
                            </NativeSelectOption>
                            <NativeSelectOption value="seat_level">
                              Seat-level
                            </NativeSelectOption>
                            <NativeSelectOption value="mixed">
                              Mixed
                            </NativeSelectOption>
                          </NativeSelect>
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="table-notes">
                            Team notes
                          </FieldLabel>
                          <Textarea id="table-notes" name="notes" rows={3} />
                          <FieldDescription>
                            Notes stay with the table plan for staff review.
                          </FieldDescription>
                        </Field>
                      </FieldGroup>
                    </FieldSet>
                  </CardContent>
                  <CardFooter className="justify-end">
                    <Button
                      aria-label={`Create one table for ${eventName}`}
                      type="submit"
                    >
                      Create table
                    </Button>
                  </CardFooter>
                </form>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Create a table batch</CardTitle>
                  <CardDescription>
                    Add a numbered table run when the room layout is already
                    known.
                  </CardDescription>
                </CardHeader>
                <form action={bulkCreateEventTablesAction.bind(null, eventId)}>
                  <CardContent>
                    <FieldSet>
                      <FieldLegend>Batch details</FieldLegend>
                      <FieldGroup>
                        <Field>
                          <FieldLabel htmlFor="table-count">
                            Number of tables
                          </FieldLabel>
                          <Input
                            id="table-count"
                            min="1"
                            name="tableCount"
                            required
                            type="number"
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="bulk-capacity">
                            Capacity per table
                          </FieldLabel>
                          <Input
                            id="bulk-capacity"
                            min="1"
                            name="bulkCapacity"
                            required
                            type="number"
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="start-number">
                            Start number
                          </FieldLabel>
                          <Input
                            defaultValue="1"
                            id="start-number"
                            min="1"
                            name="startNumber"
                            type="number"
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="table-code-prefix">
                            Code prefix
                          </FieldLabel>
                          <Input
                            defaultValue="T"
                            id="table-code-prefix"
                            name="tableCodePrefix"
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="table-name-prefix">
                            Name prefix
                          </FieldLabel>
                          <Input
                            defaultValue="Table"
                            id="table-name-prefix"
                            name="tableNamePrefix"
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="bulk-mode">
                            Assignment mode
                          </FieldLabel>
                          <NativeSelect
                            className="w-full"
                            id="bulk-mode"
                            name="assignmentMode"
                          >
                            <NativeSelectOption value="table_level">
                              Table-level
                            </NativeSelectOption>
                            <NativeSelectOption value="seat_level">
                              Seat-level
                            </NativeSelectOption>
                            <NativeSelectOption value="mixed">
                              Mixed
                            </NativeSelectOption>
                          </NativeSelect>
                        </Field>
                      </FieldGroup>
                    </FieldSet>
                  </CardContent>
                  <CardFooter className="justify-end">
                    <Button
                      aria-label={`Create multiple tables for ${eventName}`}
                      type="submit"
                    >
                      Create tables
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </div>
          ) : (
            <Alert>
              <Table2Icon aria-hidden="true" />
              <AlertTitle>Table setup is read-only for your role</AlertTitle>
              <AlertDescription>
                You can review the current plan. A user with table management
                access can add or edit tables.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-4">
            {overview.summary.tableSummaries.map((summary, tableIndex) => {
              const displayTableCode = formatEventTableCode(
                summary.table.tableCode,
                tableIndex,
              );
              const displayTableName = formatEventTableName(
                summary.table.tableName,
                tableIndex,
              );
              const displayTableReference = formatEventTableReference(
                summary.table,
                tableIndex,
              );

              return (
                <Card key={summary.table.id}>
                  <CardHeader>
                    <CardTitle>{displayTableReference}</CardTitle>
                    <CardDescription>
                      {summary.activeGuestCount}/{summary.capacity} active seats
                      assigned
                      {summary.overCapacityBy > 0
                        ? `, over by ${summary.overCapacityBy}`
                        : summary.remainingCapacity === 0
                          ? ", table is full"
                          : `, ${summary.remainingCapacity} open`}
                      .
                    </CardDescription>
                    <CardAction>
                      <Badge
                        variant={
                          summary.overCapacityBy > 0
                            ? "destructive"
                            : summary.remainingCapacity === 0
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {summary.overCapacityBy > 0
                          ? "Over capacity"
                          : summary.remainingCapacity === 0
                            ? "Full"
                            : "Has space"}
                      </Badge>
                    </CardAction>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-5">
                      {canManageTables ? (
                        <form
                          action={updateEventTableAction.bind(
                            null,
                            eventId,
                            summary.table.id,
                          )}
                        >
                          <FieldSet>
                            <FieldLegend>Table controls</FieldLegend>
                            <FieldGroup className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                              <Field>
                                <FieldLabel
                                  htmlFor={`code-${summary.table.id}`}
                                >
                                  Table code
                                </FieldLabel>
                                <Input
                                  defaultValue={displayTableCode}
                                  id={`code-${summary.table.id}`}
                                  name="tableCode"
                                  required
                                />
                              </Field>
                              <Field>
                                <FieldLabel
                                  htmlFor={`name-${summary.table.id}`}
                                >
                                  Table name
                                </FieldLabel>
                                <Input
                                  defaultValue={displayTableName}
                                  id={`name-${summary.table.id}`}
                                  name="tableName"
                                  required
                                />
                              </Field>
                              <Field>
                                <FieldLabel
                                  htmlFor={`capacity-${summary.table.id}`}
                                >
                                  Capacity
                                </FieldLabel>
                                <Input
                                  defaultValue={summary.capacity}
                                  id={`capacity-${summary.table.id}`}
                                  min="1"
                                  name="capacity"
                                  required
                                  type="number"
                                />
                              </Field>
                              <Field>
                                <FieldLabel
                                  htmlFor={`status-${summary.table.id}`}
                                >
                                  Table status
                                </FieldLabel>
                                <NativeSelect
                                  className="w-full"
                                  defaultValue={summary.table.status}
                                  id={`status-${summary.table.id}`}
                                  name="status"
                                >
                                  <NativeSelectOption value="active">
                                    Active
                                  </NativeSelectOption>
                                  <NativeSelectOption value="draft">
                                    Draft
                                  </NativeSelectOption>
                                  <NativeSelectOption value="locked">
                                    Locked
                                  </NativeSelectOption>
                                  <NativeSelectOption value="archived">
                                    Archived
                                  </NativeSelectOption>
                                </NativeSelect>
                              </Field>
                              <Field>
                                <FieldLabel
                                  htmlFor={`mode-${summary.table.id}`}
                                >
                                  Assignment mode
                                </FieldLabel>
                                <NativeSelect
                                  className="w-full"
                                  defaultValue={summary.table.assignmentMode}
                                  id={`mode-${summary.table.id}`}
                                  name="assignmentMode"
                                >
                                  <NativeSelectOption value="table_level">
                                    Table-level
                                  </NativeSelectOption>
                                  <NativeSelectOption value="seat_level">
                                    Seat-level
                                  </NativeSelectOption>
                                  <NativeSelectOption value="mixed">
                                    Mixed
                                  </NativeSelectOption>
                                </NativeSelect>
                              </Field>
                              <Field>
                                <FieldLabel
                                  htmlFor={`order-${summary.table.id}`}
                                >
                                  Display order
                                </FieldLabel>
                                <Input
                                  defaultValue={summary.table.displayOrder}
                                  id={`order-${summary.table.id}`}
                                  min="0"
                                  name="displayOrder"
                                  type="number"
                                />
                              </Field>
                              <Field className="md:col-span-2 xl:col-span-3">
                                <FieldLabel
                                  htmlFor={`description-${summary.table.id}`}
                                >
                                  Guest-facing description
                                </FieldLabel>
                                <Textarea
                                  defaultValue={publicTableField(
                                    summary.table.description,
                                  )}
                                  id={`description-${summary.table.id}`}
                                  name="description"
                                  rows={2}
                                />
                              </Field>
                              <Field className="md:col-span-2 xl:col-span-3">
                                <FieldLabel
                                  htmlFor={`notes-${summary.table.id}`}
                                >
                                  Team notes
                                </FieldLabel>
                                <Textarea
                                  defaultValue={publicTableField(
                                    summary.table.notes,
                                  )}
                                  id={`notes-${summary.table.id}`}
                                  name="notes"
                                  rows={2}
                                />
                              </Field>
                              <Field className="md:col-span-2 xl:col-span-3">
                                <Button
                                  aria-label={`Save ${displayTableReference}`}
                                  type="submit"
                                  variant="outline"
                                >
                                  Save table
                                </Button>
                              </Field>
                            </FieldGroup>
                          </FieldSet>
                        </form>
                      ) : null}

                      <Separator />

                      {summary.assignedGuests.length === 0 ? (
                        <Empty>
                          <EmptyHeader>
                            <EmptyMedia variant="icon">
                              <UsersIcon aria-hidden="true" />
                            </EmptyMedia>
                            <EmptyTitle>No guests assigned</EmptyTitle>
                            <EmptyDescription>
                              Assign guests from the guest assignment tab when
                              this table is ready.
                            </EmptyDescription>
                          </EmptyHeader>
                        </Empty>
                      ) : (
                        <>
                          <div className="flex flex-col gap-3 md:hidden">
                            {summary.assignedGuests.map((guest, guestIndex) => {
                              const guestName = formatSeatingGuestDisplayName(
                                guest.displayName,
                                guestIndex,
                              );

                              return (
                                <div
                                  className="ops-ledger__record"
                                  key={guest.id}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex flex-col gap-1">
                                      <span className="font-medium">
                                        {guestName}
                                      </span>
                                      <span className="text-sm text-muted-foreground">
                                        {formatGuestDeliveryType(
                                          guest.isPrintedOnly,
                                        )}
                                      </span>
                                    </div>
                                    {guest.isVipProtocol ? (
                                      <Badge variant="outline">
                                        VIP/protocol
                                      </Badge>
                                    ) : null}
                                  </div>
                                  <div className="grid gap-2 text-sm">
                                    <div className="flex items-center justify-between gap-3">
                                      <span className="text-muted-foreground">
                                        Side
                                      </span>
                                      <span>
                                        {formatGuestSide(guest.guestSide)}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                      <span className="text-muted-foreground">
                                        RSVP
                                      </span>
                                      <span>
                                        {formatRsvpStatus(guest.rsvpStatus)}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                      <span className="text-muted-foreground">
                                        Seats
                                      </span>
                                      <span>{guest.guestCount ?? 1}</span>
                                    </div>
                                  </div>
                                  {canAssign ? (
                                    <form
                                      action={removeGuestFromEventTableAction.bind(
                                        null,
                                        eventId,
                                        guest.id,
                                      )}
                                    >
                                      <input
                                        name="reason"
                                        type="hidden"
                                        value="removed_from_seating_page"
                                      />
                                      <Button
                                        aria-label={`Remove ${guestName} from ${displayTableReference}`}
                                        type="submit"
                                        variant="outline"
                                      >
                                        Remove
                                      </Button>
                                    </form>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                          <div className="hidden md:block">
                            <Table className="min-w-[720px]">
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Guest</TableHead>
                                  <TableHead>Side</TableHead>
                                  <TableHead>RSVP</TableHead>
                                  <TableHead>Seats</TableHead>
                                  <TableHead>Notes</TableHead>
                                  {canAssign ? (
                                    <TableHead>Action</TableHead>
                                  ) : null}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {summary.assignedGuests.map(
                                  (guest, guestIndex) => {
                                    const guestName =
                                      formatSeatingGuestDisplayName(
                                        guest.displayName,
                                        guestIndex,
                                      );

                                    return (
                                      <TableRow key={guest.id}>
                                        <TableCell className="whitespace-normal">
                                          <div className="flex flex-col gap-1">
                                            <span className="font-medium">
                                              {guestName}
                                            </span>
                                            <span className="text-sm text-muted-foreground">
                                              {formatGuestDeliveryType(
                                                guest.isPrintedOnly,
                                              )}
                                            </span>
                                          </div>
                                        </TableCell>
                                        <TableCell>
                                          {formatGuestSide(guest.guestSide)}
                                        </TableCell>
                                        <TableCell>
                                          {formatRsvpStatus(guest.rsvpStatus)}
                                        </TableCell>
                                        <TableCell>
                                          {guest.guestCount ?? 1}
                                        </TableCell>
                                        <TableCell className="max-w-64 whitespace-normal">
                                          {guest.isVipProtocol ? (
                                            <Badge variant="outline">
                                              VIP/protocol
                                            </Badge>
                                          ) : (
                                            <span className="text-muted-foreground">
                                              Standard seating
                                            </span>
                                          )}
                                        </TableCell>
                                        {canAssign ? (
                                          <TableCell>
                                            <form
                                              action={removeGuestFromEventTableAction.bind(
                                                null,
                                                eventId,
                                                guest.id,
                                              )}
                                            >
                                              <input
                                                name="reason"
                                                type="hidden"
                                                value="removed_from_seating_page"
                                              />
                                              <Button
                                                aria-label={`Remove ${guestName} from ${displayTableReference}`}
                                                type="submit"
                                                variant="outline"
                                              >
                                                Remove
                                              </Button>
                                            </form>
                                          </TableCell>
                                        ) : null}
                                      </TableRow>
                                    );
                                  },
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent className="flex flex-col gap-5" value="guests">
          <div className="grid gap-4 xl:grid-cols-[minmax(320px,440px)_minmax(0,1fr)]">
            <Card>
              <CardHeader>
                <CardTitle>Assign a guest</CardTitle>
                <CardDescription>
                  Place one active invited guest at a table and add staff notes
                  if needed.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {canStartAssignments ? (
                  <form
                    action={assignGuestToEventTableAction.bind(null, eventId)}
                  >
                    <FieldSet>
                      <FieldLegend>Assignment details</FieldLegend>
                      <FieldGroup>
                        <Field>
                          <FieldLabel htmlFor="guest-id">Guest</FieldLabel>
                          <NativeSelect
                            className="w-full"
                            id="guest-id"
                            name="guestId"
                            required
                          >
                            {overview.summary.unassignedGuests.map(
                              (guest, guestIndex) => (
                                <NativeSelectOption
                                  key={guest.id}
                                  value={guest.id}
                                >
                                  {formatSeatingGuestDisplayName(
                                    guest.displayName,
                                    guestIndex,
                                  )}{" "}
                                  - {formatGuestSide(guest.guestSide)} -{" "}
                                  {formatRsvpStatus(guest.rsvpStatus)}
                                </NativeSelectOption>
                              ),
                            )}
                          </NativeSelect>
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="table-id">Table</FieldLabel>
                          <NativeSelect
                            className="w-full"
                            id="table-id"
                            name="tableId"
                            required
                          >
                            {overview.tables.map((table, tableIndex) => (
                              <NativeSelectOption
                                key={table.id}
                                value={table.id}
                              >
                                {formatEventTableReference(table, tableIndex)}
                              </NativeSelectOption>
                            ))}
                          </NativeSelect>
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="seating-notes">
                            Seating notes
                          </FieldLabel>
                          <Textarea
                            id="seating-notes"
                            name="seatingNotes"
                            rows={3}
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="vip-notes">
                            VIP/protocol notes
                          </FieldLabel>
                          <Textarea
                            id="vip-notes"
                            name="vipProtocolNotes"
                            rows={3}
                          />
                        </Field>
                        <Button
                          aria-label={`Assign selected guest to a table for ${eventName}`}
                          type="submit"
                        >
                          Assign guest
                        </Button>
                      </FieldGroup>
                    </FieldSet>
                  </form>
                ) : (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <UsersIcon aria-hidden="true" />
                      </EmptyMedia>
                      <EmptyTitle>
                        {canAssign
                          ? "Assignments are waiting on setup"
                          : "Assignments are read-only for your role"}
                      </EmptyTitle>
                      <EmptyDescription>
                        {canAssign
                          ? "Add active tables and invited guests before assigning seats."
                          : "You can review guest placement. A user with seating assignment access can make changes."}
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Unassigned active guests</CardTitle>
                <CardDescription>
                  Guests who declined are excluded from active seating.
                </CardDescription>
                <CardAction>
                  <Badge
                    variant={hasUnassignedGuests ? "outline" : "secondary"}
                  >
                    {pluralize(
                      overview.summary.unassignedGuests.length,
                      "guest",
                    )}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardContent>
                {hasUnassignedGuests ? (
                  <>
                    <div className="flex flex-col gap-3 md:hidden">
                      {overview.summary.unassignedGuests.map(
                        (guest, guestIndex) => {
                          const guestName = formatSeatingGuestDisplayName(
                            guest.displayName,
                            guestIndex,
                          );

                          return (
                            <div className="ops-ledger__record" key={guest.id}>
                              <div className="flex items-start justify-between gap-3">
                                <span className="font-medium">{guestName}</span>
                                {guest.isVipProtocol ? (
                                  <Badge variant="outline">VIP/protocol</Badge>
                                ) : null}
                              </div>
                              <div className="grid gap-2 text-sm">
                                <div className="flex items-center justify-between gap-3">
                                  <span className="text-muted-foreground">
                                    Side
                                  </span>
                                  <span>
                                    {formatGuestSide(guest.guestSide)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                  <span className="text-muted-foreground">
                                    RSVP
                                  </span>
                                  <span>
                                    {formatRsvpStatus(guest.rsvpStatus)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                  <span className="text-muted-foreground">
                                    Delivery
                                  </span>
                                  <span>
                                    {formatGuestDeliveryType(
                                      guest.isPrintedOnly,
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                  <span className="text-muted-foreground">
                                    Seats
                                  </span>
                                  <span>{guest.guestCount ?? 1}</span>
                                </div>
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                    <div className="hidden md:block">
                      <Table className="min-w-[680px]">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Guest</TableHead>
                            <TableHead>Side</TableHead>
                            <TableHead>RSVP</TableHead>
                            <TableHead>Delivery</TableHead>
                            <TableHead>Seats</TableHead>
                            <TableHead>Attention</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {overview.summary.unassignedGuests.map(
                            (guest, guestIndex) => {
                              const guestName = formatSeatingGuestDisplayName(
                                guest.displayName,
                                guestIndex,
                              );

                              return (
                                <TableRow key={guest.id}>
                                  <TableCell className="whitespace-normal font-medium">
                                    {guestName}
                                  </TableCell>
                                  <TableCell>
                                    {formatGuestSide(guest.guestSide)}
                                  </TableCell>
                                  <TableCell>
                                    {formatRsvpStatus(guest.rsvpStatus)}
                                  </TableCell>
                                  <TableCell>
                                    {formatGuestDeliveryType(
                                      guest.isPrintedOnly,
                                    )}
                                  </TableCell>
                                  <TableCell>{guest.guestCount ?? 1}</TableCell>
                                  <TableCell>
                                    {guest.isVipProtocol ? (
                                      <Badge variant="outline">
                                        VIP/protocol
                                      </Badge>
                                    ) : (
                                      <span className="text-muted-foreground">
                                        Standard
                                      </span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            },
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                ) : (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <UsersIcon aria-hidden="true" />
                      </EmptyMedia>
                      <EmptyTitle>All active guests are seated</EmptyTitle>
                      <EmptyDescription>
                        Review the table plan or generate the table-card CSV
                        when the room plan is final.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent className="flex flex-col gap-5" value="exports">
          <Card>
            <CardHeader>
              <CardTitle>Table-card CSV</CardTitle>
              <CardDescription>
                Generate a CSV handoff after the table plan has been reviewed.
              </CardDescription>
              <CardAction>
                {canExport ? (
                  <form
                    action={generateTableCardCsvExportAction.bind(
                      null,
                      eventId,
                    )}
                  >
                    <Button
                      aria-label={`Generate table-card CSV for ${eventName}`}
                      type="submit"
                    >
                      <DownloadIcon data-icon="inline-start" />
                      Generate CSV
                    </Button>
                  </form>
                ) : (
                  <Badge variant="outline">Read only</Badge>
                )}
              </CardAction>
            </CardHeader>
            <CardContent>
              <Alert>
                <DownloadIcon aria-hidden="true" />
                <AlertTitle>Use the newest generated file</AlertTitle>
                <AlertDescription>
                  Regenerate the CSV after seating changes so table-card names,
                  VIP/protocol markers, and capacity counts stay aligned.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Generated files</CardTitle>
              <CardDescription>
                Export history for this event table-card handoff.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generatedExports.length > 0 ? (
                <>
                  <div className="flex flex-col gap-3 md:hidden">
                    {generatedExports.map((exportFile) => (
                      <div className="ops-ledger__record" key={exportFile.id}>
                        <div className="flex items-start justify-between gap-3">
                          <span className="font-medium">
                            {exportFile.filename}
                          </span>
                          <Badge variant="secondary">Generated</Badge>
                        </div>
                        <div className="grid gap-2 text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">
                              Version
                            </span>
                            <span>{exportFile.version}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">Rows</span>
                            <span>
                              {pluralize(exportFile.row_count, "row")}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="hidden md:block">
                    <Table className="min-w-[560px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead>File</TableHead>
                          <TableHead>Version</TableHead>
                          <TableHead>Rows</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {generatedExports.map((exportFile) => (
                          <TableRow key={exportFile.id}>
                            <TableCell className="whitespace-normal font-medium">
                              {exportFile.filename}
                            </TableCell>
                            <TableCell>Version {exportFile.version}</TableCell>
                            <TableCell>
                              {pluralize(exportFile.row_count, "row")}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">Generated</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              ) : (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <DownloadIcon aria-hidden="true" />
                    </EmptyMedia>
                    <EmptyTitle>No CSV generated yet</EmptyTitle>
                    <EmptyDescription>
                      Generate the handoff when the seating plan is ready for
                      table-card preparation.
                    </EmptyDescription>
                  </EmptyHeader>
                  {canExport ? (
                    <EmptyContent>
                      <form
                        action={generateTableCardCsvExportAction.bind(
                          null,
                          eventId,
                        )}
                      >
                        <Button type="submit">
                          <DownloadIcon data-icon="inline-start" />
                          Generate CSV
                        </Button>
                      </form>
                    </EmptyContent>
                  ) : null}
                </Empty>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
