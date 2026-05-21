import {
  hasPermission,
  roleDefinitions,
  type PermissionSlug,
  type RoleAssignment,
} from "@/lib/security/permissions";

export type PermissionTarget =
  | {
      scope: "global";
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
  return roleDefinitions[assignment.role].grants.includes(permission);
}

export function hasScopedPermission(
  assignments: RoleAssignment[],
  permission: PermissionSlug,
  target: PermissionTarget,
) {
  if (hasPermission(assignments, permission)) {
    const globalGrant = assignments.some(
      (assignment) =>
        assignment.scope === "global" &&
        assignmentGrantsPermission(assignment, permission),
    );

    if (globalGrant) {
      return true;
    }
  }

  return assignments.some((assignment) => {
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
        (assignment.scope === "project" &&
          target.projectId != null &&
          assignment.scopeId === target.projectId)
      );
    }

    return assignment.scope === "global";
  });
}
