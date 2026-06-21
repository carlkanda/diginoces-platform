import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeftIcon,
  ArchiveIcon,
  CheckCircle2Icon,
  FileTextIcon,
  FolderOpenIcon,
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
import { buttonVariants } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import { redirectToMfaIfStepUpRequired } from "@/lib/auth/mfa-route-guard";
import { formatDate } from "@/lib/dates/format-date";
import {
  getProjectFileCapabilities,
  requireProjectFileReadPermission,
} from "@/lib/files/file-api";
import {
  listFileCategories,
  listProjectArchiveEvents,
  listProjectFiles,
  listProjectRetentionPolicies,
} from "@/lib/files/file-db";
import { fileCategories, type FileCategory } from "@/lib/files/file-service";
import { ProjectAccessError } from "@/lib/projects/project-api";
import {
  formatProjectCoupleDisplayName,
  formatProjectDisplayReference,
  formatProjectEventDisplayName,
  isInternalProjectDisplayText,
} from "@/lib/projects/project-foundation";
import { getProjectDetails } from "@/lib/projects/project-service";
import {
  registerProjectFileAction,
  updateProjectArchiveLifecycleAction,
} from "./actions";
import { RetentionActionFields } from "./retention-action-fields";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    projectId: string;
  }>;
  searchParams: Promise<{
    category?: string;
    fileStatus?: string;
    latestOnly?: string;
  }>;
};

type FileStatusNotice = {
  description: string;
  title: string;
  tone: "danger" | "success";
};

function isSupportedCategory(
  value: string | undefined,
): FileCategory | undefined {
  return fileCategories.some((category) => category === value)
    ? (value as FileCategory)
    : undefined;
}

