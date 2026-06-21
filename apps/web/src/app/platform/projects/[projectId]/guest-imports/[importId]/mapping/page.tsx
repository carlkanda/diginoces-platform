import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
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
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
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
  requireGuestImportProjectPermission,
  requireGuestImportSidePermission,
} from "@/lib/guest-imports/guest-import-api";
import {
  getGuestImportDetails,
  getStoredImportHeaders,
  getStoredImportMapping,
} from "@/lib/guest-imports/guest-import-db";
import {
  importColumnTargets,
  type ImportColumnTarget,
} from "@/lib/guest-imports/guest-import-service";
import { ProjectAccessError } from "@/lib/projects/project-api";
import {
  formatProjectCoupleDisplayName,
  formatProjectDisplayReference,
} from "@/lib/projects/project-foundation";
import { getProjectDetails } from "@/lib/projects/project-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { saveGuestImportMappingAction } from "../../actions";

export const dynamic = "force-dynamic";

type MappingPageProps = {
  params: Promise<{
    importId: string;
    projectId: string;
  }>;
};

const targetLabels: Record<ImportColumnTarget, string> = {
  displayName: "Guest name",
  eventNames: "Events",
  guestSide: "Guest side",
  guestTitleType: "Title or guest type",
  internalNotes: "Private team notes",
  isPrintedOnly: "Printed-only marker",
  preferredLanguage: "Language",
  tagNames: "Tags",
  whatsappNumber: "WhatsApp number",
};

const targetDescriptions: Record<ImportColumnTarget, string> = {
  displayName: "The name your team should recognize in the guest list.",
  eventNames: "Event names from the CSV, such as ceremony or reception.",
  guestSide:
    "Bride, groom, or both when a row needs to override the import side.",
  guestTitleType:
    "A configured title or guest type, such as Mr, Mrs, family, or VIP.",
  internalNotes:
    "Private notes for the Diginoces team. Guests never see these.",
  isPrintedOnly: "Marks guests who should stay on printed invitation handling.",
  preferredLanguage: "French, English, or another supported guest language.",
  tagNames: "Guest categories that help filtering and operations.",
  whatsappNumber:
    "The number used for digital invitations and follow-up messages.",
};

const coreTargets = new Set<ImportColumnTarget>([
  "displayName",
  "guestTitleType",
]);

const selectClassName =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50";

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function formatSide(side: string) {
  if (side === "both") {
    return "Both sides";
  }

  return side === "bride" ? "Bride side" : "Groom side";
}

