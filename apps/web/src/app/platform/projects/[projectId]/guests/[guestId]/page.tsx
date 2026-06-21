import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  EyeIcon,
  LanguagesIcon,
  MessageCircleIcon,
  NotebookTextIcon,
  SaveIcon,
  ShieldCheckIcon,
  TagsIcon,
  UserRoundCogIcon,
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
import { requireGuestListContractGateOpen } from "@/lib/contracts/contract-gates";
import { requireGuestSidePermission } from "@/lib/guests/guest-api";
import {
  getGuestDetails,
  listGuestTags,
  listGuestTitleTypes,
  type GuestSide,
} from "@/lib/guests/guest-service";
import { ProjectAccessError } from "@/lib/projects/project-api";
import {
  getProjectDetails,
  listProjectEvents,
} from "@/lib/projects/project-service";
import {
  formatProjectCoupleDisplayName,
  formatProjectDisplayReference,
  formatProjectEventDisplayName,
  isInternalProjectDisplayText,
} from "@/lib/projects/project-foundation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateGuestAction } from "../actions";

export const dynamic = "force-dynamic";

function formatSide(side: GuestSide) {
  if (side === "both") {
    return "Both sides";
  }

  return side === "bride" ? "Bride side" : "Groom side";
}

function formatGuestCount(count: number) {
  return `${count} ${count === 1 ? "guest" : "guests"}`;
}

function formatGuestDisplayName(displayName: string) {
  return isInternalProjectDisplayText(displayName)
    ? "Guest profile"
    : displayName;
}

function formatPrivateTeamNotes(notes: string | null) {
  if (!notes) {
    return "";
  }

  return isInternalProjectDisplayText(notes) ||
    /\bqa[_\s-]?fixture\b/i.test(notes)
    ? ""
    : notes;
}

function getPreferredLanguageValue(language: string | null) {
  const normalizedLanguage = language?.trim().toLowerCase();

  if (normalizedLanguage === "en" || normalizedLanguage === "english") {
    return "en";
  }

  if (normalizedLanguage === "fr" || normalizedLanguage === "french") {
    return "fr";
  }

  return "";
}

const selectClassName =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50";

const multiSelectClassName =
  "min-h-32 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50";

type EditGuestPageProps = {
  params: Promise<{
    guestId: string;
    projectId: string;
  }>;
};

