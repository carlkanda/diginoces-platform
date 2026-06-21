import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { CSSProperties } from "react";
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  ListChecksIcon,
  MapIcon,
  Table2Icon,
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
} from "@/lib/projects/project-foundation";
import { getEventSeatingOverview } from "@/lib/seating/seating-db";
import {
  buildVisualSeatingMapPlaceholder,
  formatEventTableName,
} from "@/lib/seating/seating-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SeatingMapPageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function capacityLabel(activeGuests: number, capacity: number) {
  if (capacity <= 0) {
    return "No capacity";
  }

  if (activeGuests > capacity) {
    return `Over by ${activeGuests - capacity}`;
  }

  if (activeGuests === capacity) {
    return "Full";
  }

  return `${capacity - activeGuests} open`;
}

export default async function SeatingMapPage({ params }: SeatingMapPageProps) {
  const authContext = await getAuthContext();
  const { eventId } = await params;

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath(`/platform/events/${eventId}/seating/map`));
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
              <BreadcrumbPage>Seating map</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Card>
          <CardHeader>
            <CardTitle>Seating map</CardTitle>
            <CardDescription>
              Connect the workspace before loading table placement.
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
  const mapTables = buildVisualSeatingMapPlaceholder(overview.tables);
  const canManageTables: boolean | null =
    mapTables.length === 0
      ? await hasProjectPermission(
          context,
          overview.project.id,
          "seating.tables.manage",
        )
      : null;
  const summaryByTableId = new Map(
    overview.summary.tableSummaries.map((summary) => [
      summary.table.id,
      summary,
    ]),
  );
  const projectLabel = formatProjectCoupleDisplayName(overview.project, 0);
  const eventName = formatProjectEventDisplayName(overview.event, 0);

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
            <BreadcrumbPage>Seating map</BreadcrumbPage>
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
                  {pluralize(mapTables.length, "table")} positioned
                </Badge>
              </div>
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-semibold tracking-normal text-balance">
                  Seating map
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground text-pretty">
                  Review table placement and occupancy before event-day handoff.
                  Use the seating plan to edit tables and guest assignments.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                render={<Link href={`/platform/events/${eventId}/seating`} />}
                variant="outline"
              >
                <ArrowLeftIcon data-icon="inline-start" />
                Seating plan
              </Button>
              <Button
                render={<Link href={`/platform/events/${eventId}`} />}
                variant="outline"
              >
                <ListChecksIcon data-icon="inline-start" />
                Event overview
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="ops-ledger__metrics">
            <div className="ops-ledger__metric">
              <span className="ops-ledger__metric-label">Active occupancy</span>
              <strong className="ops-ledger__metric-value">
                {overview.summary.totalActiveOccupancy}/
                {overview.summary.capacity}
              </strong>
              <span className="ops-ledger__metric-note">
                Guests counted across active tables.
              </span>
            </div>
            <div className="ops-ledger__metric">
              <span className="ops-ledger__metric-label">Tables on map</span>
              <strong className="ops-ledger__metric-value">
                {mapTables.length}
              </strong>
              <span className="ops-ledger__metric-note">
                Position markers in this event layout.
              </span>
            </div>
            <div className="ops-ledger__metric">
              <span className="ops-ledger__metric-label">Capacity alerts</span>
              <strong className="ops-ledger__metric-value">
                {overview.summary.overCapacityTables}
              </strong>
              <span className="ops-ledger__metric-note">
                Tables that need seating review.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <MapIcon aria-hidden="true" />
        <AlertTitle>Map is a placement review</AlertTitle>
        <AlertDescription>
          Table markers help staff verify the room view. The seating plan
          remains the place to change tables, capacity, guests, and exports.
        </AlertDescription>
      </Alert>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        <Card>
          <CardHeader>
            <CardTitle>Room placement</CardTitle>
            <CardDescription>
              Markers show the current room view, with a readable list layout on
              smaller screens.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mapTables.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Table2Icon aria-hidden="true" />
                  </EmptyMedia>
                  <EmptyTitle>No tables on the map yet</EmptyTitle>
                  <EmptyDescription>
                    {canManageTables === true
                      ? "Create event tables before using the map."
                      : "No tables have been configured for this event yet."}
                  </EmptyDescription>
                </EmptyHeader>
                {canManageTables === true ? (
                  <Button
                    render={
                      <Link href={`/platform/events/${eventId}/seating`} />
                    }
                  >
                    Create tables
                  </Button>
                ) : null}
              </Empty>
            ) : (
              <div className="seating-map" role="list">
                {mapTables.map((table, tableIndex) => {
                  const summary = summaryByTableId.get(table.id);
                  const displayLabel = formatEventTableName(
                    table.label,
                    tableIndex,
                  );
                  const activeGuests = summary?.activeGuestCount ?? 0;
                  const capacity = summary?.capacity ?? 0;
                  const isOverCapacity = activeGuests > capacity;

                  return (
                    <div
                      aria-label={`${displayLabel}. Occupancy ${activeGuests} of ${capacity}.`}
                      className="seating-map-table"
                      key={table.id}
                      role="listitem"
                      style={
                        {
                          "--table-x": `${table.positionX}px`,
                          "--table-y": `${table.positionY}px`,
                        } as CSSProperties
                      }
                    >
                      <strong>{displayLabel}</strong>
                      <span className="text-sm text-muted-foreground">
                        {activeGuests}/{capacity} seats
                      </span>
                      <Badge
                        variant={isOverCapacity ? "destructive" : "secondary"}
                      >
                        {capacityLabel(activeGuests, capacity)}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Table index</CardTitle>
            <CardDescription>
              Use this list to scan the same table states without relying on
              marker position.
            </CardDescription>
            <CardAction>
              <Badge variant="outline">
                {pluralize(overview.summary.tableSummaries.length, "table")}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            {overview.summary.tableSummaries.length > 0 ? (
              <>
                <div className="flex flex-col gap-3 md:hidden">
                  {overview.summary.tableSummaries.map(
                    (summary, tableIndex) => {
                      const displayLabel = formatEventTableName(
                        summary.table.tableName,
                        tableIndex,
                      );

                      return (
                        <div
                          className="ops-ledger__record"
                          key={summary.table.id}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className="font-medium">{displayLabel}</span>
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
                          <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="text-muted-foreground">
                              Occupancy
                            </span>
                            <span>
                              {summary.activeGuestCount}/{summary.capacity}
                            </span>
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Table</TableHead>
                        <TableHead>Occupancy</TableHead>
                        <TableHead>State</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overview.summary.tableSummaries.map(
                        (summary, tableIndex) => {
                          const displayLabel = formatEventTableName(
                            summary.table.tableName,
                            tableIndex,
                          );

                          return (
                            <TableRow key={summary.table.id}>
                              <TableCell className="whitespace-normal font-medium">
                                {displayLabel}
                              </TableCell>
                              <TableCell>
                                {summary.activeGuestCount}/{summary.capacity}
                              </TableCell>
                              <TableCell>
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
                  <EmptyTitle>No table index yet</EmptyTitle>
                  <EmptyDescription>
                    Tables will appear here after they are added to the seating
                    plan.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
