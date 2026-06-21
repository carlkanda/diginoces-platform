import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowRightIcon,
  FileSpreadsheetIcon,
  LockKeyholeIcon,
  MessageSquareTextIcon,
  PlusIcon,
  UsersRoundIcon,
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
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import {
  requireAnyGuestCreatePermission,
  resolveReadableGuestFilters,
} from "@/lib/guests/guest-api";
import { guestListGateAllowsAccess } from "@/lib/contracts/contract-gates";
import { hasAnyCommercialReadPermission } from "@/lib/contracts/contract-api";
import {
  getProjectDetails,
  listProjectEvents,
} from "@/lib/projects/project-service";
import {
  listProjectGuests,
  parseGuestListSideFilter,
  type GuestListFilters,
  type GuestSide,
} from "@/lib/guests/guest-service";
import {
  hasProjectPermission,
  ProjectAccessError,
  requireProjectPermission,
} from "@/lib/projects/project-api";
import {
  formatProjectCoupleDisplayName,
  formatProjectDisplayReference,
  formatProjectEventDisplayName,
  isInternalProjectDisplayText,
} from "@/lib/projects/project-foundation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type GuestListPageProps = {
  params: Promise<{
    projectId: string;
  }>;
  searchParams: Promise<{
    eventId?: string;
    side?: string;
  }>;
};

function formatSide(side: GuestSide) {
  if (side === "both") {
    return "Both sides";
  }

  return side === "bride" ? "Bride side" : "Groom side";
}

function formatInvitationRoute(isPrintedOnly: boolean) {
  return isPrintedOnly ? "Printed invitation" : "Digital invitation";
}

function formatGuestDisplayName(displayName: string, index: number) {
  return isInternalProjectDisplayText(displayName)
    ? `Guest ${index + 1}`
    : displayName;
}

function getGuestStatusVariant(isActive: boolean) {
  return isActive ? "default" : "outline";
}

