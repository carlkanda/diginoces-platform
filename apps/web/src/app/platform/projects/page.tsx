import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRightIcon,
  FolderKanbanIcon,
  GaugeIcon,
  HistoryIcon,
  LockKeyholeIcon,
  PlusIcon,
} from "lucide-react";
import { createProjectAction } from "@/app/platform/projects/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoHint } from "@/components/info-hint";
import { OperationalEmptyState } from "@/components/operational-empty-state";
import { Badge } from "@/components/ui/badge";
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
import { serverLogger } from "@/lib/logging";
import {
  formatProjectCoupleDisplayName,
  formatProjectDisplayReference,
  getProjectLifecycleLabel,
} from "@/lib/projects/project-foundation";
import { hasGlobalPermission } from "@/lib/projects/project-api";
import { listProjects } from "@/lib/projects/project-service";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type ProjectsPageProps = {
  searchParams?: Promise<{
    projectError?: string;
  }>;
};

const emptyProjectsSearchParams: Promise<{ projectError?: string }> =
  Promise.resolve({});

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}

type ProjectListItem = Awaited<ReturnType<typeof listProjects>>[number];

const setupStatuses = new Set<ProjectListItem["status"]>([
  "lead",
  "draft",
  "submitted",
]);

const activeStatuses = new Set<ProjectListItem["status"]>([
  "approved",
  "active",
  "ready_for_invitations",
  "event_operations",
]);

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function getProjectStatusCue(status: ProjectListItem["status"]) {
  const cues: Record<ProjectListItem["status"], string> = {
    active: "Open for daily work",
    approved: "Approved for setup",
    archived: "Archived",
    completed: "Delivered",
    draft: "Being prepared",
    event_operations: "Event-day work is active",
    lead: "Needs initial details",
    ready_for_invitations: "Invitation work can begin",
    submitted: "Ready for review",
  };

  return cues[status];
}

function getProjectStatusVariant(
  status: ProjectListItem["status"],
): "default" | "secondary" | "outline" {
  if (activeStatuses.has(status)) {
    return "default";
  }

  if (setupStatuses.has(status)) {
    return "secondary";
  }

  return "outline";
}

function projectErrorMessage(error: string | undefined) {
  switch (error) {
    case "invalid_project_request":
      return "Check the couple names and project year, then try again.";
    case "permission_denied":
      return "This account is not allowed to create wedding projects.";
    case "project_create_failed":
      return "The wedding project could not be created. Try again or ask operations to review the workspace.";
    case "supabase_not_configured":
      return "Project creation is unavailable until the workspace connection is ready.";
    default:
      return null;
  }
}

