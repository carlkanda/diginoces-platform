import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { ProjectValidationError } from "@/lib/projects/project-service";

export type MembershipStatus = Database["public"]["Enums"]["membership_status"];
export type RoleScope = Database["public"]["Enums"]["role_scope_type"];

export type AssignableRole = {
  description: string;
  id: string;
  name: string;
  requiresMfa: boolean;
  scope: RoleScope;
  slug: string;
};

export type AccessMember = {
  assignedAt: string;
  displayName: string | null;
  email: string;
  memberId: string;
  roleId: string;
  roleName: string;
  roleScope: RoleScope;
  roleSlug: string;
  status: MembershipStatus;
  userId: string;
};

export type GlobalRoleAssignment = {
  assignedAt: string;
  assignmentId: string;
  displayName: string | null;
  email: string;
  expiresAt: string | null;
  requiresMfa: boolean;
  roleId: string;
  roleName: string;
  roleScope: RoleScope;
  roleSlug: string;
  userId: string;
};

export type AssignMemberInput = {
  email: string;
  roleSlug: string;
  status: MembershipStatus;
};

export type AssignGlobalRoleInput = {
  email: string;
  roleSlug: string;
};

type UntypedRpcClient = {
  rpc(
    fn: string,
    args?: Record<string, unknown>,
  ): Promise<{
    data: unknown;
    error: Error | null;
  }>;
};

const membershipStatuses = new Set<MembershipStatus>([
  "active",
  "invited",
  "removed",
  "suspended",
]);
const roleScopeLookup: Record<RoleScope, true> = {
  custom: true,
  event: true,
  global: true,
  project: true,
};
const roleScopes = new Set<RoleScope>(
  Object.keys(roleScopeLookup) as RoleScope[],
);
const rpcTimestampPattern =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$/;

function requiredText(value: unknown, fieldName: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ProjectValidationError(`${fieldName} is required.`);
  }

  return value.trim();
}

function membershipStatus(value: unknown) {
  const status = requiredText(value, "status");

  if (!membershipStatuses.has(status as MembershipStatus)) {
    throw new ProjectValidationError("status is not supported.");
  }

  return status as MembershipStatus;
}

function rpcRows(data: unknown, context: string): Record<string, unknown>[] {
  if (!Array.isArray(data)) {
    throw new Error(`Unexpected ${context} RPC response.`);
  }

  return data.map((row, index) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      throw new Error(`Unexpected ${context} RPC row at index ${index}.`);
    }

    return row as Record<string, unknown>;
  });
}

