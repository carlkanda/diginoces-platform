import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  FileTextIcon,
  FolderOpenIcon,
  LockKeyholeIcon,
  PackageCheckIcon,
  ShieldCheckIcon,
} from "lucide-react";

import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import { redirectToMfaIfStepUpRequired } from "@/lib/auth/mfa-route-guard";
import { formatDate } from "@/lib/dates/format-date";
import { listEventFiles, type ProjectFileRow } from "@/lib/files/file-db";
import {
  hasEventPermission,
  hasProjectPermission,
  ProjectAccessError,
  requireEventPermission,
} from "@/lib/projects/project-api";
import {
  formatProjectCoupleDisplayName,
  formatProjectEventDisplayName,
  formatProjectEventDisplayReference,
  formatProjectVenueDisplay,
  type EventType,
  getEventLifecycleLabel,
  getEventTypeLabel,
  isInternalProjectDisplayText,
} from "@/lib/projects/project-foundation";
import { getEventDetails } from "@/lib/projects/project-service";
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

type PageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

type FileSummary = {
  archivedFiles: number;
  currentFiles: number;
  guestVisibleFiles: number;
  retentionDueFiles: number;
  totalFiles: number;
};

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function fileDisplayName(filename: string | null | undefined, index: number) {
  if (!filename || isInternalProjectDisplayText(filename)) {
    return `Event file ${index + 1}`;
  }

  return filename;
}