export default async function ProjectsPage({
  searchParams,
}: ProjectsPageProps) {
  const [authContext, params] = await Promise.all([
    getAuthContext(),
    searchParams ?? emptyProjectsSearchParams,
  ]);

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath("/platform/projects"));
  }

  let projects: ProjectListItem[] = [];
  let canCreateProjects = false;

  if (authContext.status === "authenticated") {
    const context = {
      supabase: authContext.supabase,
      user: authContext.user,
    };

    [projects, canCreateProjects] = await Promise.all([
      listProjects(context.supabase),
      hasGlobalPermission(context, "projects.create").catch(
        (error: unknown) => {
          serverLogger.error("Project create permission check failed.", {
            error,
          });

          return false;
        },
      ),
    ]);
  }

  const projectError = projectErrorMessage(params.projectError);
  const setupCount = projects.filter((project) =>
    setupStatuses.has(project.status),
  ).length;
  const activeCount = projects.filter((project) =>
    activeStatuses.has(project.status),
  ).length;
  const recentProject = projects[0];
  const defaultProjectYear = new Date().getFullYear();

  return (
    <main className="flex flex-col gap-6">
      <Card>
        <CardHeader className="has-data-[slot=card-action]:grid-cols-1 sm:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
          <h1 className="text-2xl leading-tight font-semibold">
            Wedding project desk
          </h1>
          <CardDescription className="max-w-3xl">
            Find a wedding, check its state, and open the next work area.
          </CardDescription>
          <CardAction className="col-start-1 row-start-auto mt-3 flex flex-wrap gap-2 justify-self-start sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:mt-0 sm:justify-self-end">
            {canCreateProjects ? (
              <Link
                className={buttonVariants({ variant: "default", size: "sm" })}
                href="#create-wedding-project"
              >
                <PlusIcon aria-hidden="true" data-icon="inline-start" />
                Create wedding
              </Link>
            ) : null}
            <Link
              className={buttonVariants({ variant: "outline", size: "sm" })}
              href="/platform"
            >
              Back to workspace
            </Link>
          </CardAction>
        </CardHeader>
      </Card>

      {authContext.status === "not_configured" ? (
        <Alert>
          <LockKeyholeIcon aria-hidden="true" />
          <AlertTitle>Workspace connection pending</AlertTitle>
          <AlertDescription>
            Project data will appear after the Supabase workspace connection is
            ready. The page stays available without exposing project records.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {projectError ? (
            <Alert>
              <GaugeIcon aria-hidden="true" />
              <AlertTitle>Wedding project was not created</AlertTitle>
              <AlertDescription>{projectError}</AlertDescription>
            </Alert>
          ) : null}

          <section
            aria-label="Project desk summary"
            className="grid gap-3 lg:grid-cols-[1.1fr_repeat(3,minmax(0,0.65fr))]"
          >
            <Card>
              <CardHeader>
                <CardTitle>
                  <h2>Latest movement</h2>
                </CardTitle>
                <CardDescription>
                  The wedding most recently touched by your account scope.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {recentProject ? (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={getProjectStatusVariant(recentProject.status)}
                      >
                        {getProjectLifecycleLabel(recentProject.status)}
                      </Badge>
                      <Badge variant="outline">
                        Updated {formatDate(recentProject.updated_at)}
                      </Badge>
                    </div>
                    <p className="text-lg font-semibold text-pretty">
                      {formatProjectCoupleDisplayName(recentProject, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {getProjectStatusCue(recentProject.status)}
                    </p>
                  </>
                ) : (
                  <div className="rounded-lg border bg-muted/35 p-3">
                    <p className="text-sm font-medium">
                      No assigned wedding activity yet
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Once a wedding is connected to this account, the latest
                      movement appears here.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card size="sm">
              <CardHeader>
                <CardTitle>
                  <p>Visible to you</p>
                </CardTitle>
                <CardDescription>Permission-scoped weddings</CardDescription>
              </CardHeader>
              <CardContent>
                <p
                  aria-label={`Visible to you: ${pluralize(projects.length, "wedding")}.`}
                  className="text-3xl font-semibold"
                >
                  {projects.length}
                </p>
              </CardContent>
            </Card>

            <Card size="sm">
              <CardHeader>
                <CardTitle>
                  <p>In preparation</p>
                </CardTitle>
                <CardDescription>Needs setup or review</CardDescription>
              </CardHeader>
              <CardContent>
                <p
                  aria-label={`In preparation: ${pluralize(setupCount, "wedding")}.`}
                  className="text-3xl font-semibold"
                >
                  {setupCount}
                </p>
              </CardContent>
            </Card>

            <Card size="sm">
              <CardHeader>
                <CardTitle>
                  <p>Operational</p>
                </CardTitle>
                <CardDescription>Ready for daily work</CardDescription>
              </CardHeader>
              <CardContent>
                <p
                  aria-label={`Operational: ${pluralize(activeCount, "wedding")}.`}
                  className="text-3xl font-semibold"
                >
                  {activeCount}
                </p>
              </CardContent>
            </Card>
          </section>

          {canCreateProjects ? (
            <Card id="create-wedding-project">
              <CardHeader>
                <CardTitle>
                  <h2>Create a wedding project</h2>
                </CardTitle>
                <CardDescription>
                  Start the secure workspace for a couple. Events, guests,
                  invitations, and delivery work stay inside the project after
                  it is created.
                </CardDescription>
                <CardAction>
                  <Badge variant="secondary">Admin action</Badge>
                </CardAction>
              </CardHeader>
              <form action={createProjectAction}>
                <CardContent>
                  <FieldSet>
                    <FieldLegend>Wedding identity</FieldLegend>
                    <FieldGroup className="md:grid md:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="brideName">Bride name</FieldLabel>
                        <Input id="brideName" name="brideName" required />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="groomName">Groom name</FieldLabel>
                        <Input id="groomName" name="groomName" required />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="projectYear">
                          Wedding year
                        </FieldLabel>
                        <Input
                          defaultValue={defaultProjectYear}
                          id="projectYear"
                          max={2100}
                          min={2020}
                          name="projectYear"
                          type="number"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="preferredLanguage">
                          Preferred language
                        </FieldLabel>
                        <NativeSelect
                          className="w-full"
                          defaultValue="fr"
                          id="preferredLanguage"
                          name="preferredLanguage"
                        >
                          <NativeSelectOption value="fr">
                            French
                          </NativeSelectOption>
                          <NativeSelectOption value="en">
                            English
                          </NativeSelectOption>
                        </NativeSelect>
                      </Field>
                    </FieldGroup>
                  </FieldSet>

                  <FieldSet className="mt-6">
                    <FieldLegend>Primary contact</FieldLegend>
                    <FieldGroup className="md:grid md:grid-cols-3">
                      <Field>
                        <FieldLabel htmlFor="primaryContactName">
                          Contact name
                        </FieldLabel>
                        <Input
                          id="primaryContactName"
                          name="primaryContactName"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="primaryContactEmail">
                          Contact email
                        </FieldLabel>
                        <Input
                          id="primaryContactEmail"
                          name="primaryContactEmail"
                          type="email"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="primaryContactPhone">
                          Contact phone
                        </FieldLabel>
                        <Input
                          id="primaryContactPhone"
                          name="primaryContactPhone"
                        />
                      </Field>
                      <Field className="md:col-span-3">
                        <FieldLabel htmlFor="timelineNotes">
                          Planning notes
                        </FieldLabel>
                        <Textarea
                          id="timelineNotes"
                          name="timelineNotes"
                          rows={3}
                        />
                        <FieldDescription>
                          Add dates, venues, or delivery context that helps the
                          operations team start cleanly.
                        </FieldDescription>
                      </Field>
                      <Field className="md:col-span-3">
                        <FieldLabel htmlFor="internalNotes">
                          Private team notes
                        </FieldLabel>
                        <Textarea
                          id="internalNotes"
                          name="internalNotes"
                          rows={3}
                        />
                        <FieldDescription>
                          Visible only to authorized Diginoces users.
                        </FieldDescription>
                      </Field>
                    </FieldGroup>
                  </FieldSet>
                </CardContent>
                <CardFooter className="justify-end">
                  <Button type="submit">
                    <PlusIcon aria-hidden="true" data-icon="inline-start" />
                    Create wedding project
                  </Button>
                </CardFooter>
              </form>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <h2>Your wedding projects</h2>
                <InfoHint
                  label="Project visibility"
                  text="You only see weddings connected to this account. Open one to continue inside its project workspace."
                />
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  {pluralize(projects.length, "wedding")}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <OperationalEmptyState
                  action={
                    <Link
                      className={buttonVariants({
                        variant: canCreateProjects ? "default" : "outline",
                        size: "sm",
                      })}
                      href={
                        canCreateProjects
                          ? "#create-wedding-project"
                          : "/platform"
                      }
                    >
                      {canCreateProjects
                        ? "Create first wedding"
                        : "Return to workspace"}
                    </Link>
                  }
                  description="Wedding projects assigned to this account appear here with lifecycle state and workspace links."
                  icon={FolderKanbanIcon}
                  nextStep={
                    canCreateProjects
                      ? "Create the first wedding project from this page."
                      : "Ask a Diginoces administrator to connect this account to a wedding project."
                  }
                  title="No wedding projects yet"
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Wedding</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Reference
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        Next step
                      </TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Last update
                      </TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects.map((project, projectIndex) => {
                      const projectLabel = formatProjectCoupleDisplayName(
                        project,
                        projectIndex,
                      );
                      const projectReference = formatProjectDisplayReference(
                        project,
                        projectIndex,
                      );

                      return (
                        <TableRow key={project.id}>
                          <TableCell className="min-w-60 whitespace-normal">
                            <Link
                              aria-label={`Open ${projectLabel}`}
                              className="font-medium text-foreground underline-offset-4 hover:underline"
                              href={`/platform/projects/${project.id}`}
                            >
                              {projectLabel}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={getProjectStatusVariant(project.status)}
                            >
                              {getProjectLifecycleLabel(project.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <span
                              aria-label={`${projectReference.label}: ${projectReference.value}.`}
                              className="flex flex-col gap-1"
                            >
                              <span className="text-xs text-muted-foreground">
                                {projectReference.label}
                              </span>
                              {projectReference.isCode ? (
                                <code className="font-mono text-xs">
                                  {projectReference.value}
                                </code>
                              ) : (
                                <span className="text-sm">
                                  {projectReference.value}
                                </span>
                              )}
                            </span>
                          </TableCell>
                          <TableCell className="hidden max-w-72 whitespace-normal text-muted-foreground md:table-cell">
                            {getProjectStatusCue(project.status)}
                          </TableCell>
                          <TableCell className="hidden text-muted-foreground sm:table-cell">
                            {formatDate(project.updated_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link
                              aria-label={`Open ${projectLabel}. Status: ${getProjectLifecycleLabel(project.status)}. Next step: ${getProjectStatusCue(project.status)}. Last update: ${formatDate(project.updated_at)}.`}
                              className={cn(
                                buttonVariants({
                                  variant: "outline",
                                  size: "sm",
                                }),
                                "min-w-max",
                              )}
                              href={`/platform/projects/${project.id}`}
                            >
                              Open
                              <ArrowRightIcon
                                aria-hidden="true"
                                data-icon="inline-end"
                              />
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Alert>
            <GaugeIcon aria-hidden="true" />
            <AlertTitle>Role-aware project view</AlertTitle>
            <AlertDescription>
              Missing weddings usually mean the project membership or role needs
              review.
            </AlertDescription>
          </Alert>

          <Card size="sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HistoryIcon aria-hidden="true" />
                <h2>Desk rhythm</h2>
              </CardTitle>
              <CardDescription>
                Use the latest movement area for triage, then rely on the table
                when comparing status, references, and next steps across
                weddings.
              </CardDescription>
            </CardHeader>
          </Card>
        </>
      )}
    </main>
  );
}