export default async function ProjectGuestsPage({
  params,
  searchParams,
}: GuestListPageProps) {
  const authContext = await getAuthContext();
  const { projectId } = await params;
  const filters = await searchParams;

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath(`/platform/projects/${projectId}/guests`));
  }

  if (authContext.status === "not_configured") {
    return (
      <main className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>
              <h1 className="text-2xl leading-tight font-semibold text-balance">
                Guest list
              </h1>
            </CardTitle>
            <CardDescription>
              Guest management will appear here once the workspace connection is
              ready.
            </CardDescription>
          </CardHeader>
        </Card>
        <Alert>
          <LockKeyholeIcon />
          <AlertTitle>Workspace connection pending</AlertTitle>
          <AlertDescription>
            Guest records are not requested until Supabase credentials are
            configured.
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  const supabase = await createSupabaseServerClient();
  const permissionContext = {
    supabase,
    user: authContext.user,
  };

  try {
    await requireProjectPermission(permissionContext, projectId, "guests.read");
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      notFound();
    }

    throw error;
  }

  let canCreateGuest = false;
  try {
    await requireAnyGuestCreatePermission(permissionContext, projectId);
    canCreateGuest = true;
  } catch (error) {
    if (!(error instanceof ProjectAccessError)) {
      throw error;
    }
  }

  const [
    canReadGuestImports,
    canReadRsvps,
    canReadCommercial,
    canGenerateContracts,
  ] = await Promise.all([
    hasProjectPermission(permissionContext, projectId, "guest_imports.read"),
    hasProjectPermission(permissionContext, projectId, "rsvps.read"),
    hasAnyCommercialReadPermission(permissionContext, projectId),
    hasProjectPermission(permissionContext, projectId, "contracts.generate"),
  ]);
  const projectDetails = await getProjectDetails(supabase, projectId);

  if (!projectDetails) {
    notFound();
  }

  const guestListAccessStatus = (
    projectDetails.project as typeof projectDetails.project & {
      guest_list_access_status?: string;
    }
  ).guest_list_access_status;
  const projectName = formatProjectCoupleDisplayName(projectDetails.project, 0);
  const projectReference = formatProjectDisplayReference(
    projectDetails.project,
    0,
  );

  if (
    !guestListGateAllowsAccess(guestListAccessStatus) &&
    !canGenerateContracts
  ) {
    return (
      <main className="flex flex-col gap-6">
        <Card>
          <CardHeader className="has-data-[slot=card-action]:grid-cols-1 sm:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
            <CardTitle>
              <h1 className="text-2xl leading-tight font-semibold text-balance">
                Guest list locked
              </h1>
            </CardTitle>
            <CardDescription>
              Guest-list access opens after the project contract is approved in
              the app.
            </CardDescription>
            <CardAction className="col-start-1 row-start-auto mt-3 justify-self-start sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:mt-0 sm:justify-self-end">
              <Badge variant="outline">
                {projectReference.label}: {projectReference.value}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Link
              aria-label={`Back to project overview for ${projectName}`}
              className={buttonVariants({ variant: "outline" })}
              href={`/platform/projects/${projectId}`}
            >
              Project overview
            </Link>
            {canReadCommercial ? (
              <Link
                aria-label={`Open contract controls for ${projectName}`}
                className={buttonVariants()}
                href={`/platform/projects/${projectId}/commercial`}
              >
                View contract
              </Link>
            ) : null}
          </CardContent>
        </Card>
        <Alert>
          <LockKeyholeIcon />
          <AlertTitle>Contract approval required</AlertTitle>
          <AlertDescription>
            Guest work is waiting on contract approval. A permitted couple
            member needs to approve the latest generated contract before this
            list opens for bride and groom users.
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  let side: GuestSide | "all";

  try {
    side = parseGuestListSideFilter(filters.side);
  } catch {
    notFound();
  }

  const eventId = filters.eventId;
  let readableGuestFilters: GuestListFilters;

  try {
    readableGuestFilters = await resolveReadableGuestFilters(
      permissionContext,
      projectId,
      {
        eventId,
        side,
      },
    );
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      notFound();
    }

    throw error;
  }

  const [events, guests] = await Promise.all([
    listProjectEvents(supabase, projectId),
    listProjectGuests(supabase, projectId, readableGuestFilters),
  ]);
  const selectedEventIndex = events.findIndex((event) => event.id === eventId);
  const selectedEvent =
    selectedEventIndex >= 0 ? events[selectedEventIndex] : undefined;
  const activeSideLabel = side === "all" ? "All sides" : formatSide(side);
  const activeEventLabel = eventId
    ? selectedEvent
      ? formatProjectEventDisplayName(selectedEvent, selectedEventIndex)
      : "Selected event"
    : "All events";
  const activeFilterSummary = `Showing ${activeSideLabel.toLowerCase()} for ${
    eventId ? activeEventLabel : "all events"
  }`;
  const brideGuests = guests.filter(
    (guest) => guest.guest_side === "bride",
  ).length;
  const groomGuests = guests.filter(
    (guest) => guest.guest_side === "groom",
  ).length;
  const bothSideGuests = guests.filter(
    (guest) => guest.guest_side === "both",
  ).length;
  const printedOnlyGuests = guests.filter(
    (guest) => guest.is_printed_only,
  ).length;
  const digitalGuests = guests.length - printedOnlyGuests;

  const sideHref = (
    value: GuestSide | "all",
    nextEventId: string | undefined,
  ) => {
    const params = new URLSearchParams();
    if (value !== "all") {
      params.set("side", value);
    }
    if (nextEventId) {
      params.set("eventId", nextEventId);
    }

    return `/platform/projects/${projectId}/guests${params.size > 0 ? `?${params.toString()}` : ""}`;
  };
  const summaryItems = [
    ["Visible guests", guests.length],
    ["Bride side", brideGuests],
    ["Groom side", groomGuests],
    ["Both sides", bothSideGuests],
    ["Digital", digitalGuests],
    ["Printed only", printedOnlyGuests],
  ] as const;
  const sideOptions = ["all", "bride", "groom", "both"] as const;

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
            <BreadcrumbPage>Guest list</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader className="has-data-[slot=card-action]:grid-cols-1 sm:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
          <CardTitle>
            <h1 className="text-2xl leading-tight font-semibold text-balance">
              Guest list
            </h1>
          </CardTitle>
          <CardDescription className="max-w-3xl">
            Keep names, family sides, contact routes, invitation readiness, and
            event assignments in one controlled place.
          </CardDescription>
          <CardAction className="col-start-1 row-start-auto mt-3 justify-self-start sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:mt-0 sm:justify-self-end">
            <Badge variant="outline">
              {projectReference.label}: {projectReference.value}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(220px,280px)]">
          <dl
            aria-label="Guest list summary"
            className="grid gap-3 sm:grid-cols-3"
          >
            {summaryItems.map(([label, value]) => (
              <div className="rounded-lg border bg-background p-3" key={label}>
                <dt className="text-xs font-medium text-muted-foreground">
                  {label}
                </dt>
                <dd className="mt-1 text-lg font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-col gap-3 rounded-lg border bg-background p-3">
            <div>
              <p className="text-sm font-medium">Guest actions</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Open nearby workflows without losing the current project.
              </p>
            </div>
            <Separator />
            <Link
              aria-label={`Back to project overview for ${projectName}`}
              className={buttonVariants({ variant: "outline" })}
              href={`/platform/projects/${projectId}`}
            >
              Project overview
            </Link>
            {canReadGuestImports ? (
              <Link
                aria-label={`Open guest import history for ${projectName}`}
                className={buttonVariants({ variant: "outline" })}
                href={`/platform/projects/${projectId}/guest-imports`}
              >
                <FileSpreadsheetIcon data-icon="inline-start" />
                Imports
              </Link>
            ) : null}
            {canReadRsvps ? (
              <Link
                aria-label={`Open guest response summary for ${projectName}`}
                className={buttonVariants({ variant: "outline" })}
                href={`/platform/projects/${projectId}/rsvps`}
              >
                <MessageSquareTextIcon data-icon="inline-start" />
                RSVP summary
              </Link>
            ) : null}
            {canCreateGuest ? (
              <Link
                aria-label={`Add a guest to ${projectName}`}
                className={buttonVariants()}
                href={`/platform/projects/${projectId}/guests/new`}
              >
                <PlusIcon data-icon="inline-start" />
                Add guest
              </Link>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="text-base font-semibold">Focus the list</h2>
          </CardTitle>
          <CardDescription>
            Narrow by family side or event without leaving the project.
          </CardDescription>
          <CardAction>
            <Badge variant="secondary">{activeFilterSummary}</Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">Side</h3>
            <div className="flex flex-wrap gap-2">
              {sideOptions.map((value) => (
                <Link
                  aria-current={side === value ? "page" : undefined}
                  aria-label={`Show ${
                    value === "all"
                      ? "all sides"
                      : formatSide(value).toLowerCase()
                  } for ${activeEventLabel}`}
                  className={buttonVariants({
                    variant: side === value ? "default" : "outline",
                    size: "sm",
                  })}
                  href={sideHref(value, eventId)}
                  key={value}
                >
                  {value === "all" ? "All sides" : formatSide(value)}
                </Link>
              ))}
            </div>
          </div>

          {events.length > 0 ? (
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-medium">Event</h3>
              <div className="flex flex-wrap gap-2">
                <Link
                  aria-current={!eventId ? "page" : undefined}
                  aria-label={`Show ${activeSideLabel.toLowerCase()} for all events`}
                  className={buttonVariants({
                    variant: !eventId ? "default" : "outline",
                    size: "sm",
                  })}
                  href={sideHref(side, undefined)}
                >
                  All events
                </Link>
                {events.map((event, eventIndex) => {
                  const eventLabel = formatProjectEventDisplayName(
                    event,
                    eventIndex,
                  );

                  return (
                    <Link
                      aria-current={eventId === event.id ? "page" : undefined}
                      aria-label={`Show ${activeSideLabel.toLowerCase()} for ${eventLabel}`}
                      className={buttonVariants({
                        variant: eventId === event.id ? "default" : "outline",
                        size: "sm",
                      })}
                      href={sideHref(side, event.id)}
                      key={event.id}
                    >
                      {eventLabel}
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersRoundIcon aria-hidden="true" />
            <h2 className="text-base font-semibold">Guests</h2>
          </CardTitle>
          <CardDescription>
            Review contact routes, family sides, invitation readiness, and
            profile status.
          </CardDescription>
          {canCreateGuest ? (
            <CardAction>
              <Link
                aria-label={`Add a guest to ${projectName}`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
                href={`/platform/projects/${projectId}/guests/new`}
              >
                <PlusIcon data-icon="inline-start" />
                Add one guest
              </Link>
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent>
          {guests.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <UsersRoundIcon />
                </EmptyMedia>
                <EmptyTitle>No guests match this view</EmptyTitle>
                <EmptyDescription>
                  Adjust the side or event filters, or add a guest if your role
                  allows it.
                </EmptyDescription>
              </EmptyHeader>
              {canCreateGuest ? (
                <EmptyContent>
                  <Link
                    className={buttonVariants({ size: "sm" })}
                    href={`/platform/projects/${projectId}/guests/new`}
                  >
                    Add guest
                  </Link>
                </EmptyContent>
              ) : null}
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guest</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Contact
                  </TableHead>
                  <TableHead>Side</TableHead>
                  <TableHead className="hidden lg:table-cell">Route</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {guests.map((guest, guestIndex) => {
                  const sideLabel = formatSide(guest.guest_side);
                  const invitationRoute = formatInvitationRoute(
                    guest.is_printed_only,
                  );
                  const statusLabel = guest.is_active ? "Active" : "Inactive";
                  const guestDisplayName = formatGuestDisplayName(
                    guest.display_name,
                    guestIndex,
                  );
                  const contactLabel = guest.whatsapp_number
                    ? `WhatsApp: ${guest.whatsapp_number}`
                    : "WhatsApp not recorded";

                  return (
                    <TableRow key={guest.id}>
                      <TableCell className="min-w-56 whitespace-normal font-medium">
                        <Link
                          aria-label={`Open ${guestDisplayName}`}
                          className="underline-offset-4 hover:underline"
                          href={`/platform/projects/${projectId}/guests/${guest.id}`}
                        >
                          {guestDisplayName}
                        </Link>
                      </TableCell>
                      <TableCell className="hidden whitespace-normal text-muted-foreground md:table-cell">
                        {contactLabel}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{sideLabel}</Badge>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground lg:table-cell">
                        {invitationRoute}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getGuestStatusVariant(guest.is_active)}>
                          {statusLabel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          aria-label={`Open ${guestDisplayName}. ${contactLabel}. Invitation route: ${invitationRoute}. Side: ${sideLabel}. Status: ${statusLabel}.`}
                          className={cn(
                            buttonVariants({
                              variant: "outline",
                              size: "sm",
                            }),
                            "min-w-max",
                          )}
                          href={`/platform/projects/${projectId}/guests/${guest.id}`}
                        >
                          Open
                          <ArrowRightIcon data-icon="inline-end" />
                        </Link>
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
