import {
  hasEventPermission,
  hasProjectPermission,
  ProjectAccessError,
  requireEventPermission,
  requireGlobalPermission,
  requireProjectPermission,
  type ProjectApiContext,
} from "@/lib/projects/project-api";
import type { PermissionSlug } from "@/lib/security/permissions";

const reportingPermissionSlugs = [
  "audit.export",
  "audit.read",
  "dashboards.couple.read",
  "dashboards.event.read",
  "dashboards.global.read",
  "dashboards.partner.read",
  "dashboards.project.read",
  "payments.read",
  "payments.summary.read",
  "reports.catalog.read",
  "reports.export",
  "reports.internal.read",
  "revenue.read",
] satisfies PermissionSlug[];

export async function hasGlobalReportingPermission(
  context: ProjectApiContext,
  permission: PermissionSlug,
) {
  const { data, error } = await context.supabase.rpc(
    "current_user_has_permission",
    {
      p_permission: permission,
      p_scope: "global",
    },
  );

  if (error) {
    throw error;
  }

  return Boolean(data);
}

async function hasCustomReportingPermission(
  context: ProjectApiContext,
  permission: PermissionSlug,
) {
  const { data, error } = await context.supabase.rpc(
    "current_user_has_permission",
    {
      p_permission: permission,
      p_scope: "custom",
    },
  );

  if (error) {
    throw error;
  }

  return Boolean(data);
}

export async function getReportingPermissionSet(
  context: ProjectApiContext,
  options: {
    eventId?: string;
    includeCustom?: boolean;
    projectId?: string;
  } = {},
) {
  const permissionChecks = reportingPermissionSlugs.map(async (permission) => {
    const results = await Promise.all([
      hasGlobalReportingPermission(context, permission),
      options.projectId
        ? hasProjectPermission(context, options.projectId, permission)
        : Promise.resolve(false),
      options.eventId
        ? hasEventPermission(context, options.eventId, permission)
        : Promise.resolve(false),
      options.includeCustom
        ? hasCustomReportingPermission(context, permission)
        : Promise.resolve(false),
    ]);

    return results.some(Boolean) ? permission : null;
  });

  const granted = await Promise.all(permissionChecks);
  const permissionSet = new Set<PermissionSlug>();

  for (const permission of granted) {
    if (permission !== null) {
      permissionSet.add(permission);
    }
  }

  return permissionSet;
}

export async function requireGlobalDashboardPermission(
  context: ProjectApiContext,
) {
  await requireGlobalPermission(context, "dashboards.global.read");
}

export async function requirePartnerDashboardPermission(
  context: ProjectApiContext,
) {
  const canRead =
    (await hasGlobalReportingPermission(context, "dashboards.partner.read")) ||
    (await hasCustomReportingPermission(context, "dashboards.partner.read"));

  if (!canRead) {
    throw new ProjectAccessError("Partner dashboard access denied.", 403);
  }
}

export async function requireProjectDashboardPermission(
  context: ProjectApiContext,
  projectId: string,
) {
  await requireProjectPermission(context, projectId, "dashboards.project.read");
}

export async function requireCoupleDashboardPermission(
  context: ProjectApiContext,
  projectId: string,
) {
  await requireProjectPermission(context, projectId, "dashboards.couple.read");
}

export async function requireEventDashboardPermission(
  context: ProjectApiContext,
  eventId: string,
) {
  await requireEventPermission(context, eventId, "dashboards.event.read");
}

export async function requireReportCatalogPermission(
  context: ProjectApiContext,
) {
  const canRead =
    (await hasGlobalReportingPermission(context, "reports.catalog.read")) ||
    (await hasCustomReportingPermission(context, "reports.catalog.read"));

  if (!canRead) {
    throw new ProjectAccessError("Report catalog access denied.", 403);
  }
}

export async function requireProjectReportExportPermission(
  context: ProjectApiContext,
  projectId: string,
) {
  await requireProjectPermission(context, projectId, "reports.export");
}

export async function requireEventReportExportPermission(
  context: ProjectApiContext,
  eventId: string,
) {
  await requireEventPermission(context, eventId, "reports.export");
}

export async function requireAuditLogReadPermission(
  context: ProjectApiContext,
) {
  await requireGlobalPermission(context, "audit.read");
}

export async function requireAuditExportPermission(context: ProjectApiContext) {
  await requireGlobalPermission(context, "audit.export");
}
