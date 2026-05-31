import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { InvalidJsonBodyError, readJson } from "@/lib/api/read-json";
import {
  getProjectApiContext,
  handleProjectApiError,
  isProjectApiContext,
  jsonError,
  ProjectAccessError,
} from "@/lib/projects/project-api";
import {
  getReportingPermissionSet,
  requireAuditExportPermission,
  requireEventReportExportPermission,
  requireProjectReportExportPermission,
  requireReportExportPermission,
} from "@/lib/reports/report-api";
import { generateReportCsv, listReportExports } from "@/lib/reports/report-db";
import {
  getReportCatalogForPermissions,
  parseReportKey,
  parseReportScope,
  ReportValidationError,
  sprint11ReportDefinitions,
} from "@/lib/reports/report-service";

export const dynamic = "force-dynamic";

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

async function getEventProjectId(supabase: SupabaseClient, eventId: string) {
  const { data, error } = await supabase
    .from("events")
    .select("project_id")
    .eq("id", eventId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new ProjectAccessError("Event was not found.", 404);
  }

  return data.project_id;
}

export async function GET(request: NextRequest) {
  const context = await getProjectApiContext();

  if (!isProjectApiContext(context)) {
    return context;
  }

  try {
    const projectId =
      request.nextUrl.searchParams.get("projectId") ?? undefined;
    const eventId = request.nextUrl.searchParams.get("eventId") ?? undefined;
    const permissions = await getReportingPermissionSet(context, {
      eventId,
      projectId,
    });

    if (!permissions.has("reports.catalog.read")) {
      throw new ProjectAccessError("Report catalog access denied.", 403);
    }

    return NextResponse.json(
      {
        catalog: getReportCatalogForPermissions(permissions),
        exports: await listReportExports(context.supabase, {
          eventId,
          projectId,
        }),
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    return handleProjectApiError(error);
  }
}

export async function POST(request: NextRequest) {
  const context = await getProjectApiContext();

  if (!isProjectApiContext(context)) {
    return context;
  }

  try {
    const body = await readJson(request);
    const reportKey = parseReportKey(body.reportKey);
    const scope = parseReportScope(body.scope);
    const definition = sprint11ReportDefinitions.find(
      (entry) => entry.key === reportKey,
    );
    const eventId = optionalString(body.eventId);
    let projectId = optionalString(body.projectId);

    if (scope === "event") {
      if (!eventId) {
        return jsonError(400, "invalid_request", "eventId is required.");
      }

      await requireEventReportExportPermission(context, eventId);
      projectId = await getEventProjectId(context.supabase, eventId);
    } else if (scope === "project") {
      if (!projectId) {
        return jsonError(400, "invalid_request", "projectId is required.");
      }

      await requireProjectReportExportPermission(context, projectId);
    } else if (reportKey === "audit_log_export") {
      await requireAuditExportPermission(context);
    } else {
      await requireReportExportPermission(context);
    }

    if (definition?.internalOnly && reportKey !== "audit_log_export") {
      const permissions = await getReportingPermissionSet(context, {
        eventId,
        projectId,
      });

      if (!permissions.has("reports.internal.read")) {
        throw new ProjectAccessError("Internal report access denied.", 403);
      }
    }

    const permissions = await getReportingPermissionSet(context, {
      eventId,
      projectId,
    });
    const result = await generateReportCsv(context.supabase, {
      actorUserId: context.user.id,
      eventId,
      filters: body.filters,
      permissions,
      projectId,
      reportKey,
      scope,
    });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof InvalidJsonBodyError) {
      return jsonError(400, "invalid_json", error.message);
    }

    if (error instanceof ReportValidationError) {
      return jsonError(400, "invalid_request", error.message);
    }

    return handleProjectApiError(error);
  }
}
