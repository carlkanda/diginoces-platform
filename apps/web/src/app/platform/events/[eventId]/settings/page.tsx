import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeftIcon,
  LockKeyholeIcon,
  SaveIcon,
  ShieldCheckIcon,
  UserPlusIcon,
} from "lucide-react";
import {
  assignEventMemberAction,
  updateEventMemberStatusAction,
  updateEventSettingsAction,
} from "@/app/platform/events/[eventId]/settings/actions";
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
  eventLifecycleOptions,
  eventTypeOptions,
  formatProjectCoupleDisplayName,
  formatProjectEventDisplayName,
  getEventLifecycleLabel,
} from "@/lib/projects/project-foundation";
import { hasEventPermission } from "@/lib/projects/project-api";
import {
  listAssignableEventRoles,
  listEventMembersForAdmin,
  type AccessMember,
  type AssignableRole,
  type MembershipStatus,
} from "@/lib/projects/project-access-service";
import { getEventDetails } from "@/lib/projects/project-service";
import { getRequestLanguage } from "@/lib/i18n/server";
import { translateStaticCopy } from "@/lib/i18n/static-translations";
import type { SupportedLanguage } from "@/lib/i18n/config";
import { serverLogger } from "@/lib/logging";
import { roleDefinitions } from "@/lib/security/permissions";

export const dynamic = "force-dynamic";

type EventSettingsPageProps = {
  params: Promise<{
    eventId: string;
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
      return "Check the submitted setup data, then try again.";
    case "permission_denied":
      return "This account is not allowed to perform that event setup action.";
    case "setup_action_failed":
      return "The event setup action could not be completed. Review the submitted data and try again.";
    case "supabase_not_configured":
      return "Event setup is unavailable until the workspace connection is ready.";
    default:
      return null;
  }
}

