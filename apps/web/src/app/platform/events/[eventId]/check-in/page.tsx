import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  QrCodeIcon,
  SearchIcon,
  SettingsIcon,
  SmartphoneIcon,
  UserPlusIcon,
  WifiOffIcon,
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
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import { getCheckInOverview } from "@/lib/check-in/check-in-db";
import {
  buildCheckInReadinessIssues,
  checkInMethodLabels,
  defaultCheckInMethods,
  isCheckInOpen,
  manualCheckInMethods,
  resolveOpenCheckInMethods,
  searchCheckInGuests,
  type CheckInGuest,
  type CheckInMethod,
} from "@/lib/check-in/check-in-service";
import { formatDateTimeInTimeZone } from "@/lib/dates/format-date";
import { searchParamText } from "@/lib/navigation/search-params";
import {
  hasEventPermission,
  ProjectAccessError,
  requireEventPermission,
} from "@/lib/projects/project-api";
import {
  formatProjectCoupleDisplayName,
  formatProjectEventDisplayName,
  formatProjectEventDisplayReference,
  isInternalProjectDisplayText,
} from "@/lib/projects/project-foundation";
import { formatEventTableName } from "@/lib/seating/seating-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createCheckInTokenAction,
  createPreloadSnapshotAction,
  createUnexpectedGuestRequestAction,
  performManualCheckInAction,
  resolveTokenForScanAction,
  reviewUnexpectedGuestRequestAction,
  submitOfflineSyncBatchAction,
  updateCheckInSettingsAction,
  upsertCheckInDeviceAction,
} from "./actions";

export const dynamic = "force-dynamic";

type CheckInPageProps = {
  params: Promise<{
    eventId: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function statusMessage(status: string | undefined) {
  switch (status) {
    case "device_saved":
      return "Check-in device saved.";
    case "guest_checked_in":
      return "Guest arrival recorded.";
    case "offline_sync_submitted":
      return "Offline records submitted.";
    case "preload_created":
      return "Offline guest list snapshot created.";
    case "settings_updated":
      return "Check-in settings updated.";
    case "token_created":
      return "QR check-in reference created.";
    case "unexpected_request_created":
      return "Unexpected guest request created.";
    case "unexpected_reviewed":
      return "Unexpected guest request reviewed.";
    default:
      return null;
  }
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function formatLabel(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatGuestSide(value: string | null | undefined) {
  const labels: Record<string, string> = {
    both: "Both families",
    bride: "Bride side",
    groom: "Groom side",
  };

  return value ? (labels[value] ?? formatLabel(value)) : "No side";
}

function formatRsvpStatus(value: string | null | undefined) {
  const labels: Record<string, string> = {
    maybe: "Maybe",
    no: "Cannot attend",
    pending: "Awaiting reply",
    yes: "Attending",
  };

  return value ? (labels[value] ?? formatLabel(value)) : "No RSVP";
}

function formatGuestDeliveryType(isPrintedOnly: boolean) {
  return isPrintedOnly ? "Printed invitation" : "Digital link";
}

function formatUnexpectedRequestStatus(value: string | null | undefined) {
  const labels: Record<string, string> = {
    approved: "Approved",
    manual_approved: "Manually approved",
    pending: "Awaiting review",
    rejected: "Rejected",
  };

  return value ? (labels[value] ?? formatLabel(value)) : "Not reviewed";
}

function formatToLocalDatetime(
  value: string | null | undefined,
  timeZone = "UTC",
) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      day: "2-digit",
      hour: "2-digit",
      hour12: false,
      hourCycle: "h23",
      minute: "2-digit",
      month: "2-digit",
      timeZone,
      year: "numeric",
    }).formatToParts(date);
    const part = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((item) => item.type === type)?.value ?? "";

    return `${part("year")}-${part("month")}-${part("day")}T${part(
      "hour",
    )}:${part("minute")}`;
  } catch {
    const pad = (input: number) => input.toString().padStart(2, "0");

    return [
      `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`,
      `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`,
    ].join("T");
  }
}

function formatCheckInTableName(value: string | null | undefined, index = 0) {
  return value ? formatEventTableName(value, index) : "No table";
}

function fallbackCheckInEventName(event: { event_code: string; name: string }) {
  const source = `${event.name} ${event.event_code}`.toLowerCase();

  if (source.includes("reception") || /\brec\b/.test(source)) {
    return "Reception event";
  }

  if (source.includes("civil") || /\bciv\b/.test(source)) {
    return "Civil event";
  }

  if (source.includes("customary")) {
    return "Customary event";
  }

  if (source.includes("religious")) {
    return "Religious event";
  }

  if (source.includes("brunch")) {
    return "Brunch event";
  }

  return "Event";
}

function formatCheckInGuestName(displayName: string, index: number) {
  return isInternalProjectDisplayText(displayName)
    ? `Guest ${index + 1}`
    : displayName;
}

function formatCheckInStationName(value: string, index: number) {
  return isInternalProjectDisplayText(value) ? `Station ${index + 1}` : value;
}

function formatCheckInDeviceLabel(
  value: string | null | undefined,
  index: number,
) {
  if (!value) {
    return "Unlabeled device";
  }

  return isInternalProjectDisplayText(value) ? `Device ${index + 1}` : value;
}

function formatUnexpectedGuestReason(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return isInternalProjectDisplayText(value) ? "" : ` - ${value}`;
}

function guestSubtitle(guest: CheckInGuest, tableName: string) {
  return [
    formatGuestSide(guest.guestSide),
    formatGuestDeliveryType(guest.isPrintedOnly),
    formatRsvpStatus(guest.rsvpStatus),
    tableName,
  ].join(" - ");
}

function checkboxClassName() {
  return "size-4 rounded border-input accent-primary";
}

