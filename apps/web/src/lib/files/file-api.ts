import {
  hasProjectPermissions,
  ProjectAccessError,
  requireProjectPermission,
  type ProjectApiContext,
} from "@/lib/projects/project-api";
import type { PermissionSlug } from "@/lib/security/permissions";

const fileCapabilityPermissions = [
  "files.read",
  "files.write",
  "files.download",
  "files.archive",
  "files.version.manage",
  "files.retention.manage",
] satisfies PermissionSlug[];

type AdminRoleAssignmentRow = {
  expires_at: string | null;
  roles: { slug: string } | { slug: string }[] | null;
};

export type FileCapabilitySet = {
  canArchive: boolean;
  canDownload: boolean;
  canManageRetention: boolean;
  canRead: boolean;
  canRegister: boolean;
  canSoftDelete: boolean;
  canVersion: boolean;
};

export async function getProjectFileCapabilities(
  context: ProjectApiContext,
  projectId: string,
): Promise<FileCapabilitySet> {
  const [permissions, hasAdminRole] = await Promise.all([
    hasProjectPermissions(context, projectId, fileCapabilityPermissions),
    hasActiveDiginocesAdminRole(context),
  ]);
  const canArchive = permissions.get("files.archive") ?? false;

  return {
    canArchive,
    canDownload: permissions.get("files.download") ?? false,
    canManageRetention: permissions.get("files.retention.manage") ?? false,
    canRead: permissions.get("files.read") ?? false,
    canRegister: permissions.get("files.write") ?? false,
    canSoftDelete: canArchive && hasAdminRole,
    canVersion:
      (permissions.get("files.version.manage") ?? false) ||
      (permissions.get("files.write") ?? false),
  };
}

export async function getProjectFileReadCapabilities(
  context: ProjectApiContext,
  projectId: string,
) {
  const permissions = await hasProjectPermissions(context, projectId, [
    "files.read",
    "files.download",
  ]);

  return {
    canDownload: permissions.get("files.download") ?? false,
    canRead: permissions.get("files.read") ?? false,
  };
}

export async function hasAnyProjectFileCapability(
  context: ProjectApiContext,
  projectId: string,
) {
  const capabilities = await getProjectFileCapabilities(context, projectId);
  return Object.values(capabilities).some(Boolean);
}

export async function requireProjectFileReadPermission(
  context: ProjectApiContext,
  projectId: string,
) {
  const capabilities = await getProjectFileReadCapabilities(context, projectId);

  if (!capabilities.canRead && !capabilities.canDownload) {
    throw new ProjectAccessError("Project file access denied.", 403);
  }
}

export async function requireProjectFileDownloadPermission(
  context: ProjectApiContext,
  projectId: string,
) {
  await requireProjectPermission(context, projectId, "files.download");
}

export async function requireProjectFileRegisterPermission(
  context: ProjectApiContext,
  projectId: string,
) {
  await requireProjectPermission(context, projectId, "files.write");
}

export async function requireProjectFileArchivePermission(
  context: ProjectApiContext,
  projectId: string,
) {
  await requireProjectPermission(context, projectId, "files.archive");
}

export async function requireProjectFileVersionPermission(
  context: ProjectApiContext,
  projectId: string,
) {
  const permissions = await hasProjectPermissions(context, projectId, [
    "files.version.manage",
    "files.write",
  ]);

  if (
    !permissions.get("files.version.manage") &&
    !permissions.get("files.write")
  ) {
    throw new ProjectAccessError("Project file version access denied.", 403);
  }
}

export async function requireDiginocesAdminFileSoftDeletePermission(
  context: ProjectApiContext,
) {
  if (await hasActiveDiginocesAdminRole(context)) {
    return;
  }

  throw new ProjectAccessError(
    "Diginoces admin role is required for file soft deletion.",
    403,
  );
}

async function hasActiveDiginocesAdminRole(context: ProjectApiContext) {
  const { data, error } = await context.supabase
    .from("role_assignments")
    .select("expires_at, roles!inner(slug)")
    .eq("user_id", context.user.id)
    .eq("scope", "global")
    .is("scope_id", null)
    .eq("roles.slug", "diginoces_admin");

  if (error) {
    throw error;
  }

  const now = Date.now();
  return ((data ?? []) as AdminRoleAssignmentRow[]).some((assignment) => {
    const roles = Array.isArray(assignment.roles)
      ? assignment.roles
      : assignment.roles
        ? [assignment.roles]
        : [];

    return (
      roles.some((role) => role.slug === "diginoces_admin") &&
      (!assignment.expires_at ||
        new Date(assignment.expires_at).getTime() > now)
    );
  });
}

export async function requireProjectRetentionPermission(
  context: ProjectApiContext,
  projectId: string,
) {
  await requireProjectPermission(context, projectId, "files.retention.manage");
}
