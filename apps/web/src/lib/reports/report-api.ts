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

function normalizeEventAccessRows(data: unknown) {
  if (!Array.isArray(data)) {
    throw new ProjectAccessError("Invalid event access response.", 500);
  }

  return data.flatMap((row) => {
    if (
      typeof row === "object" &&
      row !== null &&
      "event_id" in row &&
      "can_access" in row &&
      typeof row.event_id === "string"
    ) {
      return [
        {
          can_access:
            typeof row.can_access === "boolean"
              ? row.can_access
              : row.can_access === "true",
          event_id: row.event_id,
        },
      ];
    }

    return [];
  });
}

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
  scopeId?: string,
) {
  if (!scopeId) {
    return false;
  }

  const { data, error } = await context.supabase.rpc(
    "current_user_has_permission",
    {
      p_permission: permission,
      p_scope: "custom",
      p_scope_id: scopeId,
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
    customScopeId?: string;
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
        ? hasCustomReportingPermission(
            context,
            permission,
            options.customScopeId,
          )
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

export async function getEventDashboardAccessMap(
  context: ProjectApiContext,
  projectId: string,
  eventIds: string[],
) {
  const uniqueEventIds = Array.from(new Set(eventIds));

  if (uniqueEventIds.length === 0) {
    return new Map<string, boolean>();
  }

  const [hasGlobalEventDashboard, hasProjectEventDashboard] = await Promise.all(
    [
      hasGlobalReportingPermission(context, "dashboards.event.read"),
      hasProjectPermission(context, projectId, "dashboards.event.read"),
    ],
  );
  const canReadAllProjectEvents =
    hasGlobalEventDashboard || hasProjectEventDashboard;

  if (canReadAllProjectEvents) {
    return new Map(uniqueEventIds.map((eventId) => [eventId, true] as const));
  }

  const { data, error } = await context.supabase.rpc(
    "current_user_can_access_events",
    {
      p_event_ids: uniqueEventIds,
      p_permission: "dashboards.event.read",
    },
  );

  if (error) {
    throw error;
  }

  const rows = normalizeEventAccessRows(data);
  const accessByEventId = new Map(
    rows.map((row) => [row.event_id, Boolean(row.can_access)] as const),
  );

  return new Map(
    uniqueEventIds.map(
      (eventId) => [eventId, accessByEventId.get(eventId) ?? false] as const,
    ),
  );
}

export async function requireGlobalDashboardPermission(
  context: ProjectApiContext,
) {
  await requireGlobalPermission(context, "dashboards.global.read");
}

export async function requirePartnerDashboardPermission(
  context: ProjectApiContext,
  customScopeId?: string,
) {
  const canRead =
    (await hasGlobalReportingPermission(context, "dashboards.partner.read")) ||
    (await hasCustomReportingPermission(
      context,
      "dashboards.partner.read",
      customScopeId,
    ));

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
  options: {
    customScopeId?: string;
    eventId?: string;
    projectId?: string;
  } = {},
) {
  const canRead =
    (await hasGlobalReportingPermission(context, "reports.catalog.read")) ||
    (options.projectId
      ? await hasProjectPermission(
          context,
          options.projectId,
          "reports.catalog.read",
        )
      : false) ||
    (options.eventId
      ? await hasEventPermission(
          context,
          options.eventId,
          "reports.catalog.read",
        )
      : false) ||
    (await hasCustomReportingPermission(
      context,
      "reports.catalog.read",
      options.customScopeId,
    ));

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

export async function requireReportExportPermission(
  context: ProjectApiContext,
) {
  await requireGlobalPermission(context, "reports.export");
}

export async function requireAuditLogReadPermission(
  context: ProjectApiContext,
) {
  await requireGlobalPermission(context, "audit.read");
}

export async function requireAuditExportPermission(context: ProjectApiContext) {
  await requireGlobalPermission(context, "audit.export");
}