function rpcText(value: unknown, fieldName: string, context: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Unexpected ${context} RPC response: ${fieldName}.`);
  }

  return value;
}

function rpcNullableText(
  value: unknown,
  fieldName: string,
  context: string,
): string | null {
  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error(`Unexpected ${context} RPC response: ${fieldName}.`);
  }

  return value;
}

function rpcTimestamp(value: unknown, fieldName: string, context: string) {
  const timestamp = rpcText(value, fieldName, context);

  if (!isStrictRpcTimestamp(timestamp)) {
    throw new Error(`Unexpected ${context} RPC response: ${fieldName}.`);
  }

  return timestamp;
}

function rpcNullableTimestamp(
  value: unknown,
  fieldName: string,
  context: string,
) {
  const timestamp = rpcNullableText(value, fieldName, context);

  if (timestamp !== null && !isStrictRpcTimestamp(timestamp)) {
    throw new Error(`Unexpected ${context} RPC response: ${fieldName}.`);
  }

  return timestamp;
}

function isStrictRpcTimestamp(value: string) {
  const match = rpcTimestampPattern.exec(value);

  if (!match) {
    return false;
  }

  const [, yearText, monthText, dayText, hourText, minuteText, secondText] =
    match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    month < 1 ||
    month > 12 ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59 ||
    second < 0 ||
    second > 59
  ) {
    return false;
  }

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  return day >= 1 && day <= daysInMonth && !Number.isNaN(Date.parse(value));
}

function rpcBoolean(
  value: unknown,
  fieldName: string,
  context: string,
): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`Unexpected ${context} RPC response: ${fieldName}.`);
  }

  return value;
}

function rpcMembershipStatus(
  value: unknown,
  fieldName: string,
  context: string,
): MembershipStatus {
  const status = rpcText(value, fieldName, context);

  if (!membershipStatuses.has(status as MembershipStatus)) {
    throw new Error(`Unexpected ${context} RPC response: ${fieldName}.`);
  }

  return status as MembershipStatus;
}

function rpcRoleScope(
  value: unknown,
  fieldName: string,
  context: string,
): RoleScope {
  const scope = rpcText(value, fieldName, context);

  if (!roleScopes.has(scope as RoleScope)) {
    throw new Error(`Unexpected ${context} RPC response: ${fieldName}.`);
  }

  return scope as RoleScope;
}

function memberRows(data: unknown): AccessMember[] {
  const rows = rpcRows(data, "member listing");

  return rows.map((value) => {
    return {
      assignedAt: rpcTimestamp(
        value.assigned_at,
        "assigned_at",
        "member listing",
      ),
      displayName: rpcNullableText(
        value.display_name,
        "display_name",
        "member listing",
      ),
      email: rpcText(value.email, "email", "member listing"),
      memberId: rpcText(value.member_id, "member_id", "member listing"),
      roleId: rpcText(value.role_id, "role_id", "member listing"),
      roleName: rpcText(value.role_name, "role_name", "member listing"),
      roleScope: rpcRoleScope(value.role_scope, "role_scope", "member listing"),
      roleSlug: rpcText(value.role_slug, "role_slug", "member listing"),
      status: rpcMembershipStatus(value.status, "status", "member listing"),
      userId: rpcText(value.user_id, "user_id", "member listing"),
    };
  });
}

function globalRoleRows(data: unknown): GlobalRoleAssignment[] {
  const rows = rpcRows(data, "global role assignment listing");

  return rows.map((value) => {
    const roleScope = rpcRoleScope(
      value.role_scope,
      "role_scope",
      "global role assignment listing",
    );

    if (roleScope !== "global") {
      throw new Error(
        "Unexpected global role assignment listing RPC response: role_scope.",
      );
    }

    return {
      assignedAt: rpcTimestamp(
        value.assigned_at,
        "assigned_at",
        "global role assignment listing",
      ),
      assignmentId: rpcText(
        value.assignment_id,
        "assignment_id",
        "global role assignment listing",
      ),
      displayName: rpcNullableText(
        value.display_name,
        "display_name",
        "global role assignment listing",
      ),
      email: rpcText(value.email, "email", "global role assignment listing"),
      expiresAt: rpcNullableTimestamp(
        value.expires_at,
        "expires_at",
        "global role assignment listing",
      ),
      requiresMfa: rpcBoolean(
        value.requires_mfa,
        "requires_mfa",
        "global role assignment listing",
      ),
      roleId: rpcText(
        value.role_id,
        "role_id",
        "global role assignment listing",
      ),
      roleName: rpcText(
        value.role_name,
        "role_name",
        "global role assignment listing",
      ),
      roleScope,
      roleSlug: rpcText(
        value.role_slug,
        "role_slug",
        "global role assignment listing",
      ),
      userId: rpcText(
        value.user_id,
        "user_id",
        "global role assignment listing",
      ),
    };
  });
}

export function parseAssignMemberPayload(payload: unknown): AssignMemberInput {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new ProjectValidationError("Request body must be a JSON object.");
  }

  const body = payload as Record<string, unknown>;

  return {
    email: requiredText(body.email, "email").toLowerCase(),
    roleSlug: requiredText(body.roleSlug, "roleSlug"),
    status: membershipStatus(body.status ?? "active"),
  };
}

export function parseMemberStatusPayload(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new ProjectValidationError("Request body must be a JSON object.");
  }

  return {
    status: membershipStatus((payload as Record<string, unknown>).status),
  };
}

export function parseAssignGlobalRolePayload(
  payload: unknown,
): AssignGlobalRoleInput {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new ProjectValidationError("Request body must be a JSON object.");
  }

  const body = payload as Record<string, unknown>;

  return {
    email: requiredText(body.email, "email").toLowerCase(),
    roleSlug: requiredText(body.roleSlug, "roleSlug"),
  };
}

async function listAssignableRolesByScope(
  supabase: SupabaseClient<Database>,
  scope: RoleScope,
): Promise<AssignableRole[]> {
  const { data, error } = await supabase
    .from("roles")
    .select("id, slug, name, description, requires_mfa, scope")
    .eq("scope", scope)
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return data.map((role) => ({
    description: role.description,
    id: role.id,
    name: role.name,
    requiresMfa: role.requires_mfa,
    scope: role.scope,
    slug: role.slug,
  }));
}

export async function listAssignableProjectRoles(
  supabase: SupabaseClient<Database>,
): Promise<AssignableRole[]> {
  return listAssignableRolesByScope(supabase, "project");
}

export async function listAssignableGlobalRoles(
  supabase: SupabaseClient<Database>,
): Promise<AssignableRole[]> {
  return listAssignableRolesByScope(supabase, "global");
}

export async function listAssignableEventRoles(
  supabase: SupabaseClient<Database>,
): Promise<AssignableRole[]> {
  return listAssignableRolesByScope(supabase, "event");
}

export async function listProjectMembersForAdmin(
  supabase: SupabaseClient<Database>,
  projectId: string,
) {
  const { data, error } = await (supabase as unknown as UntypedRpcClient).rpc(
    "list_project_members_for_admin",
    {
      p_project_id: projectId,
    },
  );

  if (error) {
    throw error;
  }

  return memberRows(data);
}

export async function assignProjectMemberByEmail(
  supabase: SupabaseClient<Database>,
  projectId: string,
  input: AssignMemberInput,
) {
  const { error } = await (supabase as unknown as UntypedRpcClient).rpc(
    "assign_project_member_by_email",
    {
      p_email: input.email,
      p_project_id: projectId,
      p_role_slug: input.roleSlug,
      p_status: input.status,
    },
  );

  if (error) {
    throw error;
  }
}

export async function updateProjectMemberStatus(
  supabase: SupabaseClient<Database>,
  memberId: string,
  status: MembershipStatus,
) {
  const { error } = await (supabase as unknown as UntypedRpcClient).rpc(
    "update_project_member_status_for_admin",
    {
      p_member_id: memberId,
      p_status: status,
    },
  );

  if (error) {
    throw error;
  }
}

export async function listEventMembersForAdmin(
  supabase: SupabaseClient<Database>,
  eventId: string,
) {
  const { data, error } = await (supabase as unknown as UntypedRpcClient).rpc(
    "list_event_members_for_admin",
    {
      p_event_id: eventId,
    },
  );

  if (error) {
    throw error;
  }

  return memberRows(data);
}

export async function listGlobalRoleAssignmentsForAdmin(
  supabase: SupabaseClient<Database>,
) {
  const { data, error } = await (supabase as unknown as UntypedRpcClient).rpc(
    "list_global_role_assignments_for_admin",
  );

  if (error) {
    throw error;
  }

  return globalRoleRows(data);
}

export async function assignGlobalRoleByEmail(
  supabase: SupabaseClient<Database>,
  input: AssignGlobalRoleInput,
) {
  const { error } = await (supabase as unknown as UntypedRpcClient).rpc(
    "assign_global_role_by_email",
    {
      p_email: input.email,
      p_role_slug: input.roleSlug,
    },
  );

  if (error) {
    throw error;
  }
}

export async function revokeGlobalRoleAssignment(
  supabase: SupabaseClient<Database>,
  assignmentId: string,
) {
  const { error } = await (supabase as unknown as UntypedRpcClient).rpc(
    "revoke_global_role_assignment_for_admin",
    {
      p_assignment_id: assignmentId,
    },
  );

  if (error) {
    throw error;
  }
}

export async function assignEventMemberByEmail(
  supabase: SupabaseClient<Database>,
  eventId: string,
  input: AssignMemberInput,
) {
  const { error } = await (supabase as unknown as UntypedRpcClient).rpc(
    "assign_event_member_by_email",
    {
      p_email: input.email,
      p_event_id: eventId,
      p_role_slug: input.roleSlug,
      p_status: input.status,
    },
  );

  if (error) {
    throw error;
  }
}

export async function updateEventMemberStatus(
  supabase: SupabaseClient<Database>,
  memberId: string,
  status: MembershipStatus,
) {
  const { error } = await (supabase as unknown as UntypedRpcClient).rpc(
    "update_event_member_status_for_admin",
    {
      p_member_id: memberId,
      p_status: status,
    },
  );

  if (error) {
    throw error;
  }
}
