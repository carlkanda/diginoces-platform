import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  Building2Icon,
  ClipboardCheckIcon,
  InboxIcon,
  SendIcon,
  UserPlusIcon,
} from "lucide-react";
import {
  linkPartnerUserAction,
  submitPartnerProjectAction,
  updatePartnerStatusAction,
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
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import {
  hasGlobalPartnerPermission,
  hasPartnerPermission,
  requirePartnerPermission,
} from "@/lib/partners/partner-api";
import { getPartnerDetails } from "@/lib/partners/partner-db";
import {
  formatPartnerContactDisplay,
  formatPartnerOrganizationDisplay,
  formatPartnerSubmissionCoupleDisplayName,
} from "@/lib/partners/partner-service";
import { ProjectAccessError } from "@/lib/projects/project-api";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    partnerId: string;
  }>;
};

function formatValue(value: unknown) {
  return formatPartnerContactDisplay(value);
}

function formatOptionalDate(value: unknown) {
  if (typeof value !== "string" || value.length === 0) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(value));
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
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bId\b/g, "ID");
}

function formatPartnerStatus(value: unknown) {
  const labels: Record<string, string> = {
    active: "Active",
    archived: "Archived",
    inactive: "Inactive",
    pending: "Pending review",
    suspended: "Suspended",
  };
  const key = typeof value === "string" ? value : "";

  return labels[key] ?? formatLabel(value);
}

function formatSubmissionStatus(value: unknown) {
  const labels: Record<string, string> = {
    approved: "Approved",
    archived: "Archived",
    changes_requested: "Changes requested",
    draft: "Draft",
    rejected: "Rejected",
    submitted: "Ready for review",
  };
  const key = typeof value === "string" ? value : "";

  return labels[key] ?? formatLabel(value);
}

function formatSourceType(value: unknown) {
  const labels: Record<string, string> = {
    partner_assigned: "Assigned to partner",
    partner_originated: "Created by partner",
  };
  const key = typeof value === "string" ? value : "";

  return labels[key] ?? formatLabel(value);
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

  if (
    status === "draft" ||
    status === "pending" ||
    status === "changes_requested"
  ) {
    return "secondary";
  }

  return "outline";
}

