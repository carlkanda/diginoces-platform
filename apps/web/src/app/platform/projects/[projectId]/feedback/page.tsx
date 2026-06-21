import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  ClipboardCheckIcon,
  MessageSquareTextIcon,
  ShieldCheckIcon,
  StarIcon,
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
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Field,
  FieldContent,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { requireAnyFeedbackPagePermission } from "@/lib/guest-wishes/guest-wish-api";
import {
  listPostEventFeedback,
  type PostEventFeedbackRow,
} from "@/lib/guest-wishes/guest-wish-db";
import { resolveGuestWishProjectPageContext } from "@/lib/guest-wishes/guest-wish-page-context";
import {
  formatProjectCoupleDisplayName,
  formatProjectDisplayReference,
  isInternalProjectDisplayText,
} from "@/lib/projects/project-foundation";
import { getProjectDetails } from "@/lib/projects/project-service";
import {
  reviewPostEventFeedbackAction,
  submitPostEventFeedbackAction,
} from "./actions";

export const dynamic = "force-dynamic";

const feedbackSuccessStatuses = new Set(["reviewed", "submitted"]);

type PageProps = {
  params: Promise<{
    projectId: string;
  }>;
  searchParams: Promise<{
    status?: string;
  }>;
};

const ratingOptions = [5, 4, 3, 2, 1];

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function formatLabel(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  const labels: Record<string, string> = {
    approved_for_public_use: "Approved for public use",
    pending: "Waiting for review",
    rejected: "Rejected",
    reviewed: "Reviewed",
    submitted: "Submitted",
  };

  return (
    labels[value] ??
    value
      .replaceAll("_", " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

function publicText(value: string | null | undefined, fallback: string) {
  if (!value || isInternalProjectDisplayText(value)) {
    return fallback;
  }

  return value;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Not recorded";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Time not recorded";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function ratingLabel(value: number | null) {
  if (!value) {
    return "Not rated";
  }

  return `${value}/5`;
}

function getReviewBadgeVariant(status: string) {
  if (status === "approved_for_public_use") {
    return "default" as const;
  }

  if (status === "rejected") {
    return "destructive" as const;
  }

  if (status === "reviewed") {
    return "secondary" as const;
  }

  return "outline" as const;
}

function feedbackNotice(status: string | undefined) {
  if (feedbackSuccessStatuses.has(status ?? "")) {
    return {
      description:
        status === "submitted"
          ? "The couple feedback response was saved."
          : "The testimonial review decision was saved.",
      title: "Feedback saved",
      variant: "default" as const,
    };
  }

  if (status === "error") {
    return {
      description: "The feedback action could not be saved.",
      title: "Feedback was not saved",
      variant: "destructive" as const,
    };
  }

  return null;
}

function FeedbackRatings({ feedback }: { feedback: PostEventFeedbackRow }) {
  return (
    <dl className="feedback-review__grid">
      <div className="feedback-review__metric">
        <dt className="feedback-review__metric-label">Overall</dt>
        <dd className="feedback-review__metric-value">
          {ratingLabel(feedback.overallRating)}
        </dd>
      </div>
      <div className="feedback-review__metric">
        <dt className="feedback-review__metric-label">Service</dt>
        <dd className="feedback-review__metric-value">
          {ratingLabel(feedback.serviceQualityRating)}
        </dd>
      </div>
      <div className="feedback-review__metric">
        <dt className="feedback-review__metric-label">Invitations</dt>
        <dd className="feedback-review__metric-value">
          {ratingLabel(feedback.invitationCommunicationRating)}
        </dd>
      </div>
    </dl>
  );
}

function RatingSelect({
  defaultValue,
  description,
  label,
  name,
  required = false,
}: {
  defaultValue: string;
  description: string;
  label: string;
  name: string;
  required?: boolean;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <NativeSelect
        defaultValue={defaultValue}
        id={name}
        name={name}
        required={required}
      >
        {!required ? (
          <NativeSelectOption value="">Not rated</NativeSelectOption>
        ) : null}
        {ratingOptions.map((rating) => (
          <NativeSelectOption key={rating} value={String(rating)}>
            {rating}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <FieldDescription>{description}</FieldDescription>
    </Field>
  );
}

export default async function PostEventFeedbackPage({
  params,
  searchParams,
}: PageProps) {
  const { projectId } = await params;
  const query = await searchParams;
  const pageContext = await resolveGuestWishProjectPageContext({
    nextPath: `/platform/projects/${projectId}/feedback`,
    notConfiguredMessage:
      "Feedback tools are not connected for this workspace yet. Once access is ready, private responses and testimonial review will appear here.",
    notConfiguredTitle: "Post-event feedback",
    projectId,
    requirePermission: requireAnyFeedbackPagePermission,
  });

  if (pageContext.status === "not_configured") {
    return pageContext.element;
  }

  const { permissions, supabase } = pageContext;
  const canSubmit = permissions.canSubmitFeedback;
  const canReview = permissions.canReviewFeedback;
  const canReadRecords = permissions.canReadFeedback || canReview;
  const [projectDetails, feedbackRows] = await Promise.all([
    getProjectDetails(supabase, projectId),
    canReadRecords ? listPostEventFeedback(supabase, projectId) : [],
  ]);

  if (!projectDetails) {
    notFound();
  }

  const projectName = formatProjectCoupleDisplayName(projectDetails.project, 0);
  const projectReference = formatProjectDisplayReference(
    projectDetails.project,
    0,
  );
  const latestFeedback = feedbackRows[0];
  const notice = feedbackNotice(query.status);
  const approvedCount = feedbackRows.filter(
    (feedback) => feedback.reviewStatus === "approved_for_public_use",
  ).length;
  const permissionCount = feedbackRows.filter(
    (feedback) => feedback.testimonialPermissionGranted,
  ).length;
  const waitingReviewCount = feedbackRows.filter(
    (feedback) =>
      feedback.reviewStatus !== "approved_for_public_use" &&
      feedback.reviewStatus !== "rejected",
  ).length;
  const defaultTab = canReadRecords ? "responses" : "submit";

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
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
              {projectReference.value}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Event feedback</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader>
          <CardTitle>
            <h1>Event feedback and testimonials</h1>
          </CardTitle>
          <CardDescription>
            Capture private couple feedback, keep testimonial permission
            explicit, and decide what can be reused outside the project.
          </CardDescription>
          <CardAction>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href={`/platform/projects/${projectId}/guest-book`}
            >
              <ArrowLeftIcon data-icon="inline-start" />
              Guest book
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant="secondary">Post-event review</Badge>
          <Badge variant="outline">{projectName}</Badge>
          <Badge variant="outline">
            {pluralize(feedbackRows.length, "response")}
          </Badge>
        </CardContent>
      </Card>

      {notice ? (
        <Alert variant={notice.variant}>
          {notice.variant === "destructive" ? (
            <TriangleAlertIcon data-icon="inline-start" />
          ) : (
            <CheckCircle2Icon data-icon="inline-start" />
          )}
          <AlertTitle>{notice.title}</AlertTitle>
          <AlertDescription>{notice.description}</AlertDescription>
        </Alert>
      ) : null}

      <section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Tabs className="flex min-w-0 flex-col gap-6" defaultValue={defaultTab}>
          <TabsList>
            {canReadRecords ? (
              <TabsTrigger value="responses">Responses</TabsTrigger>
            ) : null}
            {canSubmit ? (
              <TabsTrigger value="submit">Submit feedback</TabsTrigger>
            ) : null}
          </TabsList>

          {canReadRecords ? (
            <TabsContent value="responses">
              <div className="flex flex-col gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      <h2>Feedback review desk</h2>
                    </CardTitle>
                    <CardDescription>
                      Private feedback stays internal. Public testimonial use
                      requires couple permission and a reviewer decision.
                    </CardDescription>
                    <CardAction>
                      <Badge variant="secondary">
                        {pluralize(feedbackRows.length, "response")}
                      </Badge>
                    </CardAction>
                  </CardHeader>
                  <CardContent className="feedback-review">
                    <dl className="feedback-review__grid">
                      <div className="feedback-review__metric">
                        <dt className="feedback-review__metric-label">
                          Waiting review
                        </dt>
                        <dd className="feedback-review__metric-value">
                          {waitingReviewCount}
                        </dd>
                      </div>
                      <div className="feedback-review__metric">
                        <dt className="feedback-review__metric-label">
                          Permission granted
                        </dt>
                        <dd className="feedback-review__metric-value">
                          {permissionCount}
                        </dd>
                      </div>
                      <div className="feedback-review__metric">
                        <dt className="feedback-review__metric-label">
                          Public approved
                        </dt>
                        <dd className="feedback-review__metric-value">
                          {approvedCount}
                        </dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>

                {feedbackRows.length === 0 ? (
                  <Card>
                    <CardContent>
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <MessageSquareTextIcon />
                          </EmptyMedia>
                          <EmptyTitle>No feedback yet</EmptyTitle>
                          <EmptyDescription>
                            Couple feedback will appear here after a post-event
                            response is submitted.
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    </CardContent>
                  </Card>
                ) : (
                  feedbackRows.map((feedback) => (
                    <Card key={feedback.id}>
                      <CardHeader>
                        <CardTitle>
                          <p>
                            {publicText(
                              feedback.publicDisplayName,
                              "Private feedback response",
                            )}
                          </p>
                        </CardTitle>
                        <CardDescription>
                          Submitted {formatDateTime(feedback.submittedAt)}
                        </CardDescription>
                        <CardAction>
                          <Badge
                            variant={getReviewBadgeVariant(
                              feedback.reviewStatus,
                            )}
                          >
                            {formatLabel(feedback.reviewStatus)}
                          </Badge>
                        </CardAction>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-5">
                        <FeedbackRatings feedback={feedback} />
                        <blockquote className="feedback-review__quote">
                          {feedback.feedbackText}
                        </blockquote>
                        {feedback.improvementSuggestions ? (
                          <div className="flex flex-col gap-2">
                            <p className="text-sm font-medium">
                              Suggested improvements
                            </p>
                            <p className="text-sm leading-6 text-muted-foreground text-pretty">
                              {feedback.improvementSuggestions}
                            </p>
                          </div>
                        ) : null}
                        <Separator />
                        <div className="flex flex-col gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant={
                                feedback.testimonialPermissionGranted
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              Testimonial permission:{" "}
                              {feedback.testimonialPermissionGranted
                                ? "Granted"
                                : "Not granted"}
                            </Badge>
                            {feedback.testimonialText ? (
                              <Badge variant="outline">
                                Testimonial text provided
                              </Badge>
                            ) : null}
                          </div>
                          <p className="text-sm leading-6 text-muted-foreground text-pretty">
                            {publicText(
                              feedback.testimonialText,
                              "No testimonial text was provided.",
                            )}
                          </p>
                        </div>

                        {canReview ? (
                          <form
                            action={reviewPostEventFeedbackAction.bind(
                              null,
                              projectId,
                            )}
                            className="flex flex-col gap-4"
                          >
                            <input
                              name="feedbackId"
                              type="hidden"
                              value={feedback.id}
                            />
                            <FieldSet>
                              <FieldLegend>Reviewer decision</FieldLegend>
                              <FieldDescription>
                                Add a private note when the testimonial needs
                                context for future use.
                              </FieldDescription>
                              <FieldGroup>
                                <Field>
                                  <FieldLabel
                                    htmlFor={`internal-note-${feedback.id}`}
                                  >
                                    Private review note
                                  </FieldLabel>
                                  <Textarea
                                    id={`internal-note-${feedback.id}`}
                                    name="internalReviewNote"
                                    placeholder="Optional private note"
                                    rows={2}
                                  />
                                </Field>
                              </FieldGroup>
                            </FieldSet>
                            <div className="flex flex-wrap gap-2">
                              <button
                                className={buttonVariants({
                                  variant: "outline",
                                })}
                                name="reviewStatus"
                                type="submit"
                                value="reviewed"
                              >
                                <ClipboardCheckIcon data-icon="inline-start" />
                                Mark reviewed
                              </button>
                              <button
                                className={buttonVariants()}
                                disabled={
                                  !feedback.testimonialPermissionGranted
                                }
                                name="reviewStatus"
                                type="submit"
                                value="approved_for_public_use"
                              >
                                <CheckCircle2Icon data-icon="inline-start" />
                                Approve testimonial
                              </button>
                              <button
                                className={buttonVariants({
                                  variant: "destructive",
                                })}
                                name="reviewStatus"
                                type="submit"
                                value="rejected"
                              >
                                Reject testimonial
                              </button>
                            </div>
                          </form>
                        ) : null}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          ) : null}

          {canSubmit ? (
            <TabsContent value="submit">
              <Card>
                <CardHeader>
                  <CardTitle>
                    <h2>Couple feedback form</h2>
                  </CardTitle>
                  <CardDescription>
                    Capture private notes, service ratings, and optional
                    testimonial permission in one reviewable record.
                  </CardDescription>
                </CardHeader>
                <form
                  action={submitPostEventFeedbackAction.bind(null, projectId)}
                >
                  <CardContent>
                    <FieldSet>
                      <FieldLegend>Experience ratings</FieldLegend>
                      <FieldDescription>
                        Ratings help the team understand what went well and what
                        needs improvement.
                      </FieldDescription>
                      <FieldGroup className="grid gap-5 md:grid-cols-3">
                        <RatingSelect
                          defaultValue="5"
                          description="Required overall experience rating."
                          label="Overall rating"
                          name="overallRating"
                          required
                        />
                        <RatingSelect
                          defaultValue=""
                          description="Optional service quality score."
                          label="Service quality rating"
                          name="serviceQualityRating"
                        />
                        <RatingSelect
                          defaultValue=""
                          description="Optional invitation and message score."
                          label="Invitation and communication rating"
                          name="invitationCommunicationRating"
                        />
                      </FieldGroup>
                    </FieldSet>

                    <FieldSet>
                      <FieldLegend>Private feedback</FieldLegend>
                      <FieldDescription>
                        This section stays inside the project unless the couple
                        separately grants testimonial permission.
                      </FieldDescription>
                      <FieldGroup>
                        <Field>
                          <FieldLabel htmlFor="feedbackText">
                            Feedback
                          </FieldLabel>
                          <Textarea
                            id="feedbackText"
                            name="feedbackText"
                            required
                            rows={4}
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="improvementSuggestions">
                            Improvement suggestions
                          </FieldLabel>
                          <Textarea
                            id="improvementSuggestions"
                            name="improvementSuggestions"
                            rows={3}
                          />
                        </Field>
                      </FieldGroup>
                    </FieldSet>

                    <FieldSet>
                      <FieldLegend>Optional testimonial</FieldLegend>
                      <FieldDescription>
                        The team can only approve public use when permission is
                        granted and testimonial text is provided.
                      </FieldDescription>
                      <FieldGroup>
                        <Field>
                          <FieldLabel htmlFor="testimonialText">
                            Testimonial text
                          </FieldLabel>
                          <Textarea
                            id="testimonialText"
                            name="testimonialText"
                            rows={3}
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="publicDisplayName">
                            Public display name
                          </FieldLabel>
                          <Input
                            id="publicDisplayName"
                            name="publicDisplayName"
                            placeholder="Ada and Ben"
                          />
                        </Field>
                        <Field orientation="horizontal">
                          <Checkbox
                            id="testimonialPermissionGranted"
                            name="testimonialPermissionGranted"
                            value="on"
                          />
                          <FieldContent>
                            <FieldLabel htmlFor="testimonialPermissionGranted">
                              Allow Diginoces to review this testimonial for
                              public use
                            </FieldLabel>
                            <FieldDescription>
                              This does not publish anything automatically. It
                              only allows an authorized reviewer to approve it.
                            </FieldDescription>
                          </FieldContent>
                        </Field>
                      </FieldGroup>
                    </FieldSet>
                  </CardContent>
                  <CardFooter>
                    <button className={buttonVariants()} type="submit">
                      <MessageSquareTextIcon data-icon="inline-start" />
                      Submit feedback
                    </button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          ) : null}
        </Tabs>

        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>
                <h2>Latest response</h2>
              </CardTitle>
              <CardDescription>
                Most recent private feedback for this wedding.
              </CardDescription>
              <CardAction>
                <Badge variant="outline">
                  {latestFeedback
                    ? ratingLabel(latestFeedback.overallRating)
                    : "No response"}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground text-pretty">
                {latestFeedback
                  ? latestFeedback.feedbackText
                  : "Private notes and testimonial permissions will appear after the couple responds."}
              </p>
            </CardContent>
          </Card>

          <Alert>
            <ShieldCheckIcon data-icon="inline-start" />
            <AlertTitle>Testimonials require two approvals</AlertTitle>
            <AlertDescription>
              The couple must grant permission first. Then an authorized
              Diginoces reviewer decides whether the text can be used publicly.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>
                <h2>Review rules</h2>
              </CardTitle>
              <CardDescription>
                Keep the post-event record useful and private by default.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
              <p>
                Private feedback helps improve operations and is not public
                testimonial copy.
              </p>
              <Separator />
              <p>
                Approved testimonials can support future public use, but this
                page does not publish them automatically.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <h2>Service signal</h2>
              </CardTitle>
              <CardDescription>
                A quick read of the latest rating.
              </CardDescription>
              <CardAction>
                <StarIcon aria-hidden="true" data-icon="inline-start" />
              </CardAction>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tracking-normal">
                {latestFeedback
                  ? ratingLabel(latestFeedback.overallRating)
                  : "Not rated"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Overall event experience
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
