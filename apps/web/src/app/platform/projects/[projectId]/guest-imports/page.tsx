import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  FileSpreadsheetIcon,
  PlusIcon,
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
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
  requireAnyGuestImportCreatePermission,
  requireGuestImportReadPermission,
} from "@/lib/guest-imports/guest-import-api";
import { listGuestImportSessions } from "@/lib/guest-imports/guest-import-db";
import { ProjectAccessError } from "@/lib/projects/project-api";
import {
  formatProjectCoupleDisplayName,
  formatProjectDisplayReference,
} from "@/lib/projects/project-foundation";
import { getProjectDetails } from "@/lib/projects/project-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type GuestImportsPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

function formatStatus(status: string) {
  const statusLabels: Record<string, string> = {
    applied: "Added to guest list",
    draft: "Draft",
    mapping_required: "Needs column matching",
    partially_approved: "Partly approved",
    ready_for_review: "Ready for review",
    rejected: "Rejected",
    submitted: "Submitted for review",
    validating: "Checking rows",
  };

  return (
    statusLabels[status] ??
    status
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

function formatSide(side: string) {
  if (side === "both") {
    return "Both sides";
  }

  return side === "bride" ? "Bride side" : "Groom side";
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function formatDateTime(value: string, locale?: string | null) {
  return new Intl.DateTimeFormat(locale ?? "en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatImportRowSummary(session: {
  invalid_row_count: number;
  row_count: number;
  valid_row_count: number;
}) {
  return {
    blocked: pluralize(session.invalid_row_count, "blocked row"),
    total: pluralize(session.row_count, "row"),
    valid: pluralize(session.valid_row_count, "valid row"),
  };
}

function getStatusBadgeVariant(status: string) {
  if (status === "applied") {
    return "default" as const;
  }

  if (status === "rejected") {
    return "destructive" as const;
  }

  return "secondary" as const;
}

export default async function GuestImportsPage({
  params,
}: GuestImportsPageProps) {
  const authContext = await getAuthContext();
  const { projectId } = await params;

  if (authContext.status === "anonymous") {
    redirect(
      buildLoginRedirectPath(`/platform/projects/${projectId}/guest-imports`),
    );
  }

  if (authContext.status === "not_configured") {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2">
          <Badge variant="outline" className="w-fit">
            CSV imports
          </Badge>
          <h1 className="text-2xl font-semibold tracking-normal text-balance">
            Guest import history
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground text-pretty">
            Uploaded guest lists will appear here after this environment is
            connected to Diginoces access services.
          </p>
        </div>
        <Alert>
          <UploadIcon data-icon="inline-start" />
          <AlertTitle>Access setup needed</AlertTitle>
          <AlertDescription>
            Supabase is not configured for this environment, so import history
            cannot be loaded yet.
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  const supabase = await createSupabaseServerClient();
  const context = { supabase, user: authContext.user };
  try {
    await requireGuestImportReadPermission(context, projectId);
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      notFound();
    }

    throw error;
  }

  let canUpload = false;
  try {
    await requireAnyGuestImportCreatePermission(context, projectId);
    canUpload = true;
  } catch (error) {
    if (!(error instanceof ProjectAccessError)) {
      throw error;
    }
  }

  const [projectDetails, sessions] = await Promise.all([
    getProjectDetails(supabase, projectId),
    listGuestImportSessions(supabase, projectId),
  ]);

  if (!projectDetails) {
    redirect("/platform/projects");
  }

  const totalRows = sessions.reduce(
    (sum, session) => sum + session.row_count,
    0,
  );
  const validRows = sessions.reduce(
    (sum, session) => sum + session.valid_row_count,
    0,
  );
  const blockedRows = sessions.reduce(
    (sum, session) => sum + session.invalid_row_count,
    0,
  );
  const reviewSessions = sessions.filter(
    (session) =>
      session.status === "ready_for_review" ||
      session.status === "partially_approved",
  ).length;
  const projectName = formatProjectCoupleDisplayName(projectDetails.project, 0);
  const projectReference = formatProjectDisplayReference(
    projectDetails.project,
    0,
  );

  return (
    <main className="flex w-full flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
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
              {projectName}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              render={<Link href={`/platform/projects/${projectId}/guests`} />}
            >
              Guest list
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Imports</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              {projectReference.label}: {projectReference.value}
            </Badge>
            <Badge variant="secondary">CSV only</Badge>
            <Badge variant={reviewSessions > 0 ? "secondary" : "default"}>
              {reviewSessions > 0
                ? pluralize(reviewSessions, "review item")
                : "No review queue"}
            </Badge>
          </div>
          <CardTitle className="text-2xl font-semibold tracking-normal text-balance">
            <h1>Guest imports</h1>
          </CardTitle>
          <CardDescription className="max-w-3xl text-pretty">
            Bring spreadsheet guest lists into the project, validate rows,
            review decisions, and add only approved guests to the active list.
          </CardDescription>
          <CardAction className="flex flex-wrap gap-2">
            <Link
              aria-label={`Back to guest list for ${projectName}`}
              className={buttonVariants({ variant: "outline" })}
              href={`/platform/projects/${projectId}/guests`}
            >
              <ArrowLeftIcon data-icon="inline-start" />
              Guest list
            </Link>
            {canUpload ? (
              <Link
                aria-label={`Upload a CSV guest list for ${projectName}`}
                className={buttonVariants()}
                href={`/platform/projects/${projectId}/guest-imports/new`}
              >
                <PlusIcon data-icon="inline-start" />
                Upload CSV
              </Link>
            ) : null}
          </CardAction>
        </CardHeader>
      </Card>

      <section
        className="grid gap-4 lg:grid-cols-4"
        aria-label="Import summary"
      >
        {[
          {
            icon: FileSpreadsheetIcon,
            label: "Imports",
            value: sessions.length,
            description: "Uploaded lists kept for review history.",
          },
          {
            icon: CheckCircle2Icon,
            label: "Valid rows",
            value: validRows,
            description: "Rows ready for review or approval.",
          },
          {
            icon: TriangleAlertIcon,
            label: "Blocked rows",
            value: blockedRows,
            description: "Rows that need correction before use.",
          },
          {
            icon: UploadIcon,
            label: "Total rows",
            value: totalRows,
            description: "Rows read from uploaded CSV files.",
          },
        ].map((item) => (
          <Card key={item.label}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <item.icon data-icon="inline-start" />
                {item.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-normal">
                {item.value}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Card>
          <CardHeader>
            <CardTitle>Import history</CardTitle>
            <CardDescription>
              Open an import to confirm mapping, review rows, or apply approved
              guests.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>No imports yet</EmptyTitle>
                  <EmptyDescription>
                    Upload a CSV when you are ready to review guests from a
                    spreadsheet.
                  </EmptyDescription>
                </EmptyHeader>
                {canUpload ? (
                  <EmptyContent>
                    <Link
                      className={buttonVariants()}
                      href={`/platform/projects/${projectId}/guest-imports/new`}
                    >
                      <PlusIcon data-icon="inline-start" />
                      Upload CSV
                    </Link>
                  </EmptyContent>
                ) : null}
              </Empty>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Import</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Side</TableHead>
                      <TableHead className="text-right">Rows</TableHead>
                      <TableHead className="text-right">Ready</TableHead>
                      <TableHead className="text-right">Blocked</TableHead>
                      <TableHead className="text-right">Added</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((session, index) => {
                      const rowSummary = formatImportRowSummary(session);
                      const importName = `CSV import ${sessions.length - index}`;

                      return (
                        <TableRow key={session.id}>
                          <TableCell>
                            <div className="flex min-w-56 flex-col gap-1">
                              <span className="font-medium">{importName}</span>
                              <span className="text-sm text-muted-foreground">
                                {session.source_filename}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Uploaded{" "}
                                {formatDateTime(
                                  session.created_at,
                                  projectDetails.project.preferred_language,
                                )}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={getStatusBadgeVariant(session.status)}
                            >
                              {formatStatus(session.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatSide(session.import_side)}
                          </TableCell>
                          <TableCell
                            aria-label={`Rows: ${rowSummary.total}`}
                            className="text-right font-medium"
                          >
                            {session.row_count}
                          </TableCell>
                          <TableCell
                            aria-label={`Ready: ${rowSummary.valid}`}
                            className="text-right"
                          >
                            {session.valid_row_count}
                          </TableCell>
                          <TableCell
                            aria-label={`Blocked: ${rowSummary.blocked}`}
                            className="text-right"
                          >
                            {session.invalid_row_count}
                          </TableCell>
                          <TableCell className="text-right">
                            {session.created_guest_count}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link
                              aria-label={`Open ${importName}: ${formatStatus(
                                session.status,
                              )}, ${rowSummary.total}, ${formatSide(
                                session.import_side,
                              )}`}
                              className={buttonVariants({
                                size: "sm",
                                variant: "outline",
                              })}
                              href={`/platform/projects/${projectId}/guest-imports/${session.id}`}
                            >
                              Open
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <aside className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Workflow rules</CardTitle>
              <CardDescription>
                Guest import remains controlled before guests are added.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-3 text-sm">
                <li className="flex gap-3">
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileSpreadsheetIcon data-icon="inline-start" />
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="font-medium">CSV only</span>
                    <span className="text-muted-foreground">
                      Uploaded files are parsed into review rows; source files
                      are not persisted here.
                    </span>
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <ShieldCheckIcon data-icon="inline-start" />
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="font-medium">Review before apply</span>
                    <span className="text-muted-foreground">
                      Rows must pass validation and approval before guests are
                      created.
                    </span>
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {!canUpload ? (
            <Alert>
              <ShieldCheckIcon data-icon="inline-start" />
              <AlertTitle>Upload access limited</AlertTitle>
              <AlertDescription>
                You can read import history, but your current role cannot start
                a new guest import for this project.
              </AlertDescription>
            </Alert>
          ) : null}
        </aside>
      </section>
    </main>
  );
}