export default async function GuestImportMappingPage({
  params,
}: MappingPageProps) {
  const authContext = await getAuthContext();
  const { importId, projectId } = await params;

  if (authContext.status === "anonymous") {
    redirect(
      buildLoginRedirectPath(
        `/platform/projects/${projectId}/guest-imports/${importId}/mapping`,
      ),
    );
  }

  if (authContext.status === "not_configured") {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2">
          <Badge variant="outline" className="w-fit">
            Column mapping
          </Badge>
          <h1 className="text-2xl font-semibold tracking-normal text-balance">
            Match CSV columns
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground text-pretty">
            Column matching will be available after this environment is
            connected to Diginoces access services.
          </p>
        </div>
        <Alert>
          <FileSpreadsheetIcon data-icon="inline-start" />
          <AlertTitle>Access setup needed</AlertTitle>
          <AlertDescription>
            Supabase is not configured for this environment, so CSV columns
            cannot be matched yet.
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  const supabase = await createSupabaseServerClient();
  const context = { supabase, user: authContext.user };

  try {
    await requireGuestImportProjectPermission(
      context,
      projectId,
      "guest_imports.create",
    );
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

  try {
    await requireGuestImportSidePermission(
      context,
      projectId,
      details.session.import_side,
      "guest_imports.create",
    );
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      notFound();
    }

    throw error;
  }

  const headers = getStoredImportHeaders(details);
  const mapping = getStoredImportMapping(details);
  const action = saveGuestImportMappingAction.bind(null, projectId, importId);
  const projectReference = formatProjectDisplayReference(
    projectDetails.project,
    0,
  );
  const projectName = formatProjectCoupleDisplayName(projectDetails.project, 0);
  const importContext = `${formatSide(details.session.import_side)} CSV import for ${projectName}`;
  const mappedColumnCount = importColumnTargets.filter(
    (target) => mapping[target],
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
            <BreadcrumbPage>Column mapping</BreadcrumbPage>
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
            <Badge variant="secondary">
              {pluralize(details.session.row_count, "row")}
            </Badge>
          </div>
          <CardTitle className="text-2xl font-semibold tracking-normal text-balance">
            <h1>Match CSV columns to guest fields</h1>
          </CardTitle>
          <CardDescription className="max-w-3xl text-pretty">
            Choose which source column should populate each Diginoces guest
            field. Validation runs after saving this mapping.
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

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_23rem]">
        <form action={action} className="flex min-w-0 flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheetIcon />
                Column matches
              </CardTitle>
              <CardDescription>
                Leave optional fields unmapped when the CSV does not include
                that information.
              </CardDescription>
              <CardAction>
                <Badge variant="outline">
                  {pluralize(mappedColumnCount, "matched field")}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              {headers.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <FileSpreadsheetIcon />
                    </EmptyMedia>
                    <EmptyTitle>No CSV headers found</EmptyTitle>
                    <EmptyDescription>
                      Return to the import session and start again with a CSV
                      file that includes a header row.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Link
                      className={buttonVariants({ variant: "outline" })}
                      href={`/platform/projects/${projectId}/guest-imports/${importId}`}
                    >
                      <ArrowLeftIcon data-icon="inline-start" />
                      Import session
                    </Link>
                  </EmptyContent>
                </Empty>
              ) : (
                <FieldGroup>
                  <div className="overflow-x-auto">
                    <Table aria-label={`Column mapping for ${importContext}`}>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Diginoces field</TableHead>
                          <TableHead>Source CSV column</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importColumnTargets.map((target) => (
                          <TableRow key={target}>
                            <TableCell>
                              <div className="flex min-w-56 flex-col gap-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-medium">
                                    {targetLabels[target]}
                                  </span>
                                  <Badge
                                    variant={
                                      coreTargets.has(target)
                                        ? "default"
                                        : "secondary"
                                    }
                                  >
                                    {coreTargets.has(target)
                                      ? "Core match"
                                      : "Optional"}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground text-pretty">
                                  {targetDescriptions[target]}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Field>
                                <FieldLabel
                                  className="sr-only"
                                  htmlFor={`${target}-column`}
                                >
                                  Source column for {targetLabels[target]}
                                </FieldLabel>
                                <select
                                  className={selectClassName}
                                  defaultValue={mapping[target] ?? ""}
                                  id={`${target}-column`}
                                  name={target}
                                >
                                  <option value="">Not mapped</option>
                                  {headers.map((header, index) => (
                                    <option
                                      key={`${header}-${index}`}
                                      value={header}
                                    >
                                      {header}
                                    </option>
                                  ))}
                                </select>
                                <FieldDescription>
                                  {mapping[target]
                                    ? `Currently matched to "${mapping[target]}".`
                                    : "Choose a CSV header if this field exists."}
                                </FieldDescription>
                              </Field>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </FieldGroup>
              )}
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2">
              <Link
                aria-label={`Cancel column mapping for ${importContext}`}
                className={buttonVariants({ variant: "outline" })}
                href={`/platform/projects/${projectId}/guest-imports/${importId}`}
              >
                Cancel
              </Link>
              <Button
                aria-label={`Validate preview for ${importContext}`}
                disabled={headers.length === 0}
                type="submit"
              >
                <CheckCircle2Icon data-icon="inline-start" />
                Validate preview
              </Button>
            </CardFooter>
          </Card>
        </form>

        <aside className="flex min-w-0 flex-col gap-4">
          <Alert>
            <TriangleAlertIcon data-icon="inline-start" />
            <AlertTitle>Validation happens next</AlertTitle>
            <AlertDescription>
              Guest name and title/type are checked during preview validation.
              Digital invitation rows also need usable WhatsApp information
              unless they are marked printed-only.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListChecksIcon />
                Source summary
              </CardTitle>
              <CardDescription>
                The original file is not stored here; Diginoces stores parsed
                rows, headers, and this mapping.
              </CardDescription>
            </CardHeader>
            <CardContent className="import-board">
              <dl className="import-board__grid">
                <div className="import-board__metric">
                  <dt className="import-board__metric-label">Source file</dt>
                  <dd className="import-board__metric-value">
                    {details.session.source_filename}
                  </dd>
                </div>
                <div className="import-board__metric">
                  <dt className="import-board__metric-label">Headers</dt>
                  <dd className="import-board__metric-value">
                    {pluralize(headers.length, "column")}
                  </dd>
                  <dd className="import-board__metric-note">
                    {pluralize(mappedColumnCount, "field")} currently matched
                  </dd>
                </div>
                <div className="import-board__metric">
                  <dt className="import-board__metric-label">Import side</dt>
                  <dd className="import-board__metric-value">
                    {formatSide(details.session.import_side)}
                  </dd>
                  <dd className="import-board__metric-note">
                    Row-level side can override this only when mapped.
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheckIcon />
                Review path
              </CardTitle>
              <CardDescription>
                Mapping only prepares the preview. Guests are added later after
                review approval.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm text-muted-foreground">
                <li>Match the CSV columns to guest fields.</li>
                <li>Validate the preview and correct blocked rows.</li>
                <li>Submit the import for review.</li>
                <li>Add only approved rows to the guest list.</li>
              </ol>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}
