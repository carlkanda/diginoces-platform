import {
  getValidRoleAssignments,
  roleDefinitions,
  type PermissionSlug,
  type RoleAssignment,
} from "@/lib/security/permissions";

export type PermissionTarget =
  | {
      scope: "global";
    }
  | {
      scope: "custom";
      scopeId: string;
    }
  | {
      projectId: string;
      scope: "project";
    }
  | {
      eventId: string;
      projectId?: string;
      scope: "event";
    };

function assignmentGrantsPermission(
  assignment: RoleAssignment,
  permission: PermissionSlug,
) {
  const definition = roleDefinitions[assignment.role];
  return (
    definition?.scope === assignment.scope &&
    definition.grants.includes(permission)
  );
}

export function hasScopedPermission(
  assignments: RoleAssignment[],
  permission: PermissionSlug,
  target: PermissionTarget,
) {
  const validAssignments = getValidRoleAssignments(assignments);

  const globalGrant = validAssignments.some(
    (assignment) =>
      assignment.scope === "global" &&
      assignmentGrantsPermission(assignment, permission),
  );

  if (globalGrant) {
    return true;
  }

  return validAssignments.some((assignment) => {
    if (!assignmentGrantsPermission(assignment, permission)) {
      return false;
    }

    if (target.scope === "project") {
      return (
        assignment.scope === "project" &&
        assignment.scopeId === target.projectId
      );
    }

    if (target.scope === "event") {
      return (
        (assignment.scope === "event" &&
          assignment.scopeId === target.eventId) ||
        (typeof target.projectId === "string" &&
          assignment.scope === "project" &&
          assignment.scopeId === target.projectId)
      );
    }

    if (target.scope === "custom") {
      return (
        assignment.scope === "custom" && assignment.scopeId === target.scopeId
      );
    }

    return assignment.scope === "global";
  });
}