function fileDisplayName(filename: string | null | undefined, index: number) {
  if (!filename || isInternalProjectDisplayText(filename)) {
    return `Registered file ${index + 1}`;
  }

  return filename;
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
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
    pending: "Pending",
    pending_cleanup: "Pending cleanup",
    project_archive: "Project archive",
    qr_asset: "QR asset",
    report_export: "Report export",
    retained: "Retained",
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
    file_registered: {
      description:
        "The file record was added to this wedding. Open the record to review versions, downloads, and archive actions.",
      title: "File registered",
      tone: "success",
    },
    file_register_failed: {
      description:
        "The file record could not be added. Check the filename, format, size, and category before trying again.",
      title: "File was not registered",
      tone: "danger",
    },
    permission_denied: {
      description:
        "Your role does not allow that file action. Ask a Diginoces administrator if this access should change.",
      title: "File action not allowed",
      tone: "danger",
    },
    retention_updated: {
      description:
        "The retention decision was recorded for this wedding file vault.",
      title: "Retention updated",
      tone: "success",
    },
    retention_update_failed: {
      description:
        "The retention decision could not be saved. Check the action, date, and reason before trying again.",
      title: "Retention was not updated",
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

function buildFilesHref(
  projectId: string,
  filters: {
    category?: string;
    latestOnly?: boolean;
  },
) {
  const search = new URLSearchParams();

  if (filters.category) {
    search.set("category", filters.category);
  }

  if (filters.latestOnly === false) {
    search.set("latestOnly", "false");
  }

  const query = search.toString();
  const path = `/platform/projects/${projectId}/files`;

  return query ? `${path}?${query}` : path;
}

export default async function ProjectFilesPage({
  params,
  searchParams,
}: PageProps) {
  const authContext = await getAuthContext();
  const { projectId } = await params;
  const filters = await searchParams;

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath(`/platform/projects/${projectId}/files`));
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
              <BreadcrumbPage>Wedding file vault</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Card>
          <CardHeader>
            <CardTitle>
              <h1>Wedding file vault is unavailable</h1>
            </CardTitle>
            <CardDescription>
              Project documents will appear here after the workspace connection
              is ready.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <LockKeyholeIcon aria-hidden="true" />
              <AlertTitle>Connection required</AlertTitle>
              <AlertDescription>
                This page is secure by default. Ask a Diginoces administrator to
                finish the workspace connection before opening file records.
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
      await redirectToMfaIfStepUpRequired(
        context,
        `/platform/projects/${projectId}/files`,
        [
          {
            permission: "files.read",
            scope: "project",
            scopeId: projectId,
          },
          {
            permission: "files.download",
            scope: "project",
            scopeId: projectId,
          },
        ],
      );
      notFound();
    }

    throw error;
  }

  const category = isSupportedCategory(filters.category);
  const [projectDetails, capabilities, categories, files, policies, events] =
    await Promise.all([
      getProjectDetails(supabase, projectId),
      getProjectFileCapabilities(context, projectId),
      listFileCategories(supabase),
      listProjectFiles(supabase, projectId, {
        category,
        latestOnly: filters.latestOnly !== "false",
      }),
      listProjectRetentionPolicies(supabase, projectId),
      listProjectArchiveEvents(supabase, projectId),
    ]);

  if (!projectDetails) {
    notFound();
  }

  const retentionPolicy = policies[0] ?? null;
  const projectReference = formatProjectDisplayReference(
    projectDetails.project,
    0,
  );
  const projectName = formatProjectCoupleDisplayName(projectDetails.project, 0);
  const notice = fileStatusNotice(filters.fileStatus);
  const activeFiles = files.filter((file) => file.status === "active").length;
  const archivedFiles = files.filter(
    (file) => file.status === "archived",
  ).length;
  const latestOnly = filters.latestOnly !== "false";
  const versionToggleHref = buildFilesHref(projectId, {
    category,
    latestOnly: latestOnly ? false : true,
  });

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
            <BreadcrumbPage>Files</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader>
          <CardTitle>
            <h1>Wedding file vault</h1>
          </CardTitle>
          <CardDescription>
            Register, classify, and retain contracts, invitations, exports, and
            reports for this wedding. Each record keeps visibility, version, and
            archive context in one place.
          </CardDescription>
          <CardAction>
            <div className="flex flex-wrap gap-2">
              <Link
                aria-label={
                  latestOnly
                    ? `Show every file version for ${projectName}`
                    : `Show only current file versions for ${projectName}`
                }
                className={buttonVariants({ variant: "outline" })}
                href={versionToggleHref}
              >
                {latestOnly ? "Show all versions" : "Show current only"}
              </Link>
              <Link
                aria-label={`Back to project overview for ${projectName}`}
                className={buttonVariants({ variant: "outline" })}
                href={`/platform/projects/${projectId}`}
              >
                <ArrowLeftIcon aria-hidden="true" data-icon="inline-start" />
                Project overview
              </Link>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant="secondary">Protected records</Badge>
          <Badge variant="outline">{projectName}</Badge>
          <Badge variant="outline">{pluralize(files.length, "file")}</Badge>
          <Badge variant="outline">
            {latestOnly ? "Current versions" : "All versions"}
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
              <CardTitle>File register</CardTitle>
              <CardDescription>
                Search the protected record set for this wedding. Open a file to
                review versions, downloads, and archive decisions.
              </CardDescription>
              <CardAction>
                <Badge variant="outline">
                  {pluralize(files.length, "file")}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                <Link
                  aria-label={`Show all files for ${projectName}`}
                  className={buttonVariants({
                    size: "sm",
                    variant: category ? "outline" : "default",
                  })}
                  href={buildFilesHref(projectId, {
                    latestOnly,
                  })}
                >
                  All records
                </Link>
                {categories.map((entry) => {
                  const active = category === entry.slug;

                  return (
                    <Link
                      aria-label={`Show ${entry.name} files for ${projectName}`}
                      className={buttonVariants({
                        size: "sm",
                        variant: active ? "default" : "outline",
                      })}
                      href={buildFilesHref(projectId, {
                        category: entry.slug,
                        latestOnly,
                      })}
                      key={entry.slug}
                    >
                      {entry.name}
                    </Link>
                  );
                })}
              </div>

              {files.length === 0 ? (
                <Empty className="border">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <FolderOpenIcon aria-hidden="true" />
                    </EmptyMedia>
                    <EmptyTitle>No files registered yet</EmptyTitle>
                    <EmptyDescription>
                      Start by registering the first contract, invitation asset,
                      export, or report that needs controlled access.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <>
                  <div className="grid gap-3 sm:hidden">
                    {files.map((file, index) => (
                      <div
                        className="flex flex-col gap-3 rounded-lg border bg-background p-3"
                        key={file.id}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <strong className="block text-sm font-medium text-pretty">
                              {fileDisplayName(file.filename, index)}
                            </strong>
                            <span className="text-xs text-muted-foreground">
                              {formatLabel(file.mime_type)} -{" "}
                              {file.is_latest
                                ? "Current version"
                                : "Previous version"}
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
                        <Link
                          aria-label={`Open ${fileDisplayName(
                            file.filename,
                            index,
                          )} in ${projectName}`}
                          className={buttonVariants({
                            size: "sm",
                            variant: "outline",
                          })}
                          href={`/platform/projects/${projectId}/files/${file.id}`}
                        >
                          Open record
                        </Link>
                      </div>
                    ))}
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
                        {files.map((file, index) => (
                          <TableRow key={file.id}>
                            <TableCell className="min-w-64 whitespace-normal">
                              <div className="flex flex-col gap-1">
                                <strong className="text-sm font-medium">
                                  {fileDisplayName(file.filename, index)}
                                </strong>
                                <span className="text-xs text-muted-foreground">
                                  {formatLabel(file.mime_type)} -{" "}
                                  {file.is_latest
                                    ? "Current version"
                                    : "Previous version"}
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
                            <TableCell>v{file.version}</TableCell>
                            <TableCell className="text-right">
                              <Link
                                aria-label={`Open ${fileDisplayName(
                                  file.filename,
                                  index,
                                )} in ${projectName}`}
                                className={buttonVariants({
                                  size: "sm",
                                  variant: "outline",
                                })}
                                href={`/platform/projects/${projectId}/files/${file.id}`}
                              >
                                Open
                              </Link>
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

          {capabilities.canRegister ? (
            <Card>
              <CardHeader>
                <CardTitle>Register a protected file</CardTitle>
                <CardDescription>
                  Add the file metadata the team needs before anyone opens or
                  shares it. Visibility and event scope are saved with the
                  record.
                </CardDescription>
              </CardHeader>
              <form action={registerProjectFileAction.bind(null, projectId)}>
                <CardContent>
                  <FieldSet>
                    <FieldLegend>File details</FieldLegend>
                    <FieldGroup>
                      <Field>
                        <FieldLabel htmlFor="file-upload">
                          Select file
                        </FieldLabel>
                        <Input id="file-upload" name="file" type="file" />
                        <FieldDescription>
                          Choose a file when it is ready, or save the record
                          details now and attach the file later.
                        </FieldDescription>
                      </Field>

                      <div className="grid gap-5 md:grid-cols-2">
                        <Field>
                          <FieldLabel htmlFor="file-category">
                            Category
                          </FieldLabel>
                          <NativeSelect
                            className="w-full"
                            id="file-category"
                            name="category"
                            required
                          >
                            {categories.map((entry) => (
                              <NativeSelectOption
                                key={entry.slug}
                                value={entry.slug}
                              >
                                {entry.name}
                              </NativeSelectOption>
                            ))}
                          </NativeSelect>
                        </Field>

                        <Field>
                          <FieldLabel htmlFor="file-visibility">
                            Visibility
                          </FieldLabel>
                          <NativeSelect
                            className="w-full"
                            id="file-visibility"
                            name="visibility"
                            required
                          >
                            <NativeSelectOption value="internal">
                              Team only
                            </NativeSelectOption>
                            <NativeSelectOption value="couple_visible">
                              Couple visible
                            </NativeSelectOption>
                            <NativeSelectOption value="partner_visible">
                              Partner visible
                            </NativeSelectOption>
                            <NativeSelectOption value="guest_visible">
                              Guest visible
                            </NativeSelectOption>
                          </NativeSelect>
                        </Field>
                      </div>

                      <Field>
                        <FieldLabel htmlFor="file-event">
                          Where this file belongs
                        </FieldLabel>
                        <NativeSelect
                          className="w-full"
                          id="file-event"
                          name="eventId"
                        >
                          <NativeSelectOption value="">
                            Whole project
                          </NativeSelectOption>
                          {projectDetails.events.map((event, eventIndex) => (
                            <NativeSelectOption key={event.id} value={event.id}>
                              {formatProjectEventDisplayName(event, eventIndex)}
                            </NativeSelectOption>
                          ))}
                        </NativeSelect>
                      </Field>

                      <div className="grid gap-5 md:grid-cols-3">
                        <Field>
                          <FieldLabel htmlFor="filename">File name</FieldLabel>
                          <Input
                            id="filename"
                            name="filename"
                            placeholder="invitation-proof.pdf"
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="mimeType">
                            File format
                          </FieldLabel>
                          <Input
                            id="mimeType"
                            name="mimeType"
                            placeholder="application/pdf"
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
                      </div>
                    </FieldGroup>
                  </FieldSet>
                </CardContent>
                <CardFooter className="justify-end">
                  <button
                    aria-label={`Register file details for ${projectName}`}
                    className={buttonVariants()}
                    type="submit"
                  >
                    <UploadIcon aria-hidden="true" data-icon="inline-start" />
                    Register file
                  </button>
                </CardFooter>
              </form>
            </Card>
          ) : (
            <Alert>
              <LockKeyholeIcon aria-hidden="true" />
              <AlertTitle>Read-only file access</AlertTitle>
              <AlertDescription>
                You can review registered files, but your role cannot add file
                records to this wedding.
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Archive trail</CardTitle>
              <CardDescription>
                Lifecycle decisions recorded for this wedding file vault.
              </CardDescription>
              <CardAction>
                <Badge variant="outline">
                  {pluralize(events.length, "record")}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <Empty className="border">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <HistoryIcon aria-hidden="true" />
                    </EmptyMedia>
                    <EmptyTitle>No retention history yet</EmptyTitle>
                    <EmptyDescription>
                      Archive and cleanup decisions will appear after a
                      lifecycle action is recorded.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <>
                  <div className="grid gap-3 sm:hidden">
                    {events.map((event) => (
                      <div
                        className="flex flex-col gap-3 rounded-lg border bg-background p-3"
                        key={event.id}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <Badge variant="secondary">
                            {formatLabel(event.action)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(event.created_at)}
                          </span>
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
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {events.map((event) => (
                          <TableRow key={event.id}>
                            <TableCell>
                              <Badge variant="secondary">
                                {formatLabel(event.action)}
                              </Badge>
                            </TableCell>
                            <TableCell className="min-w-80 whitespace-normal">
                              {event.reason}
                            </TableCell>
                            <TableCell>
                              {formatDate(event.created_at)}
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

        <aside className="flex min-w-0 flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Vault snapshot</CardTitle>
              <CardDescription>
                What is live in this wedding right now.
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
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Active files</span>
                <Badge>{activeFiles}</Badge>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Archived files</span>
                <Badge variant="secondary">{archivedFiles}</Badge>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Showing</span>
                <Badge variant="outline">
                  {latestOnly ? "Current only" : "All versions"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lifecycle rules</CardTitle>
              <CardDescription>
                Retention dates and archive obligations for this wedding.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <ArchiveIcon
                  aria-hidden="true"
                  className="mt-0.5 text-muted-foreground"
                />
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    Project retention status
                  </span>
                  <strong className="text-sm font-medium">
                    {formatLabel(
                      retentionPolicy?.status ??
                        projectDetails.project.status ??
                        "active",
                    )}
                  </strong>
                </div>
              </div>
              <Separator />
              <div className="grid gap-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">
                    Retention starts
                  </span>
                  <strong className="font-medium">
                    {formatDate(retentionPolicy?.retention_start_at)}
                  </strong>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Retention ends</span>
                  <strong className="font-medium">
                    {formatDate(retentionPolicy?.retention_end_at)}
                  </strong>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Notice status</span>
                  <strong className="font-medium">
                    {formatLabel(
                      retentionPolicy?.notice_status ?? "not_required",
                    )}
                  </strong>
                </div>
              </div>
            </CardContent>
          </Card>

          {capabilities.canManageRetention ? (
            <Card>
              <CardHeader>
                <CardTitle>Record lifecycle decision</CardTitle>
                <CardDescription>
                  Record a lifecycle decision with an audit-friendly reason.
                </CardDescription>
              </CardHeader>
              <form
                action={updateProjectArchiveLifecycleAction.bind(
                  null,
                  projectId,
                )}
              >
                <CardContent>
                  <FieldSet>
                    <FieldLegend>Retention decision</FieldLegend>
                    <FieldGroup>
                      <RetentionActionFields />
                      <Field>
                        <FieldLabel htmlFor="retention-reason">
                          Reason
                        </FieldLabel>
                        <Textarea
                          id="retention-reason"
                          name="reason"
                          required
                          rows={3}
                        />
                        <FieldDescription>
                          Explain why this retention action is being recorded.
                        </FieldDescription>
                      </Field>
                    </FieldGroup>
                  </FieldSet>
                </CardContent>
                <CardFooter className="justify-end">
                  <button
                    aria-label={`Update the retention schedule for ${projectName}`}
                    className={buttonVariants()}
                    type="submit"
                  >
                    <ShieldCheckIcon
                      aria-hidden="true"
                      data-icon="inline-start"
                    />
                    Save decision
                  </button>
                </CardFooter>
              </form>
            </Card>
          ) : (
            <Alert>
              <ShieldCheckIcon aria-hidden="true" />
              <AlertTitle>Retention controls are protected</AlertTitle>
              <AlertDescription>
                You can review retention state, but only authorized Diginoces
                roles can update archive lifecycle decisions.
              </AlertDescription>
            </Alert>
          )}

          <Alert>
            <FileTextIcon aria-hidden="true" />
            <AlertTitle>Visibility changes access</AlertTitle>
            <AlertDescription>
              A file can become visible to couples, partners, or guests only
              after its visibility is changed. Keep sensitive records team-only
              until they are ready to share.
            </AlertDescription>
          </Alert>
        </aside>
      </section>
    </main>
  );
}
