import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  HeartHandshakeIcon,
  MessageSquareTextIcon,
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
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { requireGuestMessageCoupleReviewPermission } from "@/lib/guest-wishes/guest-wish-api";
import { listCoupleGuestMessages } from "@/lib/guest-wishes/guest-wish-db";
import { resolveGuestWishProjectPageContext } from "@/lib/guest-wishes/guest-wish-page-context";
import {
  formatProjectCoupleDisplayName,
  formatProjectDisplayReference,
  isInternalProjectDisplayText,
} from "@/lib/projects/project-foundation";
import { getProjectDetails } from "@/lib/projects/project-service";
import { ConfirmSubmitButton } from "../confirm-submit-button";
import { coupleReviewGuestMessageAction } from "../actions";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    projectId: string;
  }>;
  searchParams: Promise<{
    status?: string;
  }>;
};

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function formatLabel(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return value
    .replaceAll("_", " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function publicMessageText(
  value: string | null | undefined,
  fallback = "Message text is not ready yet",
) {
  if (!value || isInternalProjectDisplayText(value)) {
    return fallback;
  }

  return value;
}

function guestBookGuestName(value: string, index: number) {
  return isInternalProjectDisplayText(value) ? `Guest ${index + 1}` : value;
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

function getStatusBadgeVariant(status: string) {
  if (status === "excluded" || status === "couple_correction_requested") {
    return "destructive" as const;
  }

  if (status === "couple_approved") {
    return "default" as const;
  }

  if (status === "archived") {
    return "outline" as const;
  }

  return "secondary" as const;
}

function reviewNotice(query: { status?: string }) {
  if (query.status === "reviewed") {
    return {
      description: "The couple review decision was saved.",
      title: "Decision saved",
      variant: "default" as const,
    };
  }

  if (query.status === "error") {
    return {
      description: "The couple review action could not be saved.",
      title: "Decision was not saved",
      variant: "destructive" as const,
    };
  }

  return null;
}

export default async function CoupleGuestBookReviewPage({
  params,
  searchParams,
}: PageProps) {
  const { projectId } = await params;
  const query = await searchParams;
  const pageContext = await resolveGuestWishProjectPageContext({
    nextPath: `/platform/projects/${projectId}/guest-book/couple-review`,
    notConfiguredMessage:
      "Couple review is not connected for this workspace yet. Once access is ready, approved guest wishes will appear here.",
    notConfiguredTitle: "Couple guest-book review",
    projectId,
    requirePermission: requireGuestMessageCoupleReviewPermission,
  });

  if (pageContext.status === "not_configured") {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>
              <h1>Guest-book approval</h1>
            </CardTitle>
            <CardDescription>
              Approved guest wishes will appear after this environment is
              connected to Diginoces access services.
            </CardDescription>
          </CardHeader>
        </Card>
        <Alert>
          <HeartHandshakeIcon data-icon="inline-start" />
          <AlertTitle>Access setup needed</AlertTitle>
          <AlertDescription>
            Couple review is not connected for this workspace yet.
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  const [projectDetails, messages] = await Promise.all([
    getProjectDetails(pageContext.supabase, projectId),
    listCoupleGuestMessages(pageContext.supabase, projectId),
  ]);

  if (!projectDetails) {
    notFound();
  }

  const projectName = formatProjectCoupleDisplayName(projectDetails.project, 0);
  const projectReference = formatProjectDisplayReference(
    projectDetails.project,
    0,
  );
  const notice = reviewNotice(query);
  const nextMessage = messages[0];
  const nextGuestName = nextMessage
    ? guestBookGuestName(nextMessage.guestDisplayName, 0)
    : "Guest message";
  const nextMessageText = nextMessage
    ? publicMessageText(nextMessage.approvedText)
    : "Messages approved by the team will appear here for the couple decision.";
  const approvedCount = messages.filter(
    (message) => message.status === "couple_approved",
  ).length;
  const correctionCount = messages.filter(
    (message) => message.status === "couple_correction_requested",
  ).length;
  const excludedCount = messages.filter(
    (message) => message.status === "excluded",
  ).length;

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
            <BreadcrumbLink
              render={
                <Link href={`/platform/projects/${projectId}/guest-book`} />
              }
            >
              Guest book
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Couple review</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader>
          <CardTitle>
            <h1>Review guest-book messages</h1>
          </CardTitle>
          <CardDescription>
            Approve the guest wishes that should become part of the final
            keepsake, or send a clear note back to the team when something needs
            correction.
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
          <Badge variant="secondary">Couple approval</Badge>
          <Badge variant="outline">{projectName}</Badge>
          <Badge variant="outline">
            {pluralize(messages.length, "prepared message")}
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

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>
                <h2>Decision queue</h2>
              </CardTitle>
              <CardDescription>
                Each message has already passed team moderation. This step
                confirms what the couple wants in the keepsake.
              </CardDescription>
              <CardAction>
                <Badge variant="secondary">
                  {pluralize(messages.length, "prepared message")}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="review-board">
              <dl className="review-board__summary">
                <div className="review-board__stat">
                  <dt className="review-board__stat-label">Approved</dt>
                  <dd className="review-board__stat-value">{approvedCount}</dd>
                  <dd className="review-board__stat-note">
                    Kept for the final book
                  </dd>
                </div>
                <div className="review-board__stat">
                  <dt className="review-board__stat-label">Needs correction</dt>
                  <dd className="review-board__stat-value">
                    {correctionCount}
                  </dd>
                  <dd className="review-board__stat-note">
                    Sent back to the team
                  </dd>
                </div>
                <div className="review-board__stat">
                  <dt className="review-board__stat-label">Excluded</dt>
                  <dd className="review-board__stat-value">{excludedCount}</dd>
                  <dd className="review-board__stat-note">
                    Left out of the keepsake
                  </dd>
                </div>
              </dl>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="review-board__lane">
                  <div className="review-board__lane-header">
                    <p className="review-board__lane-title">
                      Approve what feels right
                    </p>
                    <Badge variant="secondary">
                      {pluralize(messages.length, "note")}
                    </Badge>
                  </div>
                  <p className="review-board__lane-copy">
                    Every message here has already passed team moderation and is
                    waiting for the couple decision.
                  </p>
                </div>
                <div className="review-board__lane">
                  <div className="review-board__lane-header">
                    <p className="review-board__lane-title">
                      Send clear changes
                    </p>
                    <Badge variant="outline">
                      {pluralize(correctionCount, "correction")}
                    </Badge>
                  </div>
                  <p className="review-board__lane-copy">
                    Request a correction when wording, names, or tone need a
                    careful adjustment before export.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4">
            {messages.length === 0 ? (
              <Card>
                <CardContent>
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <HeartHandshakeIcon />
                      </EmptyMedia>
                      <EmptyTitle>No messages ready</EmptyTitle>
                      <EmptyDescription>
                        Diginoces will send moderated guest messages here before
                        the final guest-book file is prepared.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </CardContent>
              </Card>
            ) : (
              messages.map((message, messageIndex) => {
                const guestName = guestBookGuestName(
                  message.guestDisplayName,
                  messageIndex,
                );

                return (
                  <Card key={message.id}>
                    <CardHeader>
                      <CardTitle>
                        <h2>{guestName}</h2>
                      </CardTitle>
                      <CardDescription>
                        Submitted {formatDateTime(message.submittedAt)}
                      </CardDescription>
                      <CardAction>
                        <Badge variant={getStatusBadgeVariant(message.status)}>
                          {formatLabel(message.status)}
                        </Badge>
                      </CardAction>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-5">
                      <blockquote className="review-board__quote text-pretty">
                        {publicMessageText(message.approvedText)}
                      </blockquote>
                      {message.coupleComment ? (
                        <Alert>
                          <MessageSquareTextIcon data-icon="inline-start" />
                          <AlertTitle>Previous couple note</AlertTitle>
                          <AlertDescription>
                            {message.coupleComment}
                          </AlertDescription>
                        </Alert>
                      ) : null}
                      <form
                        action={coupleReviewGuestMessageAction.bind(
                          null,
                          projectId,
                        )}
                        className="flex flex-col gap-4"
                      >
                        <input
                          name="messageId"
                          type="hidden"
                          value={message.id}
                        />
                        <FieldSet>
                          <FieldLegend>Couple decision</FieldLegend>
                          <FieldDescription>
                            Add a note only when the team needs context for a
                            correction or exclusion.
                          </FieldDescription>
                          <FieldGroup>
                            <Field>
                              <FieldLabel htmlFor={`comment-${message.id}`}>
                                Optional note
                              </FieldLabel>
                              <Textarea
                                id={`comment-${message.id}`}
                                name="comment"
                                placeholder="Explain what should be corrected or why this note should be excluded."
                              />
                              <FieldDescription>
                                This note is internal to the Diginoces review
                                workflow.
                              </FieldDescription>
                            </Field>
                          </FieldGroup>
                        </FieldSet>
                        <div className="review-board__actions">
                          <button
                            aria-label={`Approve guest-book message from ${guestName}`}
                            className={buttonVariants()}
                            name="action"
                            type="submit"
                            value="approve"
                          >
                            <CheckCircle2Icon data-icon="inline-start" />
                            Approve
                          </button>
                          <button
                            aria-label={`Request a correction for guest-book message from ${guestName}`}
                            className={buttonVariants({ variant: "outline" })}
                            name="action"
                            type="submit"
                            value="request_correction"
                          >
                            Request correction
                          </button>
                          <ConfirmSubmitButton
                            aria-label={`Exclude guest-book message from ${guestName}`}
                            className={buttonVariants({
                              variant: "destructive",
                            })}
                            message="Exclude this message from the guest-book export?"
                            name="action"
                            type="submit"
                            value="exclude"
                          >
                            Exclude
                          </ConfirmSubmitButton>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>
                <h2>Next note</h2>
              </CardTitle>
              <CardDescription>
                The first message currently waiting in the queue.
              </CardDescription>
              <CardAction>
                <Badge variant="outline">{nextGuestName}</Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <blockquote className="review-board__quote text-pretty">
                {nextMessageText}
              </blockquote>
            </CardContent>
          </Card>

          <Alert>
            <ShieldCheckIcon data-icon="inline-start" />
            <AlertTitle>Couple decisions shape the final keepsake</AlertTitle>
            <AlertDescription>
              Approved messages can move into the final guest-book export.
              Correction requests return to the team before export.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>
                <h2>Decision guide</h2>
              </CardTitle>
              <CardDescription>
                Keep the review quick and consistent.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
              <p>
                Approve messages that are ready to preserve as written. Request
                correction when a name, wording, or tone needs adjustment.
              </p>
              <Separator />
              <p>
                Exclude a message only when it should not appear in the final
                keepsake at all.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
