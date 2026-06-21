import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeftIcon,
  HeartHandshakeIcon,
  LockKeyholeIcon,
  MessageCircleHeartIcon,
  UsersRoundIcon,
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
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import { ProjectAccessError } from "@/lib/projects/project-api";
import {
  formatProjectCoupleDisplayName,
  formatProjectDisplayReference,
} from "@/lib/projects/project-foundation";
import {
  getReportingPermissionSet,
  requireCoupleDashboardPermission,
} from "@/lib/reports/report-api";
import { getCoupleDashboardOverview } from "@/lib/reports/report-db";
import { getDashboardVisibility } from "@/lib/reports/report-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

function formatLabel(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  const labels: Record<string, string> = {
    "Active guests": "Active guests",
    "Active tables": "Active tables",
    "Invited event assignments": "Guests invited to events",
    "Pending RSVP": "Awaiting RSVP",
    "RSVP yes": "Attending",
    manualReviewRequired: "Review needed",
    pendingRsvp: "Awaiting RSVP",
    printedOnly: "Printed invitation",
    rsvpYes: "Attending",
    yes: "Attending",
    no: "Cannot attend",
    maybe: "Maybe",
  };

  return (
    labels[value] ??
    value
      .replaceAll("_", " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
      .replace(/\bRsvp\b/g, "RSVP")
  );
}

function SummaryTable({ values }: { values: Record<string, number | string> }) {
  return (
    <Table>
      <TableBody>
        {Object.entries(values).map(([key, value]) => (
          <TableRow key={key}>
            <TableCell className="whitespace-normal text-muted-foreground">
              {formatLabel(key)}
            </TableCell>
            <TableCell className="text-right font-medium">{value}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default async function CoupleDashboardPage({ params }: PageProps) {
  const authContext = await getAuthContext();
  const { projectId } = await params;

  if (authContext.status === "anonymous") {
    redirect(
      buildLoginRedirectPath(
        `/platform/projects/${projectId}/couple-dashboard`,
      ),
    );
  }

  if (authContext.status === "not_configured") {
    return (
      <main className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>
              <h1 className="text-2xl leading-tight font-semibold text-balance">
                Couple view
              </h1>
            </CardTitle>
            <CardDescription>
              Shared progress will appear here once the workspace connection is
              ready.
            </CardDescription>
          </CardHeader>
        </Card>
        <Alert>
          <LockKeyholeIcon />
          <AlertTitle>Workspace connection pending</AlertTitle>
          <AlertDescription>
            The couple view stays unavailable until the project data connection
            is configured.
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  const supabase = await createSupabaseServerClient();
  const context = { supabase, user: authContext.user };

  try {
    await requireCoupleDashboardPermission(context, projectId);
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      notFound();
    }

    throw error;
  }

  const permissions = await getReportingPermissionSet(context, { projectId });
  const overview = await getCoupleDashboardOverview(
    supabase,
    projectId,
    getDashboardVisibility(permissions),
  );

  if (!overview) {
    notFound();
  }

  const projectReference = formatProjectDisplayReference(overview.project, 0);
  const projectName = formatProjectCoupleDisplayName(overview.project, 0);

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
              Projects
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
            <BreadcrumbPage>Couple view</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader className="has-data-[slot=card-action]:grid-cols-1 sm:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
          <CardTitle>
            <h1 className="text-2xl leading-tight font-semibold text-balance">
              Couple view
            </h1>
          </CardTitle>
          <CardDescription className="max-w-3xl">
            A shared progress view for {projectName}: guest list readiness and
            RSVP movement without staff-only operational details.
          </CardDescription>
          <CardAction className="col-start-1 row-start-auto mt-3 justify-self-start sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:mt-0 sm:justify-self-end">
            <Badge variant="outline">
              {projectReference.label}: {projectReference.value}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(220px,280px)]">
          <dl
            aria-label="Shared progress highlights"
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            {overview.metrics.map((metric) => (
              <div
                className="rounded-lg border bg-background p-3"
                key={metric.label}
              >
                <dt className="text-xs font-medium text-muted-foreground">
                  {formatLabel(metric.label)}
                </dt>
                <dd className="mt-1 text-lg font-semibold">
                  {typeof metric.value === "string"
                    ? formatLabel(metric.value)
                    : metric.value}
                </dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-col gap-3 rounded-lg border bg-background p-3">
            <div>
              <p className="text-sm font-medium">Shared navigation</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Return to the wider project workspace when you need staff tools.
              </p>
            </div>
            <Separator />
            <Link
              className={buttonVariants({ variant: "outline" })}
              href={`/platform/projects/${projectId}`}
            >
              <ArrowLeftIcon data-icon="inline-start" />
              Project overview
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersRoundIcon />
              <h2 className="text-base font-semibold">Guest list</h2>
            </CardTitle>
            <CardDescription>
              A simple read of the active guest list, sides, and printed
              invitations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SummaryTable values={overview.summaries.guests} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircleHeartIcon />
              <h2 className="text-base font-semibold">RSVP progress</h2>
            </CardTitle>
            <CardDescription>
              Current response counts across the events visible to this couple
              view.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SummaryTable values={overview.summaries.rsvps} />
          </CardContent>
        </Card>
      </div>

      <Alert>
        <HeartHandshakeIcon />
        <AlertTitle>Shared view</AlertTitle>
        <AlertDescription>
          This page is intentionally narrower than the staff dashboard. It keeps
          the couple focused on guest and RSVP progress while staff-only
          operations remain in the project workspace.
        </AlertDescription>
      </Alert>
    </main>
  );
}
