import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  LanguagesIcon,
  MessageCircleIcon,
  NotebookTextIcon,
  PlusIcon,
  ShieldCheckIcon,
  TagsIcon,
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
import { redirectToMfaIfStepUpRequired } from "@/lib/auth/mfa-route-guard";
import { requireGuestListContractGateOpen } from "@/lib/contracts/contract-gates";
import { requireAnyGuestCreatePermission } from "@/lib/guests/guest-api";
import { listGuestTags, listGuestTitleTypes } from "@/lib/guests/guest-service";
import { ProjectAccessError } from "@/lib/projects/project-api";
import {
  getProjectDetails,
  listProjectEvents,
} from "@/lib/projects/project-service";
import {
  formatProjectCoupleDisplayName,
  formatProjectDisplayReference,
  formatProjectEventDisplayName,
} from "@/lib/projects/project-foundation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createGuestAction } from "../actions";

export const dynamic = "force-dynamic";

type NewGuestPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

function formatGuestCount(count: number) {
  return `${count} ${count === 1 ? "guest" : "guests"}`;
}

const selectClassName =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50";

const multiSelectClassName =
  "min-h-32 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50";

export default async function NewGuestPage({ params }: NewGuestPageProps) {
  const authContext = await getAuthContext();
  const { projectId } = await params;

  if (authContext.status === "anonymous") {
    redirect(
      buildLoginRedirectPath(`/platform/projects/${projectId}/guests/new`),
    );
  }

  if (authContext.status === "not_configured") {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2">
          <Badge variant="outline" className="w-fit">
            Secure guest list
          </Badge>
          <h1 className="text-2xl font-semibold tracking-normal text-balance">
            Add a guest
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground text-pretty">
            Guest creation will be available after the workspace is connected to
            Diginoces access services.
          </p>
        </div>
        <Alert>
          <ShieldCheckIcon data-icon="inline-start" />
          <AlertTitle>Access setup needed</AlertTitle>
          <AlertDescription>
            Supabase is not configured for this environment, so the page cannot
            load project guest data yet.
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  const supabase = await createSupabaseServerClient();

  const permissionContext = {
    supabase,
    user: authContext.user,
  };

  try {
    await requireAnyGuestCreatePermission(permissionContext, projectId);
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      await redirectToMfaIfStepUpRequired(
        permissionContext,
        `/platform/projects/${projectId}/guests/new`,
        [
          {
            permission: "guests.create",
            scope: "project",
            scopeId: projectId,
          },
          {
            permission: "guests.update",
            scope: "project",
            scopeId: projectId,
          },
          {
            permission: "guests.manage_bride_side",
            scope: "project",
            scopeId: projectId,
          },
          {
            permission: "guests.manage_groom_side",
            scope: "project",
            scopeId: projectId,
          },
        ],
      );
      notFound();
    }

    throw error;
  }

  try {
    await requireGuestListContractGateOpen(permissionContext, projectId);
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      notFound();
    }

    throw error;
  }

  const [projectDetails, events, tags, titleTypes] = await Promise.all([
    getProjectDetails(supabase, projectId),
    listProjectEvents(supabase, projectId),
    listGuestTags(supabase, projectId),
    listGuestTitleTypes(supabase, projectId),
  ]);

  if (!projectDetails) {
    notFound();
  }

  const action = createGuestAction.bind(null, projectId);
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
            <BreadcrumbPage>Add guest</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="has-data-[slot=card-action]:grid-cols-1 sm:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
              <div className="flex max-w-3xl flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">
                    {projectReference.label}: {projectReference.value}
                  </Badge>
                  <Badge variant="secondary">Manual entry</Badge>
                </div>
                <CardTitle>
                  <h1 className="text-2xl font-semibold tracking-normal text-balance">
                    Add a guest to {projectName}
                  </h1>
                </CardTitle>
                <CardDescription className="max-w-3xl text-pretty">
                  Create one guest or household with the invitation name, side,
                  contact route, event assignments, and private team notes the
                  operations team needs.
                </CardDescription>
              </div>
              <CardAction className="col-start-1 row-start-auto mt-3 flex flex-wrap gap-2 justify-self-start sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:mt-0 sm:justify-self-end">
                <Link
                  className={buttonVariants({ variant: "outline" })}
                  href={`/platform/projects/${projectId}/guests`}
                  aria-label={`Back to guest list for ${projectName}`}
                >
                  <ArrowLeftIcon data-icon="inline-start" />
                  Guest list
                </Link>
                <Link
                  className={buttonVariants({ variant: "ghost" })}
                  href={`/platform/projects/${projectId}`}
                  aria-label={`Back to project overview for ${projectName}`}
                >
                  Project overview
                </Link>
              </CardAction>
            </CardHeader>
          </Card>

          <form action={action} className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UsersRoundIcon aria-hidden="true" />
                  <h2 className="text-base font-semibold">Name and side</h2>
                </CardTitle>
                <CardDescription>
                  Use the name that should appear across invitations, lists, and
                  event-day operations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup className="grid gap-4 lg:grid-cols-3">
                  <Field>
                    <FieldLabel htmlFor="displayName">Display name</FieldLabel>
                    <Input id="displayName" name="displayName" required />
                    <FieldDescription>
                      The guest-facing name for invitations and RSVP.
                    </FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="guestTitleTypeId">
                      Title or guest type
                    </FieldLabel>
                    <select
                      id="guestTitleTypeId"
                      name="guestTitleTypeId"
                      required
                      className={selectClassName}
                    >
                      <option value="">Choose title or type</option>
                      {titleTypes.map((titleType) => (
                        <option key={titleType.id} value={titleType.id}>
                          {titleType.label} -{" "}
                          {formatGuestCount(titleType.default_guest_count)}
                        </option>
                      ))}
                    </select>
                    <FieldDescription>
                      Sets the expected guest count for this entry.
                    </FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="guestSide">Guest side</FieldLabel>
                    <select
                      id="guestSide"
                      name="guestSide"
                      required
                      className={selectClassName}
                    >
                      <option value="bride">Bride side</option>
                      <option value="groom">Groom side</option>
                      <option value="both">Both sides</option>
                    </select>
                    <FieldDescription>
                      Controls side ownership, filters, and permissions.
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircleIcon aria-hidden="true" />
                  <h2 className="text-base font-semibold">
                    Communication route
                  </h2>
                </CardTitle>
                <CardDescription>
                  Decide whether this guest can receive digital follow-up or
                  should stay on the printed invitation path.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup className="grid gap-4 lg:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="whatsappNumber">
                      WhatsApp number
                    </FieldLabel>
                    <Input
                      id="whatsappNumber"
                      name="whatsappNumber"
                      placeholder="+243..."
                    />
                    <FieldDescription>
                      Required for digital invitation and message preparation
                      unless the guest is printed-only.
                    </FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="preferredLanguage">
                      Language preference
                    </FieldLabel>
                    <select
                      id="preferredLanguage"
                      name="preferredLanguage"
                      className={selectClassName}
                    >
                      <option value="">Choose language</option>
                      <option value="en">English</option>
                      <option value="fr">French</option>
                    </select>
                    <FieldDescription>
                      Keeps guest-facing labels consistent in English or French.
                    </FieldDescription>
                  </Field>

                  <Field className="guest-form-callout lg:col-span-2">
                    <label className="flex items-start gap-3 text-sm font-medium">
                      <input
                        name="isPrintedOnly"
                        type="checkbox"
                        className="mt-0.5 size-4 shrink-0 rounded border border-input accent-primary"
                      />
                      <span className="flex flex-col gap-1">
                        <span>Printed invitation only</span>
                        <span className="font-normal text-muted-foreground">
                          Use this when the guest does not need WhatsApp-based
                          invitation or reminder preparation.
                        </span>
                      </span>
                    </label>
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDaysIcon aria-hidden="true" />
                  <h2 className="text-base font-semibold">
                    Events and organization
                  </h2>
                </CardTitle>
                <CardDescription>
                  Assign the guest to event lists and internal categories so
                  teams can prepare the right invitations and follow-ups.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup className="grid gap-4 lg:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="eventIds">
                      Event assignments
                    </FieldLabel>
                    <select
                      id="eventIds"
                      multiple
                      name="eventIds"
                      className={multiSelectClassName}
                    >
                      {events.map((event, eventIndex) => (
                        <option key={event.id} value={event.id}>
                          {formatProjectEventDisplayName(event, eventIndex)}
                        </option>
                      ))}
                    </select>
                    <FieldDescription>
                      Select every event this guest should be invited to.
                    </FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="tagIds">Tags</FieldLabel>
                    <select
                      id="tagIds"
                      multiple
                      name="tagIds"
                      className={multiSelectClassName}
                    >
                      {tags.map((tag) => (
                        <option key={tag.id} value={tag.id}>
                          {tag.name}
                        </option>
                      ))}
                    </select>
                    <FieldDescription>
                      Use tags for family groups, VIP handling, protocol, or
                      follow-up lists.
                    </FieldDescription>
                  </Field>

                  <Field className="lg:col-span-2">
                    <FieldLabel htmlFor="internalNotes">
                      Private team notes
                    </FieldLabel>
                    <Textarea
                      id="internalNotes"
                      name="internalNotes"
                      rows={4}
                    />
                    <FieldDescription>
                      Visible to authorized team members only. Keep it factual
                      and useful for operations.
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>

            <div className="sticky bottom-0 z-10 -mx-4 border-t bg-background px-4 py-3 sm:mx-0 sm:rounded-xl sm:border sm:bg-card">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  The guest will be checked against validation and permission
                  rules before it is saved.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    className={buttonVariants({ variant: "outline" })}
                    href={`/platform/projects/${projectId}/guests`}
                    aria-label={`Cancel adding a guest to ${projectName}`}
                  >
                    Cancel
                  </Link>
                  <Button
                    aria-label={`Create guest for ${projectName}`}
                    type="submit"
                  >
                    <PlusIcon data-icon="inline-start" />
                    Create guest
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>

        <aside className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>
                <h2 className="text-base font-semibold">Before saving</h2>
              </CardTitle>
              <CardDescription>
                These checks help keep invitations and event-day lists clean.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-3 text-sm">
                {[
                  {
                    icon: UsersRoundIcon,
                    title: "Use the invitation name",
                    description:
                      "Enter the person or household name exactly as the guest should see it.",
                  },
                  {
                    icon: MessageCircleIcon,
                    title: "Confirm WhatsApp readiness",
                    description:
                      "Digital guests need a usable WhatsApp number; printed-only guests do not.",
                  },
                  {
                    icon: TagsIcon,
                    title: "Tag for operations",
                    description:
                      "Categories help with VIP handling, family groups, and later follow-up.",
                  },
                ].map((item) => (
                  <li key={item.title} className="flex gap-3">
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <item.icon data-icon="inline-start" />
                    </span>
                    <span className="flex flex-col gap-0.5">
                      <span className="font-medium">{item.title}</span>
                      <span className="text-muted-foreground">
                        {item.description}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <h2 className="text-base font-semibold">Available setup</h2>
              </CardTitle>
              <CardAction>
                <CheckCircle2Icon
                  data-icon="inline-start"
                  className="text-primary"
                />
              </CardAction>
              <CardDescription>
                Current project options loaded for this form.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    <NotebookTextIcon data-icon="inline-start" />
                    Guest types
                  </dt>
                  <dd className="font-medium">{titleTypes.length}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    <CalendarDaysIcon data-icon="inline-start" />
                    Events
                  </dt>
                  <dd className="font-medium">{events.length}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    <TagsIcon data-icon="inline-start" />
                    Tags
                  </dt>
                  <dd className="font-medium">{tags.length}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    <LanguagesIcon data-icon="inline-start" />
                    Languages
                  </dt>
                  <dd className="font-medium">English, French</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Alert>
            <ShieldCheckIcon data-icon="inline-start" />
            <AlertTitle>Permission checked</AlertTitle>
            <AlertDescription>
              Only authorized project users can create guests, and side
              ownership is checked again when the form is submitted.
            </AlertDescription>
          </Alert>
        </aside>
      </section>
    </main>
  );
}
