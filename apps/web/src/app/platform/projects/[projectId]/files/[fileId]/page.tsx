import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArchiveIcon,
  ArrowLeftIcon,
  CheckCircle2Icon,
  DownloadIcon,
  FileClockIcon,
  FileTextIcon,
  HistoryIcon,
  LockKeyholeIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
  UploadIcon,
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
import { Button, buttonVariants } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import { formatDateTime } from "@/lib/dates/format-date";
import {
  getProjectFileCapabilities,
  requireProjectFileReadPermission,
} from "@/lib/files/file-api";
import { getProjectFileDetails } from "@/lib/files/file-db";
import { ProjectAccessError } from "@/lib/projects/project-api";
import {
  formatProjectCoupleDisplayName,
  formatProjectDisplayReference,
  isInternalProjectDisplayText,
} from "@/lib/projects/project-foundation";
import { getProjectDetails } from "@/lib/projects/project-service";
import { archiveProjectFileAction, createFileVersionAction } from "../actions";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    fileId: string;
    projectId: string;
  }>;
  searchParams: Promise<{
    fileStatus?: string;
  }>;
};

type FileStatusNotice = {
  description: string;
  title: string;
  tone: "danger" | "success";
};

function fileDisplayName(filename: string | null | undefined, index?: number) {
  if (!filename || isInternalProjectDisplayText(filename)) {
    return typeof index === "number"
      ? `Registered file ${index + 1}`
      : "Registered file";
  }

  return filename;
}

