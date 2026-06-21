import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  Building2Icon,
  ClipboardCheckIcon,
  FilePlus2Icon,
  InboxIcon,
  SendIcon,
} from "lucide-react";
import {
  createPartnerProjectDraftAction,
  submitPartnerDashboardProjectAction,
} from "@/app/platform/partners/actions";
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
import { Button } from "@/components/ui/button";
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
import { serverLogger } from "@/lib/logging";
import { hasPartnerPermission } from "@/lib/partners/partner-api";
import {
  getPartnerDashboardOverview,
  getPartnerDetails,
  listPartners,
} from "@/lib/partners/partner-db";
import {
  formatPartnerContactDisplay,
  formatPartnerOrganizationDisplay,
  formatPartnerSubmissionCoupleDisplayName,
} from "@/lib/partners/partner-service";
import { ProjectAccessError } from "@/lib/projects/project-api";
import { requirePartnerDashboardPermission } from "@/lib/reports/report-api";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    partnerId?: string | string[];
  }>;
};

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function partnerRowId(partner: { id?: unknown }) {
  if (typeof partner.id !== "string" || partner.id.length === 0) {
    throw new Error("Partner row is missing a valid id.");
  }

  return partner.id;
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function formatLabel(value: unknown) {
  const text = typeof value === "string" ? value : String(value ?? "");

  if (!text) {
    return "Not set";
  }

  return text
    .replaceAll("_", " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatProjectReference(value: unknown) {
  const text = typeof value === "string" ? value : "";

  if (!text) {
    return "No project reference";
  }

  if (/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(text)) {
    return `Project reference ${text.slice(0, 8)}`;
  }

  return text;
}

function statusBadgeVariant(
  value: unknown,
): "default" | "secondary" | "outline" | "destructive" {
  const status = typeof value === "string" ? value : "";

  if (status === "active" || status === "approved" || status === "submitted") {
    return "default";
  }

  if (status === "rejected" || status === "suspended") {
    return "destructive";
  }

  if (status === "draft" || status === "pending") {
    return "secondary";
  }

  return "outline";
}

function PartnerDashboardBreadcrumb({ partnerName }: { partnerName?: string }) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href="/platform" />}>
            Workspace
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href="/platform/partners" />}>
            Partners
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        {partnerName ? (
          <>
            <BreadcrumbItem>
              <BreadcrumbPage>{partnerName}</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Partner dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : (
          <BreadcrumbItem>
            <BreadcrumbPage>Partner dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export default async function PartnerDashboardPage({
  searchParams,
}: PageProps) {
  const authContext = await getAuthContext();
  const requestedPartnerId = firstSearchParam((await searchParams)?.partnerId);

  if (authContext.status === "anonymous") {
    const dashboardPath = requestedPartnerId
      ? `/platform/partner-dashboard?${new URLSearchParams({
          partnerId: requestedPartnerId,
        }).toString()}`
      : "/platform/partner-dashboard";

    redirect(buildLoginRedirectPath(dashboardPath));
  }

  if (authContext.status === "not_configured") {
    return (
      <div className="flex flex-col gap-6">
        <PartnerDashboardBreadcrumb />

        <Card>
          <CardHeader>
            <CardTitle>
              <h1 className="text-3xl leading-tight font-semibold tracking-normal text-balance">
                Partner dashboard
              </h1>
            </CardTitle>
            <CardDescription>
              Connect the workspace before loading partner assignments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <Building2Icon aria-hidden="true" />
              <AlertTitle>Partner records are not connected</AlertTitle>
              <AlertDescription>
                Assigned weddings and partner submissions will appear here after
                secure workspace access is ready.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  const supabase = authContext.supabase;
  const context = { supabase, user: authContext.user };
  const partners = await listPartners(supabase);
  const [onlyPartner] = partners;
  const selectedPartner = requestedPartnerId
    ? (partners.find(
        (partner) => partnerRowId(partner) === requestedPartnerId,
      ) ?? null)
    : partners.length === 1
      ? onlyPartner
      : null;

  if (requestedPartnerId && !selectedPartner) {
    notFound();
  }

  if (partners.length > 1 && !selectedPartner) {
    return (
      <div className="flex flex-col gap-6">
        <PartnerDashboardBreadcrumb />

        <Card>
          <CardHeader>
            <CardTitle>
              <h1 className="text-3xl leading-tight font-semibold tracking-normal text-balance">
                Partner dashboard
              </h1>
            </CardTitle>
            <CardDescription>
              Choose the partner profile you want to work from before opening
              assigned weddings or preparing a new submission.
            </CardDescription>
            <CardAction>
              <Button
                variant="outline"
                render={<Link href="/platform/partners" />}
              >
                <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
                Partners
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {pluralize(partners.length, "profile")}
              </Badge>
              <Badge variant="outline">Selection required</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Choose a partner profile</CardTitle>
            <CardDescription>
              Each profile keeps its wedding work, drafts, and review state
              separated.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:hidden">
              {partners.map((partner, index) => {
                const partnerId = partnerRowId(partner);
                const partnerName = formatPartnerOrganizationDisplay(
                  partner.organization_name,
                  index,
                );

                return (
                  <div className="workflow-record" key={partnerId}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="font-medium">{partnerName}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatPartnerContactDisplay(partner.contact_email)}
                        </p>
                      </div>
                      <Badge variant={statusBadgeVariant(partner.status)}>
                        {formatLabel(partner.status)}
                      </Badge>
                    </div>
                    <Button
                      className="w-full"
                      variant="outline"
                      render={
                        <Link
                          href={`/platform/partner-dashboard?${new URLSearchParams(
                            { partnerId },
                          ).toString()}`}
                        />
                      }
                    >
                      Open workspace
                      <ArrowRightIcon
                        data-icon="inline-end"
                        aria-hidden="true"
                      />
                    </Button>
                  </div>
                );
              })}
            </div>

            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Partner</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Open</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partners.map((partner, index) => {
                    const partnerId = partnerRowId(partner);
                    const partnerName = formatPartnerOrganizationDisplay(
                      partner.organization_name,
                      index,
                    );

                    return (
                      <TableRow key={partnerId}>
                        <TableCell className="min-w-56 whitespace-normal font-medium">
                          {partnerName}
                        </TableCell>
                        <TableCell className="min-w-56 whitespace-normal text-muted-foreground">
                          {formatPartnerContactDisplay(partner.contact_email)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant(partner.status)}>
                            {formatLabel(partner.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            render={
                              <Link
                                href={`/platform/partner-dashboard?${new URLSearchParams(
                                  { partnerId },
                                ).toString()}`}
                              />
                            }
                          >
                            Open
                            <ArrowRightIcon
                              data-icon="inline-end"
                              aria-hidden="true"
                            />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!selectedPartner) {
    return (
      <div className="flex flex-col gap-6">
        <PartnerDashboardBreadcrumb />

        <Card>
          <CardHeader>
            <CardTitle>
              <h1 className="text-3xl leading-tight font-semibold tracking-normal text-balance">
                Partner dashboard
              </h1>
            </CardTitle>
            <CardDescription>
              Partner work becomes available after this account is linked to a
              profile.
            </CardDescription>
            <CardAction>
              <Button
                variant="outline"
                render={<Link href="/platform/partners" />}
              >
                <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
                Partners
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <InboxIcon aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle>No partner profile is linked</EmptyTitle>
                <EmptyDescription>
                  Link this account to a partner profile before wedding
                  submissions and assigned work can be shown here.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      </div>
    );
  }

  const partnerId = partnerRowId(selectedPartner);

  try {
    await requirePartnerDashboardPermission(context, partnerId);
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      serverLogger.error("Permission denied for partner dashboard.", {
        error,
        partnerId,
        userId: context.user.id,
      });
      notFound();
    }

    throw error;
  }

  const [details, overview] = await Promise.all([
    getPartnerDetails(supabase, partnerId),
    getPartnerDashboardOverview(supabase, partnerId),
  ]);
  const [canCreatePartnerProject, canSubmitPartnerProject] = await Promise.all([
    hasPartnerPermission(context, partnerId, "partner_projects.create"),
    hasPartnerPermission(context, partnerId, "partner_projects.submit"),
  ]);
  const createDraftAction = createPartnerProjectDraftAction.bind(
    null,
    partnerId,
  );
  const selectedPartnerName = formatPartnerOrganizationDisplay(
    selectedPartner.organization_name,
    partners.indexOf(selectedPartner),
  );
  const submissionCount = details?.submissions.length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <PartnerDashboardBreadcrumb partnerName={selectedPartnerName} />

      <Card>
        <CardHeader>
          <CardTitle>
            <h1 className="text-3xl leading-tight font-semibold tracking-normal text-balance">
              Partner dashboard
            </h1>
          </CardTitle>
          <CardDescription>
            Prepare wedding submissions and follow assigned work for{" "}
            {selectedPartnerName}.
          </CardDescription>
          <CardAction>
            <Button
              variant="outline"
              render={<Link href={`/platform/partners/${partnerId}`} />}
            >
              Partner profile
              <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusBadgeVariant(selectedPartner.status)}>
              {formatLabel(selectedPartner.status)}
            </Badge>
            <Badge variant="secondary">
              {pluralize(overview.projects.length, "assigned wedding")}
            </Badge>
            <Badge variant="outline">
              {pluralize(submissionCount, "submission")}
            </Badge>
          </div>

          <Separator />

          <dl className="grid gap-4 md:grid-cols-4">
            <div className="flex flex-col gap-1">
              <dt className="text-sm text-muted-foreground">Partner</dt>
              <dd className="text-sm font-medium">{selectedPartnerName}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-sm text-muted-foreground">Contact</dt>
              <dd className="text-sm font-medium">
                {formatPartnerContactDisplay(selectedPartner.contact_email)}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-sm text-muted-foreground">
                Assigned weddings
              </dt>
              <dd className="text-sm font-medium">
                {pluralize(overview.projects.length, "wedding")}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-sm text-muted-foreground">Submissions</dt>
              <dd className="text-sm font-medium">
                {pluralize(submissionCount, "submission")}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {canCreatePartnerProject ? (
        <Card>
          <CardHeader>
            <CardTitle>Create a wedding submission</CardTitle>
            <CardDescription>
              Capture the couple and planning notes. Diginoces reviews the
              submission before connecting it to an operational wedding.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createDraftAction} className="flex flex-col gap-6">
              <FieldSet>
                <FieldLegend>Couple and contact</FieldLegend>
                <FieldGroup>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="brideName">Bride name</FieldLabel>
                      <Input id="brideName" name="brideName" required />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="groomName">Groom name</FieldLabel>
                      <Input id="groomName" name="groomName" required />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="primaryContactEmail">
                        Primary contact email
                      </FieldLabel>
                      <Input
                        id="primaryContactEmail"
                        name="primaryContactEmail"
                        type="email"
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="primaryContactPhone">
                        Primary contact phone
                      </FieldLabel>
                      <Input
                        id="primaryContactPhone"
                        name="primaryContactPhone"
                      />
                    </Field>
                  </div>
                </FieldGroup>
              </FieldSet>

              <FieldSet>
                <FieldLegend>Planning details</FieldLegend>
                <FieldGroup>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="plannedGuestCount">
                        Planned guest count
                      </FieldLabel>
                      <Input
                        id="plannedGuestCount"
                        min="0"
                        name="plannedGuestCount"
                        type="number"
                      />
                      <FieldDescription>
                        Use the best estimate available today.
                      </FieldDescription>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="projectYear">
                        Wedding year
                      </FieldLabel>
                      <Input
                        id="projectYear"
                        max="2100"
                        min="2020"
                        name="projectYear"
                        type="number"
                      />
                    </Field>
                  </div>
                  <Field>
                    <FieldLabel htmlFor="eventNotes">Event notes</FieldLabel>
                    <Textarea id="eventNotes" name="eventNotes" rows={4} />
                    <FieldDescription>
                      Include dates, venues, expected events, and timing notes.
                    </FieldDescription>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="partnerNotes">
                      Partner notes
                    </FieldLabel>
                    <Textarea id="partnerNotes" name="partnerNotes" rows={4} />
                    <FieldDescription>
                      Add anything Diginoces should review before assigning the
                      wedding.
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </FieldSet>

              <div className="flex flex-wrap items-center justify-end gap-3">
                <Button type="submit">
                  <FilePlus2Icon data-icon="inline-start" aria-hidden="true" />
                  Create submission
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground">
              Changes after submission should be coordinated with Diginoces so
              the review trail stays clear.
            </p>
          </CardFooter>
        </Card>
      ) : (
        <Alert>
          <ClipboardCheckIcon aria-hidden="true" />
          <AlertTitle>Submission creation is not available</AlertTitle>
          <AlertDescription>
            You can still review assigned weddings and existing submissions
            visible to this partner profile.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Assigned weddings</CardTitle>
          <CardDescription>
            Follow operational weddings connected to this partner profile.
          </CardDescription>
          <CardAction>
            <Badge variant="secondary">
              {pluralize(overview.projects.length, "wedding")}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          {overview.projects.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <InboxIcon aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle>No assigned weddings yet</EmptyTitle>
                <EmptyDescription>
                  Approved or assigned weddings will appear here after Diginoces
                  connects them to this partner profile.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <>
              <div className="grid gap-3 md:hidden">
                {overview.projects.map((project) => (
                  <div className="workflow-record" key={project.projectId}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="font-medium">{project.coupleNames}</h3>
                        <p className="mt-1 font-mono text-xs text-muted-foreground">
                          {project.projectCode}
                        </p>
                      </div>
                      <Badge
                        variant={statusBadgeVariant(project.approvalStatus)}
                      >
                        {formatLabel(project.approvalStatus)}
                      </Badge>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">
                        Commercial state
                      </span>
                      <Badge
                        variant={statusBadgeVariant(project.commercialStatus)}
                      >
                        {formatLabel(project.commercialStatus)}
                      </Badge>
                    </div>
                    <Button
                      className="w-full"
                      variant="outline"
                      render={
                        <Link
                          href={`/platform/projects/${project.projectId}`}
                        />
                      }
                    >
                      Open wedding
                      <ArrowRightIcon
                        data-icon="inline-end"
                        aria-hidden="true"
                      />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Wedding</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Review</TableHead>
                      <TableHead>Commercial state</TableHead>
                      <TableHead className="text-right">Open</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overview.projects.map((project) => (
                      <TableRow key={project.projectId}>
                        <TableCell className="min-w-56 whitespace-normal font-medium">
                          {project.coupleNames}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {project.projectCode}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={statusBadgeVariant(project.approvalStatus)}
                          >
                            {formatLabel(project.approvalStatus)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={statusBadgeVariant(
                              project.commercialStatus,
                            )}
                          >
                            {formatLabel(project.commercialStatus)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            render={
                              <Link
                                href={`/platform/projects/${project.projectId}`}
                              />
                            }
                          >
                            Open
                            <ArrowRightIcon
                              data-icon="inline-end"
                              aria-hidden="true"
                            />
                          </Button>
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

      <Card>
        <CardHeader>
          <CardTitle>Submissions</CardTitle>
          <CardDescription>
            Track wedding submissions from first draft through Diginoces review.
          </CardDescription>
          <CardAction>
            <Badge variant="outline">
              {pluralize(submissionCount, "submission")}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          {!details || details.submissions.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <InboxIcon aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle>No submissions yet</EmptyTitle>
                <EmptyDescription>
                  New wedding submissions appear here after they are created.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <>
              <div className="grid gap-3 md:hidden">
                {details.submissions.map((submission, index) => {
                  const status = String(submission.status);
                  const canSubmit =
                    status === "draft" || status === "changes_requested";
                  const submitAction = submitPartnerDashboardProjectAction.bind(
                    null,
                    partnerId,
                    String(submission.id),
                  );
                  const submissionName =
                    formatPartnerSubmissionCoupleDisplayName(submission, index);

                  return (
                    <div
                      className="workflow-record"
                      key={String(submission.id)}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="font-medium">{submissionName}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {formatProjectReference(submission.project_id)}
                          </p>
                        </div>
                        <Badge variant={statusBadgeVariant(status)}>
                          {formatLabel(status)}
                        </Badge>
                      </div>
                      {canSubmit && canSubmitPartnerProject ? (
                        <form action={submitAction}>
                          <Button
                            className="w-full"
                            variant="outline"
                            type="submit"
                          >
                            <SendIcon
                              data-icon="inline-start"
                              aria-hidden="true"
                            />
                            Send for review
                          </Button>
                        </form>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Waiting on Diginoces
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Wedding</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Next step</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {details.submissions.map((submission, index) => {
                      const status = String(submission.status);
                      const canSubmit =
                        status === "draft" || status === "changes_requested";
                      const submitAction =
                        submitPartnerDashboardProjectAction.bind(
                          null,
                          partnerId,
                          String(submission.id),
                        );
                      const submissionName =
                        formatPartnerSubmissionCoupleDisplayName(
                          submission,
                          index,
                        );

                      return (
                        <TableRow key={String(submission.id)}>
                          <TableCell className="min-w-56 whitespace-normal font-medium">
                            {submissionName}
                          </TableCell>
                          <TableCell className="min-w-48 whitespace-normal text-muted-foreground">
                            {formatProjectReference(submission.project_id)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusBadgeVariant(status)}>
                              {formatLabel(status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {canSubmit && canSubmitPartnerProject ? (
                              <form action={submitAction}>
                                <Button variant="outline" type="submit">
                                  <SendIcon
                                    data-icon="inline-start"
                                    aria-hidden="true"
                                  />
                                  Send for review
                                </Button>
                              </form>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                Waiting on Diginoces
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
