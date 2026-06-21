import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeftIcon,
  ClipboardCheckIcon,
  FileSpreadsheetIcon,
  ListChecksIcon,
  SaveIcon,
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
import { requireGuestImportReviewPermission } from "@/lib/guest-imports/guest-import-api";
import {
  getGuestImportDetails,
  getImportRowDisplayName,
  isReviewableStoredRow,
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
import { reviewGuestImportRowsAction } from "../../actions";

export const dynamic = "force-dynamic";

type GuestImportReviewPageProps = {
  params: Promise<{
    importId: string;
    projectId: string;
  }>;
};

const reviewStatuses = ["approved", "rejected", "held"] as const;

function formatStatus(status: string) {
  const statusLabels: Record<string, string> = {
    applied: "Added to guest list",
    approved: "Approve",
    blocked: "Needs correction",
    blocking: "Blocks import",
    clear: "No duplicate warning",
    draft: "Draft",
    held: "Hold",
    mapping_required: "Needs column matching",
    partially_approved: "Partly approved",
    pending: "Pending review",
    previewed: "Preview ready",
    ready_for_review: "Ready for review",
    rejected: "Reject",
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

function defaultReviewStatus(status: string) {
  if (status === "approved" || status === "rejected" || status === "held") {
    return status;
  }

  return "held";
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function formatSide(side: string) {
  if (side === "both") {
    return "Both sides";
  }

  return side === "bride" ? "Bride side" : "Groom side";
}

function jsonArrayCount(value: unknown) {
  return Array.isArray(value) ? value.length : 0;
}

function getStatusBadgeVariant(status: string) {
  if (
    status === "approved" ||
    status === "applied" ||
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

export default async function GuestImportReviewPage({
  params,
}: GuestImportReviewPageProps) {
  const authContext = await getAuthContext();
  const { importId, projectId } = await params;

  if (authContext.status === "anonymous") {
    redirect(
      buildLoginRedirectPath(
        `/platform/projects/${projectId}/guest-imports/${importId}/review`,
      ),
    );
  }

  if (authContext.status === "not_configured") {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2">
          <Badge variant="outline" className="w-fit">
            Import review
          </Badge>
          <h1 className="text-2xl font-semibold tracking-normal text-balance">
            Review imported rows
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground text-pretty">
            Row approval controls will be available after this environment is
            connected to Diginoces access services.
          </p>
        </div>
        <Alert>
          <ClipboardCheckIcon data-icon="inline-start" />
          <AlertTitle>Access setup needed</AlertTitle>
          <AlertDescription>
            Supabase is not configured for this environment, so import review
            decisions cannot be saved yet.
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  const supabase = await createSupabaseServerClient();
  const context = { supabase, user: authContext.user };

  try {
    await requireGuestImportReviewPermission(context, projectId);
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

  const action = reviewGuestImportRowsAction.bind(null, projectId, importId);
  const projectReference = formatProjectDisplayReference(
    projectDetails.project,
    0,
  );
  const projectName = formatProjectCoupleDisplayName(projectDetails.project, 0);
  const importContext = `${formatSide(details.session.import_side)} CSV import for ${projectName}`;
  const reviewableRows = details.rows.filter(isReviewableStoredRow);
  const blockedRows = details.rows.filter((row) => !isReviewableStoredRow(row));
  const approvedRows = details.rows.filter(
    (row) => row.approval_status === "approved",
  ).length;
  const rejectedRows = details.rows.filter(
    (row) => row.approval_status === "rejected",
  ).length;
  const heldRows = details.rows.filter(
    (row) => row.approval_status === "held",
  ).length;

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
            <BreadcrumbLink
              render={
                <Link
                  href={`/platform/projects/${projectId}/guest-imports/${importId}`}
                />
              }
            >
              Import session
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Review rows</BreadcrumbPage>
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
            <h1>Decide which imported rows can be used</h1>
          </CardTitle>
          <CardDescription className="max-w-3xl text-pretty">
            Approve rows that can become guests, reject rows that should not be
            used, or hold rows that need clarification from the couple or team.
          </CardDescription>
          <CardAction className="flex flex-wrap gap-2">
            <Link
              aria-label={`Back to import detail for ${importContext}`}
              className={buttonVariants({ variant: "outline" })}
              href={`/platform/projects/${projectId}/guest-imports/${importId}`}
            >
              <ArrowLeftIcon data-icon="inline-start" />
              Import session
            </Link>
            <Link
              aria-label={`Back to import history for ${projectName}`}
              className={buttonVariants({ variant: "ghost" })}
              href={`/platform/projects/${projectId}/guest-imports`}
            >
              Import history
            </Link>
          </CardAction>
        </CardHeader>
      </Card>

      <form
        action={action}
        className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_23rem]"
      >
        <div className="flex min-w-0 flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListChecksIcon />
                Row decisions
              </CardTitle>
              <CardDescription>
                Validation and duplicate status stay visible while each
                reviewable row receives a decision.
              </CardDescription>
              <CardAction>
                <Badge variant="outline">
                  {pluralize(reviewableRows.length, "reviewable row")}
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
                    <EmptyTitle>No rows to review</EmptyTitle>
                    <EmptyDescription>
                      Validate the CSV preview before opening review decisions.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="overflow-x-auto">
                  <Table aria-label={`Rows to review for ${importContext}`}>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Row</TableHead>
                        <TableHead>Guest</TableHead>
                        <TableHead>Validation</TableHead>
                        <TableHead>Duplicate check</TableHead>
                        <TableHead>Decision</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {details.rows.map((row) => {
                        const reviewable = isReviewableStoredRow(row);
                        const currentStatus = defaultReviewStatus(
                          row.approval_status,
                        );
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
                              <div className="flex min-w-48 flex-col gap-1">
                                <span className="font-medium">
                                  {rowDisplayName}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {validationIssueCount} errors /{" "}
                                  {duplicateWarningCount} warnings
                                </span>
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
                                  row.duplicate_severity,
                                )}
                              >
                                {formatStatus(row.duplicate_severity)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {reviewable ? (
                                <FieldSet>
                                  <FieldLegend className="sr-only">
                                    Decision for row {row.row_number}:{" "}
                                    {rowDisplayName}
                                  </FieldLegend>
                                  <input
                                    name="rowIds"
                                    type="hidden"
                                    value={row.id}
                                  />
                                  <FieldGroup className="flex-row flex-wrap gap-2">
                                    {reviewStatuses.map((status) => (
                                      <Field
                                        className="w-auto flex-row items-center rounded-lg border px-2 py-1"
                                        key={status}
                                      >
                                        <input
                                          aria-label={`${formatStatus(status)} row ${row.row_number}: ${rowDisplayName}`}
                                          className="accent-primary"
                                          defaultChecked={
                                            currentStatus === status
                                          }
                                          id={`${row.id}-${status}`}
                                          name={`rowStatus:${row.id}`}
                                          type="radio"
                                          value={status}
                                        />
                                        <FieldLabel
                                          className="font-normal"
                                          htmlFor={`${row.id}-${status}`}
                                        >
                                          {formatStatus(status)}
                                        </FieldLabel>
                                      </Field>
                                    ))}
                                  </FieldGroup>
                                </FieldSet>
                              ) : (
                                <Badge
                                  variant={getStatusBadgeVariant(
                                    row.approval_status,
                                  )}
                                >
                                  {formatStatus(row.approval_status)}
                                </Badge>
                              )}
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

          <Card>
            <CardHeader>
              <CardTitle>Review notes</CardTitle>
              <CardDescription>
                Add context for the team before saving these row decisions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="reviewNotes">Notes</FieldLabel>
                  <Textarea id="reviewNotes" name="reviewNotes" rows={4} />
                  <FieldDescription>
                    Notes are attached to the import review. Keep them useful
                    for the next person who checks this list.
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2">
              <Link
                aria-label={`Cancel review for ${importContext}`}
                className={buttonVariants({ variant: "outline" })}
                href={`/platform/projects/${projectId}/guest-imports/${importId}`}
              >
                Cancel
              </Link>
              <Button
                aria-label={`Save review decisions for ${importContext}`}
                type="submit"
              >
                <SaveIcon data-icon="inline-start" />
                Save review
              </Button>
            </CardFooter>
          </Card>
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          <Alert>
            <TriangleAlertIcon data-icon="inline-start" />
            <AlertTitle>Review before adding guests</AlertTitle>
            <AlertDescription>
              Saving decisions does not add guests yet. Approved rows can be
              applied from the import session after review.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheckIcon />
                Decision summary
              </CardTitle>
              <CardDescription>
                This session keeps rejected and held rows out of the guest list.
              </CardDescription>
            </CardHeader>
            <CardContent className="import-board">
              <dl className="import-board__grid">
                <div className="import-board__metric">
                  <dt className="import-board__metric-label">Reviewable now</dt>
                  <dd className="import-board__metric-value">
                    {pluralize(reviewableRows.length, "row")}
                  </dd>
                  <dd className="import-board__metric-note">
                    {pluralize(blockedRows.length, "row")} cannot be decided
                    here
                  </dd>
                </div>
                <div className="import-board__metric">
                  <dt className="import-board__metric-label">
                    Current decisions
                  </dt>
                  <dd className="import-board__metric-value">
                    {pluralize(approvedRows, "approved row")}
                  </dd>
                  <dd className="import-board__metric-note">
                    {pluralize(rejectedRows, "rejected row")} /{" "}
                    {pluralize(heldRows, "held row")}
                  </dd>
                </div>
                <div className="import-board__metric">
                  <dt className="import-board__metric-label">Source</dt>
                  <dd className="import-board__metric-value">
                    {details.session.source_filename}
                  </dd>
                  <dd className="import-board__metric-note">
                    {formatSide(details.session.import_side)}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheckIcon />
                Decision guide
              </CardTitle>
              <CardDescription>
                Use review decisions to keep the guest list clean before rows
                are applied.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 text-sm">
                <div className="flex flex-col gap-1">
                  <dt className="font-medium">Approve</dt>
                  <dd className="text-muted-foreground">
                    The row is acceptable and can become a guest later.
                  </dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="font-medium">Reject</dt>
                  <dd className="text-muted-foreground">
                    The row should not be used for this wedding.
                  </dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="font-medium">Hold</dt>
                  <dd className="text-muted-foreground">
                    The row needs clarification before a final decision.
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </aside>
      </form>
    </main>
  );
}