function PartnerDetailBreadcrumb({ partnerName }: { partnerName?: string }) {
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
        <BreadcrumbItem>
          <BreadcrumbPage>{partnerName ?? "Partner profile"}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export default async function PartnerDetailPage({ params }: PageProps) {
  const { partnerId } = await params;
  const authContext = await getAuthContext();

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath(`/platform/partners/${partnerId}`));
  }

  if (authContext.status === "not_configured") {
    return (
      <div className="flex flex-col gap-6">
        <PartnerDetailBreadcrumb />

        <Card>
          <CardHeader>
            <CardTitle>
              <h1 className="text-2xl font-semibold tracking-normal text-balance">
                Partner profile
              </h1>
            </CardTitle>
            <CardDescription>
              Connect the workspace before loading partner records.
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
            <Alert>
              <Building2Icon aria-hidden="true" />
              <AlertTitle>Partner details are not connected</AlertTitle>
              <AlertDescription>
                Profile details and partner project activity will appear here
                after secure workspace access is ready.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  const supabase = authContext.supabase;
  const context = { supabase, user: authContext.user };

  try {
    await requirePartnerPermission(context, partnerId, "partners.read");
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      notFound();
    }

    throw error;
  }

  const [
    details,
    canManagePartners,
    canReviewProjects,
    canSubmitPartnerProjects,
  ] = await Promise.all([
    getPartnerDetails(supabase, partnerId),
    hasGlobalPartnerPermission(supabase, "partners.manage"),
    hasGlobalPartnerPermission(supabase, "partner_projects.review"),
    hasPartnerPermission(context, partnerId, "partner_projects.submit"),
  ]);

  if (!details) {
    notFound();
  }

  const partner = details.partner;
  const partnerName = formatPartnerOrganizationDisplay(
    partner.organization_name,
    0,
  );
  const updateStatusAction = updatePartnerStatusAction.bind(null, partnerId);
  const linkUserAction = linkPartnerUserAction.bind(null, partnerId);

  return (
    <div className="flex flex-col gap-6">
      <PartnerDetailBreadcrumb partnerName={partnerName} />

      <Card>
        <CardHeader>
          <CardTitle>
            <h1 className="text-2xl font-semibold tracking-normal text-balance">
              {partnerName}
            </h1>
          </CardTitle>
          <CardDescription>
            Review access, project submissions, and source records tied to this
            partner profile.
          </CardDescription>
          <CardAction>
            <Button
              variant="outline"
              render={
                <Link
                  href={`/platform/partner-dashboard?${new URLSearchParams({
                    partnerId,
                  }).toString()}`}
                />
              }
            >
              Partner dashboard
              <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusBadgeVariant(partner.status)}>
              {formatPartnerStatus(partner.status)}
            </Badge>
            <Badge variant="secondary">
              {formatLabel(partner.partner_type)}
            </Badge>
            <Badge variant="outline">
              {pluralize(details.users.length, "linked account")}
            </Badge>
          </div>

          <Separator />

          <dl className="grid gap-4 md:grid-cols-4">
            <div className="flex flex-col gap-1">
              <dt className="text-sm text-muted-foreground">Status</dt>
              <dd className="text-sm font-medium">
                {formatPartnerStatus(partner.status)}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-sm text-muted-foreground">Partner type</dt>
              <dd className="text-sm font-medium">
                {formatLabel(partner.partner_type)}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-sm text-muted-foreground">Contact email</dt>
              <dd className="text-sm font-medium">
                {formatValue(partner.contact_email)}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-sm text-muted-foreground">WhatsApp</dt>
              <dd className="text-sm font-medium">
                {formatValue(partner.whatsapp_phone)}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {canManagePartners ? (
        <Card>
          <CardHeader>
            <CardTitle>Profile controls</CardTitle>
            <CardDescription>
              Manage profile status and linked accounts. These changes affect
              whether the partner can prepare or submit wedding work.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 lg:grid-cols-2">
              <form action={updateStatusAction} className="flex flex-col gap-4">
                <FieldSet>
                  <FieldLegend>Lifecycle status</FieldLegend>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="status">Status</FieldLabel>
                      <NativeSelect
                        className="w-full"
                        defaultValue={String(partner.status)}
                        id="status"
                        name="status"
                      >
                        <NativeSelectOption value="pending">
                          Pending review
                        </NativeSelectOption>
                        <NativeSelectOption value="active">
                          Active
                        </NativeSelectOption>
                        <NativeSelectOption value="suspended">
                          Suspended
                        </NativeSelectOption>
                        <NativeSelectOption value="inactive">
                          Inactive
                        </NativeSelectOption>
                        <NativeSelectOption value="archived">
                          Archived
                        </NativeSelectOption>
                      </NativeSelect>
                      <FieldDescription>
                        Active partners can continue assigned work according to
                        their permissions.
                      </FieldDescription>
                    </Field>
                  </FieldGroup>
                </FieldSet>
                <div className="flex justify-end">
                  <Button type="submit">Save status</Button>
                </div>
              </form>

              <form action={linkUserAction} className="flex flex-col gap-4">
                <FieldSet>
                  <FieldLegend>Link account</FieldLegend>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="userId">
                        Account reference
                      </FieldLabel>
                      <Input id="userId" name="userId" required />
                      <FieldDescription>
                        Use the account identifier approved for this partner.
                      </FieldDescription>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="role">Role</FieldLabel>
                      <NativeSelect
                        className="w-full"
                        defaultValue="member"
                        id="role"
                        name="role"
                      >
                        <NativeSelectOption value="member">
                          Member
                        </NativeSelectOption>
                        <NativeSelectOption value="admin">
                          Admin
                        </NativeSelectOption>
                      </NativeSelect>
                    </Field>
                  </FieldGroup>
                </FieldSet>
                <div className="flex justify-end">
                  <Button type="submit">
                    <UserPlusIcon data-icon="inline-start" aria-hidden="true" />
                    Link account
                  </Button>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Alert>
          <ClipboardCheckIcon aria-hidden="true" />
          <AlertTitle>Profile controls are limited</AlertTitle>
          <AlertDescription>
            You can review this profile, but status and account changes require
            partner management access.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Linked accounts</CardTitle>
          <CardDescription>
            Accounts that can access this partner profile and their operational
            role.
          </CardDescription>
          <CardAction>
            <Badge variant="secondary">
              {pluralize(details.users.length, "account")}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          {details.users.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <InboxIcon aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle>No linked accounts yet</EmptyTitle>
                <EmptyDescription>
                  Linked partner accounts will appear here after a manager
                  grants access.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <>
              <div className="grid gap-3 md:hidden">
                {details.users.map((user) => (
                  <div className="workflow-record" key={String(user.id)}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="font-medium">
                          {formatLabel(user.role)}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Added {formatOptionalDate(user.created_at)}
                        </p>
                      </div>
                      <Badge variant={statusBadgeVariant(user.status)}>
                        {formatPartnerStatus(user.status)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Added</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {details.users.map((user) => (
                      <TableRow key={String(user.id)}>
                        <TableCell className="font-medium">
                          {formatLabel(user.role)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant(user.status)}>
                            {formatPartnerStatus(user.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatOptionalDate(user.created_at)}
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
          <CardTitle>Project submissions</CardTitle>
          <CardDescription>
            Drafts and submitted weddings created by this partner before they
            become active client work.
          </CardDescription>
          <CardAction>
            <Badge variant="outline">
              {pluralize(details.submissions.length, "submission")}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          {details.submissions.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <InboxIcon aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle>No partner-created weddings yet</EmptyTitle>
                <EmptyDescription>
                  Drafts and submitted weddings will appear here when this
                  partner starts a request.
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
                  const showWaiting =
                    (canSubmit && !canSubmitPartnerProjects) ||
                    (status === "submitted" && !canReviewProjects);
                  const submitAction = submitPartnerProjectAction.bind(
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
                          {formatSubmissionStatus(status)}
                        </Badge>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-muted-foreground">Created</span>
                        <span>{formatOptionalDate(submission.created_at)}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {canSubmit && canSubmitPartnerProjects ? (
                          <form action={submitAction}>
                            <Button variant="outline" type="submit">
                              <SendIcon
                                data-icon="inline-start"
                                aria-hidden="true"
                              />
                              Send for review
                            </Button>
                          </form>
                        ) : null}
                        {canReviewProjects && status === "submitted" ? (
                          <Button
                            variant="outline"
                            render={<Link href="/platform/partners/review" />}
                          >
                            Review
                            <ArrowRightIcon
                              data-icon="inline-end"
                              aria-hidden="true"
                            />
                          </Button>
                        ) : null}
                        {showWaiting ? (
                          <span className="text-sm text-muted-foreground">
                            Waiting on Diginoces
                          </span>
                        ) : null}
                      </div>
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
                      <TableHead>Created</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Next step</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {details.submissions.map((submission, index) => {
                      const status = String(submission.status);
                      const canSubmit =
                        status === "draft" || status === "changes_requested";
                      const showWaiting =
                        (canSubmit && !canSubmitPartnerProjects) ||
                        (status === "submitted" && !canReviewProjects);
                      const submitAction = submitPartnerProjectAction.bind(
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
                          <TableCell className="text-muted-foreground">
                            {formatOptionalDate(submission.created_at)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusBadgeVariant(status)}>
                              {formatSubmissionStatus(status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {canSubmit && canSubmitPartnerProjects ? (
                                <form action={submitAction}>
                                  <Button variant="outline" type="submit">
                                    <SendIcon
                                      data-icon="inline-start"
                                      aria-hidden="true"
                                    />
                                    Send for review
                                  </Button>
                                </form>
                              ) : null}
                              {canReviewProjects && status === "submitted" ? (
                                <Button
                                  variant="outline"
                                  render={
                                    <Link href="/platform/partners/review" />
                                  }
                                >
                                  Review
                                  <ArrowRightIcon
                                    data-icon="inline-end"
                                    aria-hidden="true"
                                  />
                                </Button>
                              ) : null}
                              {showWaiting ? (
                                <span className="text-sm text-muted-foreground">
                                  Waiting on Diginoces
                                </span>
                              ) : null}
                            </div>
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

      <Card>
        <CardHeader>
          <CardTitle>Source tracking</CardTitle>
          <CardDescription>
            Shows whether work was created by this partner or assigned by
            Diginoces.
          </CardDescription>
          <CardAction>
            <Badge variant="secondary">
              {pluralize(details.sources.length, "source")}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          {details.sources.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <InboxIcon aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle>No source records yet</EmptyTitle>
                <EmptyDescription>
                  Project source records appear after a partner-created or
                  partner-assigned wedding is connected here.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <>
              <div className="grid gap-3 md:hidden">
                {details.sources.map((source) => (
                  <div className="workflow-record" key={String(source.id)}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="font-medium">
                          {formatSourceType(source.source_type)}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatProjectReference(source.project_id)}
                        </p>
                      </div>
                      <Badge
                        variant={statusBadgeVariant(source.approval_status)}
                      >
                        {formatSubmissionStatus(source.approval_status)}
                      </Badge>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">Submitted</span>
                      <span>{formatOptionalDate(source.submitted_at)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {details.sources.map((source) => (
                      <TableRow key={String(source.id)}>
                        <TableCell className="min-w-48 whitespace-normal font-medium">
                          {formatSourceType(source.source_type)}
                        </TableCell>
                        <TableCell className="min-w-48 whitespace-normal text-muted-foreground">
                          {formatProjectReference(source.project_id)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatOptionalDate(source.submitted_at)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={statusBadgeVariant(source.approval_status)}
                          >
                            {formatSubmissionStatus(source.approval_status)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            Partner-originated and partner-assigned work remain under Diginoces
            review and permission controls.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
