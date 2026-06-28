import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeftIcon,
  CalendarPlusIcon,
  LockKeyholeIcon,
  SaveIcon,
  ShieldCheckIcon,
  UserPlusIcon,
} from "lucide-react";
import {
  assignProjectMemberAction,
  createProjectEventAction,
  updateProjectMemberStatusAction,
  updateProjectSettingsAction,
} from "@/app/platform/projects/[projectId]/settings/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
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
import { formatDiginocesDateTime } from "@/lib/dates/format-date";
import {
  eventTypeOptions,
  formatProjectCoupleDisplayName,
  getProjectLifecycleLabel,
  projectLifecycleOptions,
} from "@/lib/projects/project-foundation";
import { hasProjectPermission } from "@/lib/projects/project-api";
import {
  listAssignableProjectRoles,
  listProjectMembersForAdmin,
  type AccessMember,
  type AssignableRole,
  type MembershipStatus,
} from "@/lib/projects/project-access-service";
import { getProjectDetails } from "@/lib/projects/project-service";
import { getRequestLanguage } from "@/lib/i18n/server";
import { translateStaticCopy } from "@/lib/i18n/static-translations";
import type { SupportedLanguage } from "@/lib/i18n/config";
import { serverLogger } from "@/lib/logging";
import { roleDefinitions } from "@/lib/security/permissions";

export const dynamic = "force-dynamic";

type ProjectSettingsPageProps = {
  params: Promise<{
    projectId: string;
  }>;
  searchParams?: Promise<{
    setupError?: string;
    setupStatus?: string;
  }>;
};

type AccessLoadResult<T> = {
  data: T;
  error: string | null;
};

const emptySearchParams: Promise<{
  setupError?: string;
  setupStatus?: string;
}> = Promise.resolve({});

const membershipStatusOptions: {
  label: string;
  value: MembershipStatus;
}[] = [
  { label: "Active", value: "active" },
  { label: "Invited", value: "invited" },
  { label: "Suspended", value: "suspended" },
  { label: "Removed", value: "removed" },
];

function membershipStatusLabel(status: MembershipStatus) {
  return (
    membershipStatusOptions.find((option) => option.value === status)?.label ??
    status
  );
}

function formatSettingsCopy(value: string, language: SupportedLanguage) {
  return translateStaticCopy(value, language);
}

function isBuiltInRoleSlug(slug: string) {
  return Object.prototype.hasOwnProperty.call(roleDefinitions, slug);
}

function formatRoleText(
  role: Pick<AssignableRole, "description" | "name" | "slug">,
  field: "description" | "name",
  language: SupportedLanguage,
) {
  const value = role[field];

  return isBuiltInRoleSlug(role.slug)
    ? formatSettingsCopy(value, language)
    : value;
}

async function loadAccessData<T>(
  loader: () => Promise<T>,
  fallback: T,
  logMessage: string,
  userMessage: string,
): Promise<AccessLoadResult<T>> {
  try {
    return {
      data: await loader(),
      error: null,
    };
  } catch (error) {
    serverLogger.error(logMessage, { error });

    return {
      data: fallback,
      error: userMessage,
    };
  }
}

function setupErrorMessage(error: string | undefined) {
  switch (error) {
    case "invalid_setup_request":
      return "Check the entered setup details, then try again.";
    case "permission_denied":
      return "This account is not allowed to perform that setup action.";
    case "setup_action_failed":
      return "The setup action could not be completed. Review the submitted data and try again.";
    case "supabase_not_configured":
      return "Setup is unavailable until the workspace connection is ready.";
    default:
      return null;
  }
}

function setupStatusMessage(status: string | undefined) {
  switch (status) {
    case "project_member_assigned":
      return "Project access was updated.";
    case "project_member_updated":
      return "Project member status was updated.";
    case "project_updated":
      return "Wedding project details were saved.";
    default:
      return null;
  }
}

function formatDateTime(value: string, language: SupportedLanguage) {
  return formatDiginocesDateTime(value, language === "fr" ? "fr-FR" : "en");
}

function formatMemberName(displayName: string | null, email: string) {
  return displayName && displayName.trim().length > 0 ? displayName : email;
}

function formatAssignedCount(count: number, language: SupportedLanguage) {
  if (language === "fr") {
    return `${count} attribution${count === 1 ? "" : "s"}`;
  }

  return `${count} assigned`;
}

