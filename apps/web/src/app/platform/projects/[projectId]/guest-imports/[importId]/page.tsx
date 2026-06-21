import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  ClipboardCheckIcon,
  FileSpreadsheetIcon,
  ListChecksIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
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
  EmptyContent,
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
  getGuestImportActionCapabilities,
  requireGuestImportReadPermission,
} from "@/lib/guest-imports/guest-import-api";
import {
  getGuestImportDetails,
  getImportRowDisplayName,
  isReviewableStoredRow,
  summarizeStoredImportRows,
  type GuestImportRowRow,
} from "@/lib/guest-imports/guest-import-db";
import { ProjectAccessError } from "@/lib/projects/project-api";
import {
  formatProjectCoupleDisplayName,
  formatProjectDisplayReference,
  isInternalProjectDisplayText,
} from "@/lib/projects/project-foundation";
import { getProjectDetails } from "@/lib/projects/project-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  applyGuestImportRowsAction,
  submitGuestImportAction,
} from "../actions";

export const dynamic = "force-dynamic";

type GuestImportDetailPageProps = {
  params: Promise<{
    importId: string;
    projectId: string;
  }>;
};

function formatStatus(status: string) {
  const statusLabels: Record<string, string> = {
    applied: "Added to guest list",
    approved: "Approved",
    blocked: "Needs correction",
    blocking: "Blocks import",
    clear: "No duplicate warning",
    draft: "Draft",
    held: "Held for clarification",
    mapping_required: "Needs column matching",
    partially_approved: "Partly approved",
    pending: "Pending review",
    previewed: "Preview ready",
    ready_for_review: "Ready for review",
    rejected: "Rejected",
    submitted: "Submitted for review",
    valid: "Ready",
    validating: "Checking rows",
    validation_failed: "Needs correction",
    warning: "Needs review",
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

function formatReviewSummary(summary: {
  approvedRows: number;
  blockedRows: number;
  heldRows: number;
  rejectedRows: number;
  warningRows: number;
}) {
  return [
    pluralize(summary.approvedRows, "approved row"),
    pluralize(summary.rejectedRows, "rejected row"),
    pluralize(summary.heldRows, "held row"),
    pluralize(summary.blockedRows, "blocked row"),
    pluralize(summary.warningRows, "row with warnings", "rows with warnings"),
  ].join(", ");
}

function jsonArrayCount(value: unknown) {
  return Array.isArray(value) ? value.length : 0;
}

function jsonObjectCount(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? Object.keys(value).length
    : 0;
}

function getStatusBadgeVariant(status: string) {
  if (
    status === "applied" ||
    status === "approved" ||
    status === "clear" ||
    status === "valid"
  ) {
    return "default" as const;
  }

  if (
    status === "blocked" ||
    status === "blocking" ||
    status === "rejected" ||
    status === "validation_failed"
  ) {
    return "destructive" as const;
  }

  if (status === "held" || status === "mapping_required") {
    return "outline" as const;
  }

  return "secondary" as const;
}

function formatImportRowDisplayName(row: GuestImportRowRow) {
  const displayName = getImportRowDisplayName(row);

  return isInternalProjectDisplayText(displayName)
    ? `Import row ${row.row_number}`
    : displayName;
}

export default async function GuestImportDetailPage({
  params,
}: GuestImportDetailPageProps) {
  const authContext = await getAuthContext();
  const { importId, projectId } = await params;

  if (authContext.status === "anonymous") {
    redirect(
      buildLoginRedirectPath(
        `/platform/projects/${projectId}/guest-imports/${importId}`,
      ),
    );
  }

  if (authContext.status === "not_configured") {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2">
          <Badge variant="outline" className="w-fit">
            CSV import
          </Badge>
          <h1 className="text-2xl font-semibold tracking-normal text-balance">
            Import session
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground text-pretty">
            Parsed rows, review decisions, and apply controls will appear here
            after this environment is connected to Diginoces access services.
          </p>
        </div>
        <Alert>
          <FileSpreadsheetIcon data-icon="inline-start" />
          <AlertTitle>Access setup needed</AlertTitle>
          <AlertDescription>
            Supabase is not configured for this environment, so this import
            session cannot be loaded yet.
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

  const [details, projectDetails] = await Promise.all([
    getGuestImportDetails(supabase, projectId, importId),
    getProjectDetails(supabase, projectId),
  ]);

  if (!details || !projectDetails) {
    notFound();
  }

  const capabilities = await getGuestImportActionCapabilities(
    context,
    projectId,
    details.session.import_side,
    details.session.uploaded_by,
  );
  const summary = summarizeStoredImportRows(details.rows);
  const canSubmit =
    capabilities.canSubmit &&
    (details.session.status === "previewed" ||
      details.session.status === "validation_failed") &&
    details.rows.some(isReviewableStoredRow);
  const canApply =
    capabilities.canApply &&
    (details.session.status === "approved" ||
      details.session.status === "partially_approved") &&
    details.rows.some((row) => row.approval_status === "approved");
  const submitAction = submitGuestImportAction.bind(null, projectId, importId);
  const applyAction = applyGuestImportRowsAction.bind(
    null,
    projectId,
    importId,
  );
  const projectReference = formatProjectDisplayReference(
    projectDetails.project,
    0,
  );
  const projectName = formatProjectCoupleDisplayName(projectDetails.project, 0);
  const importContext = `${formatSide(details.session.import_side)} CSV import for ${projectName}`;
  const reviewSummaryText = formatReviewSummary(summary);
  const sourceColumnCount = details.mapping
    ? jsonArrayCount(details.mapping.source_headers)
    : 0;
  const mappedColumnCount = details.mapping
    ? jsonObjectCount(details.mapping.target_mapping)
    : 0;
  const timeline = [
    {
      label: "Uploaded",
      value: formatDateTime(details.session.created_at),
    },
    details.session.submitted_at
      ? {
          label: "Submitted",
          value: formatDateTime(details.session.submitted_at),
        }
      : null,
    details.session.reviewed_at
      ? {
          label: "Reviewed",
          value: formatDateTime(details.session.reviewed_at),
        }
      : null,
    details.session.applied_at
      ? {
          label: "Applied",
          value: formatDateTime(details.session.applied_at),
        }
      : null,
  ].filter((item): item is { label: string; value: string } => Boolean(item));

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
            <BreadcrumbLink
              render={
                <Link href={`/platform/projects/${projectId}/guest-imports`} />
              }
            >
              Imports
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Import session</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              {projectReference.label}: {projectReference.value}
            </Badge>
            <Badge variant="secondary">
              {formatSide(details.session.import_side)}
            </Badge>
            <Badge variant={getStatusBadgeVariant(details.session.status)}>
              {formatStatus(details.session.status)}
            </Badge>
          </div>
          <CardTitle className="text-2xl font-semibold tracking-normal text-balance">
            <h1>Review imported guest rows</h1>
          </CardTitle>
          <CardDescription className="max-w-3xl text-pretty">
            Inspect the parsed CSV, confirm whether rows are ready for review,
            and add approved guests only when the session has passed review.
          </CardDescription>
          <CardAction className="flex flex-wrap gap-2">
            <Link
              aria-label={`Back to import history for ${projectName}`}
              className={buttonVariants({ variant: "outline" })}
              href={`/platform/projects/${projectId}/guest-imports`}
            >
              <ArrowLeftIcon data-icon="inline-start" />
              Import history
            </Link>
            {capabilities.canEditMapping ? (
              <Link
                aria-label={`Open column mapping for ${importContext}`}
                className={buttonVariants({ variant: "secondary" })}
                href={`/platform/projects/${projectId}/guest-imports/${importId}/mapping`}
              >
                <FileSpreadsheetIcon data-icon="inline-start" />
                Column mapping
              </Link>
            ) : null}
            {capabilities.canReview ? (
              <Link
                aria-label={`Review rows for ${importContext}`}
                className={buttonVariants()}
                href={`/platform/projects/${projectId}/guest-imports/${importId}/review`}
              >
                <ClipboardCheckIcon data-icon="inline-start" />
                Review rows
              </Link>
            ) : null}
          </CardAction>
        </CardHeader>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="flex min-w-0 flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListChecksIcon />
                Session state
              </CardTitle>
              <CardDescription>
                This is the current evidence for the CSV before any new guest
                records are created.
              </CardDescription>
            </CardHeader>
            <CardContent className="import-board">
              <dl className="import-board__grid">
                <div className="import-board__metric">
                  <dt className="import-board__metric-label">File</dt>
                  <dd className="import-board__metric-value">
                    {details.session.source_filename}
                  </dd>
                  <dd className="import-board__metric-note">
                    {details.session.source_file_type.toUpperCase()}
                  </dd>
                </div>
                <div className="import-board__metric">
                  <dt className="import-board__metric-label">Rows</dt>
                  <dd className="import-board__metric-value">
                    {pluralize(details.session.row_count, "row")}
                  </dd>
                  <dd className="import-board__metric-note">
                    {pluralize(details.session.valid_row_count, "ready row")} /{" "}
                    {pluralize(
                      details.session.invalid_row_count,
                      "blocked row",
                    )}
                  </dd>
                </div>
                <div className="import-board__metric">
                  <dt className="import-board__metric-label">Review</dt>
                  <dd className="import-board__metric-value">
                    {pluralize(summary.approvedRows, "approved row")}
                  </dd>
                  <dd className="import-board__metric-note">
                    {pluralize(summary.heldRows, "held row")} /{" "}
                    {pluralize(summary.rejectedRows, "rejected row")}
                  </dd>
                </div>
                <div className="import-board__metric">
                  <dt className="import-board__metric-label">
                    Guest list impact
                  </dt>
                  <dd className="import-board__metric-value">
                    {pluralize(details.session.created_guest_count, "guest")}
                  </dd>
                  <dd className="import-board__metric-note">
                    {pluralize(
                      details.session.duplicate_warning_count,
                      "duplicate warning",
                    )}
                  </dd>
                </div>
              </dl>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2">
              <Badge variant="outline">
                {pluralize(sourceColumnCount, "source column")}
              </Badge>
              <Badge variant="outline">
                {pluralize(mappedColumnCount, "mapped field")}
              </Badge>
              {timeline.map((item) => (
                <Badge key={item.label} variant="secondary">
                  {item.label}: {item.value}
                </Badge>
              ))}
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Parsed rows</CardTitle>
              <CardDescription>
                Names, validation state, review decision, and duplicate warning
                for each staged row.
              </CardDescription>
              <CardAction>
                <Badge variant="outline">
                  {pluralize(details.rows.length, "row")}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              {details.rows.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <FileSpreadsheetIcon />
                    </EmptyMedia>
                    <EmptyTitle>No parsed rows yet</EmptyTitle>
                    <EmptyDescription>
                      Return to column mapping if the CSV needs to be matched
                      and validated again.
                    </EmptyDescription>
                  </EmptyHeader>
                  {capabilities.canEditMapping ? (
                    <EmptyContent>
                      <Link
                        className={buttonVariants({ variant: "outline" })}
                        href={`/platform/projects/${projectId}/guest-imports/${importId}/mapping`}
                      >
                        <FileSpreadsheetIcon data-icon="inline-start" />
                        Open mapping
                      </Link>
                    </EmptyContent>
                  ) : null}
                </Empty>
              ) : (
                <div className="overflow-x-auto">
                  <Table aria-label={`Parsed rows for ${importContext}`}>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Row</TableHead>
                        <TableHead>Guest</TableHead>
                        <TableHead>Validation</TableHead>
                        <TableHead>Review</TableHead>
                        <TableHead>Duplicate check</TableHead>
                        <TableHead className="text-right">Alerts</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {details.rows.map((row) => {
                        const rowDisplayName = formatImportRowDisplayName(row);
                        const validationIssueCount = jsonArrayCount(
                          row.validation_errors,
                        );
                        const duplicateWarningCount = jsonArrayCount(
                          row.duplicate_warnings,
                        );

                        return (
                          <TableRow key={row.id}>
                            <TableCell className="font-mono text-xs">
                              {row.row_number}
                            </TableCell>
                            <TableCell>
                              <div className="flex min-w-44 flex-col gap-1">
                                <span className="font-medium">
                                  {rowDisplayName}
                                </span>
                                {row.linked_guest_id ? (
                                  <span className="text-xs text-muted-foreground">
                                    Added to guest list
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">
                                    Staged guest row
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={getStatusBadgeVariant(
                                  row.validation_status,
                                )}
                              >
                                {formatStatus(row.validation_status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={getStatusBadgeVariant(
                                  row.approval_status,
                                )}
                              >
                                {formatStatus(row.approval_status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={getStatusBadgeVariant(
                                  row.duplicate_severity,
                                )}
                              >
                                {formatStatus(row.duplicate_severity)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground">
                              {validationIssueCount} errors /{" "}
                              {duplicateWarningCount} warnings
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
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Next actions</CardTitle>
              <CardDescription>
                Move this import through review without adding unapproved rows.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <form action={submitAction}>
                <Button
                  aria-label={`Submit ${importContext} for review`}
                  className="w-full"
                  disabled={!canSubmit}
                  type="submit"
                >
                  <ShieldCheckIcon data-icon="inline-start" />
                  Submit for review
                </Button>
              </form>
              <form action={applyAction}>
                <Button
                  aria-label={`Apply approved rows from ${importContext}`}
                  className="w-full"
                  disabled={!canApply}
                  type="submit"
                  variant="secondary"
                >
                  <CheckCircle2Icon data-icon="inline-start" />
                  Apply approved rows
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2">
              <p className="text-sm text-muted-foreground">
                Review summary: {reviewSummaryText}.
              </p>
              <p className="text-sm text-muted-foreground">
                Submit is available after preview validation. Apply is available
                only when at least one row has been approved.
              </p>
            </CardFooter>
          </Card>

          <Alert>
            <TriangleAlertIcon data-icon="inline-start" />
            <AlertTitle>Import safety</AlertTitle>
            <AlertDescription>
              Bride and groom uploads remain staged until an authorized reviewer
              approves rows. Rejected or held rows stay out of the guest list.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Related work</CardTitle>
              <CardDescription>
                Continue with the guest list or the review workspace for this
                import.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Link
                className={buttonVariants({ variant: "outline" })}
                href={`/platform/projects/${projectId}/guests`}
              >
                Guest list
              </Link>
              <Link
                className={buttonVariants({ variant: "ghost" })}
                href={`/platform/projects/${projectId}/guest-imports`}
              >
                Import history
              </Link>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}