function formatLabel(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  const labels: Record<string, string> = {
    active: "Active",
    archived: "Archived",
    canva_csv_export: "Canva CSV export",
    check_in_export: "Check-in export",
    contract: "Contract",
    contract_addendum: "Contract addendum",
    couple_visible: "Couple visible",
    deleted: "Deleted",
    failed: "Failed",
    generated: "Generated",
    generated_invitation: "Generated invitation",
    guest_book_export: "Guest-book export",
    guest_visible: "Guest visible",
    import_file: "Import file",
    internal: "Team only",
    invitation_template: "Invitation template",
    not_required: "Not required",
    partner_document: "Partner document",
    partner_visible: "Partner visible",
    payment_proof: "Payment proof",
    pending_cleanup: "Pending cleanup",
    project_archive: "Project archive",
    qr_asset: "QR asset",
    report_export: "Report export",
    retained: "Retained",
    retention_active: "Retention active",
    retention_due: "Retention due",
    retention_extended: "Retention extended",
    superseded: "Previous version",
    table_card_export: "Table-card export",
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

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value < 0) {
    return "Size not recorded";
  }
  if (value === 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size >= 10 || unitIndex === 0 ? Math.round(size) : size.toFixed(1)} ${
    units[unitIndex]
  }`;
}

function fileSummary(files: ProjectFileRow[]): FileSummary {
  return {
    archivedFiles: files.filter((file) => file.status === "archived").length,
    currentFiles: files.filter((file) => file.is_latest).length,
    guestVisibleFiles: files.filter(
      (file) => file.visibility === "guest_visible",
    ).length,
    retentionDueFiles: files.filter(
      (file) => file.retention_status === "retention_due",
    ).length,
    totalFiles: files.length,
  };
}

function statusBadgeVariant(status: string | null | undefined) {
  if (status === "active" || status === "generated") {
    return "default" as const;
  }

  if (status === "archived" || status === "superseded") {
    return "secondary" as const;
  }

  if (status === "deleted" || status === "failed") {
    return "destructive" as const;
  }

  return "outline" as const;
}

export default async function EventFilesPage({ params }: PageProps) {
  const authContext = await getAuthContext();
  const { eventId } = await params;

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath(`/platform/events/${eventId}/files`));
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
              <BreadcrumbPage>Event file handoff</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Card>
          <CardHeader>
            <CardTitle>
              <h1>Event file handoff is waiting for access</h1>
            </CardTitle>
            <CardDescription>
              File records will appear after the workspace connection is ready.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <LockKeyholeIcon aria-hidden="true" />
              <AlertTitle>Connection required</AlertTitle>
              <AlertDescription>
                Event file records stay closed until the secure workspace
                connection is available.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </main>
    );
  }

  const supabase = authContext.supabase;
  const context = { supabase, user: authContext.user };

  try {
    await requireEventPermission(context, eventId, "files.read");
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      await redirectToMfaIfStepUpRequired(
        context,
        `/platform/events/${eventId}/files`,
        {
          permission: "files.read",
          scope: "event",
          scopeId: eventId,
        },
      );
      notFound();
    }

    throw error;
  }

  const [event, files] = await Promise.all([
    getEventDetails(supabase, eventId),
    listEventFiles(supabase, eventId),
  ]);

  if (!event) {
    notFound();
  }

  const eventTypeLabel = getEventTypeLabel(event.event.event_type as EventType);
  const fallbackEventName = `${eventTypeLabel} event`;
  const eventName = isInternalProjectDisplayText(event.event.name)
    ? fallbackEventName
    : formatProjectEventDisplayName(event.event, 0);
  const eventReference = formatProjectEventDisplayReference(event.event, 0);
  const eventReferenceValue = eventReference.isCode
    ? eventReference.value
    : fallbackEventName;
  const eventStatus = getEventLifecycleLabel(event.event.status);
  const projectName = formatProjectCoupleDisplayName(event.project, 0);
  const venueName = formatProjectVenueDisplay(event.event.venue_name);
  const summary = fileSummary(files);
  const [canReadInvitations, canReadSeating, canReadCheckIn] =
    await Promise.all([
      hasProjectPermission(
        context,
        event.project.id,
        "invitation_templates.read",
      ),
      hasProjectPermission(context, event.project.id, "seating.read"),
      hasEventPermission(context, eventId, "check_in.read"),
    ]);

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
              Weddings
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              render={<Link href={`/platform/projects/${event.project.id}`} />}
            >
              {projectName}
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
            <BreadcrumbPage>Files</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{eventTypeLabel}</Badge>
            <Badge variant="outline">{eventStatus}</Badge>
            <Badge variant="outline">
              {eventReference.label}: {eventReferenceValue}
            </Badge>
          </div>
          <div className="max-w-3xl">
            <h1 className="text-3xl font-semibold tracking-normal text-balance">
              Event file handoff
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground text-pretty">
              Review templates, generated invitations, seating exports, check-in
              reports, and other records the team needs for {eventName}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              render={<Link href={`/platform/events/${eventId}`} />}
            >
              <ArrowLeftIcon aria-hidden="true" data-icon="inline-start" />
              Event workspace
            </Button>
            <Button
              render={
                <Link href={`/platform/projects/${event.project.id}/files`} />
              }
            >
              Project file vault
              <ArrowRightIcon aria-hidden="true" data-icon="inline-end" />
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>File snapshot</CardTitle>
            <CardDescription>
              The event-specific file state for this workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Files</span>
              <strong>{summary.totalFiles}</strong>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Current versions</span>
              <strong>{summary.currentFiles}</strong>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Guest visible</span>
              <strong>{summary.guestVisibleFiles}</strong>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Retention due</span>
              <strong>{summary.retentionDueFiles}</strong>
            </div>
          </CardContent>
        </Card>
      </section>

      <Alert>
        <ShieldCheckIcon aria-hidden="true" />
        <AlertTitle>File access is event-scoped</AlertTitle>
        <AlertDescription>
          This page only lists files connected to this event. File details,
          downloads, versions, and retention controls still follow the project
          file permissions.
        </AlertDescription>
      </Alert>

      <section className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card>
          <CardHeader>
            <CardTitle>Event records</CardTitle>
            <CardDescription>
              Open a file record to review versions, download permissions,
              access history, or archive state.
            </CardDescription>
            <CardAction>
              <Badge variant="secondary">
                {pluralize(files.length, "file")}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            {files.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <FolderOpenIcon aria-hidden="true" />
                  </EmptyMedia>
                  <EmptyTitle>No event files yet</EmptyTitle>
                  <EmptyDescription>
                    Files assigned to this event will appear here after they are
                    registered from the project file vault.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button
                    render={
                      <Link
                        href={`/platform/projects/${event.project.id}/files`}
                      />
                    }
                    variant="outline"
                  >
                    Open project file vault
                  </Button>
                </EmptyContent>
              </Empty>
            ) : (
              <>
                <div className="grid gap-3 sm:hidden">
                  {files.map((file, index) => {
                    const displayName = fileDisplayName(file.filename, index);

                    return (
                      <div
                        className="flex flex-col gap-3 rounded-lg border bg-background p-3"
                        key={file.id}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <strong className="block text-sm font-medium text-pretty">
                              {displayName}
                            </strong>
                            <span className="text-xs text-muted-foreground">
                              {formatBytes(file.file_size_bytes)} -{" "}
                              {formatLabel(file.mime_type)}
                            </span>
                          </div>
                          <Badge variant={statusBadgeVariant(file.status)}>
                            {formatLabel(file.status)}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-muted-foreground">
                              Category
                            </span>
                            <span>{formatLabel(file.category)}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-muted-foreground">
                              Version
                            </span>
                            <span>v{file.version}</span>
                          </div>
                          <div className="col-span-2 flex flex-col gap-1">
                            <span className="text-xs font-medium text-muted-foreground">
                              Visibility
                            </span>
                            <Badge className="w-fit" variant="outline">
                              {formatLabel(file.visibility)}
                            </Badge>
                          </div>
                        </div>

                        <Button
                          aria-label={`Open ${displayName}`}
                          render={
                            <Link
                              href={`/platform/projects/${event.project.id}/files/${file.id}`}
                            />
                          }
                          size="sm"
                          variant="outline"
                        >
                          Open record
                          <ArrowRightIcon
                            aria-hidden="true"
                            data-icon="inline-end"
                          />
                        </Button>
                      </div>
                    );
                  })}
                </div>

                <div className="hidden sm:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>File</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Visibility</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Version</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {files.map((file, index) => {
                        const displayName = fileDisplayName(
                          file.filename,
                          index,
                        );

                        return (
                          <TableRow key={file.id}>
                            <TableCell className="min-w-64 whitespace-normal">
                              <div className="flex flex-col gap-1">
                                <strong className="text-sm font-medium">
                                  {displayName}
                                </strong>
                                <span className="text-xs text-muted-foreground">
                                  {formatBytes(file.file_size_bytes)} -{" "}
                                  {formatLabel(file.mime_type)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>{formatLabel(file.category)}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {formatLabel(file.visibility)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusBadgeVariant(file.status)}>
                                {formatLabel(file.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <span>v{file.version}</span>
                                <span className="text-xs text-muted-foreground">
                                  {file.is_latest
                                    ? "Current version"
                                    : "Previous version"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                aria-label={`Open ${displayName}`}
                                render={
                                  <Link
                                    href={`/platform/projects/${event.project.id}/files/${file.id}`}
                                  />
                                }
                                size="sm"
                                variant="outline"
                              >
                                Open
                                <ArrowRightIcon
                                  aria-hidden="true"
                                  data-icon="inline-end"
                                />
                              </Button>
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

        <aside className="flex min-w-0 flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Event context</CardTitle>
              <CardDescription>
                Details that help confirm each file belongs to the right event.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <div className="flex items-start gap-3">
                <CalendarDaysIcon aria-hidden="true" />
                <div className="min-w-0">
                  <p className="font-medium">
                    {formatDate(event.event.event_date)}
                  </p>
                  <p className="text-muted-foreground">{venueName}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Archived files</span>
                <Badge variant="secondary">{summary.archivedFiles}</Badge>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Current versions</span>
                <Badge variant="outline">{summary.currentFiles}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>File handoff</CardTitle>
              <CardDescription>
                Where to go when the file needs more work.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {canReadInvitations ? (
                <Button
                  render={
                    <Link href={`/platform/events/${eventId}/invitations`} />
                  }
                  size="sm"
                  variant="outline"
                >
                  Invitation files
                  <ArrowRightIcon aria-hidden="true" data-icon="inline-end" />
                </Button>
              ) : null}
              {canReadSeating ? (
                <Button
                  render={<Link href={`/platform/events/${eventId}/seating`} />}
                  size="sm"
                  variant="outline"
                >
                  Seating exports
                  <ArrowRightIcon aria-hidden="true" data-icon="inline-end" />
                </Button>
              ) : null}
              {canReadCheckIn ? (
                <Button
                  render={
                    <Link href={`/platform/events/${eventId}/check-in`} />
                  }
                  size="sm"
                  variant="outline"
                >
                  Check-in records
                  <ArrowRightIcon aria-hidden="true" data-icon="inline-end" />
                </Button>
              ) : null}
              {!canReadInvitations && !canReadSeating && !canReadCheckIn ? (
                <p className="text-sm text-muted-foreground">
                  No additional event handoff pages are available for this role.
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Alert>
            <PackageCheckIcon aria-hidden="true" />
            <AlertTitle>Use the project vault to add files</AlertTitle>
            <AlertDescription>
              Event files are registered and versioned from the project file
              vault. This event page keeps the linked records easy to review.
            </AlertDescription>
          </Alert>

          <Alert>
            <FileTextIcon aria-hidden="true" />
            <AlertTitle>Keep visibility deliberate</AlertTitle>
            <AlertDescription>
              Guest-visible and partner-visible files should be reviewed before
              handoff. Sensitive records should remain team-only.
            </AlertDescription>
          </Alert>
        </aside>
      </section>
    </main>
  );
}
