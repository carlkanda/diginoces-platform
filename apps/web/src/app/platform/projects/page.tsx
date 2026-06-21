import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRightIcon,
  FolderKanbanIcon,
  GaugeIcon,
  HistoryIcon,
  LockKeyholeIcon,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoHint } from "@/components/info-hint";
import { Badge } from "@/components/ui/badge";
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
  formatProjectCoupleDisplayName,
  formatProjectDisplayReference,
  getProjectLifecycleLabel,
} from "@/lib/projects/project-foundation";
import { listProjects } from "@/lib/projects/project-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

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

export default async function ProjectsPage() {
  const authContext = await getAuthContext();

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath("/platform/projects"));
  }

  const projects =
    authContext.status === "authenticated"
      ? await listProjects(await createSupabaseServerClient())
      : [];
  const setupCount = projects.filter((project) =>
    setupStatuses.has(project.status),
  ).length;
  const activeCount = projects.filter((project) =>
    activeStatuses.has(project.status),
  ).length;
  const recentProject = projects[0];

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
          <CardAction className="col-start-1 row-start-auto mt-3 justify-self-start sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:mt-0 sm:justify-self-end">
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
                  <>
                    <p className="text-lg font-semibold">No activity yet</p>
                    <p className="text-sm text-muted-foreground">
                      Assigned weddings will appear here once the team connects
                      this account to a project.
                    </p>
                  </>
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
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <FolderKanbanIcon aria-hidden="true" />
                    </EmptyMedia>
                    <EmptyTitle>No wedding projects yet</EmptyTitle>
                    <EmptyDescription>
                      When a wedding is assigned to this account, it will appear
                      here with its lifecycle state and workspace link.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Link
                      className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                      })}
                      href="/platform"
                    >
                      Return to workspace
                    </Link>
                  </EmptyContent>
                </Empty>
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
