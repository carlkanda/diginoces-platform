import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeftIcon,
  LockKeyholeIcon,
  SearchIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
  UserCogIcon,
  UserPlusIcon,
  XIcon,
} from "lucide-react";
import {
  assignGlobalRoleAction,
  revokeGlobalRoleAction,
} from "@/app/platform/access/actions";
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
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import { formatDiginocesDateTime } from "@/lib/dates/format-date";
import {
  listAssignableGlobalRoles,
  listGlobalRoleAssignmentsForAdmin,
  type GlobalRoleAssignment,
} from "@/lib/projects/project-access-service";
import {
  ProjectAccessError,
  requireGlobalPermission,
} from "@/lib/projects/project-api";
import { getRequestLanguage } from "@/lib/i18n/server";
import { translateStaticCopy } from "@/lib/i18n/static-translations";
import { serverLogger } from "@/lib/logging";
import type { SupportedLanguage } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

type AccessPageSearchParams = {
  accessError?: AccessPageQueryValue;
  accessRole?: AccessPageQueryValue;
  accessSearch?: AccessPageQueryValue;
  accessState?: AccessPageQueryValue;
  accessStatus?: AccessPageQueryValue;
};

type AccessPageProps = {
  searchParams?: Promise<AccessPageSearchParams>;
};

type AccessLoadResult<T> = {
  data: T;
  error: string | null;
};

const emptySearchParams: Promise<AccessPageSearchParams> = Promise.resolve({});

type AccessPageQueryValue = string | string[] | undefined;

const accessPageTemplates = {
  recordCount: {
    en: "{visibleCount} of {totalCount} access records",
    fr: "{visibleCount} / {totalCount} accès",
  },
} as const;

const assignmentStateFilters = [
  { label: "All statuses", value: "all" },
  { label: "Active", value: "active" },
  { label: "Revoked", value: "revoked" },
] as const;

function accessErrorMessage(error: string | undefined) {
  switch (error) {
    case "access_action_failed":
      return "The access change could not be completed. Confirm the request is still valid, then try again.";
    case "invalid_access_request":
      return "Check the email and selected role, then try again.";
    case "permission_denied":
      return "This account is not allowed to manage global access.";
    case "supabase_not_configured":
      return "Access management is unavailable until the workspace connection is ready.";
    default:
      return null;
  }
}

function accessStatusMessage(status: string | undefined) {
  switch (status) {
    case "global_role_assigned":
      return "Global role access was updated.";
    case "global_role_revoked":
      return "Global role access was revoked.";
    default:
      return null;
  }
}

function firstSearchParam(value: AccessPageQueryValue) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeAccessPageSearchParams(params: AccessPageSearchParams) {
  return {
    accessError: firstSearchParam(params.accessError),
    accessRole: firstSearchParam(params.accessRole),
    accessSearch: firstSearchParam(params.accessSearch),
    accessState: firstSearchParam(params.accessState),
    accessStatus: firstSearchParam(params.accessStatus),
  };
}

function formatDateTime(value: string, language: SupportedLanguage) {
  return formatDiginocesDateTime(value, language === "fr" ? "fr-FR" : "en");
}

function formatMemberName(displayName: string | null, email: string) {
  return displayName && displayName.trim().length > 0 ? displayName : email;
}

function formatAccessCopy(value: string, language: SupportedLanguage) {
  return translateStaticCopy(value, language);
}

function formatAccessRecordCount(
  visibleCount: number,
  totalCount: number,
  language: SupportedLanguage,
) {
  return accessPageTemplates.recordCount[language]
    .replace("{visibleCount}", String(visibleCount))
    .replace("{totalCount}", String(totalCount));
}

