import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeftIcon,
  ClipboardCheckIcon,
  InboxIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { reviewPartnerProjectAction } from "@/app/platform/partners/actions";
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
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import { redirectToMfaIfStepUpRequired } from "@/lib/auth/mfa-route-guard";
import { listPartnerReviewQueue } from "@/lib/partners/partner-db";
import {
  formatPartnerOrganizationDisplay,
  formatPartnerSubmissionCoupleDisplayName,
} from "@/lib/partners/partner-service";
import {
  ProjectAccessError,
  requireGlobalPermission,
} from "@/lib/projects/project-api";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function partnerName(row: Record<string, unknown>, index: number) {
  const partner = row.partners;

  if (
    partner &&
    typeof partner === "object" &&
    "organization_name" in partner
  ) {
    return formatPartnerOrganizationDisplay(partner.organization_name, index);
  }

  return "Partner";
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

function plannedGuestCount(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `${value} planned ${value === 1 ? "guest" : "guests"}`;
  }

  return "Guest count not set";
}

export default async function PartnerReviewPage() {
  const authContext = await getAuthContext();

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath("/platform/partners/review"));
  }

  if (authContext.status === "not_configured") {
    return (
      <div className="flex flex-col gap-6">
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
              <BreadcrumbPage>Review queue</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Card>
          <CardHeader>
            <CardTitle>Partner project review</CardTitle>
            <CardDescription>
              Connect the workspace before loading submitted partner projects.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <ClipboardCheckIcon aria-hidden="true" />
              <AlertTitle>Review queue is not connected</AlertTitle>
              <AlertDescription>
                Submitted partner projects will appear here after secure access
                is ready.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  const context = { supabase, user: authContext.user };

  try {
    await requireGlobalPermission(context, "partner_projects.review");
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      await redirectToMfaIfStepUpRequired(
        context,
        "/platform/partners/review",
        {
          permission: "partner_projects.review",
          scope: "global",
        },
      );
      notFound();
    }

    throw error;
  }

  const queue = await listPartnerReviewQueue(supabase);

  return (
    <div className="flex flex-col gap-6">
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
            <BreadcrumbPage>Review queue</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex max-w-3xl flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Diginoces review</Badge>
                <Badge variant="outline">
                  {pluralize(queue.length, "submission")}
                </Badge>
                <Badge variant="outline">MFA protected</Badge>
              </div>
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-semibold tracking-normal text-balance">
                  Partner project review
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground text-pretty">
                  Review partner-submitted wedding projects before they become
                  active client work under Diginoces controls.
                </p>
              </div>
            </div>
            <Button
              render={<Link href="/platform/partners" />}
              variant="outline"
            >
              <ArrowLeftIcon data-icon="inline-start" />
              Partners
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <ShieldCheckIcon aria-hidden="true" />
            <AlertTitle>Review decisions affect project access</AlertTitle>
            <AlertDescription>
              Approve only submissions that are ready to move into Diginoces
              operations. Use requested changes when the partner should correct
              details first.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {queue.length === 0 ? (
        <Card>
          <CardContent>
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <InboxIcon aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle>No submissions waiting</EmptyTitle>
                <EmptyDescription>
                  Partner project submissions that need a team decision will
                  appear here.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {queue.map((submission, index) => {
            const reviewAction = reviewPartnerProjectAction.bind(
              null,
              String(submission.id),
            );
            const submissionName = formatPartnerSubmissionCoupleDisplayName(
              submission,
              index,
            );
            const submissionPartnerName = partnerName(submission, index);

            return (
              <Card
                aria-label={`${submissionName}. Status: ${formatLabel(
                  submission.status,
                )}. Partner: ${submissionPartnerName}.`}
                key={String(submission.id)}
              >
                <CardHeader>
                  <CardTitle>{submissionName}</CardTitle>
                  <CardDescription>
                    {submissionPartnerName} -{" "}
                    {plannedGuestCount(submission.planned_guest_count)}
                  </CardDescription>
                  <CardAction>
                    <Badge variant="outline">
                      {formatLabel(submission.status)}
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="partner-network__metrics">
                    <div className="partner-network__metric">
                      <span className="partner-network__metric-label">
                        Partner
                      </span>
                      <strong className="partner-network__metric-value text-base">
                        {submissionPartnerName}
                      </strong>
                    </div>
                    <div className="partner-network__metric">
                      <span className="partner-network__metric-label">
                        Guest estimate
                      </span>
                      <strong className="partner-network__metric-value text-base">
                        {plannedGuestCount(submission.planned_guest_count)}
                      </strong>
                    </div>
                    <div className="partner-network__metric">
                      <span className="partner-network__metric-label">
                        Current state
                      </span>
                      <strong className="partner-network__metric-value text-base">
                        {formatLabel(submission.status)}
                      </strong>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <form action={reviewAction} className="w-full">
                    <FieldSet>
                      <FieldLegend>Review decision</FieldLegend>
                      <FieldGroup className="md:grid md:grid-cols-[minmax(160px,0.4fr)_minmax(0,1fr)_auto] md:items-end">
                        <Field>
                          <FieldLabel htmlFor={`action-${submission.id}`}>
                            Decision
                          </FieldLabel>
                          <NativeSelect
                            className="w-full"
                            defaultValue="approve"
                            id={`action-${submission.id}`}
                            name="action"
                          >
                            <NativeSelectOption value="approve">
                              Approve
                            </NativeSelectOption>
                            <NativeSelectOption value="request_changes">
                              Request changes
                            </NativeSelectOption>
                            <NativeSelectOption value="reject">
                              Reject
                            </NativeSelectOption>
                            <NativeSelectOption value="archive">
                              Archive
                            </NativeSelectOption>
                          </NativeSelect>
                        </Field>
                        <Field>
                          <FieldLabel htmlFor={`reason-${submission.id}`}>
                            Reason
                          </FieldLabel>
                          <Input
                            id={`reason-${submission.id}`}
                            name="reason"
                            placeholder="Brief decision note"
                            required
                          />
                          <FieldDescription>
                            This note is kept with the partner review history.
                          </FieldDescription>
                        </Field>
                        <Button type="submit">Save review</Button>
                      </FieldGroup>
                    </FieldSet>
                  </form>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      <Separator />
    </div>
  );
}
