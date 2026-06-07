import { redirect } from "next/navigation";
import { buildMfaStepUpRedirectPathForClient } from "@/lib/auth/auth-service";
import type { PermissionSlug } from "@/lib/security/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type RoleScope = Database["public"]["Enums"]["role_scope_type"];
type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

type MfaRouteContext = {
  supabase: SupabaseServerClient;
  user: {
    id: string;
  };
};

type MfaStepUpCapability = {
  permission: PermissionSlug;
  scope: RoleScope;
  scopeId?: string;
};

type MfaRoleAssignment = {
  role_id: string;
  scope: RoleScope;
  scope_id: string | null;
};

async function listActiveRoleAssignmentsForMfaStepUp(
  context: MfaRouteContext,
): Promise<MfaRoleAssignment[]> {
  const { data: assignments, error } = await context.supabase
    .from("role_assignments")
    .select("role_id, scope, scope_id")
    .eq("user_id", context.user.id)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

  if (error) {
    throw error;
  }

  return assignments ?? [];
}

async function hasPotentialPermissionAfterMfa(
  context: MfaRouteContext,
  assignments: MfaRoleAssignment[],
  capability: MfaStepUpCapability,
): Promise<boolean> {
  if (capability.scopeId === "") {
    throw new Error("MFA step-up scopeId cannot be empty.");
  }

  const roleIds = assignments
    .filter((assignment) => {
      if (assignment.scope === "global") {
        return true;
      }

      if (assignment.scope !== capability.scope) {
        return false;
      }

      return (
        capability.scopeId === undefined ||
        assignment.scope_id === capability.scopeId
      );
    })
    .map((assignment) => assignment.role_id);

  if (roleIds.length === 0) {
    return false;
  }

  const { data: grants, error: grantError } = await context.supabase
    .from("role_permissions")
    .select("role_id")
    .eq("permission_slug", capability.permission)
    .in("role_id", roleIds)
    .limit(1);

  if (grantError) {
    throw grantError;
  }

  return Boolean(grants?.length);
}

export async function redirectToMfaIfStepUpRequired(
  context: MfaRouteContext,
  nextPath: string,
  capabilities: MfaStepUpCapability | readonly MfaStepUpCapability[],
): Promise<void> {
  const capabilityList = Array.isArray(capabilities)
    ? capabilities
    : [capabilities];

  if (capabilityList.length === 0) {
    return;
  }

  const assignments = await listActiveRoleAssignmentsForMfaStepUp(context);
  const canPotentiallyAccess = (
    await Promise.all(
      capabilityList.map((capability) =>
        hasPotentialPermissionAfterMfa(context, assignments, capability),
      ),
    )
  ).some(Boolean);

  if (!canPotentiallyAccess) {
    return;
  }

  const mfaPath = await buildMfaStepUpRedirectPathForClient(
    context.supabase,
    nextPath,
  );

  if (mfaPath) {
    redirect(mfaPath);
  }
}