function formatLabel(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  const labels: Record<string, string> = {
    access_denied: "Access denied",
    active: "Active",
    archive: "Archive",
    archived: "Archived",
    canva_csv_export: "Canva CSV export",
    contract: "Contract",
    couple_visible: "Couple visible",
    deleted: "Deleted",
    denied: "Denied",
    download: "Download",
    download_denied: "Download denied",
    download_requested: "Download requested",
    failed: "Failed",
    generated: "Generated",
    generated_invitation: "Generated invitation",
    guest_book_export: "Guest-book export",
    guest_visible: "Guest visible",
    internal: "Team only",
    invitation_template: "Invitation template",
    not_required: "Not required",
    partner_visible: "Partner visible",
    payment_proof: "Payment proof",
    pending: "Pending",
    pending_cleanup: "Pending cleanup",
    project_archive: "Project archive",
    report_export: "Report export",
    soft_delete: "Retire previous version",
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

function fileStatusNotice(status: string | undefined): FileStatusNotice | null {
  const notices: Record<string, FileStatusNotice> = {
    file_archive_failed: {
      description:
        "The archive action could not be saved. Check the reason and your access before trying again.",
      title: "Archive action failed",
      tone: "danger",
    },
    file_archived: {
      description:
        "The archive action was recorded for this file and added to the file history.",
      title: "File archived",
      tone: "success",
    },
    file_version_created: {
      description:
        "The updated file record was added and the version history has been refreshed.",
      title: "New version recorded",
      tone: "success",
    },
    file_version_failed: {
      description:
        "The updated file record could not be saved. Check the filename, format, and size before trying again.",
      title: "Version was not recorded",
      tone: "danger",
    },
    permission_denied: {
      description:
        "Your role does not allow that file action. Ask a Diginoces administrator if this access should change.",
      title: "File action not allowed",
      tone: "danger",
    },
  };

  return status ? (notices[status] ?? null) : null;
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

export default async function ProjectFileDetailsPage({
  params,
  searchParams,
}: PageProps) {
  const authContext = await getAuthContext();
  const { fileId, projectId } = await params;
  const filters = await searchParams;

  if (authContext.status === "anonymous") {
    redirect(
      buildLoginRedirectPath(`/platform/projects/${projectId}/files/${fileId}`),
    );
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
              <BreadcrumbPage>File record</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Card>
          <CardHeader>
            <CardTitle>
              <h1>File record is unavailable</h1>
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
                This page is secure by default. Ask a Diginoces administrator to
                finish the workspace connection before opening this file.
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
    await requireProjectFileReadPermission(context, projectId);
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      notFound();
    }

    throw error;
  }

  const [details, projectDetails, capabilities] = await Promise.all([
    getProjectFileDetails(supabase, fileId),
    getProjectDetails(supabase, projectId),
    getProjectFileCapabilities(context, projectId),
  ]);

  if (!details || details.file.project_id !== projectId || !projectDetails) {
    notFound();
  }

  const file = details.file;
  const displayFilename = fileDisplayName(file.filename);
  const notice = fileStatusNotice(filters.fileStatus);
  const projectReference = formatProjectDisplayReference(
    projectDetails.project,
    0,
  );
  const projectName = formatProjectCoupleDisplayName(projectDetails.project, 0);
  const allowedAccessCount = details.accessEvents.filter(
    (event) => event.allowed,
  ).length;
  const deniedAccessCount = details.accessEvents.length - allowedAccessCount;

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
            <BreadcrumbLink render={<Link href="/platform/projects" />}>
              Weddings
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              render={<Link href={`/platform/projects/${projectId}`} />}
            >
              {projectReference.value}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              render={<Link href={`/platform/projects/${projectId}/files`} />}
            >
              Files
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{displayFilename}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader>
          <CardTitle>
            <h1>{displayFilename}</h1>
          </CardTitle>
          <CardDescription>
            Control this protected file record: review access, download when
            allowed, register a new version, or archive it with a clear reason.
          </CardDescription>
          <CardAction>
            <div className="flex flex-wrap gap-2">
              <Link
                aria-label={`Back to the wedding file vault from ${displayFilename}`}
                className={buttonVariants({ variant: "outline" })}
                href={`/platform/projects/${projectId}/files`}
              >
                <ArrowLeftIcon aria-hidden="true" data-icon="inline-start" />
                File vault
              </Link>
              {capabilities.canDownload ? (
                <Link
                  aria-label={`Download ${displayFilename}`}
                  className={buttonVariants()}
                  href={`/api/projects/${projectId}/files/${file.id}/download`}
                >
                  <DownloadIcon aria-hidden="true" data-icon="inline-start" />
                  Download
                </Link>
              ) : null}
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant="secondary">Protected file record</Badge>
          <Badge variant="outline">{formatLabel(file.category)}</Badge>
          <Badge variant="outline">Version {file.version}</Badge>
          <Badge variant={statusBadgeVariant(file.status)}>
            {formatLabel(file.status)}
          </Badge>
        </CardContent>
      </Card>

      {notice ? (
        <Alert variant={notice.tone === "danger" ? "destructive" : "default"}>
          {notice.tone === "danger" ? (
            <TriangleAlertIcon aria-hidden="true" />
          ) : (
            <CheckCircle2Icon aria-hidden="true" />
          )}
          <AlertTitle>{notice.title}</AlertTitle>
          <AlertDescription>{notice.description}</AlertDescription>
        </Alert>
      ) : null}

      <section className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Record summary</CardTitle>
              <CardDescription>
                Metadata, visibility, and retention state for this file record.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex flex-col gap-1 rounded-lg border bg-background p-3">
                  <span className="text-xs font-medium text-muted-foreground">
                    Status
                  </span>
                  <strong className="text-sm font-medium">
                    {formatLabel(file.status)}
                  </strong>
                </div>
                <div className="flex flex-col gap-1 rounded-lg border bg-background p-3">
                  <span className="text-xs font-medium text-muted-foreground">
                    Visibility
                  </span>
                  <strong className="text-sm font-medium">
                    {formatLabel(file.visibility)}
                  </strong>
                </div>
                <div className="flex flex-col gap-1 rounded-lg border bg-background p-3">
                  <span className="text-xs font-medium text-muted-foreground">
                    Version set
                  </span>
                  <strong className="text-sm font-medium">
                    {file.is_latest ? "Current version" : "Previous version"}
                  </strong>
                </div>
                <div className="flex flex-col gap-1 rounded-lg border bg-background p-3">
                  <span className="text-xs font-medium text-muted-foreground">
                    Size
                  </span>
                  <strong className="text-sm font-medium">
                    {file.file_size_bytes} bytes
                  </strong>
                </div>
                <div className="flex flex-col gap-1 rounded-lg border bg-background p-3">
                  <span className="text-xs font-medium text-muted-foreground">
                    Created
                  </span>
                  <strong className="text-sm font-medium">
                    {formatDateTime(file.created_at)}
                  </strong>
                </div>
                <div className="flex flex-col gap-1 rounded-lg border bg-background p-3">
                  <span className="text-xs font-medium text-muted-foreground">
                    Retention status
                  </span>
                  <strong className="text-sm font-medium">
                    {formatLabel(file.retention_status)}
                  </strong>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Version and access history</CardTitle>
              <CardDescription>
                Versions, access checks, and archive events for this record.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="versions">
                <TabsList>
                  <TabsTrigger value="versions">
                    <FileClockIcon
                      aria-hidden="true"
                      data-icon="inline-start"
                    />
                    Versions
                  </TabsTrigger>
                  <TabsTrigger value="access">
                    <ShieldCheckIcon
                      aria-hidden="true"
                      data-icon="inline-start"
                    />
                    Access
                  </TabsTrigger>
                  <TabsTrigger value="archive">
                    <HistoryIcon aria-hidden="true" data-icon="inline-start" />
                    Archive
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="versions">
                  <div className="grid gap-3 sm:hidden">
                    {details.versions.map((version, index) => (
                      <div
                        className="flex flex-col gap-3 rounded-lg border bg-background p-3"
                        key={version.id}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <strong className="block text-sm font-medium text-pretty">
                              {fileDisplayName(version.filename, index)}
                            </strong>
                            <span className="text-xs text-muted-foreground">
                              {version.is_latest
                                ? "Current version"
                                : "Previous version"}
                            </span>
                          </div>
                          <Badge variant={statusBadgeVariant(version.status)}>
                            {formatLabel(version.status)}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-muted-foreground">
                              Version
                            </span>
                            <span>v{version.version}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-muted-foreground">
                              Created
                            </span>
                            <span>{formatDateTime(version.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="hidden sm:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>File</TableHead>
                          <TableHead>Version</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {details.versions.map((version, index) => (
                          <TableRow key={version.id}>
                            <TableCell className="min-w-64 whitespace-normal">
                              <div className="flex flex-col gap-1">
                                <strong className="text-sm font-medium">
                                  {fileDisplayName(version.filename, index)}
                                </strong>
                                <span className="text-xs text-muted-foreground">
                                  {version.is_latest
                                    ? "Current version"
                                    : "Previous version"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>v{version.version}</TableCell>
                            <TableCell>
                              <Badge
                                variant={statusBadgeVariant(version.status)}
                              >
                                {formatLabel(version.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {formatDateTime(version.created_at)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="access">
                  {details.accessEvents.length === 0 ? (
                    <Empty className="border">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <ShieldCheckIcon aria-hidden="true" />
                        </EmptyMedia>
                        <EmptyTitle>No file access history yet</EmptyTitle>
                        <EmptyDescription>
                          Access checks will appear after this file is requested
                          or downloaded.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : (
                    <>
                      <div className="grid gap-3 sm:hidden">
                        {details.accessEvents.map((event) => (
                          <div
                            className="flex flex-col gap-3 rounded-lg border bg-background p-3"
                            key={event.id}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <strong className="block text-sm font-medium">
                                  {formatLabel(event.access_action)}
                                </strong>
                                <span className="text-xs text-muted-foreground">
                                  {formatDateTime(event.created_at)}
                                </span>
                              </div>
                              <Badge
                                variant={
                                  event.allowed ? "default" : "destructive"
                                }
                              >
                                {event.allowed ? "Allowed" : "Denied"}
                              </Badge>
                            </div>
                            <div className="flex flex-col gap-1 text-sm">
                              <span className="text-xs font-medium text-muted-foreground">
                                Context
                              </span>
                              <span>{formatLabel(event.access_context)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="hidden sm:block">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Action</TableHead>
                              <TableHead>Context</TableHead>
                              <TableHead>Result</TableHead>
                              <TableHead>Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {details.accessEvents.map((event) => (
                              <TableRow key={event.id}>
                                <TableCell>
                                  {formatLabel(event.access_action)}
                                </TableCell>
                                <TableCell>
                                  {formatLabel(event.access_context)}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      event.allowed ? "default" : "destructive"
                                    }
                                  >
                                    {event.allowed ? "Allowed" : "Denied"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {formatDateTime(event.created_at)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="archive">
                  {details.archiveEvents.length === 0 ? (
                    <Empty className="border">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <ArchiveIcon aria-hidden="true" />
                        </EmptyMedia>
                        <EmptyTitle>No archive history yet</EmptyTitle>
                        <EmptyDescription>
                          Archive events will appear after lifecycle actions are
                          applied.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : (
                    <>
                      <div className="grid gap-3 sm:hidden">
                        {details.archiveEvents.map((event) => (
                          <div
                            className="flex flex-col gap-3 rounded-lg border bg-background p-3"
                            key={event.id}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <strong className="block text-sm font-medium">
                                  {formatLabel(event.action)}
                                </strong>
                                <span className="text-xs text-muted-foreground">
                                  {formatDateTime(event.created_at)}
                                </span>
                              </div>
                              <Badge variant="secondary">
                                {formatLabel(event.next_status)}
                              </Badge>
                            </div>
                            <p className="text-sm leading-6 text-pretty">
                              {event.reason}
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className="hidden sm:block">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Action</TableHead>
                              <TableHead>Reason</TableHead>
                              <TableHead>Next state</TableHead>
                              <TableHead>Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {details.archiveEvents.map((event) => (
                              <TableRow key={event.id}>
                                <TableCell>
                                  {formatLabel(event.action)}
                                </TableCell>
                                <TableCell className="min-w-80 whitespace-normal">
                                  {event.reason}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary">
                                    {formatLabel(event.next_status)}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {formatDateTime(event.created_at)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Wedding context</CardTitle>
              <CardDescription>
                Confirm the wedding before changing the record.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                  {projectReference.label}
                </span>
                <strong className="text-sm font-medium">
                  {projectReference.value}
                </strong>
              </div>
              <Separator />
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                  Couple
                </span>
                <strong className="text-sm font-medium">{projectName}</strong>
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Allowed access</span>
                <Badge>{allowedAccessCount}</Badge>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Denied access</span>
                <Badge
                  variant={deniedAccessCount > 0 ? "destructive" : "outline"}
                >
                  {deniedAccessCount}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {capabilities.canVersion ? (
            <Card>
              <CardHeader>
                <CardTitle>Record an updated file</CardTitle>
                <CardDescription>
                  Keep earlier versions available while registering the latest
                  file details.
                </CardDescription>
              </CardHeader>
              <form
                action={createFileVersionAction.bind(null, projectId, file.id)}
              >
                <CardContent>
                  <FieldSet>
                    <FieldLegend>Updated file</FieldLegend>
                    <FieldGroup>
                      <Field>
                        <FieldLabel htmlFor="file-version-upload">
                          Select file
                        </FieldLabel>
                        <Input
                          id="file-version-upload"
                          name="file"
                          type="file"
                        />
                        <FieldDescription>
                          Choose the updated file when it is ready, or enter the
                          new details below.
                        </FieldDescription>
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="filename">File name</FieldLabel>
                        <Input
                          id="filename"
                          name="filename"
                          placeholder={displayFilename}
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="mimeType">File format</FieldLabel>
                        <Input
                          id="mimeType"
                          name="mimeType"
                          placeholder={file.mime_type}
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="fileSizeBytes">
                          Size in bytes
                        </FieldLabel>
                        <Input
                          id="fileSizeBytes"
                          min={0}
                          name="fileSizeBytes"
                          type="number"
                        />
                      </Field>
                      <input
                        name="category"
                        type="hidden"
                        value={file.category}
                      />
                      <input
                        name="visibility"
                        type="hidden"
                        value={file.visibility}
                      />
                      <Field>
                        <FieldLabel htmlFor="version-reason">
                          Version note
                        </FieldLabel>
                        <Textarea id="version-reason" name="reason" rows={2} />
                        <FieldDescription>
                          Optional context for why this version is being added.
                        </FieldDescription>
                      </Field>
                    </FieldGroup>
                  </FieldSet>
                </CardContent>
                <CardFooter className="justify-end">
                  <Button
                    aria-label={`Record an updated file for ${displayFilename}`}
                    type="submit"
                  >
                    <UploadIcon aria-hidden="true" data-icon="inline-start" />
                    Record updated file
                  </Button>
                </CardFooter>
              </form>
            </Card>
          ) : (
            <Alert>
              <LockKeyholeIcon aria-hidden="true" />
              <AlertTitle>Version controls are protected</AlertTitle>
              <AlertDescription>
                You can review this file, but your role cannot record updated
                versions for it.
              </AlertDescription>
            </Alert>
          )}

          {capabilities.canArchive ? (
            <Card>
              <CardHeader>
                <CardTitle>Archive decision</CardTitle>
                <CardDescription>
                  Archive the file with a reason. Retiring a previous version is
                  available only to Diginoces administrators.
                </CardDescription>
              </CardHeader>
              <form
                action={archiveProjectFileAction.bind(null, projectId, file.id)}
              >
                <CardContent>
                  <FieldSet>
                    <FieldLegend>Archive decision</FieldLegend>
                    <FieldGroup>
                      <Field>
                        <FieldLabel htmlFor="archive-action">
                          Archive action
                        </FieldLabel>
                        <NativeSelect
                          className="w-full"
                          id="archive-action"
                          name="action"
                          required
                        >
                          <NativeSelectOption value="archive">
                            Archive
                          </NativeSelectOption>
                          {capabilities.canSoftDelete ? (
                            <NativeSelectOption value="soft_delete">
                              Retire previous version
                            </NativeSelectOption>
                          ) : null}
                        </NativeSelect>
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="archive-reason">
                          Archive reason
                        </FieldLabel>
                        <Textarea
                          id="archive-reason"
                          name="reason"
                          required
                          rows={3}
                        />
                        <FieldDescription>
                          This reason is stored with the file history.
                        </FieldDescription>
                      </Field>
                    </FieldGroup>
                  </FieldSet>
                </CardContent>
                <CardFooter className="justify-end">
                  <Button
                    aria-label={`Apply archive action to ${displayFilename}`}
                    type="submit"
                  >
                    <ArchiveIcon aria-hidden="true" data-icon="inline-start" />
                    Apply archive action
                  </Button>
                </CardFooter>
              </form>
            </Card>
          ) : null}

          <Alert>
            <FileTextIcon aria-hidden="true" />
            <AlertTitle>Visibility controls access</AlertTitle>
            <AlertDescription>
              This file is currently{" "}
              {formatLabel(file.visibility).toLowerCase()}. Download and archive
              actions still require server-side permission.
            </AlertDescription>
          </Alert>
        </aside>
      </section>
    </main>
  );
}
