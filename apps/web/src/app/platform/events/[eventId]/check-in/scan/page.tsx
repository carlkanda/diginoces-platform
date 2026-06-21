import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  CheckCircle2Icon,
  QrCodeIcon,
  SearchIcon,
  SmartphoneIcon,
  TicketCheckIcon,
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
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import { getCheckInOverview } from "@/lib/check-in/check-in-db";
import {
  buildCheckInReadinessIssues,
  resolveAllowedCheckInMethods,
} from "@/lib/check-in/check-in-service";
import { searchParamText } from "@/lib/navigation/search-params";
import {
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
import { checkInByTokenAction, resolveTokenForScanAction } from "../actions";

export const dynamic = "force-dynamic";

type ScanPageProps = {
  params: Promise<{
    eventId: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

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

function formatScanStatus(value: string) {
  const labels: Record<string, string> = {
    "not found": "Guest not found",
    "not scanned": "Ready to scan",
    resolved: "Guest found",
  };

  return labels[value] ?? formatLabel(value);
}

function remainingLabel(remainingCount: number) {
  if (remainingCount <= 0) {
    return "Arrival already complete";
  }

  return `${remainingCount} ${remainingCount === 1 ? "arrival" : "arrivals"} remaining`;
}

export default async function CheckInScanPage({
  params,
  searchParams,
}: ScanPageProps) {
  const authContext = await getAuthContext();
  const { eventId } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};

  if (authContext.status === "anonymous") {
    redirect(
      buildLoginRedirectPath(`/platform/events/${eventId}/check-in/scan`),
    );
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
              <BreadcrumbPage>QR check-in</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Card>
          <CardHeader>
            <CardTitle>QR check-in</CardTitle>
            <CardDescription>
              Connect the workspace before loading scan controls.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTriangleIcon aria-hidden="true" />
              <AlertTitle>Workspace connection needed</AlertTitle>
              <AlertDescription>
                Scan controls will appear after the secure connection is ready.
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
    await requireEventPermission(context, eventId, "check_in.perform");
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      notFound();
    }

    throw error;
  }

  const guestId = searchParamText(resolvedSearchParams, "guestId");
  const tokenId = searchParamText(resolvedSearchParams, "tokenId");
  const invitationId = searchParamText(resolvedSearchParams, "invitationId");
  const scanStatus = searchParamText(resolvedSearchParams, "scanStatus");
  const scanError = searchParamText(resolvedSearchParams, "scanError");
  const overview = await getCheckInOverview(supabase, eventId);
  const tableDisplayNames = new Map(
    [
      ...new Set(
        overview.guests
          .map((checkInGuest) => checkInGuest.tableName)
          .filter((tableName): tableName is string => Boolean(tableName)),
      ),
    ]
      .sort((left, right) => left.localeCompare(right))
      .map((tableName, tableIndex) => [
        tableName,
        formatEventTableName(tableName, tableIndex),
      ]),
  );
  const allowedMethods = resolveAllowedCheckInMethods(
    overview.settings?.allowed_methods,
  );
  const isQrAllowed = allowedMethods.has("qr_scan");
  const guest = guestId
    ? (overview.guests.find((item) => item.guestId === guestId) ?? null)
    : null;
  const resolvedStatus = guest
    ? (scanStatus ?? "resolved")
    : guestId
      ? "not found"
      : "not scanned";
  const remainingCount = guest
    ? Math.max(guest.expectedCount - guest.arrivedCount, 0)
    : 0;
  const projectLabel = formatProjectCoupleDisplayName(overview.project, 0);
  const fallbackEventName = fallbackCheckInEventName(overview.event);
  const eventName = isInternalProjectDisplayText(overview.event.name)
    ? fallbackEventName
    : formatProjectEventDisplayName(overview.event, 0);
  const eventReference = formatProjectEventDisplayReference(overview.event, 0);
  const eventReferenceValue = eventReference.isCode
    ? eventReference.value
    : fallbackEventName;
  const guestIndex = guest
    ? Math.max(
        0,
        overview.guests.findIndex((item) => item.guestId === guest.guestId),
      )
    : 0;
  const guestDisplayName = guest
    ? formatCheckInGuestName(guest.displayName, guestIndex)
    : null;
  const deviceDisplayNames = new Map(
    overview.devices.map((device, index) => [
      device.id,
      formatCheckInStationName(device.station_name, index),
    ]),
  );
  const readinessItems = guest ? buildCheckInReadinessIssues(guest) : [];

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
            <BreadcrumbLink
              render={<Link href={`/platform/events/${eventId}/check-in`} />}
            >
              Check-in
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>QR scan</BreadcrumbPage>
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
                <Badge variant={guest ? "secondary" : "outline"}>
                  {formatScanStatus(resolvedStatus)}
                </Badge>
              </div>
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-semibold tracking-normal text-balance">
                  QR check-in
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground text-pretty">
                  Resolve an invitation QR reference, confirm the matched guest,
                  and record the arrival for {eventName}.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                render={<Link href={`/platform/events/${eventId}/check-in`} />}
                variant="outline"
              >
                <ArrowLeftIcon data-icon="inline-start" />
                Check-in desk
              </Button>
              <Button
                render={<Link href={`/platform/events/${eventId}`} />}
                variant="outline"
              >
                Event overview
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="ops-ledger__metrics">
            <div className="ops-ledger__metric">
              <span className="ops-ledger__metric-label">Scan state</span>
              <strong className="ops-ledger__metric-value">
                {formatScanStatus(resolvedStatus)}
              </strong>
              <span className="ops-ledger__metric-note">
                {isQrAllowed ? "QR lookup is available." : "QR lookup is off."}
              </span>
            </div>
            <div className="ops-ledger__metric">
              <span className="ops-ledger__metric-label">Matched guest</span>
              <strong className="ops-ledger__metric-value">
                {guestDisplayName ?? "No guest selected"}
              </strong>
              <span className="ops-ledger__metric-note">
                Confirm identity before recording arrival.
              </span>
            </div>
            <div className="ops-ledger__metric">
              <span className="ops-ledger__metric-label">Arrival state</span>
              <strong className="ops-ledger__metric-value">
                {guest ? remainingLabel(remainingCount) : "Waiting for scan"}
              </strong>
              <span className="ops-ledger__metric-note">
                Arrival count remains bounded by the guest record.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {scanError ? (
        <Alert variant="destructive">
          <AlertTriangleIcon aria-hidden="true" />
          <AlertTitle>Scan could not be completed</AlertTitle>
          <AlertDescription>{scanError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Find guest by QR reference</CardTitle>
            <CardDescription>
              Enter the text from the invitation QR code before confirming the
              arrival.
            </CardDescription>
            <CardAction>
              <Badge variant={isQrAllowed ? "secondary" : "outline"}>
                {isQrAllowed ? "Enabled" : "Disabled"}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            {isQrAllowed ? (
              <form action={resolveTokenForScanAction.bind(null, eventId)}>
                <FieldSet>
                  <FieldLegend>QR reference</FieldLegend>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="token">QR code text</FieldLabel>
                      <Input
                        autoComplete="off"
                        id="token"
                        name="token"
                        placeholder="Paste or scan the QR reference"
                        required
                      />
                      <FieldDescription>
                        This looks up the guest and keeps the arrival action on
                        this page.
                      </FieldDescription>
                    </Field>
                  </FieldGroup>
                </FieldSet>
                <div className="mt-4 flex justify-end">
                  <Button
                    aria-label={`Find guest from the scanned QR code for ${eventName}`}
                    type="submit"
                  >
                    <SearchIcon data-icon="inline-start" />
                    Find guest
                  </Button>
                </div>
              </form>
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <QrCodeIcon aria-hidden="true" />
                  </EmptyMedia>
                  <EmptyTitle>QR scanning is disabled</EmptyTitle>
                  <EmptyDescription>
                    Use manual check-in from the event desk, or update event
                    settings before scanning QR references.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Arrival confirmation</CardTitle>
            <CardDescription>
              Confirm the guest details before recording the arrival.
            </CardDescription>
            <CardAction>
              <Badge variant={guest ? "secondary" : "outline"}>
                {guest ? "Guest matched" : "Waiting"}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {isQrAllowed && guest ? (
              <>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="ops-ledger__metric">
                    <span className="ops-ledger__metric-label">Guest</span>
                    <strong className="ops-ledger__metric-value text-base">
                      {guestDisplayName ?? guest.displayName}
                    </strong>
                  </div>
                  <div className="ops-ledger__metric">
                    <span className="ops-ledger__metric-label">Side</span>
                    <strong className="ops-ledger__metric-value text-base">
                      {formatGuestSide(guest.guestSide)}
                    </strong>
                  </div>
                  <div className="ops-ledger__metric">
                    <span className="ops-ledger__metric-label">RSVP</span>
                    <strong className="ops-ledger__metric-value text-base">
                      {formatRsvpStatus(guest.rsvpStatus)}
                    </strong>
                  </div>
                  <div className="ops-ledger__metric">
                    <span className="ops-ledger__metric-label">Table</span>
                    <strong className="ops-ledger__metric-value text-base">
                      {guest.tableName
                        ? (tableDisplayNames.get(guest.tableName) ??
                          formatEventTableName(
                            guest.tableName,
                            tableDisplayNames.size,
                          ))
                        : "Unassigned"}
                    </strong>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    {formatGuestDeliveryType(guest.isPrintedOnly)}
                  </Badge>
                  <Badge
                    variant={guest.isVipProtocol ? "secondary" : "outline"}
                  >
                    {guest.isVipProtocol ? "VIP protocol" : "Standard arrival"}
                  </Badge>
                  <Badge variant={remainingCount > 0 ? "secondary" : "outline"}>
                    {remainingLabel(remainingCount)}
                  </Badge>
                </div>

                {readinessItems.length > 0 ? (
                  <Alert>
                    <AlertTriangleIcon aria-hidden="true" />
                    <AlertTitle>Review before confirming</AlertTitle>
                    <AlertDescription>
                      <span className="flex flex-col gap-1">
                        {readinessItems.map((readinessItem) => (
                          <span key={readinessItem.code}>
                            {readinessItem.message}
                          </span>
                        ))}
                      </span>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <CheckCircle2Icon aria-hidden="true" />
                    <AlertTitle>Guest is ready for check-in</AlertTitle>
                    <AlertDescription>
                      The QR reference matched this event and no readiness
                      warning is showing.
                    </AlertDescription>
                  </Alert>
                )}

                <Separator />

                <form action={checkInByTokenAction.bind(null, eventId)}>
                  <input name="guestId" type="hidden" value={guest.guestId} />
                  <input
                    name="invitationId"
                    type="hidden"
                    value={invitationId ?? ""}
                  />
                  <input name="tokenId" type="hidden" value={tokenId ?? ""} />
                  <FieldSet>
                    <FieldLegend>Record arrival</FieldLegend>
                    <FieldGroup className="md:grid md:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="arrivalCount">
                          Arrival count
                        </FieldLabel>
                        <Input
                          defaultValue={1}
                          disabled={remainingCount <= 0}
                          id="arrivalCount"
                          max={remainingCount > 0 ? remainingCount : 1}
                          min="1"
                          name="arrivalCount"
                          type="number"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="deviceId">
                          Station/device
                        </FieldLabel>
                        <NativeSelect
                          className="w-full"
                          id="deviceId"
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
                    </FieldGroup>
                  </FieldSet>

                  {!tokenId ? (
                    <Alert className="mt-4" variant="destructive">
                      <AlertTriangleIcon aria-hidden="true" />
                      <AlertTitle>QR reference missing</AlertTitle>
                      <AlertDescription>
                        This scan is missing its QR reference. Scan again before
                        confirming the arrival.
                      </AlertDescription>
                    </Alert>
                  ) : null}

                  <div className="mt-4 flex justify-end">
                    <Button
                      aria-label={`Confirm QR check-in for ${guestDisplayName ?? guest.displayName}`}
                      disabled={remainingCount <= 0 || !tokenId}
                      type="submit"
                    >
                      <TicketCheckIcon data-icon="inline-start" />
                      Confirm check-in
                    </Button>
                  </div>
                </form>
              </>
            ) : guestId && isQrAllowed ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <AlertTriangleIcon aria-hidden="true" />
                  </EmptyMedia>
                  <EmptyTitle>Guest not found</EmptyTitle>
                  <EmptyDescription>
                    This QR code could not be matched to a guest for {eventName}
                    . Scan again or use manual guest search from check-in.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <SmartphoneIcon aria-hidden="true" />
                  </EmptyMedia>
                  <EmptyTitle>Scan a guest invitation</EmptyTitle>
                  <EmptyDescription>
                    The matched guest and arrival controls will appear here
                    after a QR reference is resolved.
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
