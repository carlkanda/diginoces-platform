import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  LockKeyholeIcon,
  MessageSquareTextIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
  UsersRoundIcon,
} from "lucide-react";
import { createPartnerCommentAction } from "@/app/platform/partners/actions";
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
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import { serverLogger } from "@/lib/logging";
import { listProjectComments } from "@/lib/partners/partner-db";
import {
  hasProjectPermission,
  ProjectAccessError,
  requireProjectPermission,
} from "@/lib/projects/project-api";
import {
  formatProjectCoupleDisplayName,
  formatProjectDisplayReference,
  isInternalProjectDisplayText,
} from "@/lib/projects/project-foundation";
import { getProjectDetails } from "@/lib/projects/project-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type CommentNotice = {
  description: string;
  tone: "danger" | "success";
  title: string;
};

function publicCommentBody(value: unknown) {
  const text = typeof value === "string" ? value : String(value ?? "");

  if (!text || isInternalProjectDisplayText(text)) {
    return "Project update ready for review.";
  }

  return text;
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function formatLabel(value: unknown) {
  const text = typeof value === "string" ? value : String(value ?? "");

  if (!text) {
    return "Not set";
  }

  const labels: Record<string, string> = {
    internal_only: "Team only",
    partner_visible: "Partner visible",
  };

  if (labels[text]) {
    return labels[text];
  }

  return text
    .replaceAll("_", " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bApi\b/g, "App");
}

function formatDateTime(value: unknown) {
  const date = new Date(String(value ?? ""));

  if (Number.isNaN(date.getTime())) {
    return "Date not available";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function firstSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function commentNotice(query: {
  partnerError?: string | string[];
  partnerStatus?: string | string[];
}): CommentNotice | null {
  const status = firstSearchValue(query.partnerStatus);
  const error = firstSearchValue(query.partnerError);

  if (status === "project_comment_created") {
    return {
      description:
        "The update was added to the project thread with the selected visibility.",
      title: "Comment posted",
      tone: "success",
    };
  }

  if (error === "invalid_partner_request") {
    return {
      description:
        "The comment could not be saved. Check that the message is filled in and that the visibility is allowed for your role.",
      title: "Comment needs attention",
      tone: "danger",
    };
  }

  if (error === "partner_action_failed") {
    return {
      description:
        "The project thread could not be updated. Try again, then contact the Diginoces team if the problem continues.",
      title: "Comment was not posted",
      tone: "danger",
    };
  }

  return null;
}

type PageProps = {
  params: Promise<{
    projectId: string;
  }>;
  searchParams: Promise<{
    partnerError?: string | string[];
    partnerStatus?: string | string[];
  }>;
};

async function optionalProjectCommentPermission(
  context: Parameters<typeof hasProjectPermission>[0],
  projectId: string,
  permission: "project_comments.create" | "project_comments.internal.read",
) {
  try {
    return {
      allowed: await hasProjectPermission(context, projectId, permission),
      failed: false,
    };
  } catch (error) {
    serverLogger.error("Optional project comment permission check failed.", {
      error,
      permission,
      projectId,
    });

    return {
      allowed: false,
      failed: true,
    };
  }
}

export default async function ProjectCommentsPage({
  params,
  searchParams,
}: PageProps) {
  const { projectId } = await params;
  const query = await searchParams;
  const authContext = await getAuthContext();

  if (authContext.status === "anonymous") {
    redirect(
      buildLoginRedirectPath(`/platform/projects/${projectId}/comments`),
    );
  }

  if (authContext.status === "not_configured") {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/platform" />}>
                Workspace
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Project comments</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Card>
          <CardHeader>
            <CardTitle>
              <h1>Project comments are unavailable</h1>
            </CardTitle>
            <CardDescription>
              Shared updates will appear here after the workspace connection is
              ready.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <LockKeyholeIcon aria-hidden="true" />
              <AlertTitle>Connection required</AlertTitle>
              <AlertDescription>
                This page is secure by default. Ask a Diginoces administrator to
                finish the workspace connection before posting or reading
                project updates.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </main>
    );
  }

  const supabase = await createSupabaseServerClient();
  const context = { supabase, user: authContext.user };

  try {
    await requireProjectPermission(context, projectId, "project_comments.read");
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      notFound();
    }

    throw error;
  }

  const [details, comments, createCommentAccess, createInternalCommentAccess] =
    await Promise.all([
      getProjectDetails(supabase, projectId),
      listProjectComments(supabase, projectId),
      optionalProjectCommentPermission(
        context,
        projectId,
        "project_comments.create",
      ),
      optionalProjectCommentPermission(
        context,
        projectId,
        "project_comments.internal.read",
      ),
    ]);

  if (!details) {
    notFound();
  }

  const commentAction = createPartnerCommentAction.bind(null, projectId);
  const notice = commentNotice(query);
  const permissionCheckFailed =
    createCommentAccess.failed || createInternalCommentAccess.failed;
  const projectName = formatProjectCoupleDisplayName(details.project, 0);
  const projectReference = formatProjectDisplayReference(details.project, 0);
  const partnerVisibleCount = comments.filter(
    (comment) => comment.visibility === "partner_visible",
  ).length;
  const teamOnlyCount = comments.filter(
    (comment) => comment.visibility === "internal_only",
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
            <BreadcrumbPage>Comments</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader>
          <CardTitle>
            <h1>Wedding update thread</h1>
          </CardTitle>
          <CardDescription>
            Keep Diginoces, assigned partners, and internal reviewers aligned in
            one project-scoped thread. Choose the audience before posting.
          </CardDescription>
          <CardAction>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href={`/platform/projects/${projectId}`}
            >
              <ArrowLeftIcon aria-hidden="true" data-icon="inline-start" />
              Project overview
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant="secondary">Project thread</Badge>
          <Badge variant="outline">{projectName}</Badge>
          <Badge variant="outline">
            {pluralize(comments.length, "comment")}
          </Badge>
          <Badge variant="outline">
            {pluralize(partnerVisibleCount, "partner-visible note")}
          </Badge>
        </CardContent>
      </Card>

      {notice ? (
        <Alert variant={notice.tone === "danger" ? "destructive" : "default"}>
          {notice.tone === "danger" ? (
            <TriangleAlertIcon aria-hidden="true" />
          ) : (
            <CheckCircle2Icon aria-hidden="true" />
          )}
          <AlertTitle>{notice.title}</AlertTitle>
          <AlertDescription>{notice.description}</AlertDescription>
        </Alert>
      ) : null}

      {permissionCheckFailed ? (
        <Alert variant="destructive">
          <TriangleAlertIcon aria-hidden="true" />
          <AlertTitle>Comment permissions could not be checked</AlertTitle>
          <AlertDescription>
            You can still read the thread, but posting controls are hidden until
            Diginoces can confirm your access. Refresh the page or contact an
            administrator.
          </AlertDescription>
        </Alert>
      ) : null}

      <section className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-6">
          {createCommentAccess.allowed ? (
            <Card>
              <CardHeader>
                <CardTitle>Add a project update</CardTitle>
                <CardDescription>
                  Use the thread for decisions, handoffs, partner questions, or
                  context that should stay with this wedding.
                </CardDescription>
              </CardHeader>
              <form action={commentAction}>
                <CardContent>
                  <FieldSet>
                    <FieldLegend>Comment details</FieldLegend>
                    <FieldGroup>
                      <Field>
                        <FieldLabel htmlFor="comment-body">Comment</FieldLabel>
                        <Textarea
                          id="comment-body"
                          name="body"
                          placeholder="Write the update that should stay attached to this wedding."
                          required
                          rows={4}
                        />
                        <FieldDescription>
                          Keep private commercial details out of partner-visible
                          comments.
                        </FieldDescription>
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="comment-visibility">
                          Visibility
                        </FieldLabel>
                        <NativeSelect
                          className="w-full sm:w-72"
                          defaultValue="partner_visible"
                          id="comment-visibility"
                          name="visibility"
                        >
                          <NativeSelectOption value="partner_visible">
                            Partner visible
                          </NativeSelectOption>
                          {createInternalCommentAccess.allowed ? (
                            <NativeSelectOption value="internal_only">
                              Team only
                            </NativeSelectOption>
                          ) : null}
                        </NativeSelect>
                        <FieldDescription>
                          Partner-visible updates may be seen by authorized
                          partner users. Team-only updates stay internal.
                        </FieldDescription>
                      </Field>
                    </FieldGroup>
                  </FieldSet>
                </CardContent>
                <CardFooter className="justify-end">
                  <button className={buttonVariants()} type="submit">
                    <MessageSquareTextIcon
                      aria-hidden="true"
                      data-icon="inline-start"
                    />
                    Post comment
                  </button>
                </CardFooter>
              </form>
            </Card>
          ) : (
            <Alert>
              <LockKeyholeIcon aria-hidden="true" />
              <AlertTitle>Read-only access</AlertTitle>
              <AlertDescription>
                You can review the project thread, but your role cannot add
                comments to this wedding.
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Thread</CardTitle>
              <CardDescription>
                Shared project updates and team-only notes, newest first.
              </CardDescription>
              <CardAction>
                <Badge variant="outline">
                  {pluralize(comments.length, "comment")}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              {comments.length === 0 ? (
                <Empty className="border">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <MessageSquareTextIcon aria-hidden="true" />
                    </EmptyMedia>
                    <EmptyTitle>No comments yet</EmptyTitle>
                    <EmptyDescription>
                      Add the first update when there is a partner question,
                      review note, or decision that should stay with this
                      wedding.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="flex flex-col gap-3">
                  {comments.map((comment) => (
                    <article
                      className="rounded-xl border bg-background p-4"
                      key={String(comment.id)}
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex min-w-0 flex-col gap-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <strong className="text-sm font-medium">
                                {formatLabel(comment.author_type)}
                              </strong>
                              <Badge
                                variant={
                                  comment.visibility === "internal_only"
                                    ? "secondary"
                                    : "outline"
                                }
                              >
                                {formatLabel(comment.visibility)}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDateTime(comment.created_at)}
                            </span>
                          </div>
                        </div>
                        <p className="max-w-3xl text-sm leading-6 text-pretty">
                          {publicCommentBody(comment.body)}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Project context</CardTitle>
              <CardDescription>
                Confirm the wedding before adding an update.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                  {projectReference.label}
                </span>
                <strong className="text-sm font-medium">
                  {projectReference.value}
                </strong>
              </div>
              <Separator />
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                  Couple
                </span>
                <strong className="text-sm font-medium">{projectName}</strong>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Visibility guide</CardTitle>
              <CardDescription>
                Choose the audience before posting.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <UsersRoundIcon
                  aria-hidden="true"
                  className="mt-0.5 text-muted-foreground"
                />
                <div className="flex flex-col gap-1">
                  <strong className="text-sm font-medium">
                    Partner visible
                  </strong>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Use for partner questions, external handoffs, or updates
                    that assigned partner users may need.
                  </p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <ShieldCheckIcon
                  aria-hidden="true"
                  className="mt-0.5 text-muted-foreground"
                />
                <div className="flex flex-col gap-1">
                  <strong className="text-sm font-medium">Team only</strong>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Use for internal preparation notes. This option appears only
                    for roles with team-note access.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thread summary</CardTitle>
              <CardDescription>
                Current comment visibility for this wedding.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Partner visible</span>
                <Badge variant="outline">{partnerVisibleCount}</Badge>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Team only</span>
                <Badge variant="secondary">{teamOnlyCount}</Badge>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Total</span>
                <Badge>{comments.length}</Badge>
              </div>
            </CardContent>
          </Card>
        </aside>
      </section>
    </main>
  );
}
