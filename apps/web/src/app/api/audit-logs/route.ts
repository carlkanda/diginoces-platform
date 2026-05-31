import { NextResponse, type NextRequest } from "next/server";
import { InvalidJsonBodyError, readJson } from "@/lib/api/read-json";
import {
  getProjectApiContext,
  handleProjectApiError,
  isProjectApiContext,
  jsonError,
} from "@/lib/projects/project-api";
import {
  getReportingPermissionSet,
  requireAuditExportPermission,
  requireAuditLogReadPermission,
} from "@/lib/reports/report-api";
import { generateReportCsv, listAuditLogs } from "@/lib/reports/report-db";
import {
  normalizeAuditLogFilters,
  ReportValidationError,
} from "@/lib/reports/report-service";

export const dynamic = "force-dynamic";

function filtersFromSearchParams(params: URLSearchParams) {
  return normalizeAuditLogFilters({
    action: params.get("action"),
    actorUserId: params.get("actorUserId"),
    from: params.get("from"),
    objectType: params.get("objectType"),
    search: params.get("search"),
    to: params.get("to"),
  });
}

export async function GET(request: NextRequest) {
  const context = await getProjectApiContext();

  if (!isProjectApiContext(context)) {
    return context;
  }

  try {
    await requireAuditLogReadPermission(context);
    const filters = filtersFromSearchParams(request.nextUrl.searchParams);

    return NextResponse.json(
      {
        logs: await listAuditLogs(context.supabase, filters, 100),
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
    await requireAuditExportPermission(context);
    const body = await readJson(request);
    const permissions = await getReportingPermissionSet(context);
    const result = await generateReportCsv(context.supabase, {
      actorUserId: context.user.id,
      filters: body.filters,
      permissions,
      reportKey: "audit_log_export",
      scope: "global",
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