export default async function EditGuestPage({ params }: EditGuestPageProps) {
  const authContext = await getAuthContext();
  const { guestId, projectId } = await params;

  if (authContext.status === "anonymous") {
    redirect(
      buildLoginRedirectPath(
        `/platform/projects/${projectId}/guests/${guestId}`,
      ),
    );
  }

  if (authContext.status === "not_configured") {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2">
          <Badge variant="outline" className="w-fit">
            Secure guest profile
          </Badge>
          <h1 className="text-2xl font-semibold tracking-normal text-balance">
            Edit guest
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground text-pretty">
            Guest profiles will be editable after the workspace is connected to
            Diginoces access services.
          </p>
        </div>
        <Alert>
          <ShieldCheckIcon data-icon="inline-start" />
          <AlertTitle>Access setup needed</AlertTitle>
          <AlertDescription>
            Supabase is not configured for this environment, so the page cannot
            load this guest profile yet.
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  const supabase = await createSupabaseServerClient();
  const details = await getGuestDetails(supabase, guestId);

  if (!details || details.guest.project_id !== projectId) {
    notFound();
  }

  const permissionContext = {
    supabase,
    user: authContext.user,
  };

  try {
    await requireGuestSidePermission(
      permissionContext,
      projectId,
      details.guest.guest_side,
    );
    await requireGuestListContractGateOpen(permissionContext, projectId);
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      notFound();
    }

    throw error;
  }

  const { data: canPreviewPublicPage, error: previewPermissionError } =
    await supabase.rpc("current_user_can_access_project", {
      p_permission: "guest_public_pages.preview",
      p_project_id: projectId,
    });

  if (previewPermissionError) {
    throw previewPermissionError;
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

  const selectedEventIds = details.eventAssignments.map(
    (assignment) => assignment.event_id,
  );
  const selectedTagIds = details.tagAssignments.map(
    (assignment) => assignment.tag_id,
  );
  const action = updateGuestAction.bind(null, projectId, guestId);
  const projectReference = formatProjectDisplayReference(
    projectDetails.project,
    0,
  );
  const projectName = formatProjectCoupleDisplayName(projectDetails.project, 0);
  const guestDisplayName = formatGuestDisplayName(details.guest.display_name);
  const privateTeamNotes = formatPrivateTeamNotes(details.guest.internal_notes);
  const preferredLanguage = getPreferredLanguageValue(
    details.guest.preferred_language,
  );
  const invitationRoute = details.guest.is_printed_only
    ? "Printed invitation"
    : "Digital invitation";
  const activeState = details.guest.is_active ? "Active" : "Inactive";

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
            <BreadcrumbPage>{guestDisplayName}</BreadcrumbPage>
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
                  <Badge
                    variant={details.guest.is_active ? "default" : "secondary"}
                  >
                    {activeState}
                  </Badge>
                  <Badge variant="secondary">
                    {formatSide(details.guest.guest_side)}
                  </Badge>
                </div>
                <CardTitle>
                  <h1 className="text-2xl font-semibold tracking-normal text-balance">
                    {guestDisplayName}
                  </h1>
                </CardTitle>
                <CardDescription className="max-w-3xl text-pretty">
                  Keep this profile accurate for invitations, RSVP tracking,
                  event assignments, and event-day operations.
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
                {canPreviewPublicPage ? (
                  <Link
                    className={buttonVariants({ variant: "ghost" })}
                    href={`/platform/projects/${projectId}/guests/${guestId}/public-preview`}
                    aria-label={`Preview guest page for ${guestDisplayName}`}
                  >
                    <EyeIcon data-icon="inline-start" />
                    Preview guest page
                  </Link>
                ) : null}
              </CardAction>
            </CardHeader>
          </Card>

          <form action={action} className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserRoundCogIcon aria-hidden="true" />
                  <h2 className="text-base font-semibold">Profile identity</h2>
                </CardTitle>
                <CardDescription>
                  Update the guest-facing name, guest count type, and side
                  ownership.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup className="grid gap-4 lg:grid-cols-3">
                  <Field>
                    <FieldLabel htmlFor="displayName">Display name</FieldLabel>
                    <Input
                      defaultValue={guestDisplayName}
                      id="displayName"
                      name="displayName"
                      required
                    />
                    <FieldDescription>
                      The name shown on invitations, RSVP, and lists.
                    </FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="guestTitleTypeId">
                      Title or guest type
                    </FieldLabel>
                    <select
                      defaultValue={details.guest.guest_title_type_id ?? ""}
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
                      Sets the expected guest count for this profile.
                    </FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="guestSide">Guest side</FieldLabel>
                    <select
                      defaultValue={details.guest.guest_side}
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
                      Changing side ownership is permission-checked on save.
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
                    Communication and status
                  </h2>
                </CardTitle>
                <CardDescription>
                  Manage digital readiness, language, and whether this guest
                  remains active in the project.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup className="grid gap-4 lg:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="whatsappNumber">
                      WhatsApp number
                    </FieldLabel>
                    <Input
                      defaultValue={details.guest.whatsapp_number ?? ""}
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
                      defaultValue={preferredLanguage}
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

                  <Field className="guest-form-callout">
                    <label className="flex items-start gap-3 text-sm font-medium">
                      <input
                        defaultChecked={details.guest.is_printed_only}
                        name="isPrintedOnly"
                        type="checkbox"
                        className="mt-0.5 size-4 shrink-0 rounded border border-input accent-primary"
                      />
                      <span className="flex flex-col gap-1">
                        <span>Printed invitation only</span>
                        <span className="font-normal text-muted-foreground">
                          Excludes this guest from WhatsApp-required invitation
                          preparation.
                        </span>
                      </span>
                    </label>
                  </Field>

                  <Field className="guest-form-callout">
                    <label className="flex items-start gap-3 text-sm font-medium">
                      <input
                        defaultChecked={details.guest.is_active}
                        name="isActive"
                        type="checkbox"
                        className="mt-0.5 size-4 shrink-0 rounded border border-input accent-primary"
                      />
                      <span className="flex flex-col gap-1">
                        <span>Guest is active</span>
                        <span className="font-normal text-muted-foreground">
                          Turning this off removes the guest from active
                          operating lists and requires deactivation permission.
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
                  Keep event assignments, internal tags, and team notes aligned
                  with current plans.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup className="grid gap-4 lg:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="eventIds">
                      Event assignments
                    </FieldLabel>
                    <select
                      defaultValue={selectedEventIds}
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
                      defaultValue={selectedTagIds}
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
                      defaultValue={privateTeamNotes}
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
                  Updates are checked against side ownership, project access,
                  and deactivation rules before saving.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    className={buttonVariants({ variant: "outline" })}
                    href={`/platform/projects/${projectId}/guests`}
                    aria-label={`Cancel editing ${guestDisplayName}`}
                  >
                    Cancel
                  </Link>
                  <Button
                    aria-label={`Save changes for ${guestDisplayName}`}
                    type="submit"
                  >
                    <SaveIcon data-icon="inline-start" />
                    Save guest
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
                <h2 className="text-base font-semibold">Profile state</h2>
              </CardTitle>
              <CardAction>
                <CheckCircle2Icon
                  data-icon="inline-start"
                  className="text-primary"
                />
              </CardAction>
              <CardDescription>
                Current operating status for this guest.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    <UsersRoundIcon data-icon="inline-start" />
                    Side
                  </dt>
                  <dd className="font-medium">
                    {formatSide(details.guest.guest_side)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    <MessageCircleIcon data-icon="inline-start" />
                    Route
                  </dt>
                  <dd className="font-medium">{invitationRoute}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    <CalendarDaysIcon data-icon="inline-start" />
                    Events
                  </dt>
                  <dd className="font-medium">{selectedEventIds.length}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    <TagsIcon data-icon="inline-start" />
                    Tags
                  </dt>
                  <dd className="font-medium">{selectedTagIds.length}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    <LanguagesIcon data-icon="inline-start" />
                    Language
                  </dt>
                  <dd className="font-medium">
                    {preferredLanguage
                      ? preferredLanguage.toUpperCase()
                      : "Not set"}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Alert>
            <ShieldCheckIcon data-icon="inline-start" />
            <AlertTitle>Protected changes</AlertTitle>
            <AlertDescription>
              Side changes and deactivation are permission-checked on the
              server. If you turn off active status without permission, the
              update will be rejected.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>
                <h2 className="text-base font-semibold">Profile guidance</h2>
              </CardTitle>
              <CardDescription>
                Keep this guest ready for the next invitation or event-day
                action.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-3 text-sm">
                {[
                  {
                    icon: NotebookTextIcon,
                    title: "Keep notes factual",
                    description:
                      "Private notes should help team members act, not store sensitive details unnecessarily.",
                  },
                  {
                    icon: CalendarDaysIcon,
                    title: "Review event fit",
                    description:
                      "Event assignments drive invitation generation, RSVP views, and day-of operations.",
                  },
                  {
                    icon: MessageCircleIcon,
                    title: "Check digital readiness",
                    description:
                      "A digital guest needs a usable WhatsApp number before message preparation.",
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
        </aside>
      </section>
    </main>
  );
}