function projectStatusChangeConfirmMessage(
  language: SupportedLanguage,
  member: AccessMember,
) {
  const memberName = formatMemberName(member.displayName, member.email);

  if (language === "fr") {
    return `Modifier le statut d’accès de ${memberName} pour ce mariage ? Cela peut changer les pages du mariage que cette personne peut ouvrir.`;
  }

  return `Change ${memberName}'s wedding access status? This can change which wedding pages they can open.`;
}

export default async function ProjectSettingsPage({
  params,
  searchParams,
}: ProjectSettingsPageProps) {
  const [{ projectId }, query, authContext, language] = await Promise.all([
    params,
    searchParams ?? emptySearchParams,
    getAuthContext(),
    getRequestLanguage(),
  ]);
  const t = (value: string) => formatSettingsCopy(value, language);

  if (authContext.status === "anonymous") {
    redirect(
      buildLoginRedirectPath(`/platform/projects/${projectId}/settings`),
    );
  }

  if (authContext.status === "not_configured") {
    return (
      <main className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("Wedding setup")}</CardTitle>
            <CardDescription>
              {t(
                "Setup controls will appear after the workspace connection is ready.",
              )}
            </CardDescription>
          </CardHeader>
        </Card>
        <Alert>
          <LockKeyholeIcon aria-hidden="true" />
          <AlertTitle>{t("Workspace connection pending")}</AlertTitle>
          <AlertDescription>
            {t(
              "Project setup stays closed until the secure workspace connection is configured.",
            )}
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  const context = {
    supabase: authContext.supabase,
    user: authContext.user,
  };

  const [
    canUpdateProject,
    canCreateEvents,
    canReadProjectMembers,
    canManageProjectMembers,
  ] = await Promise.all([
    hasProjectPermission(context, projectId, "projects.update"),
    hasProjectPermission(context, projectId, "events.create"),
    hasProjectPermission(context, projectId, "project_members.read"),
    hasProjectPermission(context, projectId, "project_members.manage"),
  ]);

  if (
    !canUpdateProject &&
    !canCreateEvents &&
    !canReadProjectMembers &&
    !canManageProjectMembers
  ) {
    notFound();
  }

  const details = await getProjectDetails(authContext.supabase, projectId);

  if (!details) {
    notFound();
  }

  const canLoadProjectMembers =
    canReadProjectMembers || canManageProjectMembers;
  const [projectRolesLoad, projectMembersLoad] = await Promise.all([
    canManageProjectMembers
      ? loadAccessData(
          () => listAssignableProjectRoles(authContext.supabase),
          [],
          "Project role listing failed.",
          "Role options could not be loaded safely. Adding new access is paused until the data can be verified.",
        )
      : Promise.resolve({ data: [], error: null }),
    canLoadProjectMembers
      ? loadAccessData(
          () => listProjectMembersForAdmin(authContext.supabase, projectId),
          [],
          "Project member listing failed.",
          "Access assignments could not be loaded safely. Management controls are paused until the data can be verified.",
        )
      : Promise.resolve({ data: [], error: null }),
  ]);
  const projectRoles = projectRolesLoad.data;
  const projectMembers = projectMembersLoad.data;
  const projectRolesLoadError = projectRolesLoad.error;
  const projectMembersLoadError = projectMembersLoad.error;
  const canAssignProjectMembers =
    canManageProjectMembers &&
    !projectRolesLoadError &&
    !projectMembersLoadError &&
    projectRoles.length > 0;
  const canUpdateProjectMemberStatuses =
    canManageProjectMembers && !projectMembersLoadError;
  const projectName = formatProjectCoupleDisplayName(details.project, 0);
  const updateProject = updateProjectSettingsAction.bind(null, projectId);
  const createEvent = createProjectEventAction.bind(null, projectId);
  const assignMember = assignProjectMemberAction.bind(null, projectId);
  const setupError = setupErrorMessage(query.setupError);
  const setupStatus = setupStatusMessage(query.setupStatus);
  const setupSections = [
    canUpdateProject
      ? { href: "#wedding-identity", label: t("Wedding identity") }
      : null,
    canCreateEvents
      ? { href: "#create-event", label: t("Create an event") }
      : null,
    canLoadProjectMembers
      ? { href: "#project-access", label: t("Project access") }
      : null,
  ].filter((section): section is { href: string; label: string } =>
    Boolean(section),
  );

  return (
    <main className="flex flex-col gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/platform" />}>
              {t("Workspace")}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/platform/projects" />}>
              {t("Weddings")}
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
            <BreadcrumbPage>{t("Setup")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader className="has-data-[slot=card-action]:grid-cols-1 sm:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
          <CardTitle>
            <h1 className="text-2xl leading-tight font-semibold">
              {t("Wedding setup")}
            </h1>
          </CardTitle>
          <CardDescription className="max-w-3xl">
            {t(
              "Keep the couple record, events, and access assignments ready before daily project work begins.",
            )}
          </CardDescription>
          <CardAction className="col-start-1 row-start-auto mt-3 justify-self-start sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:mt-0 sm:justify-self-end">
            <Button
              render={<Link href={`/platform/projects/${projectId}`} />}
              variant="outline"
            >
              <ArrowLeftIcon aria-hidden="true" data-icon="inline-start" />
              {t("Return to wedding")}
            </Button>
          </CardAction>
        </CardHeader>
      </Card>

      {setupError ? (
        <Alert>
          <ShieldCheckIcon aria-hidden="true" />
          <AlertTitle>{t("Setup action was not completed")}</AlertTitle>
          <AlertDescription>{t(setupError)}</AlertDescription>
        </Alert>
      ) : null}

      {setupStatus ? (
        <Alert>
          <ShieldCheckIcon aria-hidden="true" />
          <AlertTitle>{t("Setup updated")}</AlertTitle>
          <AlertDescription>{t(setupStatus)}</AlertDescription>
        </Alert>
      ) : null}

      {setupSections.length > 1 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("Setup sections")}</CardTitle>
            <CardDescription>
              {t(
                "Jump directly to the part of the wedding setup you need to adjust.",
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {setupSections.map((section) => (
                <Button
                  key={section.href}
                  render={<Link href={section.href} />}
                  variant="outline"
                >
                  {section.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {canUpdateProject ? (
        <Card id="wedding-identity">
          <CardHeader>
            <CardTitle>{t("Wedding identity")}</CardTitle>
            <CardDescription>
              {t(
                "Update the couple record, language, contact details, and project lifecycle status.",
              )}
            </CardDescription>
            <CardAction>
              <Badge variant="outline">
                {t(getProjectLifecycleLabel(details.project.status))}
              </Badge>
            </CardAction>
          </CardHeader>
          <form action={updateProject}>
            <CardContent>
              <FieldSet>
                <FieldLegend>{t("Couple and status")}</FieldLegend>
                <FieldGroup className="md:grid md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="brideName">
                      {t("Bride name")}
                    </FieldLabel>
                    <Input
                      defaultValue={details.project.bride_name}
                      id="brideName"
                      name="brideName"
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="groomName">
                      {t("Groom name")}
                    </FieldLabel>
                    <Input
                      defaultValue={details.project.groom_name}
                      id="groomName"
                      name="groomName"
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="projectYear">
                      {t("Wedding year")}
                    </FieldLabel>
                    <Input
                      defaultValue={details.project.project_year ?? ""}
                      id="projectYear"
                      max={2100}
                      min={2020}
                      name="projectYear"
                      type="number"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="status">
                      {t("Project status")}
                    </FieldLabel>
                    <NativeSelect
                      className="w-full"
                      defaultValue={details.project.status}
                      id="status"
                      name="status"
                    >
                      {projectLifecycleOptions.map((option) => (
                        <NativeSelectOption
                          key={option.value}
                          value={option.value}
                        >
                          {t(option.label)}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="preferredLanguage">
                      {t("Preferred language")}
                    </FieldLabel>
                    <NativeSelect
                      className="w-full"
                      defaultValue={details.project.preferred_language ?? "fr"}
                      id="preferredLanguage"
                      name="preferredLanguage"
                    >
                      <NativeSelectOption value="fr">
                        {t("French")}
                      </NativeSelectOption>
                      <NativeSelectOption value="en">
                        {t("English")}
                      </NativeSelectOption>
                    </NativeSelect>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="primaryContactName">
                      {t("Primary contact")}
                    </FieldLabel>
                    <Input
                      defaultValue={details.project.primary_contact_name ?? ""}
                      id="primaryContactName"
                      name="primaryContactName"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="primaryContactEmail">
                      {t("Contact email")}
                    </FieldLabel>
                    <Input
                      defaultValue={details.project.primary_contact_email ?? ""}
                      id="primaryContactEmail"
                      name="primaryContactEmail"
                      type="email"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="primaryContactPhone">
                      {t("Contact phone")}
                    </FieldLabel>
                    <Input
                      defaultValue={details.project.primary_contact_phone ?? ""}
                      id="primaryContactPhone"
                      name="primaryContactPhone"
                    />
                  </Field>
                  <Field className="md:col-span-2">
                    <FieldLabel htmlFor="timelineNotes">
                      {t("Planning notes")}
                    </FieldLabel>
                    <Textarea
                      defaultValue={details.project.timeline_notes ?? ""}
                      id="timelineNotes"
                      name="timelineNotes"
                      rows={3}
                    />
                  </Field>
                  <Field className="md:col-span-2">
                    <FieldLabel htmlFor="internalNotes">
                      {t("Private team notes")}
                    </FieldLabel>
                    <Textarea
                      defaultValue={details.project.internal_notes ?? ""}
                      id="internalNotes"
                      name="internalNotes"
                      rows={3}
                    />
                    <FieldDescription>
                      {t("Visible only to authorized Diginoces users.")}
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </FieldSet>
            </CardContent>
            <CardFooter className="justify-end">
              <Button type="submit">
                <SaveIcon aria-hidden="true" data-icon="inline-start" />
                {t("Save wedding setup")}
              </Button>
            </CardFooter>
          </form>
        </Card>
      ) : null}

      {canCreateEvents ? (
        <Card id="create-event">
          <CardHeader>
            <CardTitle>{t("Create an event")}</CardTitle>
            <CardDescription>
              {t(
                "Add ceremonies, receptions, brunches, or other event workspaces inside this wedding.",
              )}
            </CardDescription>
          </CardHeader>
          <form action={createEvent}>
            <CardContent>
              <FieldSet>
                <FieldLegend>{t("Event details")}</FieldLegend>
                <FieldGroup className="md:grid md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="eventType">
                      {t("Event type")}
                    </FieldLabel>
                    <NativeSelect
                      className="w-full"
                      defaultValue="reception"
                      id="eventType"
                      name="eventType"
                    >
                      {eventTypeOptions.map((option) => (
                        <NativeSelectOption
                          key={option.value}
                          value={option.value}
                        >
                          {t(option.label)}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="name">{t("Event name")}</FieldLabel>
                    <Input id="name" name="name" required />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="eventDate">{t("Date")}</FieldLabel>
                    <Input id="eventDate" name="eventDate" type="date" />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="startsAt">
                      {t("Start time")}
                    </FieldLabel>
                    <Input id="startsAt" name="startsAt" type="time" />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="endsAt">{t("End time")}</FieldLabel>
                    <Input id="endsAt" name="endsAt" type="time" />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="venueName">{t("Venue")}</FieldLabel>
                    <Input id="venueName" name="venueName" />
                  </Field>
                  <Field className="md:col-span-2">
                    <FieldLabel htmlFor="venueAddress">
                      {t("Venue address")}
                    </FieldLabel>
                    <Textarea id="venueAddress" name="venueAddress" rows={2} />
                  </Field>
                </FieldGroup>
              </FieldSet>
            </CardContent>
            <CardFooter className="justify-end">
              <Button type="submit">
                <CalendarPlusIcon aria-hidden="true" data-icon="inline-start" />
                {t("Create event")}
              </Button>
            </CardFooter>
          </form>
        </Card>
      ) : null}

      {canLoadProjectMembers ? (
        <Card id="project-access">
          <CardHeader>
            <CardTitle>{t("Project access")}</CardTitle>
            <CardDescription>
              {t(
                "Assign bride, groom, couple, or project operator access to users who already have a Diginoces login.",
              )}
            </CardDescription>
            <CardAction>
              {projectMembersLoadError ? (
                <Badge variant="destructive">{t("Access unavailable")}</Badge>
              ) : (
                <Badge variant="outline">
                  {formatAssignedCount(projectMembers.length, language)}
                </Badge>
              )}
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {projectRolesLoadError ? (
              <Alert variant="destructive">
                <LockKeyholeIcon aria-hidden="true" />
                <AlertTitle>{t("Role options unavailable")}</AlertTitle>
                <AlertDescription>{t(projectRolesLoadError)}</AlertDescription>
              </Alert>
            ) : null}

            {projectMembersLoadError ? (
              <Alert variant="destructive">
                <LockKeyholeIcon aria-hidden="true" />
                <AlertTitle>{t("Access assignments unavailable")}</AlertTitle>
                <AlertDescription>
                  {t(projectMembersLoadError)}
                </AlertDescription>
              </Alert>
            ) : null}

            {canAssignProjectMembers ? (
              <form action={assignMember}>
                <FieldSet>
                  <FieldLegend>{t("Add project member")}</FieldLegend>
                  <FieldGroup className="md:grid md:grid-cols-[minmax(0,1.2fr)_minmax(12rem,0.8fr)_10rem_auto] md:items-end">
                    <Field>
                      <FieldLabel htmlFor="memberEmail">
                        {t("User email")}
                      </FieldLabel>
                      <Input
                        id="memberEmail"
                        name="email"
                        placeholder="bride@example.com"
                        required
                        type="email"
                      />
                      <FieldDescription>
                        {t("The user must already be able to sign in.")}
                      </FieldDescription>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="roleSlug">
                        {t("Project role")}
                      </FieldLabel>
                      <NativeSelect
                        className="w-full"
                        defaultValue=""
                        id="roleSlug"
                        name="roleSlug"
                        required
                      >
                        <NativeSelectOption disabled value="">
                          {t("Select a project role")}
                        </NativeSelectOption>
                        {projectRoles.map((role) => (
                          <NativeSelectOption key={role.slug} value={role.slug}>
                            {formatRoleText(role, "name", language)}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="memberStatus">
                        {t("Status")}
                      </FieldLabel>
                      <NativeSelect
                        className="w-full"
                        defaultValue="active"
                        id="memberStatus"
                        name="status"
                      >
                        <NativeSelectOption value="active">
                          {t("Active")}
                        </NativeSelectOption>
                        <NativeSelectOption value="invited">
                          {t("Invited")}
                        </NativeSelectOption>
                      </NativeSelect>
                    </Field>
                    <Button type="submit">
                      <UserPlusIcon
                        aria-hidden="true"
                        data-icon="inline-start"
                      />
                      {t("Add")}
                    </Button>
                  </FieldGroup>
                </FieldSet>
              </form>
            ) : null}

            {canAssignProjectMembers && projectRoles.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {projectRoles.map((role) => (
                  <div
                    className="rounded-lg border border-border bg-muted/30 p-4"
                    key={role.slug}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">
                        {formatRoleText(role, "name", language)}
                      </p>
                      <Badge variant="outline">{t("Project scoped")}</Badge>
                      {role.requiresMfa ? (
                        <Badge variant="secondary">{t("MFA required")}</Badge>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {formatRoleText(role, "description", language)}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            {projectMembersLoadError ? null : projectMembers.length === 0 ? (
              <Alert>
                <ShieldCheckIcon aria-hidden="true" />
                <AlertTitle>{t("No project members assigned")}</AlertTitle>
                <AlertDescription>
                  {t(
                    "Add the bride, groom, or operator accounts that should open this wedding.",
                  )}
                </AlertDescription>
              </Alert>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-[42rem]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("User")}</TableHead>
                      <TableHead>{t("Role")}</TableHead>
                      <TableHead>{t("Status")}</TableHead>
                      <TableHead className="hidden md:table-cell">
                        {t("Assigned")}
                      </TableHead>
                      {canUpdateProjectMemberStatuses ? (
                        <TableHead className="text-right">
                          {t("Update")}
                        </TableHead>
                      ) : null}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projectMembers.map((member) => (
                      <TableRow key={member.memberId}>
                        <TableCell className="whitespace-normal">
                          <span className="block font-medium">
                            {formatMemberName(member.displayName, member.email)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {member.email}
                          </span>
                        </TableCell>
                        <TableCell>
                          {isBuiltInRoleSlug(member.roleSlug)
                            ? t(member.roleName)
                            : member.roleName}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {t(membershipStatusLabel(member.status))}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground md:table-cell">
                          {formatDateTime(member.assignedAt, language)}
                        </TableCell>
                        {canUpdateProjectMemberStatuses ? (
                          <TableCell className="text-right">
                            <form
                              action={updateProjectMemberStatusAction.bind(
                                null,
                                projectId,
                                member.memberId,
                              )}
                              className="flex justify-end gap-2"
                            >
                              <NativeSelect
                                aria-label={`${t("New project access status for")} ${formatMemberName(
                                  member.displayName,
                                  member.email,
                                )}`}
                                className="w-36"
                                defaultValue={member.status}
                                name="status"
                                size="sm"
                              >
                                {membershipStatusOptions.map((option) => (
                                  <NativeSelectOption
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {t(option.label)}
                                  </NativeSelectOption>
                                ))}
                              </NativeSelect>
                              <ConfirmSubmitButton
                                confirmMessage={projectStatusChangeConfirmMessage(
                                  language,
                                  member,
                                )}
                                size="sm"
                                aria-label={`${t("Save project access status for")} ${formatMemberName(
                                  member.displayName,
                                  member.email,
                                )}`}
                                type="submit"
                                variant="outline"
                              >
                                {t("Save")}
                              </ConfirmSubmitButton>
                            </form>
                          </TableCell>
                        ) : null}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </main>
  );
}