export default async function EventCheckInPage({
  params,
  searchParams,
}: CheckInPageProps) {
  const authContext = await getAuthContext();
  const { eventId } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath(`/platform/events/${eventId}/check-in`));
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
              <BreadcrumbPage>Event check-in</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Card>
          <CardHeader>
            <CardTitle>Event check-in</CardTitle>
            <CardDescription>
              Connect the workspace before loading arrival tools.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTriangleIcon aria-hidden="true" />
              <AlertTitle>Workspace connection needed</AlertTitle>
              <AlertDescription>
                Check-in tools will appear after the secure connection is ready.
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
    await requireEventPermission(context, eventId, "check_in.read");
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      notFound();
    }

    throw error;
  }

  const overview = await getCheckInOverview(supabase, eventId);
  const [
    canConfigure,
    canManageDevices,
    canManageTokens,
    canPerform,
    canCreateUnexpected,
    canReviewUnexpected,
    canSyncOffline,
    canViewDashboard,
  ] = await Promise.all([
    hasEventPermission(context, eventId, "check_in.settings.manage"),
    hasEventPermission(context, eventId, "check_in.devices.manage"),
    hasEventPermission(context, eventId, "check_in.tokens.manage"),
    hasEventPermission(context, eventId, "check_in.perform"),
    hasEventPermission(context, eventId, "check_in.unexpected_guests.create"),
    hasEventPermission(context, eventId, "check_in.unexpected_guests.review"),
    hasEventPermission(context, eventId, "check_in.offline_sync"),
    hasEventPermission(context, eventId, "check_in.dashboard"),
  ]);
  const checkInOpen = isCheckInOpen(overview.settings);
  const allowedMethods = resolveOpenCheckInMethods({
    allowedMethods: overview.settings?.allowed_methods,
    enabled: overview.settings?.enabled,
    status: overview.settings?.status,
  });
  const isCheckInMethodAllowed = (method: CheckInMethod) =>
    allowedMethods.has(method);
  const qrScanAllowed = isCheckInMethodAllowed("qr_scan");
  const manualCheckInMethodOptions = manualCheckInMethods.map((method) => ({
    label: checkInMethodLabels[method],
    value: method,
  }));
  const allowedManualCheckInMethods = manualCheckInMethodOptions.filter(
    (method) => isCheckInMethodAllowed(method.value),
  );
  const canResolveQr = canPerform && qrScanAllowed;
  const canPerformManual = canPerform && allowedManualCheckInMethods.length > 0;
  const unexpectedGuestMode =
    overview.settings?.unexpected_guest_mode ?? "supervisor_approval_required";
  const canUseUnexpectedGuestWorkflow = unexpectedGuestMode !== "disabled";
  const canSubmitUnexpected =
    canCreateUnexpected && canUseUnexpectedGuestWorkflow;
  const canProcessUnexpected =
    canReviewUnexpected &&
    unexpectedGuestMode === "supervisor_approval_required";
  const query = searchParamText(resolvedSearchParams, "q") ?? "";
  const side = searchParamText(resolvedSearchParams, "side") ?? "all";
  const selectedTableValue = searchParamText(resolvedSearchParams, "tableId");
  const tableId =
    selectedTableValue === "unassigned" ? null : selectedTableValue;
  const rawTableOptions = [
    ...new Map(
      overview.guests.map((guest) => [
        guest.tableId ?? "unassigned",
        {
          label: guest.tableName ?? "Unassigned",
          value: guest.tableId ?? "unassigned",
        },
      ]),
    ).values(),
  ].sort((left, right) => left.label.localeCompare(right.label));
  const tableOptions = rawTableOptions.map((table, index) => ({
    ...table,
    label:
      table.value === "unassigned"
        ? table.label
        : formatCheckInTableName(table.label, index),
  }));
  const tableDisplayNames = new Map(
    tableOptions.map((table) => [table.value, table.label]),
  );
  const searchResults = searchCheckInGuests(overview.guests, {
    query,
    side:
      side === "bride" || side === "groom" || side === "both" ? side : "all",
    tableId,
  }).slice(0, 30);
  const checkInError = searchParamText(resolvedSearchParams, "checkInError");
  const checkInStatus = statusMessage(
    searchParamText(resolvedSearchParams, "checkInStatus"),
  );
  const tokenPreview = searchParamText(resolvedSearchParams, "tokenPreview");
  const projectLabel = formatProjectCoupleDisplayName(overview.project, 0);
  const fallbackEventName = fallbackCheckInEventName(overview.event);
  const eventName = isInternalProjectDisplayText(overview.event.name)
    ? fallbackEventName
    : formatProjectEventDisplayName(overview.event, 0);
  const eventReference = formatProjectEventDisplayReference(overview.event, 0);
  const eventReferenceValue = eventReference.isCode
    ? eventReference.value
    : fallbackEventName;
  const guestDisplayNames = new Map(
    overview.guests.map((guest, index) => [
      guest.guestId,
      formatCheckInGuestName(guest.displayName, index),
    ]),
  );
  const deviceDisplayNames = new Map(
    overview.devices.map((device, index) => [
      device.id,
      formatCheckInStationName(device.station_name, index),
    ]),
  );
  const deviceLabelNames = new Map(
    overview.devices.map((device, index) => [
      device.id,
      formatCheckInDeviceLabel(device.device_label, index),
    ]),
  );
  const arrivalProgressText = `${overview.metrics.arrivedUnits}/${overview.metrics.expectedUnits} arrivals recorded`;
  const eventTime = formatDateTimeInTimeZone(
    overview.event.starts_at,
    overview.settings?.timezone ?? "UTC",
  );

  const renderManualArrivalAction = (
    guest: CheckInGuest,
    guestDisplayName: string,
    remainingCount: number,
  ) => {
    if (canPerformManual && remainingCount > 0) {
      return (
        <form
          action={performManualCheckInAction.bind(null, eventId, guest.guestId)}
          className="flex flex-col gap-3"
        >
          <input
            name="invitationId"
            type="hidden"
            value={guest.invitationId ?? ""}
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <NativeSelect name="method">
              {allowedManualCheckInMethods.map((method) => (
                <NativeSelectOption key={method.value} value={method.value}>
                  {method.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <Input
              defaultValue={Math.min(1, remainingCount)}
              max={remainingCount}
              min="1"
              name="arrivalCount"
              type="number"
            />
            <NativeSelect name="deviceId">
              <NativeSelectOption value="">
                Unassigned device
              </NativeSelectOption>
              {overview.devices.map((device) => (
                <NativeSelectOption key={device.id} value={device.id}>
                  {deviceDisplayNames.get(device.id) ?? device.station_name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <Input name="notes" placeholder="Notes" />
          </div>
          {canReviewUnexpected ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                className={checkboxClassName()}
                name="supervisorOverride"
                type="checkbox"
              />
              Supervisor override
            </label>
          ) : null}
          <Button
            aria-label={`Check in ${guestDisplayName} for ${eventName}`}
            type="submit"
          >
            Check in
          </Button>
        </form>
      );
    }

    if (remainingCount <= 0) {
      return <Badge variant="secondary">Complete</Badge>;
    }

    return (
      <span className="text-muted-foreground">
        No arrival action available.
      </span>
    );
  };

  const renderUnexpectedRequestActions = (
    request: (typeof overview.unexpectedRequests)[number],
    requestGuestName: string,
  ) => {
    if (canProcessUnexpected && request.status === "pending") {
      return (
        <div className="flex flex-wrap gap-2">
          <form
            action={reviewUnexpectedGuestRequestAction.bind(
              null,
              eventId,
              request.id,
              "approved",
            )}
          >
            <input name="approvedArrivalCount" type="hidden" value="1" />
            <Button
              aria-label={`Approve unexpected guest request for ${requestGuestName}`}
              type="submit"
              variant="outline"
            >
              Approve
            </Button>
          </form>
          <form
            action={reviewUnexpectedGuestRequestAction.bind(
              null,
              eventId,
              request.id,
              "manual_approved",
            )}
          >
            <input name="approvalMode" type="hidden" value="manual_external" />
            <input name="approvedArrivalCount" type="hidden" value="1" />
            <Button
              aria-label={`Record manual approval for ${requestGuestName}`}
              type="submit"
              variant="outline"
            >
              Manual approval
            </Button>
          </form>
          <form
            action={reviewUnexpectedGuestRequestAction.bind(
              null,
              eventId,
              request.id,
              "rejected",
            )}
          >
            <Button
              aria-label={`Reject unexpected guest request for ${requestGuestName}`}
              type="submit"
              variant="outline"
            >
              Reject
            </Button>
          </form>
        </div>
      );
    }

    return <span className="text-muted-foreground">No action available</span>;
  };

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
            <BreadcrumbPage>Check-in</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex max-w-3xl flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{projectLabel}</Badge>
                <Badge variant="outline">
                  {eventReference.label}: {eventReferenceValue}
                </Badge>
                <Badge variant={checkInOpen ? "secondary" : "outline"}>
                  {checkInOpen ? "Open now" : "Not open"}
                </Badge>
              </div>
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-semibold tracking-normal text-balance">
                  Event check-in
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground text-pretty">
                  Record arrivals for {eventName}, resolve QR references, find
                  guests by name or table, and keep offline stations aligned.
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
                render={<Link href={`/platform/events/${eventId}/seating`} />}
                variant="outline"
              >
                <ClipboardListIcon data-icon="inline-start" />
                Seating
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="ops-ledger__metrics">
            <div className="ops-ledger__metric">
              <span className="ops-ledger__metric-label">Arrival progress</span>
              <strong className="ops-ledger__metric-value">
                {arrivalProgressText}
              </strong>
              <span className="ops-ledger__metric-note">
                Expected guest units versus arrived units.
              </span>
            </div>
            <div className="ops-ledger__metric">
              <span className="ops-ledger__metric-label">Remaining</span>
              <strong className="ops-ledger__metric-value">
                {overview.metrics.remainingUnits}
              </strong>
              <span className="ops-ledger__metric-note">
                Guest units still expected.
              </span>
            </div>
            <div className="ops-ledger__metric">
              <span className="ops-ledger__metric-label">Offline queue</span>
              <strong className="ops-ledger__metric-value">
                {overview.metrics.offlinePendingCount}
              </strong>
              <span className="ops-ledger__metric-note">
                Records waiting for sync.
              </span>
            </div>
            <div className="ops-ledger__metric">
              <span className="ops-ledger__metric-label">
                Unexpected guests
              </span>
              <strong className="ops-ledger__metric-value">
                {overview.metrics.unexpectedPendingCount}
              </strong>
              <span className="ops-ledger__metric-note">
                Requests waiting for review.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {checkInError ? (
        <Alert variant="destructive">
          <AlertTriangleIcon aria-hidden="true" />
          <AlertTitle>Check-in action could not be completed</AlertTitle>
          <AlertDescription>{checkInError}</AlertDescription>
        </Alert>
      ) : null}

      {checkInStatus ? (
        <Alert>
          <CheckCircle2Icon aria-hidden="true" />
          <AlertTitle>{checkInStatus}</AlertTitle>
          <AlertDescription>
            {tokenPreview
              ? `QR preview: ${tokenPreview}`
              : "Review the updated arrival state before event handoff."}
          </AlertDescription>
        </Alert>
      ) : null}

      <Tabs defaultValue="arrivals">
        <TabsList
          className="w-full justify-start overflow-x-auto"
          variant="line"
        >
          <TabsTrigger value="arrivals">Arrivals</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="exceptions">Unexpected guests</TabsTrigger>
          <TabsTrigger value="stations">Stations and offline</TabsTrigger>
        </TabsList>

        <TabsContent className="flex flex-col gap-5" value="arrivals">
          {canViewDashboard ? (
            <Card>
              <CardHeader>
                <CardTitle>Arrival dashboard</CardTitle>
                <CardDescription>
                  {eventTime
                    ? `Event time: ${eventTime}`
                    : "Event time is not set."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Signal</TableHead>
                      <TableHead>Count</TableHead>
                      <TableHead>Use</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Expected arrivals</TableCell>
                      <TableCell>{overview.metrics.expectedUnits}</TableCell>
                      <TableCell className="whitespace-normal text-muted-foreground">
                        Total guest units expected for this event.
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Recorded arrivals</TableCell>
                      <TableCell>{overview.metrics.arrivedUnits}</TableCell>
                      <TableCell className="whitespace-normal text-muted-foreground">
                        Arrivals already confirmed at a station.
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Partial arrivals</TableCell>
                      <TableCell>
                        {overview.metrics.partialArrivalCount}
                      </TableCell>
                      <TableCell className="whitespace-normal text-muted-foreground">
                        Guest groups with some arrivals still outstanding.
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Duplicate scans</TableCell>
                      <TableCell>
                        {overview.metrics.duplicateScanCount}
                      </TableCell>
                      <TableCell className="whitespace-normal text-muted-foreground">
                        Scan attempts that may need staff review.
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Sync alerts</TableCell>
                      <TableCell>
                        {overview.metrics.syncConflictCount}
                      </TableCell>
                      <TableCell className="whitespace-normal text-muted-foreground">
                        Offline records that need reconciliation.
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-[minmax(300px,420px)_minmax(0,1fr)]">
            <div className="flex flex-col gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>QR scan lookup</CardTitle>
                  <CardDescription>
                    Paste the scanned QR text to open the focused scan review
                    page.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {canResolveQr ? (
                    <form
                      action={resolveTokenForScanAction.bind(null, eventId)}
                    >
                      <FieldSet>
                        <FieldLegend>Invitation QR reference</FieldLegend>
                        <FieldGroup>
                          <Field>
                            <FieldLabel htmlFor="token">
                              QR code text
                            </FieldLabel>
                            <Input
                              id="token"
                              name="token"
                              placeholder="Paste the scanned QR text"
                              required
                            />
                          </Field>
                          <Button
                            aria-label={`Find guest from the invitation QR code for ${eventName}`}
                            type="submit"
                          >
                            <QrCodeIcon data-icon="inline-start" />
                            Find guest
                          </Button>
                        </FieldGroup>
                      </FieldSet>
                    </form>
                  ) : (
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <QrCodeIcon aria-hidden="true" />
                        </EmptyMedia>
                        <EmptyTitle>QR lookup is not available</EmptyTitle>
                        <EmptyDescription>
                          {!canPerform
                            ? "Your role can review arrivals but cannot perform check-in."
                            : !checkInOpen
                              ? "Check-in is not open for this event."
                              : "QR scanning is disabled for this event."}
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  )}
                </CardContent>
                <CardFooter className="justify-between gap-3">
                  <span className="text-sm text-muted-foreground">
                    The public guest page token and check-in token stay
                    separate.
                  </span>
                  <Button
                    render={
                      <Link
                        href={`/platform/events/${eventId}/check-in/scan`}
                      />
                    }
                    variant="outline"
                  >
                    Open scan page
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Search guests</CardTitle>
                  <CardDescription>
                    Filter by name, phone, invitation reference, side, or table.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form>
                    <FieldSet>
                      <FieldLegend>Search filters</FieldLegend>
                      <FieldGroup>
                        <Field>
                          <FieldLabel htmlFor="q">Search</FieldLabel>
                          <Input
                            defaultValue={query}
                            id="q"
                            name="q"
                            placeholder="Name, phone, invitation ID, table"
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="side">Side</FieldLabel>
                          <NativeSelect
                            className="w-full"
                            defaultValue={side}
                            id="side"
                            name="side"
                          >
                            <NativeSelectOption value="all">
                              All sides
                            </NativeSelectOption>
                            <NativeSelectOption value="bride">
                              Bride + both
                            </NativeSelectOption>
                            <NativeSelectOption value="groom">
                              Groom + both
                            </NativeSelectOption>
                            <NativeSelectOption value="both">
                              Both only
                            </NativeSelectOption>
                          </NativeSelect>
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="tableId">Table</FieldLabel>
                          <NativeSelect
                            className="w-full"
                            defaultValue={selectedTableValue ?? ""}
                            id="tableId"
                            name="tableId"
                          >
                            <NativeSelectOption value="">
                              All tables
                            </NativeSelectOption>
                            {tableOptions.map((table) => (
                              <NativeSelectOption
                                key={table.value}
                                value={table.value}
                              >
                                {table.label}
                              </NativeSelectOption>
                            ))}
                          </NativeSelect>
                        </Field>
                        <Button
                          aria-label={`Search invited guests for ${eventName}`}
                          type="submit"
                          variant="outline"
                        >
                          <SearchIcon data-icon="inline-start" />
                          Search
                        </Button>
                      </FieldGroup>
                    </FieldSet>
                  </form>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Guest arrival list</CardTitle>
                <CardDescription>
                  Showing the first {searchResults.length} matching invited
                  guests.
                </CardDescription>
                <CardAction>
                  <Badge variant={checkInOpen ? "secondary" : "outline"}>
                    {checkInOpen ? "Open" : "Closed"}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardContent>
                {!checkInOpen && canPerform ? (
                  <Alert>
                    <AlertTriangleIcon aria-hidden="true" />
                    <AlertTitle>Check-in is closed</AlertTitle>
                    <AlertDescription>
                      Open check-in before recording new arrivals.
                    </AlertDescription>
                  </Alert>
                ) : null}

                {checkInOpen &&
                canPerform &&
                allowedManualCheckInMethods.length === 0 ? (
                  <Alert>
                    <AlertTriangleIcon aria-hidden="true" />
                    <AlertTitle>Manual check-in is disabled</AlertTitle>
                    <AlertDescription>
                      Use an enabled method or update event check-in settings.
                    </AlertDescription>
                  </Alert>
                ) : null}

                {searchResults.length === 0 ? (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <SearchIcon aria-hidden="true" />
                      </EmptyMedia>
                      <EmptyTitle>No matching invited guests</EmptyTitle>
                      <EmptyDescription>
                        Adjust the search filters or create an unexpected guest
                        request if the person is not on the list.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <>
                    <div className="flex flex-col gap-3 md:hidden">
                      {searchResults.map((guest) => {
                        const readinessIssues =
                          buildCheckInReadinessIssues(guest);
                        const guestDisplayName =
                          guestDisplayNames.get(guest.guestId) ??
                          guest.displayName;
                        const tableName =
                          tableDisplayNames.get(
                            guest.tableId ?? "unassigned",
                          ) ?? formatCheckInTableName(guest.tableName);
                        const remainingCount = Math.max(
                          guest.expectedCount - guest.arrivedCount,
                          0,
                        );

                        return (
                          <div
                            className="ops-ledger__record"
                            key={guest.guestId}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex flex-col gap-1">
                                <span className="font-medium">
                                  {guestDisplayName}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {guestSubtitle(guest, tableName)}
                                </span>
                              </div>
                              <Badge
                                variant={
                                  remainingCount <= 0 ? "secondary" : "outline"
                                }
                              >
                                {guest.arrivedCount}/{guest.expectedCount}
                              </Badge>
                            </div>
                            {guest.isVipProtocol ? (
                              <Badge variant="outline">VIP/protocol</Badge>
                            ) : null}
                            <div className="flex flex-col gap-2 text-sm">
                              <span className="font-medium">Readiness</span>
                              {readinessIssues.length > 0 ? (
                                readinessIssues.map((readinessItem) => (
                                  <span
                                    className="text-muted-foreground"
                                    key={readinessItem.code}
                                  >
                                    {readinessItem.message}
                                  </span>
                                ))
                              ) : (
                                <span className="text-muted-foreground">
                                  Ready for arrival.
                                </span>
                              )}
                            </div>
                            <Separator />
                            {renderManualArrivalAction(
                              guest,
                              guestDisplayName,
                              remainingCount,
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Guest</TableHead>
                            <TableHead>Arrival</TableHead>
                            <TableHead>Readiness</TableHead>
                            <TableHead>Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {searchResults.map((guest) => {
                            const readinessIssues =
                              buildCheckInReadinessIssues(guest);
                            const guestDisplayName =
                              guestDisplayNames.get(guest.guestId) ??
                              guest.displayName;
                            const tableName =
                              tableDisplayNames.get(
                                guest.tableId ?? "unassigned",
                              ) ?? formatCheckInTableName(guest.tableName);
                            const remainingCount = Math.max(
                              guest.expectedCount - guest.arrivedCount,
                              0,
                            );

                            return (
                              <TableRow key={guest.guestId}>
                                <TableCell className="min-w-64 whitespace-normal">
                                  <div className="flex flex-col gap-1">
                                    <span className="font-medium">
                                      {guestDisplayName}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                      {guestSubtitle(guest, tableName)}
                                    </span>
                                    {guest.isVipProtocol ? (
                                      <Badge variant="outline">
                                        VIP/protocol
                                      </Badge>
                                    ) : null}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      remainingCount <= 0
                                        ? "secondary"
                                        : "outline"
                                    }
                                  >
                                    {guest.arrivedCount}/{guest.expectedCount}
                                  </Badge>
                                </TableCell>
                                <TableCell className="max-w-72 whitespace-normal">
                                  {readinessIssues.length > 0 ? (
                                    <div className="flex flex-col gap-1">
                                      {readinessIssues.map((readinessItem) => (
                                        <span
                                          className="text-sm text-muted-foreground"
                                          key={readinessItem.code}
                                        >
                                          {readinessItem.message}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">
                                      Ready for arrival.
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="min-w-80 whitespace-normal">
                                  {renderManualArrivalAction(
                                    guest,
                                    guestDisplayName,
                                    remainingCount,
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
          </div>
        </TabsContent>

        <TabsContent className="flex flex-col gap-5" value="settings">
          {canConfigure ? (
            <Card>
              <CardHeader>
                <CardTitle>Check-in settings</CardTitle>
                <CardDescription>
                  Control when arrivals can be recorded and which methods event
                  staff may use.
                </CardDescription>
                <CardAction>
                  <Badge
                    variant={
                      overview.settings?.enabled ? "secondary" : "outline"
                    }
                  >
                    {overview.settings?.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </CardAction>
              </CardHeader>
              <form action={updateCheckInSettingsAction.bind(null, eventId)}>
                <CardContent>
                  <FieldSet>
                    <FieldLegend>Event check-in controls</FieldLegend>
                    <FieldGroup className="grid gap-4 md:grid-cols-2">
                      <Field orientation="horizontal">
                        <input
                          className={checkboxClassName()}
                          defaultChecked={overview.settings?.enabled ?? false}
                          id="enabled"
                          name="enabled"
                          type="checkbox"
                        />
                        <FieldLabel htmlFor="enabled">Enabled</FieldLabel>
                      </Field>
                      <Field orientation="horizontal">
                        <input
                          className={checkboxClassName()}
                          defaultChecked={
                            overview.settings?.offline_preload_enabled ?? false
                          }
                          id="offlinePreloadEnabled"
                          name="offlinePreloadEnabled"
                          type="checkbox"
                        />
                        <FieldLabel htmlFor="offlinePreloadEnabled">
                          Offline preload
                        </FieldLabel>
                      </Field>
                      <Field orientation="horizontal">
                        <input
                          className={checkboxClassName()}
                          defaultChecked={
                            overview.settings?.supervisor_approval_required ??
                            true
                          }
                          id="supervisorApprovalRequired"
                          name="supervisorApprovalRequired"
                          type="checkbox"
                        />
                        <FieldLabel htmlFor="supervisorApprovalRequired">
                          Supervisor approval
                        </FieldLabel>
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="startsAt">Starts at</FieldLabel>
                        <Input
                          defaultValue={formatToLocalDatetime(
                            overview.settings?.starts_at,
                            overview.settings?.timezone ?? "UTC",
                          )}
                          id="startsAt"
                          name="startsAt"
                          type="datetime-local"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="endsAt">Ends at</FieldLabel>
                        <Input
                          defaultValue={formatToLocalDatetime(
                            overview.settings?.ends_at,
                            overview.settings?.timezone ?? "UTC",
                          )}
                          id="endsAt"
                          name="endsAt"
                          type="datetime-local"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="timezone">Timezone</FieldLabel>
                        <Input
                          defaultValue={overview.settings?.timezone ?? "UTC"}
                          id="timezone"
                          name="timezone"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="unexpectedGuestMode">
                          Unexpected guests
                        </FieldLabel>
                        <NativeSelect
                          className="w-full"
                          defaultValue={
                            overview.settings?.unexpected_guest_mode ??
                            "supervisor_approval_required"
                          }
                          id="unexpectedGuestMode"
                          name="unexpectedGuestMode"
                        >
                          <NativeSelectOption value="supervisor_approval_required">
                            Supervisor approval required
                          </NativeSelectOption>
                          <NativeSelectOption value="manual_recording_only">
                            Manual recording
                          </NativeSelectOption>
                          <NativeSelectOption value="disabled">
                            Disabled
                          </NativeSelectOption>
                        </NativeSelect>
                      </Field>
                      <Field className="md:col-span-2">
                        <FieldLabel>Allowed check-in methods</FieldLabel>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {defaultCheckInMethods.map((method) => (
                            <label className="ops-ledger__inline" key={method}>
                              <input
                                className={checkboxClassName()}
                                defaultChecked={
                                  overview.settings?.allowed_methods?.includes(
                                    method,
                                  ) ?? true
                                }
                                name="allowedMethods"
                                type="checkbox"
                                value={method}
                              />
                              {checkInMethodLabels[method]}
                            </label>
                          ))}
                        </div>
                        <FieldDescription>
                          Disabled methods remain unavailable even when the
                          event is open.
                        </FieldDescription>
                      </Field>
                    </FieldGroup>
                  </FieldSet>
                </CardContent>
                <CardFooter className="justify-end">
                  <Button
                    aria-label={`Save check-in settings for ${eventName}`}
                    type="submit"
                  >
                    <SettingsIcon data-icon="inline-start" />
                    Save settings
                  </Button>
                </CardFooter>
              </form>
            </Card>
          ) : (
            <Alert>
              <SettingsIcon aria-hidden="true" />
              <AlertTitle>Settings are read-only for your role</AlertTitle>
              <AlertDescription>
                You can use the available check-in tools, but only authorized
                event leads can change methods and timing.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent className="flex flex-col gap-5" value="exceptions">
          <div className="grid gap-4 xl:grid-cols-[minmax(300px,420px)_minmax(0,1fr)]">
            <Card>
              <CardHeader>
                <CardTitle>Request unexpected guest review</CardTitle>
                <CardDescription>
                  Use this only when someone arrives who is not on the invited
                  guest list.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {canSubmitUnexpected ? (
                  <form
                    action={createUnexpectedGuestRequestAction.bind(
                      null,
                      eventId,
                    )}
                  >
                    <FieldSet>
                      <FieldLegend>Guest request</FieldLegend>
                      <FieldGroup>
                        <Field>
                          <FieldLabel htmlFor="requestedName">Name</FieldLabel>
                          <Input
                            id="requestedName"
                            name="requestedName"
                            required
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="guestSide">Side</FieldLabel>
                          <NativeSelect
                            className="w-full"
                            id="guestSide"
                            name="guestSide"
                          >
                            <NativeSelectOption value="">
                              Unknown
                            </NativeSelectOption>
                            <NativeSelectOption value="bride">
                              Bride
                            </NativeSelectOption>
                            <NativeSelectOption value="groom">
                              Groom
                            </NativeSelectOption>
                            <NativeSelectOption value="both">
                              Both
                            </NativeSelectOption>
                          </NativeSelect>
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="deviceIdUnexpected">
                            Station/device
                          </FieldLabel>
                          <NativeSelect
                            className="w-full"
                            id="deviceIdUnexpected"
                            name="deviceId"
                          >
                            <NativeSelectOption value="">
                              Unassigned device
                            </NativeSelectOption>
                            {overview.devices.map((device) => (
                              <NativeSelectOption
                                key={device.id}
                                value={device.id}
                              >
                                {deviceDisplayNames.get(device.id) ??
                                  device.station_name}
                              </NativeSelectOption>
                            ))}
                          </NativeSelect>
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="reason">Reason</FieldLabel>
                          <Input id="reason" name="reason" />
                        </Field>
                        <Button
                          aria-label={`Create unexpected guest request for ${eventName}`}
                          type="submit"
                          variant="outline"
                        >
                          <UserPlusIcon data-icon="inline-start" />
                          Create request
                        </Button>
                      </FieldGroup>
                    </FieldSet>
                  </form>
                ) : (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <UserPlusIcon aria-hidden="true" />
                      </EmptyMedia>
                      <EmptyTitle>
                        Unexpected guest intake is unavailable
                      </EmptyTitle>
                      <EmptyDescription>
                        {canCreateUnexpected && !canUseUnexpectedGuestWorkflow
                          ? "Unexpected guest requests are disabled for this event."
                          : "Your role can review existing requests but cannot create new ones."}
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Review queue</CardTitle>
                <CardDescription>
                  Supervisor decisions for guests who are not on the planned
                  list.
                </CardDescription>
                <CardAction>
                  <Badge variant="outline">
                    {pluralize(overview.unexpectedRequests.length, "request")}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardContent>
                {canReviewUnexpected &&
                unexpectedGuestMode === "manual_recording_only" ? (
                  <Alert>
                    <AlertTriangleIcon aria-hidden="true" />
                    <AlertTitle>Manual recording mode</AlertTitle>
                    <AlertDescription>
                      Unexpected guests are being handled outside the approval
                      queue for this event.
                    </AlertDescription>
                  </Alert>
                ) : null}

                {overview.unexpectedRequests.length === 0 ? (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <UserPlusIcon aria-hidden="true" />
                      </EmptyMedia>
                      <EmptyTitle>No unexpected guest requests</EmptyTitle>
                      <EmptyDescription>
                        New requests will appear here for review during
                        event-day operations.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <>
                    <div className="flex flex-col gap-3 md:hidden">
                      {overview.unexpectedRequests.map((request, index) => {
                        const requestGuestName = formatCheckInGuestName(
                          request.requested_name,
                          index,
                        );
                        const requestReason = formatUnexpectedGuestReason(
                          request.reason,
                        ).replace(/^ - /, "");

                        return (
                          <div className="ops-ledger__record" key={request.id}>
                            <div className="flex items-start justify-between gap-3">
                              <span className="font-medium">
                                {requestGuestName}
                              </span>
                              <Badge variant="outline">
                                {formatUnexpectedRequestStatus(request.status)}
                              </Badge>
                            </div>
                            <div className="grid gap-2 text-sm">
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-muted-foreground">
                                  Side
                                </span>
                                <span>
                                  {formatGuestSide(request.guest_side)}
                                </span>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-muted-foreground">
                                  Reason
                                </span>
                                <span>
                                  {requestReason || "No reason recorded"}
                                </span>
                              </div>
                            </div>
                            <Separator />
                            {renderUnexpectedRequestActions(
                              request,
                              requestGuestName,
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Guest</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Side</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {overview.unexpectedRequests.map((request, index) => {
                            const requestGuestName = formatCheckInGuestName(
                              request.requested_name,
                              index,
                            );
                            const requestReason = formatUnexpectedGuestReason(
                              request.reason,
                            ).replace(/^ - /, "");

                            return (
                              <TableRow key={request.id}>
                                <TableCell className="whitespace-normal font-medium">
                                  {requestGuestName}
                                </TableCell>
                                <TableCell>
                                  {formatUnexpectedRequestStatus(
                                    request.status,
                                  )}
                                </TableCell>
                                <TableCell>
                                  {formatGuestSide(request.guest_side)}
                                </TableCell>
                                <TableCell className="max-w-64 whitespace-normal text-muted-foreground">
                                  {requestReason || "No reason recorded"}
                                </TableCell>
                                <TableCell className="min-w-72">
                                  {renderUnexpectedRequestActions(
                                    request,
                                    requestGuestName,
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
          </div>
        </TabsContent>

        <TabsContent className="flex flex-col gap-5" value="stations">
          <div className="grid gap-4 xl:grid-cols-3">
            {canManageDevices ? (
              <Card>
                <CardHeader>
                  <CardTitle>Station device</CardTitle>
                  <CardDescription>
                    Register a check-in station or staff tablet.
                  </CardDescription>
                </CardHeader>
                <form action={upsertCheckInDeviceAction.bind(null, eventId)}>
                  <CardContent>
                    <FieldSet>
                      <FieldLegend>Device details</FieldLegend>
                      <FieldGroup>
                        <Field>
                          <FieldLabel htmlFor="stationName">
                            Station name
                          </FieldLabel>
                          <Input
                            id="stationName"
                            name="stationName"
                            placeholder="Entrance A"
                            required
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="deviceLabel">
                            Device label
                          </FieldLabel>
                          <Input
                            id="deviceLabel"
                            name="deviceLabel"
                            placeholder="Tablet 1"
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="assignedStaffUserId">
                            Assigned staff user
                          </FieldLabel>
                          <Input
                            id="assignedStaffUserId"
                            name="assignedStaffUserId"
                            placeholder="Staff account reference"
                          />
                        </Field>
                      </FieldGroup>
                    </FieldSet>
                  </CardContent>
                  <CardFooter className="justify-end">
                    <Button
                      aria-label={`Save check-in device for ${eventName}`}
                      type="submit"
                    >
                      <SmartphoneIcon data-icon="inline-start" />
                      Save device
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            ) : null}

            {canManageTokens ? (
              <Card>
                <CardHeader>
                  <CardTitle>QR reference</CardTitle>
                  <CardDescription>
                    Create a check-in QR reference for a guest.
                  </CardDescription>
                </CardHeader>
                <form action={createCheckInTokenAction.bind(null, eventId)}>
                  <CardContent>
                    <FieldSet>
                      <FieldLegend>Guest reference</FieldLegend>
                      <FieldGroup>
                        <Field>
                          <FieldLabel htmlFor="guestIdToken">Guest</FieldLabel>
                          <NativeSelect
                            className="w-full"
                            id="guestIdToken"
                            name="guestId"
                            required
                          >
                            {overview.guests.map((guest) => (
                              <NativeSelectOption
                                key={guest.guestId}
                                value={guest.guestId}
                              >
                                {guestDisplayNames.get(guest.guestId) ??
                                  guest.displayName}
                              </NativeSelectOption>
                            ))}
                          </NativeSelect>
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="invitationId">
                            Invitation reference
                          </FieldLabel>
                          <Input id="invitationId" name="invitationId" />
                        </Field>
                      </FieldGroup>
                    </FieldSet>
                  </CardContent>
                  <CardFooter className="justify-end">
                    <Button
                      aria-label={`Create a QR check-in reference for ${eventName}`}
                      type="submit"
                    >
                      <QrCodeIcon data-icon="inline-start" />
                      Create reference
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            ) : null}

            {canSyncOffline ? (
              <Card>
                <CardHeader>
                  <CardTitle>Offline support</CardTitle>
                  <CardDescription>
                    Prepare a station list or submit one offline arrival record.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-5">
                    <form
                      action={createPreloadSnapshotAction.bind(null, eventId)}
                    >
                      <FieldSet>
                        <FieldLegend>Preload list</FieldLegend>
                        <FieldGroup>
                          <Field>
                            <FieldLabel htmlFor="deviceIdPreload">
                              Station/device
                            </FieldLabel>
                            <NativeSelect
                              className="w-full"
                              id="deviceIdPreload"
                              name="deviceId"
                            >
                              <NativeSelectOption value="">
                                Any assigned device
                              </NativeSelectOption>
                              {overview.devices.map((device) => (
                                <NativeSelectOption
                                  key={device.id}
                                  value={device.id}
                                >
                                  {deviceDisplayNames.get(device.id) ??
                                    device.station_name}
                                </NativeSelectOption>
                              ))}
                            </NativeSelect>
                          </Field>
                          <Button
                            aria-label={`Create offline preload snapshot for ${eventName}`}
                            type="submit"
                          >
                            <WifiOffIcon data-icon="inline-start" />
                            Create preload
                          </Button>
                        </FieldGroup>
                      </FieldSet>
                    </form>

                    <Separator />

                    <form
                      action={submitOfflineSyncBatchAction.bind(null, eventId)}
                    >
                      <FieldSet>
                        <FieldLegend>Submit offline record</FieldLegend>
                        <FieldGroup>
                          <Field>
                            <FieldLabel htmlFor="guestIdOffline">
                              Offline guest
                            </FieldLabel>
                            <NativeSelect
                              className="w-full"
                              id="guestIdOffline"
                              name="guestId"
                              required
                            >
                              {overview.guests.map((guest) => (
                                <NativeSelectOption
                                  key={guest.guestId}
                                  value={guest.guestId}
                                >
                                  {guestDisplayNames.get(guest.guestId) ??
                                    guest.displayName}
                                </NativeSelectOption>
                              ))}
                            </NativeSelect>
                          </Field>
                          <Field>
                            <FieldLabel htmlFor="arrivalCountOffline">
                              Arrival count
                            </FieldLabel>
                            <Input
                              defaultValue="1"
                              id="arrivalCountOffline"
                              min="1"
                              name="arrivalCount"
                              type="number"
                            />
                          </Field>
                          <Button
                            aria-label={`Submit offline check-in records for ${eventName}`}
                            type="submit"
                            variant="outline"
                          >
                            Submit offline record
                          </Button>
                        </FieldGroup>
                      </FieldSet>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Devices and stations</CardTitle>
              <CardDescription>
                Active stations, offline state, and recent check-in activity.
              </CardDescription>
              <CardAction>
                <Badge variant="outline">
                  {pluralize(overview.devices.length, "station")}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              {overview.devices.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <SmartphoneIcon aria-hidden="true" />
                    </EmptyMedia>
                    <EmptyTitle>No check-in stations assigned</EmptyTitle>
                    <EmptyDescription>
                      Add a station when the event team has a dedicated check-in
                      device.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <>
                  <div className="flex flex-col gap-3 md:hidden">
                    {overview.devices.map((device) => (
                      <div className="ops-ledger__record" key={device.id}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">
                              {deviceDisplayNames.get(device.id) ??
                                device.station_name}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {deviceLabelNames.get(device.id) ??
                                "Unlabeled device"}
                            </span>
                          </div>
                          <Badge variant="outline">
                            {formatLabel(device.sync_status)}
                          </Badge>
                        </div>
                        <div className="grid gap-2 text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">
                              Status
                            </span>
                            <span>{formatLabel(device.status)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">
                              Offline list
                            </span>
                            <span>{formatLabel(device.preload_status)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">
                              Activity
                            </span>
                            <span>
                              {pluralize(device.activity_count, "action")}
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
                          <TableHead>Station</TableHead>
                          <TableHead>Device</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Offline list</TableHead>
                          <TableHead>Sync</TableHead>
                          <TableHead>Activity</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {overview.devices.map((device) => (
                          <TableRow key={device.id}>
                            <TableCell className="whitespace-normal font-medium">
                              {deviceDisplayNames.get(device.id) ??
                                device.station_name}
                            </TableCell>
                            <TableCell className="whitespace-normal">
                              {deviceLabelNames.get(device.id) ??
                                "Unlabeled device"}
                            </TableCell>
                            <TableCell>{formatLabel(device.status)}</TableCell>
                            <TableCell>
                              {formatLabel(device.preload_status)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {formatLabel(device.sync_status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {pluralize(device.activity_count, "action")}
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
    </div>
  );
}
