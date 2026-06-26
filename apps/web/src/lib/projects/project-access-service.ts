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

function memberRows(data: unknown): AccessMember[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((row) => {
    const value = row as Record<string, unknown>;

    return {
      assignedAt: String(value.assigned_at ?? ""),
      displayName:
        typeof value.display_name === "string" ? value.display_name : null,
      email: String(value.email ?? ""),
      memberId: String(value.member_id ?? ""),
      roleId: String(value.role_id ?? ""),
      roleName: String(value.role_name ?? ""),
      roleScope: String(value.role_scope ?? "project") as RoleScope,
      roleSlug: String(value.role_slug ?? ""),
      status: String(value.status ?? "active") as MembershipStatus,
      userId: String(value.user_id ?? ""),
    };
  });
}

function globalRoleRows(data: unknown): GlobalRoleAssignment[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((row) => {
    const value = row as Record<string, unknown>;

    return {
      assignedAt: String(value.assigned_at ?? ""),
      assignmentId: String(value.assignment_id ?? ""),
      displayName:
        typeof value.display_name === "string" ? value.display_name : null,
      email: String(value.email ?? ""),
      expiresAt: typeof value.expires_at === "string" ? value.expires_at : null,
      requiresMfa: value.requires_mfa === true,
      roleId: String(value.role_id ?? ""),
      roleName: String(value.role_name ?? ""),
      roleSlug: String(value.role_slug ?? ""),
      userId: String(value.user_id ?? ""),
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
