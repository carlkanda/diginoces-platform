import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeftIcon,
  ClipboardPasteIcon,
  FileSpreadsheetIcon,
  ShieldCheckIcon,
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import { requireAnyGuestImportCreatePermission } from "@/lib/guest-imports/guest-import-api";
import { ProjectAccessError } from "@/lib/projects/project-api";
import {
  formatProjectCoupleDisplayName,
  formatProjectDisplayReference,
} from "@/lib/projects/project-foundation";
import { getProjectDetails } from "@/lib/projects/project-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { startGuestImportAction } from "../actions";

export const dynamic = "force-dynamic";

type NewGuestImportPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

const selectClassName =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50";

export default async function NewGuestImportPage({
  params,
}: NewGuestImportPageProps) {
  const authContext = await getAuthContext();
  const { projectId } = await params;

  if (authContext.status === "anonymous") {
    redirect(
      buildLoginRedirectPath(
        `/platform/projects/${projectId}/guest-imports/new`,
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
            Upload guest list
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground text-pretty">
            Guest list upload will be available after this environment is
            connected to Diginoces access services.
          </p>
        </div>
        <Alert>
          <UploadIcon data-icon="inline-start" />
          <AlertTitle>Access setup needed</AlertTitle>
          <AlertDescription>
            Supabase is not configured for this environment, so guest import
            upload cannot start yet.
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  const supabase = await createSupabaseServerClient();
  try {
    await requireAnyGuestImportCreatePermission(
      { supabase, user: authContext.user },
      projectId,
    );
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      notFound();
    }

    throw error;
  }

  const projectDetails = await getProjectDetails(supabase, projectId);

  if (!projectDetails) {
    redirect("/platform/projects");
  }

  const action = startGuestImportAction.bind(null, projectId);
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
            <BreadcrumbPage>Upload CSV</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">
                  {projectReference.label}: {projectReference.value}
                </Badge>
                <Badge variant="secondary">CSV import</Badge>
              </div>
              <CardTitle className="text-2xl font-semibold tracking-normal text-balance">
                <h1>Upload guest list</h1>
              </CardTitle>
              <CardDescription className="max-w-3xl text-pretty">
                Start with a CSV file or pasted rows, choose the side this list
                belongs to, then review column matches before any guest is
                added.
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
                <Link
                  aria-label={`Back to guest list for ${projectName}`}
                  className={buttonVariants({ variant: "ghost" })}
                  href={`/platform/projects/${projectId}/guests`}
                >
                  Guest list
                </Link>
              </CardAction>
            </CardHeader>
          </Card>

          <form action={action} className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheckIcon data-icon="inline-start" />
                  List ownership
                </CardTitle>
                <CardDescription>
                  Select the side this upload belongs to. The server checks that
                  your role can create imports for that side.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="importSide">List side</FieldLabel>
                    <select
                      id="importSide"
                      name="importSide"
                      required
                      className={selectClassName}
                    >
                      <option value="bride">Bride side</option>
                      <option value="groom">Groom side</option>
                      <option value="both">Both sides</option>
                    </select>
                    <FieldDescription>
                      Side ownership controls who can read, submit, and review
                      staged rows.
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheetIcon data-icon="inline-start" />
                  CSV source
                </CardTitle>
                <CardDescription>
                  Upload a CSV file or paste spreadsheet rows. Use one source
                  per import.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup className="grid gap-4 lg:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="csvFile">CSV file</FieldLabel>
                    <Input
                      accept=".csv,text/csv"
                      id="csvFile"
                      name="csvFile"
                      type="file"
                    />
                    <FieldDescription>
                      Export a comma-separated CSV from Excel, Google Sheets, or
                      Numbers. Maximum size: 5 MB.
                    </FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="sourceFilename">List name</FieldLabel>
                    <Input
                      id="sourceFilename"
                      name="sourceFilename"
                      placeholder="guest-import.csv"
                    />
                    <FieldDescription>
                      This name appears in import history so your team can
                      recognize the upload.
                    </FieldDescription>
                  </Field>

                  <Field className="lg:col-span-2">
                    <FieldLabel htmlFor="csvContent">
                      Paste spreadsheet rows
                    </FieldLabel>
                    <Textarea
                      id="csvContent"
                      name="csvContent"
                      placeholder="Title,Name,WhatsApp,Side,Events"
                      rows={8}
                    />
                    <FieldDescription>
                      Include the header row so Diginoces can suggest column
                      matches. Paste rows only when you are not uploading a
                      file.
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>

            <div className="sticky bottom-0 z-10 -mx-4 border-t bg-background px-4 py-3 sm:mx-0 sm:rounded-xl sm:border sm:bg-card">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  The next step maps columns and validates rows. No guest is
                  created at upload time.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    aria-label={`Cancel uploading a guest list for ${projectName}`}
                    className={buttonVariants({ variant: "outline" })}
                    href={`/platform/projects/${projectId}/guest-imports`}
                  >
                    Cancel
                  </Link>
                  <Button
                    aria-label={`Review guest list columns for ${projectName}`}
                    type="submit"
                  >
                    <UploadIcon data-icon="inline-start" />
                    Review columns
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>

        <aside className="flex flex-col gap-4">
          <Alert>
            <FileSpreadsheetIcon data-icon="inline-start" />
            <AlertTitle>CSV-only import</AlertTitle>
            <AlertDescription>
              This workflow accepts CSV files or pasted CSV rows. Excel files
              must be exported to CSV first.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>What happens next</CardTitle>
              <CardDescription>
                Importing is staged so the team stays in control.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="flex list-decimal flex-col gap-3 pl-4 text-sm">
                <li>
                  <span className="font-medium">Match columns.</span> Diginoces
                  suggests mappings for names, titles, sides, events, tags, and
                  WhatsApp numbers.
                </li>
                <li>
                  <span className="font-medium">Check rows.</span> Validation
                  finds missing fields, wrong sides, and possible duplicates.
                </li>
                <li>
                  <span className="font-medium">Review and apply.</span> Only
                  approved rows create guests.
                </li>
              </ol>
            </CardContent>
          </Card>

          <Alert>
            <ClipboardPasteIcon data-icon="inline-start" />
            <AlertTitle>Source file handling</AlertTitle>
            <AlertDescription>
              The original file is not stored here. Diginoces stores parsed rows
              and import metadata for review history.
            </AlertDescription>
          </Alert>
        </aside>
      </section>
    </main>
  );
}