function formatRoleCopy(value: string, language: SupportedLanguage) {
  return formatAccessCopy(value, language);
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

function isActiveAssignment(expiresAt: string | null) {
  return !expiresAt || new Date(expiresAt).getTime() > Date.now();
}

function normalizeRoleFilter(
  value: string | undefined,
  roles: readonly { slug: string }[],
) {
  if (!value || value === "all") {
    return "all";
  }

  return roles.some((role) => role.slug === value) ? value : "all";
}

function normalizeAssignmentStateFilter(value: string | undefined) {
  if (value === "active" || value === "revoked") {
    return value;
  }

  return "all";
}

function assignmentMatchesFilters(
  assignment: GlobalRoleAssignment,
  filters: {
    language: SupportedLanguage;
    role: string;
    search: string;
    state: string;
  },
) {
  const isActive = isActiveAssignment(assignment.expiresAt);

  if (filters.role !== "all" && assignment.roleSlug !== filters.role) {
    return false;
  }

  if (filters.state === "active" && !isActive) {
    return false;
  }

  if (filters.state === "revoked" && isActive) {
    return false;
  }

  if (filters.search.length === 0) {
    return true;
  }

  const searchable = [
    formatMemberName(assignment.displayName, assignment.email),
    assignment.email,
    formatRoleCopy(assignment.roleName, filters.language),
    assignment.roleName,
    assignment.roleSlug,
    formatAccessCopy(isActive ? "Active" : "Revoked", filters.language),
    isActive ? "active" : "revoked",
  ]
    .join(" ")
    .toLowerCase();

  return searchable.includes(filters.search);
}

function revokeConfirmMessage(
  language: SupportedLanguage,
  assignment: GlobalRoleAssignment,
) {
  const memberName = formatMemberName(assignment.displayName, assignment.email);
  const roleName = formatRoleCopy(assignment.roleName, language);

  if (language === "fr") {
    return `Retirer le rôle ${roleName} de ${memberName} ? Cette personne perdra cet accès à la plateforme jusqu’à une nouvelle attribution.`;
  }

  return `Revoke ${roleName} access for ${memberName}? They will lose this platform access until it is assigned again.`;
}

export default async function AccessPage({ searchParams }: AccessPageProps) {
  const [authContext, query, language] = await Promise.all([
    getAuthContext(),
    searchParams ?? emptySearchParams,
    getRequestLanguage(),
  ]);
  const t = (value: string) => formatAccessCopy(value, language);

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath("/platform/access"));
  }

  if (authContext.status === "not_configured") {
    return (
      <main className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("Access control")}</CardTitle>
            <CardDescription>
              {t(
                "Access controls will appear after the workspace connection is ready.",
              )}
            </CardDescription>
          </CardHeader>
        </Card>
        <Alert>
          <LockKeyholeIcon aria-hidden="true" />
          <AlertTitle>{t("Workspace connection pending")}</AlertTitle>
          <AlertDescription>
            {t(
              "Role management stays closed until the secure workspace connection is configured.",
            )}
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  const normalizedQuery = normalizeAccessPageSearchParams(query);
  const context = {
    supabase: authContext.supabase,
    user: authContext.user,
  };

  try {
    await requireGlobalPermission(context, "roles.manage");
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      const deniedActionError = accessErrorMessage(normalizedQuery.accessError);

      if (deniedActionError) {
        return (
          <main className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("Access control")}</CardTitle>
                <CardDescription>
                  {t(
                    "Assign sensitive platform roles to existing Diginoces users. Wedding and event access stays inside each project or event setup page.",
                  )}
                </CardDescription>
              </CardHeader>
            </Card>
            <Alert>
              <ShieldCheckIcon aria-hidden="true" />
              <AlertTitle>{t("Access action was not completed")}</AlertTitle>
              <AlertDescription>{t(deniedActionError)}</AlertDescription>
            </Alert>
          </main>
        );
      }

      notFound();
    }

    throw error;
  }

  const [globalRolesLoad, assignmentsLoad] = await Promise.all([
    loadAccessData(
      () => listAssignableGlobalRoles(authContext.supabase),
      [],
      "Global role option listing failed.",
      "Role options could not be loaded safely. Adding new access is paused until the data can be verified.",
    ),
    loadAccessData(
      () => listGlobalRoleAssignmentsForAdmin(authContext.supabase),
      [],
      "Global role assignment listing failed.",
      "Access assignments could not be loaded safely. Management controls are paused until the data can be verified.",
    ),
  ]);
  const globalRoles = globalRolesLoad.data;
  const assignments = assignmentsLoad.data;
  const globalRolesLoadError = globalRolesLoad.error;
  const assignmentsLoadError = assignmentsLoad.error;
  const hasAssignableGlobalRoles = globalRoles.length > 0;
  const canAssignGlobalRoles =
    !globalRolesLoadError && !assignmentsLoadError && hasAssignableGlobalRoles;
  const accessError = accessErrorMessage(normalizedQuery.accessError);
  const accessStatus = accessStatusMessage(normalizedQuery.accessStatus);
  const roleFilter = normalizeRoleFilter(
    normalizedQuery.accessRole,
    globalRoles,
  );
  const stateFilter = normalizeAssignmentStateFilter(
    normalizedQuery.accessState,
  );
  const searchFilter = normalizedQuery.accessSearch?.trim().toLowerCase() ?? "";
  const filteredAssignments = assignments.filter((assignment) =>
    assignmentMatchesFilters(assignment, {
      language,
      role: roleFilter,
      search: searchFilter,
      state: stateFilter,
    }),
  );

  return (
    <main className="flex flex-col gap-6">
      <Breadcrumb aria-label={t("Breadcrumb")}>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/platform" />}>
              {t("Workspace")}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t("Access control")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader className="has-data-[slot=card-action]:grid-cols-1 sm:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
          <CardTitle>
            <h1 className="text-2xl leading-tight font-semibold">
              {t("Access control")}
            </h1>
          </CardTitle>
          <CardDescription className="max-w-3xl">
            {t(
              "Assign sensitive platform roles to existing Diginoces users. Wedding and event access stays inside each project or event setup page.",
            )}
          </CardDescription>
          <CardAction className="col-start-1 row-start-auto mt-3 justify-self-start sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:mt-0 sm:justify-self-end">
            <Button render={<Link href="/platform" />} variant="outline">
              <ArrowLeftIcon aria-hidden="true" data-icon="inline-start" />
              {t("Back to workspace")}
            </Button>
          </CardAction>
        </CardHeader>
      </Card>

      {accessError ? (
        <Alert>
          <ShieldCheckIcon aria-hidden="true" />
          <AlertTitle>{t("Access action was not completed")}</AlertTitle>
          <AlertDescription>{t(accessError)}</AlertDescription>
        </Alert>
      ) : null}

      {accessStatus ? (
        <Alert>
          <ShieldCheckIcon aria-hidden="true" />
          <AlertTitle>{t("Access updated")}</AlertTitle>
          <AlertDescription>{t(accessStatus)}</AlertDescription>
        </Alert>
      ) : null}

      <Card id="assign-global-role">
        <CardHeader>
          <CardTitle>{t("Assign global role")}</CardTitle>
          <CardDescription>
            {t(
              "Use this for Diginoces administrators, operations managers, role managers, and other platform-level roles.",
            )}
          </CardDescription>
          <CardAction>
            <Badge variant="secondary">{t("Existing users only")}</Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {globalRolesLoadError ? (
            <Alert>
              <ShieldCheckIcon aria-hidden="true" />
              <AlertTitle>{t("Role options unavailable")}</AlertTitle>
              <AlertDescription>{t(globalRolesLoadError)}</AlertDescription>
            </Alert>
          ) : null}

          {!globalRolesLoadError && !hasAssignableGlobalRoles ? (
            <Alert>
              <ShieldCheckIcon aria-hidden="true" />
              <AlertTitle>{t("No assignable platform roles")}</AlertTitle>
              <AlertDescription>
                {t(
                  "Global role assignment is paused until at least one assignable platform role is available.",
                )}
              </AlertDescription>
            </Alert>
          ) : null}

          {!globalRolesLoadError && assignmentsLoadError ? (
            <Alert>
              <ShieldCheckIcon aria-hidden="true" />
              <AlertTitle>{t("Access assignments unavailable")}</AlertTitle>
              <AlertDescription>{t(assignmentsLoadError)}</AlertDescription>
            </Alert>
          ) : null}

          {canAssignGlobalRoles ? (
            <form action={assignGlobalRoleAction}>
              <FieldSet>
                <FieldLegend>{t("Role assignment")}</FieldLegend>
                <FieldGroup>
                  <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)] md:items-start">
                    <Field>
                      <FieldLabel htmlFor="accessEmail">
                        {t("User email")}
                      </FieldLabel>
                      <Input
                        aria-describedby="assign-global-role-note"
                        id="accessEmail"
                        name="email"
                        placeholder="admin@example.com"
                        required
                        type="email"
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="roleSlug">
                        {t("Global role")}
                      </FieldLabel>
                      <NativeSelect
                        className="w-full"
                        defaultValue=""
                        id="roleSlug"
                        name="roleSlug"
                        required
                      >
                        <NativeSelectOption disabled value="">
                          {t("Select a global role")}
                        </NativeSelectOption>
                        {globalRoles.map((role) => (
                          <NativeSelectOption key={role.slug} value={role.slug}>
                            {formatRoleCopy(role.name, language)}
                            {role.requiresMfa ? " - MFA" : ""}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    </Field>
                  </div>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <FieldDescription
                      className="max-w-xl"
                      id="assign-global-role-note"
                    >
                      {t("The user must already be able to sign in.")}
                    </FieldDescription>
                    <Button className="md:shrink-0" type="submit">
                      <UserPlusIcon
                        aria-hidden="true"
                        data-icon="inline-start"
                      />
                      {t("Assign role")}
                    </Button>
                  </div>
                </FieldGroup>
              </FieldSet>
            </form>
          ) : null}

          {!globalRolesLoadError && hasAssignableGlobalRoles ? (
            <div className="grid gap-3 md:grid-cols-2">
              {globalRoles.map((role) => (
                <div
                  className="rounded-lg border border-border bg-muted/30 p-4"
                  key={role.slug}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">
                      {formatRoleCopy(role.name, language)}
                    </p>
                    {role.requiresMfa ? (
                      <Badge variant="secondary">{t("MFA required")}</Badge>
                    ) : (
                      <Badge variant="outline">{t("Standard sign-in")}</Badge>
                    )}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {formatRoleCopy(role.description, language)}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card id="global-role-assignments">
        <CardHeader>
          <CardTitle>{t("Global role assignments")}</CardTitle>
          <CardDescription>
            {t("Active and previously revoked global role assignments.")}
          </CardDescription>
          <CardAction>
            {assignmentsLoadError ? (
              <Badge variant="outline">{t("Access unavailable")}</Badge>
            ) : (
              <Badge variant="outline">
                {formatAccessRecordCount(
                  filteredAssignments.length,
                  assignments.length,
                  language,
                )}
              </Badge>
            )}
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {assignmentsLoadError ? (
            <Alert>
              <ShieldCheckIcon aria-hidden="true" />
              <AlertTitle>{t("Access assignments unavailable")}</AlertTitle>
              <AlertDescription>{t(assignmentsLoadError)}</AlertDescription>
            </Alert>
          ) : (
            <form action="/platform/access" method="get">
              <FieldSet>
                <FieldLegend>{t("Filter assignments")}</FieldLegend>
                <FieldDescription>
                  {t("Find a user, role, or status before changing access.")}
                </FieldDescription>
                <FieldGroup className="md:grid md:grid-cols-[minmax(0,1.2fr)_minmax(11rem,0.7fr)_minmax(10rem,0.7fr)_auto_auto] md:items-end">
                  <Field>
                    <FieldLabel htmlFor="accessSearch">
                      {t("Search by name or email")}
                    </FieldLabel>
                    <Input
                      defaultValue={normalizedQuery.accessSearch ?? ""}
                      id="accessSearch"
                      name="accessSearch"
                      placeholder="name@example.com"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="accessRole">
                      {t("Role filter")}
                    </FieldLabel>
                    <NativeSelect
                      className="w-full"
                      defaultValue={roleFilter}
                      id="accessRole"
                      name="accessRole"
                    >
                      <NativeSelectOption value="all">
                        {t("All roles")}
                      </NativeSelectOption>
                      {globalRoles.map((role) => (
                        <NativeSelectOption key={role.slug} value={role.slug}>
                          {formatRoleCopy(role.name, language)}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="accessState">
                      {t("Status filter")}
                    </FieldLabel>
                    <NativeSelect
                      className="w-full"
                      defaultValue={stateFilter}
                      id="accessState"
                      name="accessState"
                    >
                      {assignmentStateFilters.map((filter) => (
                        <NativeSelectOption
                          key={filter.value}
                          value={filter.value}
                        >
                          {t(filter.label)}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </Field>
                  <Button type="submit" variant="outline">
                    <SearchIcon aria-hidden="true" data-icon="inline-start" />
                    {t("Filter")}
                  </Button>
                  <Button
                    render={<Link href="/platform/access" />}
                    variant="ghost"
                  >
                    <XIcon aria-hidden="true" data-icon="inline-start" />
                    {t("Clear")}
                  </Button>
                </FieldGroup>
              </FieldSet>
            </form>
          )}

          {!assignmentsLoadError && assignments.length === 0 ? (
            <Alert>
              <UserCogIcon aria-hidden="true" />
              <AlertTitle>{t("No global roles assigned")}</AlertTitle>
              <AlertDescription>
                {t(
                  "Assign a role to an existing user before they can open protected platform areas.",
                )}
              </AlertDescription>
            </Alert>
          ) : !assignmentsLoadError && filteredAssignments.length === 0 ? (
            <Alert>
              <SlidersHorizontalIcon aria-hidden="true" />
              <AlertTitle>{t("No matching role assignments")}</AlertTitle>
              <AlertDescription>
                {t(
                  "Adjust the filters or clear them to see every global access record.",
                )}
              </AlertDescription>
            </Alert>
          ) : !assignmentsLoadError ? (
            <div className="overflow-x-auto">
              <Table className="min-w-[44rem]">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("User")}</TableHead>
                    <TableHead>{t("Role")}</TableHead>
                    <TableHead>{t("Status")}</TableHead>
                    <TableHead className="hidden md:table-cell">
                      {t("Assigned on")}
                    </TableHead>
                    <TableHead className="text-right">{t("Action")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssignments.map((assignment) => {
                    const isActive = isActiveAssignment(assignment.expiresAt);

                    return (
                      <TableRow key={assignment.assignmentId}>
                        <TableCell className="whitespace-normal">
                          <span className="block font-medium">
                            {formatMemberName(
                              assignment.displayName,
                              assignment.email,
                            )}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {assignment.email}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">
                              {formatRoleCopy(assignment.roleName, language)}
                            </Badge>
                            {assignment.requiresMfa ? (
                              <Badge variant="secondary">MFA</Badge>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={isActive ? "secondary" : "outline"}>
                            {t(isActive ? "Active" : "Revoked")}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground md:table-cell">
                          {formatDateTime(assignment.assignedAt, language)}
                        </TableCell>
                        <TableCell className="text-right">
                          {isActive ? (
                            <form
                              action={revokeGlobalRoleAction.bind(
                                null,
                                assignment.assignmentId,
                              )}
                            >
                              <ConfirmSubmitButton
                                confirmMessage={revokeConfirmMessage(
                                  language,
                                  assignment,
                                )}
                                size="sm"
                                type="submit"
                                variant="outline"
                              >
                                {t("Revoke")}
                              </ConfirmSubmitButton>
                            </form>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {t("Revoked")}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
