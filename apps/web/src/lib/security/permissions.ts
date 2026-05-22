export const permissionSlugs = [
  "platform.foundation.access",
  "auth.session.read",
  "auth.session.write",
  "users.read",
  "roles.read",
  "roles.manage",
  "audit.read",
  "audit.write",
  "files.read",
  "files.write",
  "storage.configure",
  "projects.read",
  "projects.create",
  "projects.update",
  "projects.manage_status",
  "project_members.read",
  "project_members.manage",
  "events.read",
  "events.create",
  "events.update",
  "event_members.read",
  "event_members.manage",
  "workflow_tasks.read",
  "workflow_tasks.update",
  "guests.read",
  "guests.create",
  "guests.update",
  "guests.deactivate",
  "guests.manage_bride_side",
  "guests.manage_groom_side",
  "guest_title_types.manage",
  "guest_tags.manage",
  "guest_event_assignments.manage",
  "guest_duplicates.read",
  "guest_duplicates.manage",
  "guest_imports.read",
  "guest_imports.create",
  "guest_imports.submit",
  "guest_imports.review",
  "guest_imports.apply",
  "guest_public_pages.preview",
  "guest_public_tokens.manage",
  "rsvps.read",
  "rsvps.manage",
] as const;

export type PermissionSlug = (typeof permissionSlugs)[number];

export type RoleScope = "global" | "project" | "event" | "custom";

export type RoleSlug =
  | "diginoces_admin"
  | "operations_manager"
  | "role_manager"
  | "audit_viewer"
  | "file_manager"
  | "couple"
  | "bride"
  | "groom"
  | "event_staff"
  | "partner_admin";

export type RoleDefinition = {
  description: string;
  grants: PermissionSlug[];
  requirementIds: string[];
  requiresMfa: boolean;
  scope: RoleScope;
  slug: RoleSlug;
};

export const roleDefinitions: Record<RoleSlug, RoleDefinition> = {
  audit_viewer: {
    description: "Can review foundation audit records.",
    grants: ["audit.read"],
    requirementIds: ["REP-006", "ROLE-007"],
    requiresMfa: true,
    scope: "global",
    slug: "audit_viewer",
  },
  couple: {
    description: "Future project-level wedding couple role.",
    grants: [
      "platform.foundation.access",
      "projects.read",
      "events.read",
      "workflow_tasks.read",
      "guests.read",
      "guest_duplicates.read",
      "rsvps.read",
    ],
    requirementIds: ["PV-002", "ROLE-002", "PROJ-001", "PROJ-002", "GM-001"],
    requiresMfa: false,
    scope: "project",
    slug: "couple",
  },
  bride: {
    description: "Project-level bride role with own-side guest management.",
    grants: [
      "platform.foundation.access",
      "projects.read",
      "events.read",
      "workflow_tasks.read",
      "guests.read",
      "guests.manage_bride_side",
      "guest_title_types.manage",
      "guest_tags.manage",
      "guest_event_assignments.manage",
      "guest_duplicates.read",
      "guest_imports.read",
      "guest_imports.create",
      "guest_imports.submit",
      "rsvps.read",
    ],
    requirementIds: ["ROLE-005", "GM-002", "GM-003", "GM-011"],
    requiresMfa: false,
    scope: "project",
    slug: "bride",
  },
  diginoces_admin: {
    description: "Internal administrator with foundation-level access.",
    grants: [...permissionSlugs],
    requirementIds: ["PV-001", "ROLE-001", "ROLE-007"],
    requiresMfa: true,
    scope: "global",
    slug: "diginoces_admin",
  },
  event_staff: {
    description:
      "Future event-level staff role with limited foundation access.",
    grants: ["platform.foundation.access", "events.read"],
    requirementIds: ["ROLE-003", "PROJ-002"],
    requiresMfa: false,
    scope: "event",
    slug: "event_staff",
  },
  groom: {
    description: "Project-level groom role with own-side guest management.",
    grants: [
      "platform.foundation.access",
      "projects.read",
      "events.read",
      "workflow_tasks.read",
      "guests.read",
      "guests.manage_groom_side",
      "guest_title_types.manage",
      "guest_tags.manage",
      "guest_event_assignments.manage",
      "guest_duplicates.read",
      "guest_imports.read",
      "guest_imports.create",
      "guest_imports.submit",
      "rsvps.read",
    ],
    requirementIds: ["ROLE-005", "GM-002", "GM-003", "GM-011"],
    requiresMfa: false,
    scope: "project",
    slug: "groom",
  },
  file_manager: {
    description:
      "Can manage app-owned operational files through approved services.",
    grants: ["files.read", "files.write", "storage.configure"],
    requirementIds: ["FILE-001"],
    requiresMfa: false,
    scope: "global",
    slug: "file_manager",
  },
  operations_manager: {
    description:
      "Can operate foundation services without sensitive admin controls.",
    grants: [
      "platform.foundation.access",
      "auth.session.read",
      "users.read",
      "roles.read",
      "files.read",
      "projects.read",
      "projects.create",
      "projects.update",
      "events.read",
      "events.create",
      "events.update",
      "workflow_tasks.read",
      "workflow_tasks.update",
      "guests.read",
      "guests.create",
      "guests.update",
      "guests.deactivate",
      "guest_title_types.manage",
      "guest_tags.manage",
      "guest_event_assignments.manage",
      "guest_duplicates.read",
      "guest_duplicates.manage",
      "guest_imports.read",
      "guest_imports.create",
      "guest_imports.submit",
      "guest_imports.review",
      "guest_imports.apply",
      "guest_public_pages.preview",
      "guest_public_tokens.manage",
      "rsvps.read",
      "rsvps.manage",
    ],
    requirementIds: [
      "PV-001",
      "PV-002",
      "ROLE-001",
      "PROJ-001",
      "PROJ-002",
      "GM-001",
      "GM-003",
    ],
    requiresMfa: false,
    scope: "global",
    slug: "operations_manager",
  },
  partner_admin: {
    description: "Future restricted partner administrator role.",
    grants: ["platform.foundation.access"],
    requirementIds: ["ROLE-002", "ROLE-007"],
    requiresMfa: true,
    scope: "custom",
    slug: "partner_admin",
  },
  role_manager: {
    description: "Can manage roles and permissions.",
    grants: ["roles.read", "roles.manage", "audit.write"],
    requirementIds: ["ROLE-001", "ROLE-007"],
    requiresMfa: true,
    scope: "global",
    slug: "role_manager",
  },
};

export type RoleAssignment = {
  role: RoleSlug;
  scope: RoleScope;
  scopeId?: string;
};

export function getGrantedPermissions(assignments: RoleAssignment[]) {
  return new Set(
    assignments.flatMap(
      (assignment) => roleDefinitions[assignment.role].grants,
    ),
  );
}

export function hasPermission(
  assignments: RoleAssignment[],
  permission: PermissionSlug,
) {
  return getGrantedPermissions(assignments).has(permission);
}

export function sensitiveRolesRequireMfa(assignments: RoleAssignment[]) {
  return assignments.some(
    (assignment) => roleDefinitions[assignment.role].requiresMfa,
  );
}