function setupStatusMessage(status: string | undefined) {
  switch (status) {
    case "event_created":
      return "Event was created.";
    case "event_member_assigned":
      return "Event access was updated.";
    case "event_member_updated":
      return "Event member status was updated.";
    case "event_updated":
      return "Event details were saved.";
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

function eventStatusChangeConfirmMessage(
  language: SupportedLanguage,
  member: AccessMember,
) {
  const memberName = formatMemberName(member.displayName, member.email);

  if (language === "fr") {
    return `Modifier le statut d’accès de ${memberName} pour cet événement ? Cela peut changer les pages événement que cette personne peut ouvrir.`;
  }

  return `Change ${memberName}'s event access status? This can change which event pages they can open.`;
}

function timeValue(value: string | null) {
  return value ? value.slice(0, 5) : "";
}

export default async function EventSettingsPage({
  params,
  searchParams,
}: EventSettingsPageProps) {
  const [{ eventId }, query, authContext, language] = await Promise.all([
    params,
    searchParams ?? emptySearchParams,
    getAuthContext(),
    getRequestLanguage(),
  ]);
  const t = (value: string) => formatSettingsCopy(value, language);

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath(`/platform/events/${eventId}/settings`));
  }

  if (authContext.status === "not_configured") {
    return (
      <main className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("Event setup")}</CardTitle>
            <CardDescription>
              {t(
                "Event setup controls will appear after the workspace connection is ready.",
              )}
            </CardDescription>
          </CardHeader>
        </Card>
        <Alert>
          <LockKeyholeIcon aria-hidden="true" />
          <AlertTitle>{t("Workspace connection pending")}</AlertTitle>
          <AlertDescription>
            {t(
              "Event setup stays closed until the secure workspace connection is configured.",
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

  const [canUpdateEvent, canReadEventMembers, canManageEventMembers] =
    await Promise.all([
      hasEventPermission(context, eventId, "events.update"),
      hasEventPermission(context, eventId, "event_members.read"),
      hasEventPermission(context, eventId, "event_members.manage"),
    ]);
  if (!canUpdateEvent && !canReadEventMembers && !canManageEventMembers) {
    notFound();
  }

  const details = await getEventDetails(authContext.supabase, eventId);

  if (!details) {
    notFound();
  }

  const canLoadEventMembers = canReadEventMembers || canManageEventMembers;
  const [eventRolesLoad, eventMembersLoad] = await Promise.all([
    canManageEventMembers
      ? loadAccessData(
          () => listAssignableEventRoles(authContext.supabase),
          [],
          "Event role listing failed.",
          "Role options could not be loaded safely. Adding new access is paused until the data can be verified.",
        )
      : Promise.resolve({ data: [], error: null }),
    canLoadEventMembers
      ? loadAccessData(
          () => listEventMembersForAdmin(authContext.supabase, eventId),
          [],
          "Event member listing failed.",
          "Access assignments could not be loaded safely. Management controls are paused until the data can be verified.",
        )
      : Promise.resolve({ data: [], error: null }),
  ]);
  const eventRoles = eventRolesLoad.data;
  const eventMembers = eventMembersLoad.data;
  const eventRolesLoadError = eventRolesLoad.error;
  const eventMembersLoadError = eventMembersLoad.error;
  const canAssignEventMembers =
    canManageEventMembers &&
    !eventRolesLoadError &&
    !eventMembersLoadError &&
    eventRoles.length > 0;
  const canUpdateEventMemberStatuses =
    canManageEventMembers && !eventMembersLoadError;
  const projectName = formatProjectCoupleDisplayName(details.project, 0);
  const eventName = formatProjectEventDisplayName(details.event, 0);
  const updateEvent = updateEventSettingsAction.bind(null, eventId);
  const assignMember = assignEventMemberAction.bind(null, eventId);
  const setupError = setupErrorMessage(query.setupError);
  const setupStatus = setupStatusMessage(query.setupStatus);
  const setupSections = [
    canUpdateEvent
      ? { href: "#event-details", label: t("Event details") }
      : null,
    canLoadEventMembers
      ? { href: "#event-access", label: t("Event access") }
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
              render={
                <Link href={`/platform/projects/${details.project.id}`} />
              }
            >
              {projectName}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              render={<Link href={`/platform/events/${eventId}`} />}
            >
              {eventName}
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
              {t("Event setup")}
            </h1>
          </CardTitle>
          <CardDescription className="max-w-3xl">
            {t(
              "Keep the event schedule, venue, status, and event-day staff access ready for handoff.",
            )}
          </CardDescription>
          <CardAction className="col-start-1 row-start-auto mt-3 justify-self-start sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:mt-0 sm:justify-self-end">
            <Button
              render={<Link href={`/platform/events/${eventId}`} />}
              variant="outline"
            >
              <ArrowLeftIcon aria-hidden="true" data-icon="inline-start" />
              {t("Back to event")}
            </Button>
          </CardAction>
        </CardHeader>
      </Card>

      {setupError ? (
        <Alert>
          <ShieldCheckIcon aria-hidden="true" />
          <AlertTitle>{t("Event setup was not completed")}</AlertTitle>
          <AlertDescription>{t(setupError)}</AlertDescription>
        </Alert>
      ) : null}

      {setupStatus ? (
        <Alert>
          <ShieldCheckIcon aria-hidden="true" />
          <AlertTitle>{t("Event setup updated")}</AlertTitle>
          <AlertDescription>{t(setupStatus)}</AlertDescription>
        </Alert>
      ) : null}

      {setupSections.length > 1 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("Setup sections")}</CardTitle>
            <CardDescription>
              {t("Jump directly to the event details or event access area.")}
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

      {canUpdateEvent ? (
        <Card id="event-details">
          <CardHeader>
            <CardTitle>{t("Event details")}</CardTitle>
            <CardDescription>
              {t(
                "Update the event identity, date/time, venue, and lifecycle status.",
              )}
            </CardDescription>
            <CardAction>
              <Badge variant="outline">
                {t(getEventLifecycleLabel(details.event.status))}
              </Badge>
            </CardAction>
          </CardHeader>
          <form action={updateEvent}>
            <CardContent>
              <FieldSet>
                <FieldLegend>{t("Event identity")}</FieldLegend>
                <FieldGroup className="md:grid md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="eventType">
                      {t("Event type")}
                    </FieldLabel>
                    <NativeSelect
                      className="w-full"
                      defaultValue={details.event.event_type}
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
                    <Input
                      defaultValue={details.event.name}
                      id="name"
                      name="name"
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="status">
                      {t("Event status")}
                    </FieldLabel>
                    <NativeSelect
                      className="w-full"
                      defaultValue={details.event.status}
                      id="status"
                      name="status"
                    >
                      {eventLifecycleOptions.map((option) => (
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
                    <FieldLabel htmlFor="eventDate">{t("Date")}</FieldLabel>
                    <Input
                      defaultValue={details.event.event_date ?? ""}
                      id="eventDate"
                      name="eventDate"
                      type="date"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="startsAt">
                      {t("Start time")}
                    </FieldLabel>
                    <Input
                      defaultValue={timeValue(details.event.starts_at)}
                      id="startsAt"
                      name="startsAt"
                      type="time"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="endsAt">{t("End time")}</FieldLabel>
                    <Input
                      defaultValue={timeValue(details.event.ends_at)}
                      id="endsAt"
                      name="endsAt"
                      type="time"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="venueName">{t("Venue")}</FieldLabel>
                    <Input
                      defaultValue={details.event.venue_name ?? ""}
                      id="venueName"
                      name="venueName"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="venueAddress">
                      {t("Venue address")}
                    </FieldLabel>
                    <Textarea
                      defaultValue={details.event.venue_address ?? ""}
                      id="venueAddress"
                      name="venueAddress"
                      rows={3}
                    />
                  </Field>
                </FieldGroup>
              </FieldSet>
            </CardContent>
            <CardFooter className="justify-end">
              <Button type="submit">
                <SaveIcon aria-hidden="true" data-icon="inline-start" />
                {t("Save event setup")}
              </Button>
            </CardFooter>
          </form>
        </Card>
      ) : null}

      {canLoadEventMembers ? (
        <Card id="event-access">
          <CardHeader>
            <CardTitle>{t("Event access")}</CardTitle>
            <CardDescription>
              {t(
                "Assign event staff or check-in supervisors who should access this event workspace.",
              )}
            </CardDescription>
            <CardAction>
              {eventMembersLoadError ? (
                <Badge variant="destructive">{t("Access unavailable")}</Badge>
              ) : (
                <Badge variant="outline">
                  {formatAssignedCount(eventMembers.length, language)}
                </Badge>
              )}
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {eventRolesLoadError ? (
              <Alert variant="destructive">
                <LockKeyholeIcon aria-hidden="true" />
                <AlertTitle>{t("Role options unavailable")}</AlertTitle>
                <AlertDescription>{t(eventRolesLoadError)}</AlertDescription>
              </Alert>
            ) : null}

            {eventMembersLoadError ? (
              <Alert variant="destructive">
                <LockKeyholeIcon aria-hidden="true" />
                <AlertTitle>{t("Access assignments unavailable")}</AlertTitle>
                <AlertDescription>{t(eventMembersLoadError)}</AlertDescription>
              </Alert>
            ) : null}

            {canAssignEventMembers ? (
              <form action={assignMember}>
                <FieldSet>
                  <FieldLegend>{t("Add event member")}</FieldLegend>
                  <FieldGroup className="md:grid md:grid-cols-[minmax(0,1.2fr)_minmax(12rem,0.8fr)_10rem_auto] md:items-end">
                    <Field>
                      <FieldLabel htmlFor="memberEmail">
                        {t("User email")}
                      </FieldLabel>
                      <Input
                        id="memberEmail"
                        name="email"
                        placeholder="staff@example.com"
                        required
                        type="email"
                      />
                      <FieldDescription>
                        {t("The user must already be able to sign in.")}
                      </FieldDescription>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="roleSlug">
                        {t("Event role")}
                      </FieldLabel>
                      <NativeSelect
                        className="w-full"
                        defaultValue=""
                        id="roleSlug"
                        name="roleSlug"
                        required
                      >
                        <NativeSelectOption disabled value="">
                          {t("Select an event role")}
                        </NativeSelectOption>
                        {eventRoles.map((role) => (
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

            {canAssignEventMembers && eventRoles.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {eventRoles.map((role) => (
                  <div
                    className="rounded-lg border border-border bg-muted/30 p-4"
                    key={role.slug}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">
                        {formatRoleText(role, "name", language)}
                      </p>
                      {role.requiresMfa ? (
                        <Badge variant="secondary">{t("MFA required")}</Badge>
                      ) : (
                        <Badge variant="outline">{t("Event scoped")}</Badge>
                      )}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {formatRoleText(role, "description", language)}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            {eventMembersLoadError ? null : eventMembers.length === 0 ? (
              <Alert>
                <ShieldCheckIcon aria-hidden="true" />
                <AlertTitle>{t("No event members assigned")}</AlertTitle>
                <AlertDescription>
                  {t(
                    "Add staff accounts that should run or supervise this event.",
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
                      {canUpdateEventMemberStatuses ? (
                        <TableHead className="text-right">
                          {t("Update")}
                        </TableHead>
                      ) : null}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eventMembers.map((member) => (
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
                        {canUpdateEventMemberStatuses ? (
                          <TableCell className="text-right">
                            <form
                              action={updateEventMemberStatusAction.bind(
                                null,
                                eventId,
                                member.memberId,
                              )}
                              className="flex justify-end gap-2"
                            >
                              <NativeSelect
                                aria-label={`${t("New event access status for")} ${formatMemberName(
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
                                confirmMessage={eventStatusChangeConfirmMessage(
                                  language,
                                  member,
                                )}
                                size="sm"
                                aria-label={`${t("Save event access status for")} ${formatMemberName(
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
